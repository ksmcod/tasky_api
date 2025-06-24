import { Request, Response } from "express";
import db from "../lib/db";
import { createTaskSchema } from "../schemas/taskSchemas";
import { TaskPriority, TaskStatus } from "../../generated/prisma";
import { describe } from "node:test";

// Controller function for handling task creation
// This function is responsible for processing the request to create a new task
// and sending an appropriate response back to the client.
export async function createTaskController(req: Request, res: Response) {
  const parsedData = createTaskSchema.safeParse(req.body);

  if (!parsedData.success) {
    console.log("Validation error:", parsedData.error.flatten());

    if (parsedData.error.issues[0].message) {
      if (parsedData.error.issues[0].message === "Required") {
        res.status(400).json({ message: "Bad requeset" });
        return;
      }

      res.status(400).json({ message: parsedData.error.issues[0].message });
      return;
    }

    res.status(400).json({ message: "Please fill all fields" });
    return;
  }

  try {
    const userId = req.userId as string;

    // Verify that team exists
    const teamExists = await db.team.findUnique({
      where: {
        joinCode: parsedData.data.teamCode,
      },
    });

    if (!teamExists) {
      res.status(404).json({ message: "Team not found" });
      return;
    }

    // Verify that user is part of the team
    const userInTeam = await db.teamMember.findFirst({
      where: {
        teamId: teamExists.id,
        userId: userId,
      },
    });
    if (!userInTeam) {
      res.status(403).json({ message: "You are not part of this team" });
      return;
    }

    // Verify that assignee is part of the team
    const assigneeInTeam = await db.teamMember.findFirst({
      where: {
        teamId: teamExists.id,
        user: {
          email: parsedData.data.assigneeEmail,
        },
      },
    });

    if (!assigneeInTeam) {
      res.status(403).json({ message: "Assignee is not part of this team" });
      return;
    }

    // Create the task
    await db.task.create({
      data: {
        title: parsedData.data.title,
        description: parsedData.data.description,
        status: parsedData.data.status ?? TaskStatus.PENDING,
        priority: parsedData.data.priority ?? TaskPriority.MEDIUM,
        dueDate: parsedData.data.dueDate
          ? new Date(parsedData.data.dueDate)
          : null,
        teamId: teamExists.id,
        creatorId: userInTeam.id,
        assigneeId: assigneeInTeam.id,
      },
    });

    res.status(201).json({ message: "New task assigned successfully" });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Controller function for fetching tasks assigned to the user
// This function retrieves all tasks assigned to the user making the request
// and sends them back in the response.
export async function getUserAssignedTasksController(
  req: Request,
  res: Response
) {
  const userId = req.userId as string;

  const { teamCode } = req.query;

  if (!teamCode) {
    res.status(400).json({ message: "Team code is required" });
    return;
  }

  try {
    // Verify that team exists
    const teamExists = await db.team.findUnique({
      where: {
        joinCode: teamCode as string,
      },
    });

    if (!teamExists) {
      res.status(404).json({ message: "Team not found" });
      return;
    }

    // Verify that user is part of the team
    const userInTeam = await db.teamMember.findFirst({
      where: {
        teamId: teamExists.id,
        userId: userId,
      },
    });

    if (!userInTeam) {
      res.status(403).json({ message: "You are not part of this team" });
      return;
    }

    // Fetch tasks assigned to the user
    const fetchedTasks = await db.task.findMany({
      where: {
        assigneeId: userInTeam.id,
        teamId: teamExists.id,
      },
    });

    const tasks = fetchedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching assigned tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

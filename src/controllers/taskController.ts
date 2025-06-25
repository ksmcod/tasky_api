import { Request, Response } from "express";
import db from "../lib/db";
import { createTaskSchema } from "../schemas/taskSchemas";
import { TaskPriority, TaskStatus } from "../../generated/prisma";

// Controller function for handling task creation
// This function is responsible for processing the request to create a new task
// and sending an appropriate response back to the client.
export async function createTaskController(req: Request, res: Response) {
  const statusWeightMap = {
    [TaskStatus.PENDING]: 1,
    [TaskStatus.IN_PROGRESS]: 2,
    [TaskStatus.COMPLETED]: 3,
  };

  const priorityWeightMap = {
    [TaskPriority.LOW]: 1,
    [TaskPriority.MEDIUM]: 2,
    [TaskPriority.HIGH]: 3,
  };

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
        statusWeight:
          statusWeightMap[parsedData.data.status ?? TaskStatus.PENDING],
        priority: parsedData.data.priority ?? TaskPriority.MEDIUM,
        priorityWeight:
          priorityWeightMap[parsedData.data.priority ?? TaskPriority.MEDIUM],
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
export async function getTasksController(req: Request, res: Response) {
  interface GetTasksFilter {
    assigneeId?: string;
  }

  interface GetTasksSorter {
    priorityWeight?: "asc" | "desc";
    statusWeight?: "asc" | "desc";
    dueDate?: "asc" | "desc";
    createdAt?: "asc" | "desc";
  }

  const userId = req.userId as string;

  const {
    teamCode,
    userTasks,
    sortByPriority,
    sortByStatus,
    sortByDueDate,
    sortByCreationDate,
  } = req.query;

  if (!teamCode) {
    res.status(400).json({ message: "Team code is required" });
    return;
  }

  try {
    // Query filter object
    const queryFilter: GetTasksFilter = {};
    const querySorter: GetTasksSorter = {};

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

    // Verify if we only want tasks assigned to user
    if (userTasks === "true") {
      queryFilter.assigneeId = userInTeam.id;
    }

    // Verify if we want to sort by priority
    if (
      (sortByPriority && sortByPriority === "asc") ||
      sortByPriority === "desc"
    ) {
      querySorter.priorityWeight = sortByPriority;
    }

    // Verify if we want to sort by status
    if ((sortByStatus && sortByStatus === "asc") || sortByStatus === "desc") {
      querySorter.statusWeight = sortByStatus;
    }

    // Verify if we want to sort by due date
    if (
      (sortByDueDate && sortByDueDate === "asc") ||
      sortByDueDate === "desc"
    ) {
      querySorter.dueDate = sortByDueDate;
    }

    // Verify if we want to sort by creation date
    if (
      (sortByCreationDate && sortByCreationDate === "asc") ||
      sortByCreationDate === "desc"
    ) {
      querySorter.createdAt = sortByCreationDate;
    }

    const orderByArray = Object.entries(querySorter).map(([key, value]) => ({
      [key]: value,
    }));

    console.log("Order by array:", orderByArray);

    // Fetch all team tasks
    const fetchedTasks = await db.task.findMany({
      where: {
        ...queryFilter,
        teamId: teamExists.id,
      },
      orderBy: orderByArray,
    });

    // Format the tasks for the response
    const tasks = fetchedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      assignee: task.assigneeId,
    }));

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching assigned tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

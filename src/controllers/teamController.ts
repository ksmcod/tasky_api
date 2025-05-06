import { Request, Response } from "express";
import db from "../lib/db";
import { createTeamSchema } from "../schemas/teamSchemas";

// Create new team controller
// This controller handles the creation of new teams
export async function createNewTeamController(req: Request, res: Response) {
  // Parse the request body using zod
  const parsedData = createTeamSchema.safeParse(req.body);

  // Handle scenario where parsing the body fails
  if (!parsedData.success) {
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

    // Create a unique team code
    const teamCode = Math.random().toString(36).slice(2, 10).toLowerCase();

    // Create team
    await db.team.create({
      data: {
        name: parsedData.data.name,
        description: parsedData.data.description ?? "",
        joinCode: teamCode,
        creator: { connect: { id: userId } },
        members: {
          create: {
            user: { connect: { id: userId } },
            role: "CREATOR",
          },
        },
      },
    });

    res.status(201).json({ message: "Team created" });
    return;
  } catch (error) {
    // Handle error
    console.log("Error in createTeamController: ", error);
    res.status(500).json({ message: "An error occured" });
    return;
  }
}

// Join team controller
// This controller function handles a user joining a team
export async function joinTeamController(req: Request, res: Response) {
  try {
    // If there is no request body, return error message
    if (!req.body) {
      res.status(400).json({ message: "Please send a team code" });
      return;
    }

    const { teamCode } = req.body;

    // If no team code is sent with request body, return error message
    if (!teamCode) {
      res.status(400).json({ message: "Please send a team code" });
      return;
    }

    // If the type of team code is not a string, return error message
    if (typeof teamCode !== "string") {
      res.status(400).json({ message: "Please send a valid team code" });
      return;
    }

    const userId = req.userId as string;

    // Verify that the team actually exists
    const team = await db.team.findUnique({
      where: {
        joinCode: teamCode,
      },
    });

    if (!team) {
      res.status(404).json({ message: "Team does not exist" });
      return;
    }

    // Verify that user is not already a member of this team
    const isAlreadyMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: team.id,
        },
      },
    });

    if (isAlreadyMember) {
      res.status(400).json({ message: "You are already a member" });
      return;
    }

    // Add user to the team
    await db.teamMember.create({
      data: {
        team: { connect: { joinCode: teamCode } },
        user: { connect: { id: userId } },
      },
    });

    res.status(201).json({ message: `Welcome to ${team.name}` });
    return;
  } catch (error) {
    console.log("Error in joining team: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

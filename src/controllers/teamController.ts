import { Request, Response } from "express";
import z from "zod";
import db from "../lib/db";
import {
  createTeamSchema,
  removeMemberParamsSchema,
} from "../schemas/teamSchemas";
import { AllTeamsReturnType } from "../types";

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

// Remove team member controller
// This controller function handles removing a member from a team
export async function removeTeamMember(req: Request, res: Response) {
  try {
    // 1. Validate params
    const { member_email, teamCode } = removeMemberParamsSchema.parse(
      req.params
    );
    const requesterId = req.userId as string;

    // 2. Verify team exists
    const team = await db.team.findUnique({
      where: { joinCode: teamCode },
    });
    if (!team) {
      res.status(404).json({ message: "Team not found." });
      return;
    }

    // 3. Ensure requester is creator
    const auth = await db.teamMember.findFirst({
      where: { userId: requesterId, teamId: team.id, role: "CREATOR" },
    });
    if (!auth) {
      res.status(403).json({ message: "Forbidden: must be team creator." });
      return;
    }

    // 4. Fetch user to remove
    const userToRemove = await db.user.findUnique({
      where: { email: member_email },
    });
    if (!userToRemove) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // 5. Fetch their membership
    const membership = await db.teamMember.findUnique({
      where: {
        userId_teamId: { userId: userToRemove.id, teamId: team.id },
      },
    });
    if (!membership) {
      res.status(404).json({ message: "User is not a member of this team." });
      return;
    }
    if (membership.role === "CREATOR") {
      res.status(400).json({ message: "Cannot remove the team creator." });
      return;
    }

    // 6. Delete membership
    await db.teamMember.delete({
      where: {
        userId_teamId: { userId: userToRemove.id, teamId: team.id },
      },
    });

    res
      .status(200)
      .json({ message: `${userToRemove.name} removed from ${team.name}.` });
    return;
  } catch (err) {
    // Zod invalidation
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    console.error("removeTeamMember error:", err);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
}

// Get all teams controller
// This controller function fetches all teams a user is a member of
// and returns them in a specific format
export async function getAllTeams(req: Request, res: Response) {
  try {
    const teams: AllTeamsReturnType[] = [];

    const userId = req.userId as string;

    const queryResult = await db.teamMember.findMany({
      where: {
        user: { id: userId },
      },
      include: {
        team: true,
      },
    });

    // If user is not a member of any team, return message
    if (!queryResult) {
      res.status(200).json({ message: "You are not a member of any team" });
      return;
    }

    // Map through the query result and push to teams array
    // This is to ensure that the response is in the format of AllTeamsReturnType
    queryResult.map((item) => {
      teams.push({
        name: item.team.name,
        description: item.team.description ?? "",
        joinCode: item.team.joinCode,
        createdAt: item.team.createdAt,
        joinedAt: item.joinedAt,
        role: item.role,
      });
    });

    res.status(200).json(teams);
    return;
  } catch (error) {
    console.log("Error in fetching all teams: ", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
}

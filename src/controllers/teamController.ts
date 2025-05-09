import { Request, Response } from "express";
import z from "zod";
import db from "../lib/db";
import {
  createTeamSchema,
  removeMemberParamsSchema,
} from "../schemas/teamSchemas";
import { AllTeamsReturnType, TeamMemberReturnType } from "../types";

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
export async function removeTeamMemberController(req: Request, res: Response) {
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
export async function getAllUserTeamsController(req: Request, res: Response) {
  try {
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

    // Map through the query result and modify the structure
    // to match the AllTeamsReturnType interface
    const teams: AllTeamsReturnType[] = queryResult.map((item) => ({
      name: item.team.name,
      description: item.team.description ?? "",
      joinCode: item.team.joinCode,
      createdAt: item.team.createdAt,
      joinedAt: item.joinedAt,
      role: item.role,
    }));

    res.status(200).json(teams);
    return;
  } catch (error) {
    console.log("Error in fetching all teams: ", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
}

// Get team members controller
// This controller function fetches all members of a team
// and returns them in a specific format
export async function getAllTeamMembersController(req: Request, res: Response) {
  try {
    const { teamCode } = req.params;
    const userId = req.userId as string;

    if (!teamCode) {
      res.status(400).json({ message: "Bad request" });
      return;
    }

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

    // Verify that the user is a member of this team
    const isMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: team.id,
        },
      },
    });

    if (!isMember) {
      res
        .status(403)
        .json({ message: "You are not allowed to view this team" });
      return;
    }

    // Fetch all members of the team
    const queryResult = await db.teamMember.findMany({
      where: {
        teamId: team.id,
      },
      include: {
        user: true,
      },
    });

    // If no members are found, return message
    if (!queryResult) {
      res.status(200).json({ message: "No members found" });
      return;
    }

    // Map through the query result and modify the structure
    // to match the TeamMemberReturnType interface
    const members: TeamMemberReturnType[] = queryResult.map((item) => ({
      name: item.user.name,
      email: item.user.email,
      image: item.user.image,
      role: item.role,
      joinedAt: item.joinedAt,
    }));

    res.status(200).json(members);
  } catch (error) {
    console.log("Error in fetching all team members: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Leave team controller
// This controller function handles a user leaving a team
// It verifies that the user is a member of the team and removes them if yes
// It also checks if the user is the creator of the team and prevents them from leaving
export async function leaveTeamController(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const { teamCode } = req.params;

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

    const isMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: team.id,
        },
      },
    });

    if (!isMember) {
      res.status(403).json({ message: "You are not a member of this team" });
      return;
    }

    if (isMember.role === "CREATOR") {
      res.status(400).json({ message: "You cannot leave a team you created" });
      return;
    }

    // Remove user from the team
    await db.teamMember.delete({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: team.id,
        },
      },
    });

    res.status(200).json({ message: `You left ${team.name}` });
  } catch (error) {
    console.log("Error in leaving team: ", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
}

// Delete team controller
// This controller function handles deleting a team
// It verifies that the user is the creator of the team and prevents others from deleting it
export async function deleteTeamController(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const { teamCode } = req.params;

    if (!teamCode) {
      res.status(400).json({ message: "Bad request" });
      return;
    }

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

    // Verify that user is creator of the team
    const isCreator = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: team.id,
        },
        role: "CREATOR",
      },
    });

    if (!isCreator) {
      res
        .status(403)
        .json({ message: "You are not allowed to perform this action" });
      return;
    }

    // Delete the team
    await db.team.delete({
      where: {
        joinCode: teamCode,
      },
    });

    res.status(200).json({ message: `You have deleted ${team.name}` });
  } catch (error) {
    console.log("Error in deleting team: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

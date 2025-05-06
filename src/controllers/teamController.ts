import { Request, Response } from "express";
import db from "../lib/db";
import { createTeamSchema } from "../schemas/teamSchemas";

// Create new team controller
// This controller handles the creation of new teams
export async function createNewTeamController(req: Request, res: Response) {
  const parsedData = createTeamSchema.safeParse(req.body);

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

    const teamCode = Math.random().toString(36).slice(2, 10).toLowerCase();

    const newTeam = await db.team.create({
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

    // res.status(201).json({message: "Team created"})
    res.status(201).json(newTeam);
    return;
  } catch (error) {
    console.log("Error in createTeamController: ", error);
    res.status(500).json({ message: "An error occured" });
    return;
  }
}

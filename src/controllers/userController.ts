import { Request, Response } from "express";
import db from "../lib/db";

export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = req.userId as string;

    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: "User non-existent" });
      return;
    }

    res.status(200).json(user);
    return;
  } catch (error) {
    console.log("Error in 'getCurrentUser': ", error);
    res.status(500).json({ message: "A server error occured" });
  }
}

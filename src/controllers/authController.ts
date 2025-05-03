import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";

import { registerSchema } from "../schemas/authSchemas";
import db from "../lib/db";

export async function registerController(req: Request, res: Response) {
  try {
    // Validate the request body
    const parsedData = registerSchema.safeParse(req.body);

    if (!parsedData.success) {
      res.status(400).json({ message: "Please fill all fields" });
      return;
    }

    const existingUser = await db.user.findUnique({
      where: { email: parsedData.data.email },
    });

    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

    // Create the user
    const newUser = await db.user.create({
      data: {
        name: `${parsedData.data.firstName} ${parsedData.data.lastName}`,
        email: parsedData.data.email,
        password: hashedPassword,
        image: `https://avatar.iran.liara.run/username?username=${parsedData.data.firstName}+${parsedData.data.lastName}`,
      },
    });

    if (!newUser) {
      res.status(500).json({ message: "An error occured" });
      return;
    }

    res.status(201).json(newUser);
    return;

    // return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.log("Error in registerController:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

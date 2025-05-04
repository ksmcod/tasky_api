import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import { loginSchema, registerSchema } from "../schemas/authSchemas";
import db from "../lib/db";
import { createToken } from "../utils/createToken";
import setToken from "../utils/setToken";

// Register controller
// This controller handles user registration
export async function registerController(req: Request, res: Response) {
  try {
    // Validate the request body
    const parsedData = registerSchema.safeParse(req.body);

    if (!parsedData.success) {
      if (parsedData.error.issues[0].message) {
        if (parsedData.error.issues[0].message === "Required") {
          res.status(400).json({ message: "Please fill all fields" });
          return;
        }

        res.status(400).json({ message: parsedData.error.issues[0].message });
        return;
      }

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

    // Create a token for the user
    const token = createToken(newUser.id);

    // Set the token in the response
    setToken(token, res);

    // Send the response
    res.status(201).json({ message: "Registration successful" });
    return;
  } catch (error) {
    console.log("Error in registerController:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Login controller
// This controller handles user login
export async function loginController(req: Request, res: Response) {
  const parsedData = loginSchema.safeParse(req.body);

  if (!parsedData.success) {
    if (parsedData.error.issues[0].message) {
      if (parsedData.error.issues[0].message === "Required") {
        res.status(400).json({ message: "Please fill all fields" });
        return;
      }

      res.status(400).json({ message: parsedData.error.issues[0].message });
      return;
    }

    res.status(400).json({ message: "Please fill all fields" });
    return;
  }

  try {
    // Find the user by email
    const user = await db.user.findUnique({
      where: { email: parsedData.data.email },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // If there is no password, user signed in with OAuth
    if (!user.password) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(
      parsedData.data.password,
      user.password
    );

    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Create a token for the user
    const token = createToken(user.id);

    // Set the token in the response
    setToken(token, res);

    // Send the response
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.log("Error in loginController:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

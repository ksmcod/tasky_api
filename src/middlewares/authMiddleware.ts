import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { TokenPayload } from "../utils/createToken";

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies.user_token as string;

  if (!token) {
    // return res.sendStatus(401);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;

    // const user = await db.user.findUnique({
    //   where: { id: decoded.userId },
    // });

    // if (!user) {
    //   return res.status(401).json({ message: "Unauthorized" });
    //   // res.sendStatus(401);
    // }

    // // Attach the user object to the request object
    // req.user = user as User;

    req.userId = decoded.userId;

    next();
  } catch (error: any) {
    console.log("JWT verification error: ", error);
    res.status(401).json({ message: error.message ?? "Invalid token" });
    return;
  }
}

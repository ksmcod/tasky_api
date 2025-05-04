import { Response } from "express";

export default function setToken(token: string, res: Response) {
  res.cookie("user_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV == "production",
    maxAge: 1000 * 60 * 60 * 24 * 60, // 60 days
    sameSite: "lax",
  });
}

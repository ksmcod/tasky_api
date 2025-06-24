// This file defines the API routes for the application.
import { Router, Request, Response } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import teamRoutes from "./teamRoutes";
import taskRoutes from "./taskRoutes";

const apiRoutes = Router();

// Status check
apiRoutes.get("/status", (req: Request, res: Response) => {
  res.status(200).json({ message: "Server is running" });
});

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/user", userRoutes);
apiRoutes.use("/teams", authMiddleware, teamRoutes);
apiRoutes.use("/tasks", authMiddleware, taskRoutes);

export default apiRoutes;

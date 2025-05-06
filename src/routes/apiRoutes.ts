// This file defines the API routes for the application.
import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import teamRoutes from "./teamRoutes";

const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/user", userRoutes);
apiRoutes.use("/team", authMiddleware, teamRoutes);

export default apiRoutes;

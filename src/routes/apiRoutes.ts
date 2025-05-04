// This file defines the API routes for the application.
import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";

const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/user", userRoutes);

export default apiRoutes;

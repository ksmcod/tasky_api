import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { createTaskController } from "../controllers/taskController";

const taskRoutes = Router();

taskRoutes.post("/", createTaskController);

export default taskRoutes;

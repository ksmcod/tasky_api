import { Router } from "express";
import {
  createTaskController,
  getTaskByIdController,
  getTeamTasksController,
} from "../controllers/taskController";

const taskRoutes = Router();

taskRoutes.get("/", getTeamTasksController);
taskRoutes.get("/:taskId", getTaskByIdController);
taskRoutes.post("/", createTaskController);

export default taskRoutes;

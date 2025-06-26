import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getTaskByIdController,
  getTeamTasksController,
  updateTaskController,
} from "../controllers/taskController";

const taskRoutes = Router();

taskRoutes.get("/", getTeamTasksController);
taskRoutes.get("/:taskId", getTaskByIdController);

taskRoutes.post("/", createTaskController);

taskRoutes.put("/:taskId", updateTaskController);

taskRoutes.delete("/:taskId", deleteTaskController);

export default taskRoutes;

import { Router } from "express";
import {
  createTaskController,
  getTasksController,
} from "../controllers/taskController";

const taskRoutes = Router();

taskRoutes.get("/", getTasksController);
taskRoutes.post("/", createTaskController);

export default taskRoutes;

import { Router } from "express";
import {
  createTaskController,
  getUserAssignedTasksController,
} from "../controllers/taskController";

const taskRoutes = Router();

taskRoutes.get("/", getUserAssignedTasksController);
taskRoutes.post("/", createTaskController);

export default taskRoutes;

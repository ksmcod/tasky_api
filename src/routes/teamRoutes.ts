import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { createNewTeamController } from "../controllers/teamController";

const teamRoutes = Router();

teamRoutes.post("new-team", authMiddleware, createNewTeamController);

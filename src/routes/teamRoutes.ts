import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import {
  createNewTeamController,
  joinTeamController,
} from "../controllers/teamController";

const teamRoutes = Router();

teamRoutes.post("/new-team", createNewTeamController);
teamRoutes.post("/join", joinTeamController);

export default teamRoutes;

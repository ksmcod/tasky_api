import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import {
  createNewTeamController,
  getAllTeams,
  getTeamMembers,
  joinTeamController,
  removeTeamMember,
} from "../controllers/teamController";

const teamRoutes = Router();

teamRoutes.get("/", getAllTeams);
teamRoutes.get("/:teamCode/members", getTeamMembers);
teamRoutes.post("/new", createNewTeamController);
teamRoutes.post("/join", joinTeamController);
teamRoutes.delete("/:teamCode/members/:member_email", removeTeamMember);

export default teamRoutes;

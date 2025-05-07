import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import {
  createNewTeamController,
  getAllUserTeamsController,
  getAllTeamMembersController,
  joinTeamController,
  removeTeamMemberController,
} from "../controllers/teamController";

const teamRoutes = Router();

teamRoutes.get("/", getAllTeamMembersController);
teamRoutes.get("/:teamCode/members", getAllTeamMembersController);
teamRoutes.post("/new", createNewTeamController);
teamRoutes.post("/join", joinTeamController);
teamRoutes.delete(
  "/:teamCode/members/:member_email",
  removeTeamMemberController
);

export default teamRoutes;

import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import {
  createNewTeamController,
  getAllUserTeamsController,
  getAllTeamMembersController,
  joinTeamController,
  removeTeamMemberController,
  leaveTeamController,
  deleteTeamController,
} from "../controllers/teamController";

const teamRoutes = Router();

teamRoutes.get("/", getAllUserTeamsController);
teamRoutes.get("/:teamCode/members", getAllTeamMembersController);

teamRoutes.post("/new", createNewTeamController);
teamRoutes.post("/join", joinTeamController);

teamRoutes.delete("/:teamCode", deleteTeamController);
teamRoutes.delete("/:teamCode/members/me", leaveTeamController);
teamRoutes.delete(
  "/:teamCode/members/:member_email",
  removeTeamMemberController
);

export default teamRoutes;

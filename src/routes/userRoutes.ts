import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { getCurrentUser } from "../controllers/userController";

const userRoutes = Router();

userRoutes.get("/get-user", authMiddleware, getCurrentUser);

export default userRoutes;

import { Router } from "express";
import {
  loginController,
  registerController,
} from "../controllers/authController";

const authRoutes = Router();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);

export default authRoutes;

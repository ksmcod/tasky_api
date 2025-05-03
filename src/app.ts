import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import apiRoutes from "./routes/apiRoutes";

const app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Configure routes
app.use("/api", apiRoutes);

export default app;

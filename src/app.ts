import express from "express";
import cookieParser from "cookie-parser";

const app = express();

// Configure middleware
app.use(express.json());
app.use(cookieParser());

export default app;

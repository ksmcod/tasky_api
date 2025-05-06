import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import passport from "passport";

import apiRoutes from "./routes/apiRoutes";
import { githubStrategy } from "./config/passport";

const app = express();

// Configure middleware
//Initialize passport
app.use(passport.initialize());

// Setup passpor strategies
githubStrategy(passport);

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to parse cookies
app.use(cookieParser());

// Middleware to log requests
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}
// Middleware to handle CORS

// Configure routes
app.use("/api", apiRoutes);

// Catch all route
app.use(/^\/.*/, (req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
  return;
});

// Error handling middleware
app.use(
  /^\/.*/,
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
  }
);

export default app;

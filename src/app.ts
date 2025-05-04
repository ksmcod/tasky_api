import express from "express";
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

export default app;

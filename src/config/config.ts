import dotenv from "dotenv";

interface Config {
  port: number;
  nodeEnv: string;
}
// Load environment variables from .env file
dotenv.config();

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
};

export default config;

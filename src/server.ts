import app from "./app";
import config from "./config/config";
import db from "./lib/db";

async function startServer() {
  try {
    db.$connect().then(() => {
      console.log("Connected to database");

      app.listen(config.port, () => {
        console.log(`App listening on port ${config.port}`);
      });
    });
  } catch (error) {
    console.error("Failed to connect to the database! Error: ", error);
    process.exit(1);
  }
}

startServer();

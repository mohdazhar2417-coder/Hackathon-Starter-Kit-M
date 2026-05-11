import app from "./app";
import { logger } from "./lib/logger";
import { env } from "./lib/env.js";

const port = Number(env.PORT);

app.listen(port, () => {
  logger.info({ 
    port,
    nodeEnv: env.NODE_ENV,
    databaseUrl: env.DATABASE_URL ? "SET" : "NOT SET",
    memoryDb: env.USE_MEMORY_DB === "1" ? "ENABLED" : "DISABLED"
  }, "Server listening and environment validated");
});

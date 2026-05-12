import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import authRouter from "./routes/auth.js";
import { logger } from "./lib/logger";
import { apiLimiter } from "./middlewares/rateLimit.js";
import passport from "./lib/passport.js";
import { env } from "./lib/env.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: [env.FRONTEND_URL, "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(apiLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/api/auth", authRouter);
app.use("/api", router);

export default app;

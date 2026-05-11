import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tracesRouter from "./traces";
import favoritesRouter from "./favorites";
import programsRouter from "./programs";
import adminRouter from "./admin";
import dashboardRouter from "./dashboard";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/traces", tracesRouter);
router.use("/favorites", favoritesRouter);
router.use("/programs", programsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/admin", adminRouter);
router.use("/payments", paymentsRouter);

export default router;

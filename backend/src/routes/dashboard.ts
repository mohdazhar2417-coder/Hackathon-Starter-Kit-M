import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import type { Request } from "express";
import type { AuthPayload } from "../middlewares/auth.js";
import { getDashboardStats } from "../lib/store.js";

const router = Router();

router.use(authMiddleware);

router.get("/stats", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const stats = await getDashboardStats(userId);

  res.json({
    totalTraces: stats.totalTraces,
    totalFavorites: stats.totalFavorites,
    recentTraces: stats.recentTraces.map((t) => ({
      ...t,
      savedAt: t.savedAt.toISOString(),
      customInputs: t.customInputs ?? null,
    })),
    categoriesExplored: stats.categoriesExplored,
  });
});

export default router;

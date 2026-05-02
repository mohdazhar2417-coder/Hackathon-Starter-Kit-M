import { Router } from "express";
import { db, savedTracesTable, favoriteProgramsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";
import type { Request } from "express";
import type { AuthPayload } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/stats", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;

  const [traceCount] = await db
    .select({ count: count() })
    .from(savedTracesTable)
    .where(eq(savedTracesTable.userId, userId));

  const [favCount] = await db
    .select({ count: count() })
    .from(favoriteProgramsTable)
    .where(eq(favoriteProgramsTable.userId, userId));

  const recentTraces = await db
    .select()
    .from(savedTracesTable)
    .where(eq(savedTracesTable.userId, userId))
    .orderBy(desc(savedTracesTable.savedAt))
    .limit(5);

  const categoriesRaw = await db
    .selectDistinct({ category: savedTracesTable.category })
    .from(savedTracesTable)
    .where(eq(savedTracesTable.userId, userId));

  res.json({
    totalTraces: Number(traceCount.count),
    totalFavorites: Number(favCount.count),
    recentTraces: recentTraces.map((t) => ({
      ...t,
      savedAt: t.savedAt.toISOString(),
      customInputs: t.customInputs ?? null,
    })),
    categoriesExplored: categoriesRaw.map((c) => c.category),
  });
});

export default router;

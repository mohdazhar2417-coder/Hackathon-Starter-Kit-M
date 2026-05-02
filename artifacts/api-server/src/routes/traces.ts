import { Router } from "express";
import { db, savedTracesTable, usersTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { CreateTraceBody } from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/auth.js";
import type { Request } from "express";
import type { AuthPayload } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const traces = await db.select()
    .from(savedTracesTable)
    .where(eq(savedTracesTable.userId, userId))
    .orderBy(desc(savedTracesTable.savedAt));
  res.json(traces.map(t => ({
    ...t,
    savedAt: t.savedAt.toISOString(),
    customInputs: t.customInputs ?? null,
  })));
});

router.post("/", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const parsed = CreateTraceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [trace] = await db.insert(savedTracesTable).values({
    userId,
    ...parsed.data,
  }).returning();
  res.status(201).json({
    ...trace,
    savedAt: trace.savedAt.toISOString(),
    customInputs: trace.customInputs ?? null,
  });
});

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const [traceCount] = await db.select({ count: count() })
    .from(savedTracesTable)
    .where(eq(savedTracesTable.userId, userId));
  const recentTraces = await db.select()
    .from(savedTracesTable)
    .where(eq(savedTracesTable.userId, userId))
    .orderBy(desc(savedTracesTable.savedAt))
    .limit(5);
  const categoriesRaw = await db.selectDistinct({ category: savedTracesTable.category })
    .from(savedTracesTable)
    .where(eq(savedTracesTable.userId, userId));
  res.json({
    totalTraces: traceCount.count,
    totalFavorites: 0,
    recentTraces: recentTraces.map(t => ({
      ...t,
      savedAt: t.savedAt.toISOString(),
      customInputs: t.customInputs ?? null,
    })),
    categoriesExplored: categoriesRaw.map(c => c.category),
  });
});

router.get("/:id", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const id = parseInt(req.params.id);
  const [trace] = await db.select()
    .from(savedTracesTable)
    .where(and(eq(savedTracesTable.id, id), eq(savedTracesTable.userId, userId)))
    .limit(1);
  if (!trace) {
    res.status(404).json({ error: "Trace not found" });
    return;
  }
  res.json({ ...trace, savedAt: trace.savedAt.toISOString(), customInputs: trace.customInputs ?? null });
});

router.delete("/:id", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(savedTracesTable)
    .where(and(eq(savedTracesTable.id, id), eq(savedTracesTable.userId, userId)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Trace not found" });
    return;
  }
  res.json({ success: true, message: "Trace deleted" });
});

export default router;

import { Router } from "express";
import { CreateTraceBody } from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/auth.js";
import type { Request } from "express";
import type { AuthPayload } from "../middlewares/auth.js";
import {
  createTrace,
  deleteTraceByIdForUser,
  getTraceByIdForUser,
  getTraceByShareSlug,
  listTracesByUser,
} from "../lib/store.js";

const router = Router();

// Public route for shared traces
router.get("/share/:slug", async (req, res): Promise<void> => {
  const { slug } = req.params;
  const trace = await getTraceByShareSlug(slug);
  if (!trace) {
    res.status(404).json({ error: "Shared trace not found" });
    return;
  }
  res.json({
    ...trace,
    savedAt: trace.savedAt.toISOString(),
    customInputs: trace.customInputs ?? null,
  });
});

router.use(authMiddleware);

// Make a trace public and get a share slug
router.patch("/:id/publish", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const id = parseInt(req.params.id);
  const trace = await getTraceByIdForUser(id, userId);
  if (!trace) {
    res.status(404).json({ error: "Trace not found" });
    return;
  }

  const shareSlug = Math.random().toString(36).substring(2, 10);
  const { db, savedTracesTable } = await loadDbModule();
  const [updated] = await db
    .update(savedTracesTable)
    .set({ isPublic: true, shareSlug })
    .where(and(eq(savedTracesTable.id, id), eq(savedTracesTable.userId, userId)))
    .returning();

  res.json({
    ...updated,
    savedAt: updated.savedAt.toISOString(),
    shareUrl: `${req.protocol}://${req.get("host")}/workspace?share=${shareSlug}`
  });
});

router.get("/", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const traces = await listTracesByUser(userId);
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
  const trace = await createTrace({
    userId,
    ...parsed.data,
  });
  res.status(201).json({
    ...trace,
    savedAt: trace.savedAt.toISOString(),
    customInputs: trace.customInputs ?? null,
  });
});

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const traces = await listTracesByUser(userId);
  const categoriesRaw = [...new Set(traces.map((trace) => trace.category))];
  res.json({
    totalTraces: traces.length,
    totalFavorites: 0,
    recentTraces: traces.slice(0, 5).map(t => ({
      ...t,
      savedAt: t.savedAt.toISOString(),
      customInputs: t.customInputs ?? null,
    })),
    categoriesExplored: categoriesRaw,
  });
});

router.get("/:id", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const id = parseInt(req.params.id);
  const trace = await getTraceByIdForUser(id, userId);
  if (!trace) {
    res.status(404).json({ error: "Trace not found" });
    return;
  }
  res.json({ ...trace, savedAt: trace.savedAt.toISOString(), customInputs: trace.customInputs ?? null });
});

router.delete("/:id", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const id = parseInt(req.params.id);
  const deleted = await deleteTraceByIdForUser(id, userId);
  if (!deleted) {
    res.status(404).json({ error: "Trace not found" });
    return;
  }
  res.json({ success: true, message: "Trace deleted" });
});

export default router;

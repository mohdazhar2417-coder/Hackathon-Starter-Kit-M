import { Router } from "express";
import { db, sampleProgramsTable, usersTable, savedTracesTable, favoriteProgramsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { count } from "drizzle-orm";
import { AdminCreateProgramBody, AdminUpdateProgramBody } from "@workspace/api-zod";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/programs", async (req, res): Promise<void> => {
  const programs = await db.select().from(sampleProgramsTable);
  res.json(programs.map(p => ({ ...p, tags: p.tags ?? [] })));
});

router.post("/programs", async (req, res): Promise<void> => {
  const parsed = AdminCreateProgramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [program] = await db.insert(sampleProgramsTable).values({
    ...parsed.data,
    featured: parsed.data.featured ?? false,
    tags: parsed.data.tags ?? [],
  }).returning();
  res.status(201).json({ ...program, tags: program.tags ?? [] });
});

router.put("/programs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = AdminUpdateProgramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [program] = await db.update(sampleProgramsTable)
    .set({ ...parsed.data, featured: parsed.data.featured ?? false, tags: parsed.data.tags ?? [] })
    .where(eq(sampleProgramsTable.id, id))
    .returning();
  if (!program) {
    res.status(404).json({ error: "Program not found" });
    return;
  }
  res.json({ ...program, tags: program.tags ?? [] });
});

router.delete("/programs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(sampleProgramsTable)
    .where(eq(sampleProgramsTable.id, id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Program not found" });
    return;
  }
  res.json({ success: true, message: "Program deleted" });
});

router.get("/stats", async (req, res): Promise<void> => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [traceCount] = await db.select({ count: count() }).from(savedTracesTable);
  const [favCount] = await db.select({ count: count() }).from(favoriteProgramsTable);
  const [programCount] = await db.select({ count: count() }).from(sampleProgramsTable);
  const programRows = await db.select({ category: sampleProgramsTable.category }).from(sampleProgramsTable);
  const cats: Record<string, number> = {};
  for (const r of programRows) { cats[r.category] = (cats[r.category] ?? 0) + 1; }
  res.json({
    totalUsers: userCount.count,
    totalTraces: traceCount.count,
    totalFavorites: favCount.count,
    totalPrograms: programCount.count,
    programsByCategory: Object.entries(cats).map(([category, count]) => ({ category, count, description: "" })),
  });
});

export default router;

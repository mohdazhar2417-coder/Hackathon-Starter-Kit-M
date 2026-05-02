import { Router } from "express";
import { db, sampleProgramsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Basic I/O & Math": "Learn input/output operations and fundamental arithmetic computations",
  "Conditionals": "Master if/else logic, switch cases, and decision branching",
  "Loops": "Understand for loops, while loops, and iteration patterns",
  "Number Logic": "Explore number theory programs like palindromes, primes, and Fibonacci",
  "Pattern Programs": "Build visual star and number patterns using nested loops",
};

router.get("/categories", async (req, res): Promise<void> => {
  const rows = await db
    .select({ category: sampleProgramsTable.category })
    .from(sampleProgramsTable);
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.category] = (counts[row.category] ?? 0) + 1;
  }
  res.json(Object.entries(counts).map(([category, count]) => ({
    category,
    count,
    description: CATEGORY_DESCRIPTIONS[category] ?? "",
  })));
});

router.get("/featured", async (req, res): Promise<void> => {
  const programs = await db.select()
    .from(sampleProgramsTable)
    .where(eq(sampleProgramsTable.featured, true));
  res.json(programs.map(p => ({ ...p, tags: p.tags ?? [] })));
});

router.get("/", async (req, res): Promise<void> => {
  const { category, difficulty } = req.query as { category?: string; difficulty?: string };
  let query = db.select().from(sampleProgramsTable).$dynamic();
  if (category) {
    query = query.where(eq(sampleProgramsTable.category, category));
  }
  const programs = await query;
  res.json(programs.map(p => ({ ...p, tags: p.tags ?? [] })));
});

router.get("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [program] = await db.select()
    .from(sampleProgramsTable)
    .where(eq(sampleProgramsTable.id, id))
    .limit(1);
  if (!program) {
    res.status(404).json({ error: "Program not found" });
    return;
  }
  res.json({ ...program, tags: program.tags ?? [] });
});

export default router;

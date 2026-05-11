import { Router } from "express";
import { getProgramById, listProgramCategories, listPrograms } from "../lib/store.js";

const router = Router();

router.get("/categories", async (req, res): Promise<void> => {
  const categories = await listProgramCategories();
  res.json(categories);
});

router.get("/featured", async (req, res): Promise<void> => {
  const programs = await listPrograms({ featured: true });
  res.json(programs.map(p => ({ ...p, tags: p.tags ?? [] })));
});

router.get("/", async (req, res): Promise<void> => {
  const { category, difficulty } = req.query as { category?: string; difficulty?: string };
  let programs = await listPrograms({ category });
  if (difficulty) {
    programs = programs.filter((program) => program.difficulty === difficulty);
  }
  res.json(programs.map(p => ({ ...p, tags: p.tags ?? [] })));
});

router.get("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const program = await getProgramById(id);
  if (!program) {
    res.status(404).json({ error: "Program not found" });
    return;
  }
  res.json({ ...program, tags: program.tags ?? [] });
});

export default router;

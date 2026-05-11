import { Router } from "express";
import { AdminCreateProgramBody, AdminUpdateProgramBody } from "@workspace/api-zod";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";
import {
  createProgram,
  deleteProgram,
  getAdminStats,
  listPrograms,
  updateProgram,
} from "../lib/store.js";

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/programs", async (req, res): Promise<void> => {
  const programs = await listPrograms();
  res.json(programs.map(p => ({ ...p, tags: p.tags ?? [] })));
});

router.post("/programs", async (req, res): Promise<void> => {
  const parsed = AdminCreateProgramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const program = await createProgram({
    ...parsed.data,
    featured: parsed.data.featured ?? false,
    tags: parsed.data.tags ?? [],
  });
  res.status(201).json({ ...program, tags: program.tags ?? [] });
});

router.put("/programs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = AdminUpdateProgramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const program = await updateProgram(id, {
    ...parsed.data,
    featured: parsed.data.featured ?? false,
    tags: parsed.data.tags ?? [],
  });
  if (!program) {
    res.status(404).json({ error: "Program not found" });
    return;
  }
  res.json({ ...program, tags: program.tags ?? [] });
});

router.delete("/programs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const deleted = await deleteProgram(id);
  if (!deleted) {
    res.status(404).json({ error: "Program not found" });
    return;
  }
  res.json({ success: true, message: "Program deleted" });
});

router.get("/stats", async (req, res): Promise<void> => {
  const stats = await getAdminStats();
  res.json(stats);
});

export default router;

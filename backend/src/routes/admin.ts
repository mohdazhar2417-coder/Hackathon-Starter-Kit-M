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

router.get("/users", async (req, res): Promise<void> => {
  const { listUsers } = await import("../lib/store.js");
  const users = await listUsers();
  res.json(users.map(u => {
    const { passwordHash, ...rest } = u;
    return rest;
  }));
});

router.put("/users/:id", async (req, res): Promise<void> => {
  const { updateUser } = await import("../lib/store.js");
  const id = parseInt(req.params.id);
  const user = await updateUser(id, req.body);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { passwordHash, ...rest } = user;
  res.json(rest);
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const { deleteUser } = await import("../lib/store.js");
  const id = parseInt(req.params.id);
  const deleted = await deleteUser(id);
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ success: true });
});

router.get("/analytics", async (req, res): Promise<void> => {
  const { getAdminAnalytics } = await import("../lib/store.js");
  const analytics = await getAdminAnalytics();
  res.json(analytics);
});

router.get("/activity", async (req, res): Promise<void> => {
  const { getGlobalActivity } = await import("../lib/store.js");
  const activity = await getGlobalActivity();
  res.json(activity);
});

router.get("/upi-payments", async (req, res): Promise<void> => {
  const { listPayments } = await import("../lib/store.js");
  const payments = await listPayments();
  res.json(payments);
});

router.post("/upi-payments/:id/approve", async (req, res): Promise<void> => {
  const { getPaymentRecordById, updatePaymentRecord, updateUser } = await import("../lib/store.js");
  const id = parseInt(req.params.id);
  const payment = await getPaymentRecordById(id);
  if (!payment) {
    res.status(404).json({ error: "Payment request not found" });
    return;
  }

  await updatePaymentRecord(id, { status: "completed" });
  await updateUser(payment.userId, {
    subscriptionStatus: "active",
    planType: payment.planType,
  });

  res.json({ success: true });
});

router.post("/upi-payments/:id/reject", async (req, res): Promise<void> => {
  const { getPaymentRecordById, updatePaymentRecord } = await import("../lib/store.js");
  const id = parseInt(req.params.id);
  const payment = await getPaymentRecordById(id);
  if (!payment) {
    res.status(404).json({ error: "Payment request not found" });
    return;
  }

  await updatePaymentRecord(id, { status: "failed" });
  res.json({ success: true });
});

export default router;

import { Router } from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import { SignupBody, LoginBody } from "@workspace/api-zod";
import { authMiddleware, signToken } from "../middlewares/auth.js";
import type { Request } from "express";
import type { AuthPayload } from "../middlewares/auth.js";
import { createUser, findUserByEmail, findUserById } from "../lib/store.js";
import { authLimiter } from "../middlewares/rateLimit.js";
import type { UserRecord } from "../lib/store.js";

const router = Router();

router.post("/signup", authLimiter, async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, role } = parsed.data;
  const existing = await findUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({
    name,
    email,
    passwordHash,
    role: role ?? "student",
  });
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json({
    token,
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      stripeCustomerId: user.stripeCustomerId,
      subscriptionStatus: user.subscriptionStatus,
      planType: user.planType,
      createdAt: user.createdAt.toISOString() 
    },
  });
});

router.post("/login", authLimiter, async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const user = await findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      stripeCustomerId: user.stripeCustomerId,
      subscriptionStatus: user.subscriptionStatus,
      planType: user.planType,
      createdAt: user.createdAt.toISOString() 
    },
  });
});

router.get("/me", authMiddleware, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const user = await findUserById(userId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    role: user.role, 
    stripeCustomerId: user.stripeCustomerId,
    subscriptionStatus: user.subscriptionStatus,
    planType: user.planType,
    createdAt: user.createdAt.toISOString() 
  });
});

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// This route handles the callback from Google
router.get(
  "/google/callback",
  (req, res, next) => {
    // Manually handle the passport authentication to ensure it captures the code
    passport.authenticate("google", { session: false, failureRedirect: "/login" })(req, res, next);
  },
  (req, res) => {
    const user = req.user as UserRecord;
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/login?token=${token}`);
  }
);

export default router;

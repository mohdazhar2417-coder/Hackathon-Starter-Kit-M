import { Router } from "express";
import { stripe } from "../lib/stripe.js";
import { env } from "../lib/env.js";
import { authMiddleware } from "../middlewares/auth.js";
import type { Request, Response } from "express";
import type { AuthPayload } from "../middlewares/auth.js";
import { getUserById, updateUser } from "../lib/store.js";
import express from "express";

const router = Router();

// 1. Create Checkout Session
router.post("/create-checkout-session", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const user = await getUserById(userId);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price: env.STRIPE_PRO_PRICE_ID || "price_mock_pro",
          quantity: 1,
        },
      ],
      success_url: `${env.FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${env.FRONTEND_URL}/dashboard?payment=cancel`,
      metadata: {
        userId: userId.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Webhook Handler
// Note: Webhook needs raw body, we'll handle that in app.ts usually
router.post("/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"];

  if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(400).json({ error: "Missing signature or webhook secret" });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as any;
      const userId = parseInt(session.metadata.userId);
      await updateUser(userId, {
        subscriptionStatus: "active",
        planType: "pro",
        stripeCustomerId: session.customer as string,
      });
      console.log(`Payment successful for user ${userId}`);
      break;
    case "customer.subscription.deleted":
      const subscription = event.data.object as any;
      // Find user by customer ID and update status
      // (This requires a new store function getByStripeCustomerId)
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;

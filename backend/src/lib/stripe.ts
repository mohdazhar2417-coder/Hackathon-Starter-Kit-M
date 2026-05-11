import Stripe from "stripe";
import { env } from "./env.js";

if (!env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set. Payments will not work.");
}

export const stripe = new Stripe(env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2023-10-16" as any,
});

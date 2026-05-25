import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const upiPaymentsTable = pgTable("upi_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  planType: text("plan_type").notNull(), // "pro" | "institutional"
  amount: text("amount").notNull(),
  paymentMethod: text("payment_method").notNull(), // "upi_gpay" | "upi_phonepe" | "upi_paytm" | "upi_collect" | "card" | "netbanking"
  paymentRequestId: text("payment_request_id").notNull().unique(), // Instamojo payment request ID or simulated UUID
  status: text("status").notNull().default("pending"), // "pending" | "completed" | "failed"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

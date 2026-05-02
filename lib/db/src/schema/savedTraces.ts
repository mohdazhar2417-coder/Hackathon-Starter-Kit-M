import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedTracesTable = pgTable("saved_traces", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  subtype: text("subtype").notNull(),
  code: text("code").notNull(),
  customInputs: jsonb("custom_inputs"),
  traceSummary: text("trace_summary"),
  finalOutput: text("final_output"),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavedTraceSchema = createInsertSchema(savedTracesTable).omit({
  id: true,
  savedAt: true,
});
export type InsertSavedTrace = z.infer<typeof insertSavedTraceSchema>;
export type SavedTrace = typeof savedTracesTable.$inferSelect;

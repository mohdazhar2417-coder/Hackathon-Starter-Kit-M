import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sampleProgramsTable = pgTable("sample_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subtype: text("subtype").notNull(),
  code: text("code").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"),
  featured: boolean("featured").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSampleProgramSchema = createInsertSchema(sampleProgramsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSampleProgram = z.infer<typeof insertSampleProgramSchema>;
export type SampleProgram = typeof sampleProgramsTable.$inferSelect;

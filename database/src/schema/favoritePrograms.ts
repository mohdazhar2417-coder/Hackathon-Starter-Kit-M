import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const favoriteProgramsTable = pgTable("favorite_programs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  programId: integer("program_id").notNull(),
  programName: text("program_name").notNull(),
  programCategory: text("program_category").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFavoriteProgramSchema = createInsertSchema(favoriteProgramsTable).omit({
  id: true,
  addedAt: true,
});
export type InsertFavoriteProgram = z.infer<typeof insertFavoriteProgramSchema>;
export type FavoriteProgram = typeof favoriteProgramsTable.$inferSelect;

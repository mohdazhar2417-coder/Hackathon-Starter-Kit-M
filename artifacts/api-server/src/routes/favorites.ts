import { Router } from "express";
import { db, favoriteProgramsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { AddFavoriteBody } from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/auth.js";
import type { Request } from "express";
import type { AuthPayload } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const favorites = await db.select()
    .from(favoriteProgramsTable)
    .where(eq(favoriteProgramsTable.userId, userId));
  res.json(favorites.map(f => ({ ...f, addedAt: f.addedAt.toISOString() })));
});

router.post("/", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [fav] = await db.insert(favoriteProgramsTable).values({
    userId,
    ...parsed.data,
  }).returning();
  res.status(201).json({ ...fav, addedAt: fav.addedAt.toISOString() });
});

router.delete("/:id", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(favoriteProgramsTable)
    .where(and(eq(favoriteProgramsTable.id, id), eq(favoriteProgramsTable.userId, userId)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Favorite not found" });
    return;
  }
  res.json({ success: true, message: "Removed from favorites" });
});

export default router;

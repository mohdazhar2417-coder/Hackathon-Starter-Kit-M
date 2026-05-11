import { Router } from "express";
import { AddFavoriteBody } from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/auth.js";
import type { Request } from "express";
import type { AuthPayload } from "../middlewares/auth.js";
import {
  addFavorite,
  deleteFavoriteByIdForUser,
  listFavoritesByUser,
} from "../lib/store.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const favorites = await listFavoritesByUser(userId);
  res.json(favorites.map(f => ({ ...f, addedAt: f.addedAt.toISOString() })));
});

router.post("/", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const fav = await addFavorite({
    userId,
    ...parsed.data,
  });
  res.status(201).json({ ...fav, addedAt: fav.addedAt.toISOString() });
});

router.delete("/:id", async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const id = parseInt(req.params.id);
  const deleted = await deleteFavoriteByIdForUser(id, userId);
  if (!deleted) {
    res.status(404).json({ error: "Favorite not found" });
    return;
  }
  res.json({ success: true, message: "Removed from favorites" });
});

export default router;

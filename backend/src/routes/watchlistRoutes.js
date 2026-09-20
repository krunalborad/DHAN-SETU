import { Router } from "express";
import WatchlistItem from "../models/Watchlist.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const items = await WatchlistItem.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ watchlist: items });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ message: "symbol is required." });

    const item = await WatchlistItem.findOneAndUpdate(
      { user: req.userId, symbol: symbol.toUpperCase() },
      { user: req.userId, symbol: symbol.toUpperCase() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const item = await WatchlistItem.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!item) return res.status(404).json({ message: "Watchlist item not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    next(err);
  }
});

export default router;

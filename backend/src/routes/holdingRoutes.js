import { Router } from "express";
import Holding from "../models/Holding.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const holdings = await Holding.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ holdings });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { symbol, quantity, buyPrice, buyDate } = req.body;
    if (!symbol || !quantity || !buyPrice || !buyDate) {
      return res.status(400).json({ message: "symbol, quantity, buyPrice, and buyDate are required." });
    }
    const holding = await Holding.create({
      user: req.userId,
      symbol,
      quantity,
      buyPrice,
      buyDate,
    });
    res.status(201).json({ holding });
  } catch (err) {
    next(err);
  }
});

// Bulk create — used by the CSV import flow
router.post("/bulk", async (req, res, next) => {
  try {
    const { holdings } = req.body;
    if (!Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({ message: "holdings must be a non-empty array." });
    }
    const docs = await Holding.insertMany(
      holdings.map((h) => ({ ...h, user: req.userId }))
    );
    res.status(201).json({ holdings: docs });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const holding = await Holding.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!holding) return res.status(404).json({ message: "Holding not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    next(err);
  }
});

export default router;

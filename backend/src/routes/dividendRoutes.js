import { Router } from "express";
import Dividend from "../models/Dividend.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const dividends = await Dividend.find({ user: req.userId }).sort({ exDate: -1 });
    res.json({ dividends });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { symbol, amountPerShare, exDate, paidDate } = req.body;
    if (!symbol || !amountPerShare || !exDate) {
      return res.status(400).json({ message: "symbol, amountPerShare, and exDate are required." });
    }
    const dividend = await Dividend.create({
      user: req.userId,
      symbol,
      amountPerShare,
      exDate,
      paidDate: paidDate ?? null,
    });
    res.status(201).json({ dividend });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const dividend = await Dividend.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!dividend) return res.status(404).json({ message: "Dividend not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    next(err);
  }
});

export default router;

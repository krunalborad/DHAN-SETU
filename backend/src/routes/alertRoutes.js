import { Router } from "express";
import Alert from "../models/Alert.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const alerts = await Alert.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { symbol, condition, targetPrice } = req.body;
    if (!symbol || !["above", "below"].includes(condition) || !targetPrice) {
      return res.status(400).json({ message: "symbol, condition (above|below), and targetPrice are required." });
    }
    const alert = await Alert.create({ user: req.userId, symbol, condition, targetPrice });
    res.status(201).json({ alert });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: req.body },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: "Alert not found." });
    res.json({ alert });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!alert) return res.status(404).json({ message: "Alert not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    next(err);
  }
});

export default router;

import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    condition: { type: String, enum: ["above", "below"], required: true },
    targetPrice: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    triggeredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);

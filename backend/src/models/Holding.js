import mongoose from "mongoose";

const holdingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    quantity: { type: Number, required: true, min: 0.0001 },
    buyPrice: { type: Number, required: true, min: 0 },
    buyDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Holding", holdingSchema);

import mongoose from "mongoose";

const dividendSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    amountPerShare: { type: Number, required: true, min: 0 },
    exDate: { type: Date, required: true },
    paidDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Dividend", dividendSchema);

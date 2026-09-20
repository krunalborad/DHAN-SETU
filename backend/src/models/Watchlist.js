import mongoose from "mongoose";

const watchlistItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
  },
  { timestamps: true }
);

watchlistItemSchema.index({ user: 1, symbol: 1 }, { unique: true });

export default mongoose.model("WatchlistItem", watchlistItemSchema);

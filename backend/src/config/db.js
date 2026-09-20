import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn(
      "[db] MONGODB_URI is not set — the API will start but any database " +
        "call will fail. Copy .env.example to .env and add a real connection string."
    );
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("[db] Connected to MongoDB");
  } catch (err) {
    console.error("[db] Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
}

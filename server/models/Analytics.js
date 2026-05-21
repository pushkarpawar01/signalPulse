import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    deepWorkScore: { type: Number, default: 0 },
    fragmentationScore: { type: Number, default: 0 },
    idleTime: { type: Number, default: 0 }, // in seconds
    focusTime: { type: Number, default: 0 }, // in seconds
  },
  { timestamps: true }
);

export default mongoose.model("Analytics", analyticsSchema);

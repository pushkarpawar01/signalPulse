import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appName: { type: String, required: true },
    windowTitle: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true }, // in seconds
    isIdle: { type: Boolean, default: false },
    switchCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);

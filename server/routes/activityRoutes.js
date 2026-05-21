import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createActivity, getTodayActivity } from "../controllers/activityController.js";

const router = express.Router();

// @route   POST /api/activity
// @desc    Receive activity batch from tracker
// @access  Private
router.post("/", protect, createActivity);

// @route   GET /api/activity/today
// @desc    Get current user's activity for today
// @access  Private
router.get("/today", protect, getTodayActivity);

export default router;

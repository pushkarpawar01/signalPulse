import express from "express";
import { protect, managerOnly } from "../middleware/authMiddleware.js";
import { getFocusScore, getTeamAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();

// @route   GET /api/analytics/focus-score
// @desc    Get current user's analytics
// @access  Private
router.get("/focus-score", protect, getFocusScore);

// @route   GET /api/analytics/team
// @desc    Get aggregate team stats
// @access  Private Manager
router.get("/team", protect, managerOnly, getTeamAnalytics);

export default router;

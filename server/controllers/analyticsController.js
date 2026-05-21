import Activity from "../models/Activity.js";

export const getFocusScore = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activities = await Activity.find({
      userId: req.user.id,
      startTime: { $gte: startOfDay }
    });

    let totalDuration = 0;
    let focusTime = 0; // single app > 30 mins
    let switchCount = 0;
    let idleTime = 0;

    activities.forEach(act => {
      totalDuration += act.duration;
      switchCount += act.switchCount || 1;
      if (act.isIdle) {
        idleTime += act.duration;
      }
      if (act.duration > 30 * 60 && !act.isIdle) { // 30 mins
        focusTime += act.duration;
      }
    });

    // Switches Per Minute
    const activeMinutes = (totalDuration - idleTime) / 60;
    const switchFrequency = activeMinutes > 0 ? switchCount / activeMinutes : 0;
    
    const longFocusSessions = Math.floor(focusTime / (30 * 60));
    const idlePenalty = Math.floor(idleTime / (20 * 60)); // penalty for 20 mins stagnations

    const deepWorkScore = Math.max(0, (longFocusSessions * 2) - (switchFrequency * 1.5) - idlePenalty);
    
    // Fragmentation
    const fragmented = switchCount > 15 && totalDuration < 10 * 60; // 15 in 10 mins

    res.json({
      totalDuration,
      focusTime,
      idleTime,
      switchCount,
      deepWorkScore: deepWorkScore.toFixed(2),
      fragmented
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeamAnalytics = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activities = await Activity.find({ startTime: { $gte: startOfDay } });

    // Aggregate globally
    let totalDuration = 0;
    let switchCount = 0;
    let totalFocus = 0;

    activities.forEach(act => {
      totalDuration += act.duration;
      switchCount += act.switchCount || 1;
      if (act.duration > 30 * 60 && !act.isIdle) {
        totalFocus += act.duration;
      }
    });

    const avgFocusTime = totalDuration > 0 ? (totalFocus / activities.length) / 60 : 0;
    const teamFragmentationScore = switchCount > 0 ? Math.min(100, (switchCount / (totalDuration / 60)) * 10) : 0;

    res.json({
      teamFragmentationScore: teamFragmentationScore.toFixed(0),
      averageFocusTime: avgFocusTime.toFixed(0) // in mins
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

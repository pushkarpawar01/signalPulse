import Activity from "../models/Activity.js";

export const createActivity = async (req, res) => {
  try {
    const activities = req.body.map(act => ({
      ...act,
      userId: req.user.id
    }));
    
    await Activity.insertMany(activities);
    
    res.status(201).json({ message: "Activities recorded successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTodayActivity = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const activities = await Activity.find({
      userId: req.user.id,
      startTime: { $gte: startOfDay }
    }).sort({ startTime: 1 });
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

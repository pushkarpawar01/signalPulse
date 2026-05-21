const { app, BrowserWindow, Notification, ipcMain } = require("electron");
const activeWin = require("active-win");
const axios = require("axios");

let mainWindow;
let currentSession = null;
let activityBatch = [];
let token = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 450,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });
  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();
  startTracking();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC listener for login
ipcMain.on("login", async (event, credentials) => {
  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", credentials);
    token = res.data.token;
    event.reply("login-reply", { success: true, user: res.data.name });
  } catch (error) {
    event.reply("login-reply", { 
      success: false, 
      message: error.response?.data?.message || error.message 
    });
  }
});

const sendDataToServer = async () => {
  if (activityBatch.length === 0) return;

  // Check fragmentation in batch to trigger nudge locally even if not sent
  let switchCount = activityBatch.reduce((sum, act) => sum + act.switchCount, 0);
  if (switchCount > 15 || activityBatch.length > 15) {
    new Notification({
      title: "Focus Alert",
      body: "You switched apps multiple times recently. Try a 25-minute focus session."
    }).show();
  }

  if (!token) {
    console.log("No token, skipping upload for", activityBatch.length, "items.");
    activityBatch = [];
    return;
  }

  try {
    console.log("Sending batch of size:", activityBatch.length);
    await axios.post("http://localhost:5000/api/activity", activityBatch, {
      headers: { Authorization: `Bearer ${token}` }
    });
    activityBatch = []; // clear after sending
  } catch (error) {
    console.error("Failed to send activity data:", error.message);
  }
};

const startTracking = () => {
  setInterval(async () => {
    try {
      const window = await activeWin();
      if (!window) return;

      const now = new Date();
      
      if (!currentSession) {
        currentSession = {
          appName: window.owner.name,
          windowTitle: window.title,
          startTime: now,
          lastActive: now,
          switchCount: 0
        };
        return;
      }

      // Check if switched
      if (currentSession.appName !== window.owner.name) {
        // End current session
        currentSession.endTime = now;
        currentSession.duration = Math.floor((now - currentSession.startTime) / 1000);
        
        // Only record if duration > 1 sec to avoid noisy alt-tabs
        if (currentSession.duration > 0) {
          activityBatch.push({
            appName: currentSession.appName,
            windowTitle: currentSession.windowTitle,
            startTime: currentSession.startTime,
            endTime: currentSession.endTime,
            duration: currentSession.duration,
            isIdle: false, // Could implement idle detection with system idle time
            switchCount: currentSession.switchCount + 1
          });
        }

        // Start new session
        currentSession = {
          appName: window.owner.name,
          windowTitle: window.title,
          startTime: now,
          lastActive: now,
          switchCount: 0
        };
      } else {
        // Still on same app
        currentSession.lastActive = now;
      }
      
      // Send batch every 1 minute or if batch size gets large (3 items for testing)
      if (activityBatch.length >= 3) {
        sendDataToServer();
      }
      
    } catch (err) {
      console.error("Tracking error:", err);
    }
  }, 5000); // 5 sec interval
};

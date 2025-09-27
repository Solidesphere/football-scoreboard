const { app, BrowserWindow, ipcMain, screen, dialog } = require("electron");

// Reload all windows on request
ipcMain.on("reload-all-windows", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
  if (configWindow && !configWindow.isDestroyed()) configWindow.reload();
  Object.values(scoreboardWindows).forEach((win) => {
    if (win && !win.isDestroyed()) win.reload();
  });
});
const path = require("path");
const fs = require("fs");

// Relay get-timeout requests from scoreboard to main control panel
ipcMain.on("get-timeout", (event) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("get-timeout");
  }
});
// Relay timeout timer updates to all scoreboard windows
ipcMain.on("update-timeout", (_, timeoutValue) => {
  Object.values(scoreboardWindows).forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send("update-timeout", timeoutValue);
    }
  });
});

let mainWindow;
let configWindow;
let scoreboardWindows = {}; // key: displayId, value: BrowserWindow

const configPath = path.join(__dirname, "config.json");
const logosDir = path.join(__dirname, "logos");

// Ensure logos directory exists
if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir);

// ---------------- Config Helpers ----------------
function loadConfig() {
  if (fs.existsSync(configPath)) return JSON.parse(fs.readFileSync(configPath));
  return {
    teamA: { name: "Team A", logo: "" },
    teamB: { name: "Team B", logo: "" },
    type: "league",
  };
}

function saveConfig(cfg) {
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
}

// ---------------- Environment ----------------
const isDev = !app.isPackaged;

// ---------------- Window Navigation ----------------
function setupWindowNavigation(win) {
  // Prevent opening new windows (links with target="_blank")
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  // Prevent navigation to external sites
  win.webContents.on("will-navigate", (event, url) => {
    const allowedDev = isDev && url.startsWith("http://localhost:3000");
    const allowedProd = !isDev && url.startsWith("file://");
    if (!allowedDev && !allowedProd) event.preventDefault();
  });

  // Optional: prevent drag & drop from navigating away
  win.webContents.on("will-prevent-unload", (e) => e.preventDefault());
}

// ---------------- Window Factory ----------------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev,
    },
    icon: path.join(__dirname, "assets", "icon.ico"),
  });

  setupWindowNavigation(mainWindow);

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000/#/");
  } else {
    const indexPath = path.join(__dirname, "renderer", "build", "index.html");
    mainWindow.loadURL(`file://${indexPath.replace(/\\/g, "/")}#/`);
  }

  mainWindow.on("closed", () => {
    if (configWindow && !configWindow.isDestroyed()) configWindow.close();
    Object.values(scoreboardWindows).forEach((win) => {
      if (win && !win.isDestroyed()) win.close();
    });
    mainWindow = null;
    if (process.platform !== "darwin") app.quit();
  });
}

function createScoreboardWindow(displayId = 0) {
  const displays = screen.getAllDisplays();
  if (displayId >= displays.length) return;

  // Check if a scoreboard window is already open on this display
  if (
    scoreboardWindows[displayId] &&
    !scoreboardWindows[displayId].isDestroyed()
  ) {
    // Return the already open window without creating a new one
    return scoreboardWindows[displayId];
  }

  const { bounds } = displays[displayId];

  const win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false, // hide title bar
    resizable: false,
    skipTaskbar: true, // remove from taskbar
    fullscreen: true, // fullscreen mode
    fullscreenable: true,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev,
    },
  });
  setupWindowNavigation(win);

  // Load URL
  if (isDev) {
    win.loadURL("http://localhost:3000/#/scoreboard");
  } else {
    const indexPath = path.join(__dirname, "renderer", "build", "index.html");
    win.loadURL(`file://${indexPath.replace(/\\/g, "/")}#/scoreboard`);
  }

  // Remove scrollbars via injected CSS
  win.webContents.on("did-finish-load", () => {
    win.webContents.insertCSS(`
      html, body, #root {
        margin: 0;
        padding: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
      }
    `);
  });

  win.on("closed", () => {
    delete scoreboardWindows[displayId];
  });

  scoreboardWindows[displayId] = win;
  return win;
}

function createConfigWindow() {
  configWindow = new BrowserWindow({
    width: 500,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev,
    },
  });

  setupWindowNavigation(configWindow);

  if (isDev) {
    configWindow.loadURL("http://localhost:3000/#/config");
  } else {
    const indexPath = path.join(__dirname, "renderer", "build", "index.html");
    configWindow.loadURL(`file://${indexPath.replace(/\\/g, "/")}#/config`);
  }

  configWindow.on("closed", () => (configWindow = null));
}

// ---------------- App Events ----------------
app.on("ready", () => createMainWindow());

app.on("window-all-closed", () => {
  Object.values(scoreboardWindows).forEach((win) => {
    if (win && !win.isDestroyed()) win.destroy();
  });
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  Object.values(scoreboardWindows).forEach((win) => {
    if (win && !win.isDestroyed()) win.destroy();
  });
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
  if (configWindow && !configWindow.isDestroyed()) configWindow.destroy();
});

app.on("activate", () => {
  if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
});

// ---------------- IPC ----------------
ipcMain.on("update-scoreboard", (_, data) => {
  Object.values(scoreboardWindows).forEach((win) => {
    if (win && !win.isDestroyed()) win.webContents.send("update-data", data);
  });
});

ipcMain.on("show-scoreboard", (_, displayId) =>
  createScoreboardWindow(displayId)
);
ipcMain.on("show-config", () => createConfigWindow());

ipcMain.on("save-config", (_, data) => {
  saveConfig(data);

  const cfgToSend = {
    ...data,
    teamA: {
      ...data.teamA,
      logo: data.teamA.logo
        ? `file://${path
            .join(logosDir, path.basename(data.teamA.logo))
            .replace(/\\/g, "/")}`
        : "",
    },
    teamB: {
      ...data.teamB,
      logo: data.teamB.logo
        ? `file://${path
            .join(logosDir, path.basename(data.teamB.logo))
            .replace(/\\/g, "/")}`
        : "",
    },
  };

  [mainWindow, configWindow, ...Object.values(scoreboardWindows)].forEach(
    (win) => {
      if (win && !win.isDestroyed())
        win.webContents.send("load-config", cfgToSend);
    }
  );
});

ipcMain.handle("get-config", () => {
  const cfg = loadConfig();
  return {
    ...cfg,
    teamA: {
      ...cfg.teamA,
      logo: cfg.teamA.logo
        ? `file://${path
            .join(logosDir, path.basename(cfg.teamA.logo))
            .replace(/\\/g, "/")}`
        : "",
    },
    teamB: {
      ...cfg.teamB,
      logo: cfg.teamB.logo
        ? `file://${path
            .join(logosDir, path.basename(cfg.teamB.logo))
            .replace(/\\/g, "/")}`
        : "",
    },
    leagueLogo: cfg.leagueLogo
      ? `file://${path
          .join(logosDir, path.basename(cfg.leagueLogo))
          .replace(/\\/g, "/")}`
      : "",
  };
});

ipcMain.handle("pick-logo", async (_, teamKey) => {
  const result = await dialog.showOpenDialog({
    title: "Select Team Logo",
    filters: [
      { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "svg"] },
    ],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const selectedPath = result.filePaths[0];
  const ext = path.extname(selectedPath);
  const destPath = path.join(logosDir, `${teamKey}${ext}`);
  fs.copyFileSync(selectedPath, destPath);

  return `file://${destPath.replace(/\\/g, "/")}`;
});

ipcMain.handle("pick-league-logo", async () => {
  const result = await dialog.showOpenDialog({
    title: "Select League Logo",
    filters: [
      { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "svg"] },
    ],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const selectedPath = result.filePaths[0];
  const ext = path.extname(selectedPath);
  const destPath = path.join(logosDir, `league${ext}`);
  fs.copyFileSync(selectedPath, destPath);

  // Save to config immediately
  const cfg = loadConfig();
  cfg.leagueLogo = destPath;
  saveConfig(cfg);

  return `file://${destPath.replace(/\\/g, "/")}`;
});

ipcMain.handle("get-displays", () => {
  return screen.getAllDisplays().map((d, i) => ({
    id: i,
    width: d.bounds.width,
    height: d.bounds.height,
    x: d.bounds.x,
    y: d.bounds.y,
  }));
});

ipcMain.handle("get-scoreboards", () => {
  return Object.entries(scoreboardWindows).map(([displayId, win]) => ({
    displayId: Number(displayId),
    bounds: win.getBounds(),
  }));
});

ipcMain.on("close-scoreboard", (_, displayId) => {
  const win = scoreboardWindows[displayId];
  if (win && !win.isDestroyed()) win.close();
});

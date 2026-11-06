const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: "#1b1f27",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.setMenuBarVisibility(false);
  win.maximize();
  const url = process.env.SALES_URL || "http://127.0.0.1:3000";
  win.loadURL(url);
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

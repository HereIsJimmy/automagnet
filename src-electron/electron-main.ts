import { BrowserWindow, app, ipcMain, shell } from "electron";
import path from "node:path";
import os from "node:os";
import {
  registerQuasarRuntime,
  resolveElectronAssetsPath
} from "#q-app/electron/main";
import {
  ensureConfigExists,
  readConfig,
  saveLastDownload,
  saveUploaders,
  saveWhitelist,
} from "./config-store";

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

async function createWindow() {
  /**
   * Initial window options
   */
  const mainWindow = new BrowserWindow({
    icon: resolveElectronAssetsPath("icons/icon.png"), // Windows and Linux
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.join(import.meta.dirname, "electron-preload.cjs")
    }
  });

  // magnet: links can't be navigated to directly; hand them off to the OS's
  // default torrent client instead of letting the window try (and fail) to load them
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("magnet:")) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  if (import.meta.env.QUASAR_DEV) {
    await mainWindow.loadURL(import.meta.env.QUASAR_APP_URL);
  } else {
    await mainWindow.loadFile("index.html");
  }

  if (import.meta.env.QUASAR_DEBUG) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow?.webContents.closeDevTools();
    });
  }
}

ipcMain.handle("config:get", () => readConfig());
ipcMain.handle("config:setUploaders", (_event, uploaders: string[]) => {
  saveUploaders(uploaders);
});
ipcMain.handle("config:setWhitelist", (_event, whitelist: string[]) => {
  saveWhitelist(whitelist);
});

ipcMain.handle("config:setLastDownload", (_event, lastDownload: string) => {
  saveLastDownload(lastDownload);
});

ipcMain.handle("net:fetchText", async (_event, url: string) => {
  const response = await fetch(url);
  return response.text();
});

void app.whenReady().then(() => {
  ensureConfigExists();
  registerQuasarRuntime();
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    app.quit();
  }
});

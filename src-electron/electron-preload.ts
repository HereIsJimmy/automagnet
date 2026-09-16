/**
 * This file is used specifically for security reasons.
 * Here you can securely expose privileged APIs into the renderer process
 * by leveraging Electron's contextBridge functionality and communicating
 * with the main process through Electron's inter-process communication (IPC).
 *
 * WARNING!
 * The preload script sandboxing offers limited access to a full Node.js environment.
 * Do NOT attempt to import packages from node_modules or use Node.js APIs directly in this file.
 * Instead, use IPC to communicate with the main process and access packages and Node.js
 * functionality there.
 *
 * Example on injecting window.myAPI.doAThing() into renderer thread:
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * Preload script documentation:
 * https://www.electronjs.org/docs/latest/tutorial/tutorial-preload
 */

import { contextBridge, ipcRenderer } from "electron";
import { quasarRuntime } from "#q-app/electron/preload";
import type { AppConfig } from "./config-store";

/**
 * Can be used in the renderer process through `window.quasarRuntime`
 */
contextBridge.exposeInMainWorld("quasarRuntime", quasarRuntime);

/**
 * Can be used in the renderer process through `window.configAPI`
 */
contextBridge.exposeInMainWorld("configAPI", {
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke("config:get"),
  setUploaders: (uploaders: string[]): Promise<void> =>
    ipcRenderer.invoke("config:setUploaders", uploaders),
  setWhitelist: (whitelist: string[]): Promise<void> =>
    ipcRenderer.invoke("config:setWhitelist", whitelist),
  setLastDownload: (lastDownload: string): Promise<void> =>
    ipcRenderer.invoke("config:setLastDownload", lastDownload),
});

/**
 * Fetches happen in the main process (via `window.netAPI`) instead of the
 * renderer because the renderer enforces the same browser CORS rules as
 * Chrome; third-party sites like [URL] don't send CORS headers, so a
 * renderer-side fetch() is blocked outright. Node's fetch in the main
 * process has no such restriction.
 *
 * Can be used in the renderer process through `window.netAPI`
 */
contextBridge.exposeInMainWorld("netAPI", {
  fetchText: (url: string): Promise<string> => ipcRenderer.invoke("net:fetchText", url),
});

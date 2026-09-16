import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

export interface AppConfig {
  uploaders: string[];
  whitelist: string[];
  lastDownload: string;
}

function getDefaultConfig(): AppConfig {
  return {
    uploaders: [],
    whitelist: [],
    lastDownload: "",
  };
}

function getConfigPath(): string {
  return path.join(app.getPath("userData"), "config.json");
}

export function readConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(getConfigPath(), "utf-8");
    return { ...getDefaultConfig(), ...(JSON.parse(raw) as Partial<AppConfig>) };
  } catch {
    return getDefaultConfig();
  }
}

function writeConfig(config: AppConfig): void {
  const configPath = getConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export function ensureConfigExists(): void {
  if (!fs.existsSync(getConfigPath())) {
    writeConfig(getDefaultConfig());
  }
}

export function saveUploaders(uploaders: string[]): void {
  const config = readConfig();
  config.uploaders = uploaders;
  writeConfig(config);
}

export function saveWhitelist(whitelist: string[]): void {
  const config = readConfig();
  config.whitelist = whitelist;
  writeConfig(config);
}

export function saveLastDownload(lastDownload: string): void {
  const config = readConfig();
  config.lastDownload = lastDownload;
  writeConfig(config);
}

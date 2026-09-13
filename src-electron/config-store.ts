import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

export interface AppConfig {
  uploaders: string[];
  whitelist: string[];
}

const defaultConfig: AppConfig = {
  uploaders: [],
  whitelist: [],
};

function getConfigPath(): string {
  return path.join(app.getPath("userData"), "config.json");
}

export function readConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(getConfigPath(), "utf-8");
    return { ...defaultConfig, ...(JSON.parse(raw) as Partial<AppConfig>) };
  } catch {
    return { ...defaultConfig };
  }
}

function writeConfig(config: AppConfig): void {
  const configPath = getConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
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

export interface AppConfig {
  uploaders: string[];
  whitelist: string[];
}

interface ConfigAPI {
  getConfig: () => Promise<AppConfig>;
  setUploaders: (uploaders: string[]) => Promise<void>;
  setWhitelist: (whitelist: string[]) => Promise<void>;
}

declare global {
  interface Window {
    configAPI: ConfigAPI;
  }
}

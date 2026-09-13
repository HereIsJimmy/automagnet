export interface NetAPI {
  fetchText: (url: string) => Promise<string>;
}

declare global {
  interface Window {
    netAPI: NetAPI;
  }
}

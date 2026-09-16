import { defineStore, acceptHMRUpdate } from 'pinia';

interface ConfigState {
  uploaders: string[];
  whitelist: string[];
  lastDownload: string;
  loaded: boolean;
}

export const useConfigStore = defineStore('config', {
  state: (): ConfigState => ({
    uploaders: [],
    whitelist: [],
    lastDownload: '',
    loaded: false,
  }),

  actions: {
    async load() {
      if (!window.configAPI) return;

      const config = await window.configAPI.getConfig();
      this.uploaders = config.uploaders;
      this.whitelist = config.whitelist;
      this.lastDownload = config.lastDownload;
      this.loaded = true;
    },

    async saveUploaders() {
      // this.uploaders is a reactive Proxy - Electron's IPC uses the
      // structured clone algorithm, which can't clone a Proxy directly.
      await window.configAPI?.setUploaders([...this.uploaders]);
    },

    async saveWhitelist() {
      await window.configAPI?.setWhitelist([...this.whitelist]);
    },

    async setLastDownload(lastDownload: string) {
      this.lastDownload = lastDownload;
      await window.configAPI?.setLastDownload(lastDownload);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}

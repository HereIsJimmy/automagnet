import { defineStore, acceptHMRUpdate } from 'pinia';

interface ConfigState {
  uploaders: string[];
  whitelist: string[];
  loaded: boolean;
}

export const useConfigStore = defineStore('config', {
  state: (): ConfigState => ({
    uploaders: [],
    whitelist: [],
    loaded: false,
  }),

  actions: {
    async load() {
      if (!window.configAPI) return;

      const config = await window.configAPI.getConfig();
      this.uploaders = config.uploaders;
      this.whitelist = config.whitelist;
      this.loaded = true;
    },

    async saveUploaders() {
      await window.configAPI?.setUploaders(this.uploaders);
    },

    async saveWhitelist() {
      await window.configAPI?.setWhitelist(this.whitelist);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}

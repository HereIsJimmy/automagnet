import { defineStore, acceptHMRUpdate } from 'pinia';

interface WhitelistItem {
  title: string;
  magnet: string;
  date: string;
  uploader: string;
}

interface UiState {
  scannedItems: WhitelistItem[];
}

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    scannedItems: [],
  }),

  actions: {
    setScannedItems(items: WhitelistItem[]) {
      this.scannedItems = items;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot));
}

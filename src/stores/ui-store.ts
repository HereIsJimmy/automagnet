import { defineStore, acceptHMRUpdate } from 'pinia';

export type HomeView = 'uploaders' | 'whitelist';

interface UiState {
  activeView: HomeView;
}

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    activeView: 'uploaders',
  }),

  actions: {
    setView(view: HomeView) {
      this.activeView = view;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot));
}

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="mdi-menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Automagnet </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="560">
      <q-list>
        <q-expansion-item
          v-model="whitelistExpanded"
          icon="mdi-format-list-checks"
          label="Whitelist"
          style="border-top: 1px solid #eee"
          @show="uploadersExpanded = false"
        >
          <div class="q-pa-sm drawer-panel-content">
            <WhitelistForm :items="uiStore.scannedItems" />
          </div>
        </q-expansion-item>

        <q-expansion-item
          v-model="uploadersExpanded"
          icon="mdi-upload"
          label="Torrent Uploaders"
          style="border-top: 1px solid #eee; border-bottom: 1px solid #eee"
          @show="whitelistExpanded = false"
        >
          <div class="q-pa-sm drawer-panel-content">
            <UploadersForm />
          </div>
        </q-expansion-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUiStore } from '@/stores/ui-store';
import WhitelistForm from '@/components/WhitelistForm.vue';
import UploadersForm from '@/components/UploadersForm.vue';

const uiStore = useUiStore();
const leftDrawerOpen = ref(false);
const whitelistExpanded = ref(false);
const uploadersExpanded = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>

<style scoped>
.drawer-panel-content {
  max-width: 100%;
  overflow-x: auto;
}
</style>

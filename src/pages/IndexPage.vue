<template>
  <q-page class="q-pa-md">
    <q-tabs
      v-model="uiStore.activeView"
      align="left"
      class="text-primary q-mb-md"
      active-color="primary"
      indicator-color="primary"
    >
      <q-tab name="uploaders" icon="upload" label="Torrent Uploaders" no-caps />
      <q-tab name="whitelist" icon="checklist" label="Whitelist" no-caps />
    </q-tabs>

    <UploadersForm v-if="uiStore.activeView === 'uploaders'" />
    <WhitelistForm v-else />
  </q-page>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui-store';
import UploadersForm from '@/components/UploadersForm.vue';
import WhitelistForm from '@/components/WhitelistForm.vue';

const uiStore = useUiStore();
</script>

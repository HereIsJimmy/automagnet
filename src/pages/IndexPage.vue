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
    <WhitelistForm v-else :items="whitelistItems" />

    <div class="q-mt-lg">
      <q-btn
        color="primary"
        label="Start scanning"
        no-caps
        :loading="scanning"
        @click="onStartScanning"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUiStore } from '@/stores/ui-store';
import { useConfigStore } from '@/stores/config-store';
import UploadersForm from '@/components/UploadersForm.vue';
import WhitelistForm from '@/components/WhitelistForm.vue';
import { startScanning, extractData, ResultStatus } from '@/lib/scanner';

const uiStore = useUiStore();
const configStore = useConfigStore();
const scanning = ref(false);
const whitelistItems = ref<string[]>([]);

async function onStartScanning() {
  if (scanning.value) return;

  scanning.value = true;
  try {
    if (!configStore.loaded) await configStore.load();

    const results = await startScanning(configStore.uploaders, configStore.whitelist);
    whitelistItems.value = results
      .filter((result) => result.status !== ResultStatus.Filtered)
      .map((result) => extractData(result.row).title);
  } finally {
    scanning.value = false;
  }
}
</script>

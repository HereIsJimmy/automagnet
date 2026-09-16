<template>
  <div>
    <div class="row items-center q-gutter-md q-mt-lg scan-layer">
      <q-input
        :model-value="configStore.lastDownload"
        outlined
        dense
        mask="####-##-## ##:##"
        placeholder="YYYY-MM-DD HH:MM"
        class="last-download-input"
        style="margin-top: 0"
        :error="!configStore.lastDownload"
        @update:model-value="onFullChange"
      >
        <template #append>
          <q-icon name="mdi-calendar" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="datePart" mask="YYYY-MM-DD">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
          <q-icon name="mdi-clock-outline" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-time v-model="timePart" mask="HH:mm" format24h>
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-time>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>

      <q-btn
        color="primary"
        label="Start scanning"
        style="margin-top: 0"
        no-caps
        :loading="scanning"
        :disable="!configStore.lastDownload"
        @click="onStartScanning"
      />
    </div>

    <q-banner v-if="scanError" class="bg-negative text-white q-mt-md">
      {{ scanError }}
    </q-banner>

    <div class="q-mt-lg whitelisted-items">
      <div class="text-subtitle2 q-mb-sm">Whitelisted items</div>
      <div v-if="configStore.whitelist.length === 0" class="text-grey">
        No whitelist entries yet.
      </div>
      <div v-else class="row q-gutter-xs">
        <q-chip
          v-for="entry in configStore.whitelist"
          :key="entry"
          removable
          color="positive"
          text-color="white"
          @remove="removeWhitelistEntry(entry)"
        >
          {{ entry }}
        </q-chip>
      </div>
    </div>

    <div class="q-mt-lg">
      <div class="text-subtitle2 q-mb-sm">Opened Magnets</div>
      <div v-if="openedMagnets.length === 0" class="text-grey">
        No magnets opened from the last scan.
      </div>
      <q-markup-table v-else flat bordered class="scanned-whitelisted-table">
        <thead>
          <tr>
            <th class="text-center" style="width: 120px">Uploader</th>
            <th class="text-left">Title</th>
            <th class="text-center" style="width: 140px">Date</th>
            <th class="text-center" style="width: 120px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in openedMagnets" :key="item.title">
            <td class="text-center">
              <q-badge
                :style="{ backgroundColor: pastelColorForUploader(item.uploader), color: '#333' }"
              >
                {{ item.uploader }}
              </q-badge>
            </td>
            <td>{{ displayTitle(item.title) }}</td>
            <td class="text-center">{{ item.date }}</td>
            <td class="text-center">
              <q-btn
                round
                dense
                flat
                size="sm"
                icon="mdi-magnet"
                color="primary"
                aria-label="Open magnet link"
                @click="openMagnet(item.magnet)"
              />
              <q-btn
                round
                dense
                flat
                icon="mdi-delete"
                color="negative"
                aria-label="Remove from opened magnets"
                @click="removeOpenedMagnet(item)"
              />
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </div>

    <div class="q-mt-lg">
      <div class="text-subtitle2 q-mb-sm">Ignored results</div>
      <div v-if="ignoredResults.length === 0" class="text-grey">
        No ignored results from the last scan.
      </div>
      <q-markup-table v-else flat bordered class="scanned-whitelisted-table">
        <thead>
          <tr>
            <th class="text-center" style="width: 120px">Uploader</th>
            <th class="text-left">Title</th>
            <th class="text-center" style="width: 140px">Date</th>
            <th class="text-center" style="width: 120px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in ignoredResults" :key="item.title">
            <td class="text-center">
              <q-badge
                :style="{ backgroundColor: pastelColorForUploader(item.uploader), color: '#333' }"
              >
                {{ item.uploader }}
              </q-badge>
            </td>
            <td>{{ displayTitle(item.title) }}</td>
            <td class="text-center">{{ item.date }}</td>
            <td class="text-center">
              <q-btn
                round
                dense
                flat
                size="sm"
                icon="mdi-magnet"
                color="primary"
                aria-label="Open magnet link"
                @click="openMagnet(item.magnet)"
              />
              <q-btn
                round
                dense
                flat
                icon="mdi-delete"
                color="negative"
                aria-label="Remove from ignored results"
                @click="removeIgnoredResult(item)"
              />
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useConfigStore } from '@/stores/config-store';
import {
  startScanning,
  openMagnet,
  ResultStatus,
  ScanFetchError,
  type Result,
} from '@/lib/scanner';
import { stripBracketTags as displayTitle, pastelColorForUploader } from '@/lib/display';

interface WhitelistItem {
  title: string;
  magnet: string;
  date: string;
  uploader: string;
}

function toWhitelistItem(result: Result): WhitelistItem {
  return {
    title: result.data.title,
    magnet: result.data.magnet,
    date: result.data.date,
    uploader: result.uploader ?? '',
  };
}

function sortByDateDesc(list: WhitelistItem[]): WhitelistItem[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

const emit = defineEmits<{
  scanned: [items: WhitelistItem[]];
}>();

const configStore = useConfigStore();
const scanning = ref(false);
const scanError = ref<string | null>(null);
const openedMagnets = ref<WhitelistItem[]>([]);
const ignoredResults = ref<WhitelistItem[]>([]);

onMounted(() => {
  if (!configStore.loaded) void configStore.load();
});

function removeWhitelistEntry(entry: string) {
  const index = configStore.whitelist.indexOf(entry);
  if (index === -1) return;
  configStore.whitelist.splice(index, 1);
  void configStore.saveWhitelist();
}

function removeOpenedMagnet(item: WhitelistItem) {
  openedMagnets.value = openedMagnets.value.filter((i) => i.title !== item.title);
}

function removeIgnoredResult(item: WhitelistItem) {
  ignoredResults.value = ignoredResults.value.filter((i) => i.title !== item.title);
}

function onFullChange(value: string | number | null) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return;
  void configStore.setLastDownload(value);
}

const datePart = computed({
  get: () => configStore.lastDownload.split(' ')[0] ?? '',
  set: (value: string) => {
    const time = configStore.lastDownload.split(' ')[1] ?? '00:00';
    onFullChange(`${value} ${time}`);
  },
});

const timePart = computed({
  get: () => configStore.lastDownload.split(' ')[1] ?? '00:00',
  set: (value: string) => {
    const date = configStore.lastDownload.split(' ')[0];
    if (!date) return;
    onFullChange(`${date} ${value}`);
  },
});

async function onStartScanning() {
  if (scanning.value || !configStore.lastDownload) return;

  scanning.value = true;
  scanError.value = null;
  try {
    if (!configStore.loaded) await configStore.load();

    const results = await startScanning(
      configStore.uploaders,
      configStore.whitelist,
      configStore.lastDownload,
    );
    emit(
      'scanned',
      results.filter((result) => result.status !== ResultStatus.Filtered).map(toWhitelistItem),
    );
    openedMagnets.value = sortByDateDesc(
      results.filter((result) => result.opened).map(toWhitelistItem),
    );
    ignoredResults.value = sortByDateDesc(
      results
        .filter((result) => result.status === ResultStatus.Whitelisted && !result.opened)
        .map(toWhitelistItem),
    );
  } catch (err) {
    if (err instanceof ScanFetchError) {
      scanError.value = `Scanning stopped: ${err.message}`;
    } else {
      scanError.value = err instanceof Error ? err.message : String(err);
    }
  } finally {
    scanning.value = false;
  }
}
</script>

<style>
.scan-layer .q-field__bottom {
  display: none;
}
.whitelisted-items .q-chip__icon--remove {
  margin-left: 0.3em;
}
</style>
<style scoped>
.scanned-whitelisted-table {
  max-width: 1200px;
}

.last-download-input {
  min-width: 260px;
}

.last-download-input :deep(.q-field__control) {
  height: 36px;
  min-height: 36px;
}
</style>

<template>
  <div>
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-input
        v-model="manualEntry"
        dense
        outlined
        label="Add whitelist entry"
        class="manual-entry-input"
        @keyup.enter="addManualEntry"
      />
      <q-btn
        color="primary"
        label="Add"
        no-caps
        :disable="!manualEntry.trim()"
        @click="addManualEntry"
      />
    </div>

    <div class="row items-center q-gutter-sm q-mb-md sort-bar">
      <div class="text-caption text-grey-7">Sort by</div>
      <q-btn
        flat
        dense
        no-caps
        :color="sortColumn === 'title' ? 'primary' : 'grey-7'"
        label="Title"
        :icon-right="
          sortColumn === 'title'
            ? sortDirection === 'asc'
              ? 'mdi-arrow-up'
              : 'mdi-arrow-down'
            : undefined
        "
        @click="toggleSort('title')"
      />
      <q-btn
        flat
        dense
        no-caps
        :color="sortColumn === 'date' ? 'primary' : 'grey-7'"
        label="Date"
        :icon-right="
          sortColumn === 'date'
            ? sortDirection === 'asc'
              ? 'mdi-arrow-up'
              : 'mdi-arrow-down'
            : undefined
        "
        @click="toggleSort('date')"
      />
    </div>

    <div class="column q-gutter-sm whitelist-cards">
      <q-card
        v-for="(item, index) in sortedItems"
        :key="index"
        flat
        bordered
        class="whitelist-card"
        :style="isWhitelisted(item.title) ? { borderColor: 'var(--q-positive)' } : undefined"
      >
        <q-card-section class="q-pb-none card-title">
          <div :ref="(el) => setCellRef(el, index)" class="selectable-cell text-subtitle2">
            {{ displayTitle(item.title) }}
          </div>
        </q-card-section>
        <q-card-section class="row items-center card-info-actions">
          <div class="row items-center q-gutter-sm card-info">
            <q-badge
              :style="{ backgroundColor: pastelColorForUploader(item.uploader), color: '#333' }"
            >
              {{ item.uploader }}
            </q-badge>
            <div class="text-caption text-grey-7">{{ item.date }}</div>
          </div>
          <q-space />
          <div class="row items-center">
            <q-btn
              round
              dense
              flat
              icon="mdi-check"
              :color="selectedRowIndex === index ? 'positive' : 'grey-5'"
              :disable="selectedRowIndex !== index"
              aria-label="Add selected text to whitelist"
              @click="addSelected"
            />
            <q-btn
              round
              dense
              flat
              icon="mdi-link"
              color="primary"
              aria-label="Open magnet link"
              @click="openMagnet(item.magnet)"
            />
            <q-btn
              round
              dense
              flat
              size="sm"
              icon="mdi-magnet"
              :color="selectedRowIndex === index ? 'positive' : 'primary'"
              aria-label="Open magnet and whitelist selection"
              @click="onMagnetClick(item, index)"
            />
            <q-btn
              round
              dense
              flat
              icon="mdi-delete"
              color="negative"
              :disable="matchesFor(item.title).length === 0"
              aria-label="Remove matching whitelist entries"
              @click="onRemoveClick(item.title)"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <q-dialog v-model="dialogOpen">
      <q-card class="dialog-card">
        <q-card-section>
          <div class="text-subtitle1">Which whitelist entry should be removed?</div>
        </q-card-section>
        <q-card-section class="column q-gutter-sm">
          <q-btn
            v-for="entry in dialogMatches"
            :key="entry"
            class="full-width"
            size="lg"
            outline
            color="negative"
            no-caps
            :label="entry"
            @click="removeFromWhitelist(entry)"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
  type ComponentPublicInstance,
} from 'vue';
import { useConfigStore } from '@/stores/config-store';
import { openMagnet } from '@/lib/scanner';
import { stripBracketTags as displayTitle, pastelColorForUploader } from '@/lib/display';

interface WhitelistItem {
  title: string;
  magnet: string;
  date: string;
  uploader: string;
}

const { items } = defineProps<{
  items: WhitelistItem[];
}>();

const store = useConfigStore();

type SortColumn = 'title' | 'date' | null;
const sortColumn = ref<SortColumn>('date');
const sortDirection = ref<'asc' | 'desc'>('desc');

function toggleSort(column: 'title' | 'date') {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
}

const sortedItems = computed(() => {
  if (!sortColumn.value) return items;
  const column = sortColumn.value;
  const dir = sortDirection.value === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const aValue = column === 'title' ? displayTitle(a.title) : a.date;
    const bValue = column === 'title' ? displayTitle(b.title) : b.date;
    return aValue.localeCompare(bValue) * dir;
  });
});

// Derived live from the current whitelist rather than the scan-time status,
// so the border updates immediately when the check/bin buttons change it.
function isWhitelisted(title: string): boolean {
  return matchesFor(title).length > 0;
}

function matchesFor(title: string): string[] {
  return store.whitelist.filter((entry) => title.includes(entry));
}

function removeFromWhitelist(entry: string) {
  const index = store.whitelist.indexOf(entry);
  if (index === -1) return;
  store.whitelist.splice(index, 1);
  void store.saveWhitelist();
}

const dialogTitle = ref<string | null>(null);
const dialogMatches = computed(() => (dialogTitle.value ? matchesFor(dialogTitle.value) : []));
const dialogOpen = computed({
  get: () => dialogTitle.value !== null,
  set: (value: boolean) => {
    if (!value) dialogTitle.value = null;
  },
});

watch(dialogMatches, (matches) => {
  if (dialogTitle.value && matches.length === 0) {
    dialogTitle.value = null;
  }
});

function onRemoveClick(title: string) {
  const matches = matchesFor(title);
  if (matches.length === 0) return;
  if (matches.length === 1) {
    removeFromWhitelist(matches[0]!);
    return;
  }
  dialogTitle.value = title;
}

const cellRefs: (Element | null)[] = [];

function setCellRef(el: Element | ComponentPublicInstance | null, index: number) {
  cellRefs[index] = el instanceof Element ? el : null;
}

const selectedRowIndex = ref<number | null>(null);
const selectedText = ref('');

function handleSelectionChange() {
  const selection = window.getSelection();
  const text = selection?.toString().trim() ?? '';

  if (!selection || selection.isCollapsed || !text) {
    selectedRowIndex.value = null;
    selectedText.value = '';
    return;
  }

  const anchorNode = selection.anchorNode;
  const index = cellRefs.findIndex((el) => !!el && !!anchorNode && el.contains(anchorNode));

  if (index === -1) {
    selectedRowIndex.value = null;
    selectedText.value = '';
    return;
  }

  selectedRowIndex.value = index;
  selectedText.value = text;
}

function addTextToWhitelist(text: string) {
  const trimmed = text.trim();
  if (!trimmed || store.whitelist.includes(trimmed)) return;
  store.whitelist.push(trimmed);
  void store.saveWhitelist();
}

function addSelected() {
  addTextToWhitelist(selectedText.value);
}

const manualEntry = ref('');

function addManualEntry() {
  addTextToWhitelist(manualEntry.value);
  manualEntry.value = '';
}

function onMagnetClick(item: WhitelistItem, index: number) {
  openMagnet(item.magnet);
  if (selectedRowIndex.value === index) {
    addTextToWhitelist(selectedText.value);
  }
}

onMounted(() => {
  document.addEventListener('selectionchange', handleSelectionChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', handleSelectionChange);
});
</script>

<style scoped>
.whitelist-cards {
  max-width: 800px;
  margin-right: 8px;
}

.whitelist-card {
  width: 100%;
}
.whitelist-card .card-title {
  padding-top: 8px;
}
.whitelist-card .card-info-actions {
  padding: 0px 12px 8px !important;
}
.whitelist-card .q-btn--dense.q-btn--round {
  min-width: 2em;
}
.whitelist-card .card-info {
  margin-top: 0;
}

.selectable-cell {
  user-select: text;
  cursor: text;
  max-width: 800px;
  overflow-wrap: break-word;
  white-space: normal;
}

.dialog-card {
  min-width: 320px;
}

.manual-entry-input {
  min-width: 260px;
}
</style>

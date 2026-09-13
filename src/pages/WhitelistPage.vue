<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Whitelist</div>

    <q-markup-table flat bordered>
      <thead>
        <tr>
          <th class="text-left">Text</th>
          <th class="text-left" style="width: 80px">Add</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index">
          <td :ref="(el) => setCellRef(el, index)" class="selectable-cell">
            {{ item }}
          </td>
          <td>
            <q-btn
              round
              dense
              flat
              icon="check"
              color="positive"
              :disable="selectedRowIndex !== index"
              aria-label="Add selected text to whitelist"
              @click="addSelected"
            />
          </td>
        </tr>
      </tbody>
    </q-markup-table>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, type ComponentPublicInstance } from 'vue';

const items = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
  'Deserunt mollit anim id est laborum perspiciatis unde omnis iste natus.',
];

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

function addSelected() {
  console.log('Selected text to add to whitelist:', selectedText.value);
}

onMounted(() => {
  document.addEventListener('selectionchange', handleSelectionChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', handleSelectionChange);
});
</script>

<style scoped>
.selectable-cell {
  user-select: text;
  cursor: text;
}
</style>

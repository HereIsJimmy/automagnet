<template>
  <div>
    <div v-if="store.uploaders.length === 0" class="q-mb-md">
      <q-banner class="bg-grey-3">
        No uploaders yet.
        <template #action>
          <q-btn flat color="primary" label="Add uploader" no-caps @click="addUploader(0)" />
        </template>
      </q-banner>
    </div>

    <div
      v-for="(uploader, index) in store.uploaders"
      :key="index"
      class="row items-center q-gutter-sm q-mb-sm"
    >
      <q-input
        v-model="store.uploaders[index]"
        dense
        outlined
        class="col"
        placeholder="Uploader name"
        @update:model-value="scheduleSave"
      />
      <q-btn
        round
        dense
        flat
        icon="add"
        color="primary"
        aria-label="Add uploader below"
        @click="addUploader(index + 1)"
      />
      <q-btn
        round
        dense
        flat
        icon="delete"
        color="negative"
        aria-label="Remove uploader"
        @click="removeUploader(index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useConfigStore } from '@/stores/config-store';

const store = useConfigStore();

onMounted(() => {
  if (!store.loaded) void store.load();
});

let saveTimeout: ReturnType<typeof setTimeout> | undefined;

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    void store.saveUploaders();
  }, 500);
}

onBeforeUnmount(() => {
  if (saveTimeout) clearTimeout(saveTimeout);
});

function addUploader(index: number) {
  store.uploaders.splice(index, 0, '');
  void store.saveUploaders();
}

function removeUploader(index: number) {
  store.uploaders.splice(index, 1);
  void store.saveUploaders();
}
</script>

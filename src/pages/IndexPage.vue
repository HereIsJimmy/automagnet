<template>
  <q-page class="q-pa-md">
    <ScanForm @scanned="uiStore.setScannedItems($event)" />
  </q-page>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui-store';
import ScanForm from '@/components/ScanForm.vue';

const uiStore = useUiStore();
</script>

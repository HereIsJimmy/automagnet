<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Automagnet </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item to="/uploaders" clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="upload" />
          </q-item-section>
          <q-item-section>Torrent Uploaders</q-item-section>
        </q-item>

        <q-item to="/whitelist" clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="checklist" />
          </q-item-section>
          <q-item-section>Whitelist</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>

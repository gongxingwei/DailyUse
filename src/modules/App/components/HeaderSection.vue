<template>
  <div class="header-section">
    <div class="window-controls">
        <v-btn icon size="small" @click="minimizeWindow">
            <v-icon>mdi-minus</v-icon>
        </v-btn>
        <v-btn icon size="small" @click="maximizeWindow">
            <v-icon>{{ isMaximized ? 'mdi-window-restore' : 'mdi-window-maximize' }}</v-icon>
        </v-btn>
        <v-btn class="close-button" icon size="small" @click="closeWindow">
            <v-icon>mdi-close</v-icon>
        </v-btn>
    </div>
  </div>
    

</template>
<script setup lang="ts">
import { ref } from 'vue';

const isMaximized = ref(false)
const minimizeWindow = () => {
  window.shared.ipcRenderer.send('window-control', 'minimize')
}

const maximizeWindow = () => {
  window.shared.ipcRenderer.send('window-control', 'maximize')
  isMaximized.value = !isMaximized.value
}

const closeWindow = () => {
  window.shared.ipcRenderer.send('window-control', 'close')
}
</script>

<style lang="css" scoped>

.header-section {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 100%;
  padding-right: 12px;

  -webkit-app-region: drag;
}

.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.window-controls .v-btn {
  border-radius: 0;
  width: 46px;
  height: 32px;
}

.close-button:hover {
  background-color: rgba(var(--v-theme-error), 0.7);
}
</style>
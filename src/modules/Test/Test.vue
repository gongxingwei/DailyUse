<template>
  <div class="sync-status">
    <div :class="['status-indicator', connectionStatus]"></div>
    <span>{{ statusText }}</span>
    <button @click="syncNow" :disabled="!isOnline || isSyncing">
      {{ isSyncing ? 'Syncing...' : 'Sync Now' }}
    </button>
  </div>
</template>

<script>
import { inject, ref, computed } from 'vue';

export default {
  setup() {
    const syncService = inject('syncService');
    const isOnline = ref(navigator.onLine);
    const isSyncing = ref(false);
    const pendingChanges = ref(0);
    
    window.addEventListener('online', () => isOnline.value = true);
    window.addEventListener('offline', () => isOnline.value = false);
    
    // Listen to sync events from the main process
    if (syncService) {
      syncService.on('sync-start', () => isSyncing.value = true);
      syncService.on('sync-complete', () => isSyncing.value = false);
      syncService.on('queue-update', (queueSize) => pendingChanges.value = queueSize);
    }
    
    const connectionStatus = computed(() => {
      if (!isOnline.value) return 'offline';
      if (isSyncing.value) return 'syncing';
      if (pendingChanges.value > 0) return 'pending';
      return 'synced';
    });
    
    const statusText = computed(() => {
      if (!isOnline.value) return 'Offline';
      if (isSyncing.value) return 'Synchronizing...';
      if (pendingChanges.value > 0) return `${pendingChanges.value} changes pending`;
      return 'All changes synchronized';
    });
    
    const syncNow = () => {
      if (syncService && isOnline.value && !isSyncing.value) {
        syncService.syncWithServer();
      }
    };
    
    return {
      isOnline,
      isSyncing,
      pendingChanges,
      connectionStatus,
      statusText,
      syncNow
    };
  }
}
</script>

<style scoped>
.sync-status {
  display: flex;
  align-items: center;
  padding: 8px;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.offline { background-color: gray; }
.syncing { background-color: blue; }
.pending { background-color: orange; }
.synced { background-color: green; }
</style>
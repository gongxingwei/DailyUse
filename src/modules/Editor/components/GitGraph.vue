<template>
    <div class="git-graph">
      <div class="graph-header section-header">
        <div class="section-header-left">
          <span>Commit History</span>
        </div>
        <div class="section-header-right">
          <div class="section-header-actions">
            <button class="action-button" title="Refresh" @click="refresh">
              <v-icon size="small">mdi-refresh</v-icon>
            </button>
          </div>
        </div>
      </div>
      <div class="commits-container">
        <div v-for="commit in commits" :key="commit.hash" class="commit-item">
          <div class="commit-graph">
            <!-- Graph dots and lines will be rendered here -->
            <span class="graph-dot"></span>
          </div>
          <div class="commit-info">
            <div class="commit-message">{{ commit.message }}</div>
            <div class="commit-details">
              <span class="commit-author">{{ commit.author_name }}</span>
              <span class="commit-date">{{ formatDate(commit.date) }}</span>
              <span class="commit-hash">{{ commit.hash.substring(0, 7) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useSourceControlStore } from '../stores/sourceControlStore'
  
  interface Commit {
    hash: string
    message: string
    author_name: string
    date: string
  }
  
  const store = useSourceControlStore()
  const commits = ref<Commit[]>([])
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString()
  }
  
  const refresh = async () => {
    commits.value = await store.getCommitHistory() || []
  }
  
  onMounted(async () => {  // Make this async
  const history = await store.getCommitHistory()  // Await the Promise
  console.log("Commit history:", history)  // Now this will print the actual data
  await refresh()  // Also await refresh
})
  </script>
  
  <style scoped>
  .git-graph {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .commits-container {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }
  
  .commit-item {
    display: flex;
    padding: 8px;
    gap: 12px;
    cursor: pointer;
  }
  
  .commit-item:hover {
    background-color: var(--vscode-list-hoverBackground);
  }
  
  .commit-graph {
    width: 20px;
    position: relative;
    display: flex;
    justify-content: center;
  }
  
  .graph-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--vscode-textLink-foreground);
  }
  
  .commit-info {
    flex: 1;
    min-width: 0;
  }
  
  .commit-message {
    font-size: 13px;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .commit-details {
    display: flex;
    gap: 8px;
    font-size: 11px;
    opacity: 0.8;
  }
  </style>
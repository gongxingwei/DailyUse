<template>
    <v-container>
      <div class="d-flex align-center mb-6">
        <h1 class="text-h5 font-weight-medium">我的仓库</h1>
        <v-spacer></v-spacer>
        <v-btn
          color="success"
          prepend-icon="mdi-plus"
          @click="showCreateDialog = true"
        >
          新建仓库
        </v-btn>
      </div>
  
      <div class="repo-list">
        <div v-for="repo in repositoryStore.repositories" :key="repo.title" class="repo-item">
          <div class="d-flex align-center">
            <router-link 
              :to="`/repo/${encodeURIComponent(repo.title)}`"
              class="text-h6 text-primary text-decoration-none"
            >
              {{ repo.title }}
            </router-link>
          </div>
  
          <p class="text-body-1 mt-2 text-medium-emphasis" v-if="repo.description">
            {{ repo.description }}
          </p>
  
          <div class="d-flex align-center">
            <div class="text-caption text-disabled">
              更新于 {{ formatDate(repo.updateTime) }}
            </div>
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-cog"
              variant="text"
              size="small"
              @click="openSettings(repo)"
            ></v-btn>
          </div>
        </div>
  
        <div v-if="repositoryStore.repositories.length === 0" class="empty-state">
          <v-icon size="64" color="grey-lighten-1">mdi-folder-multiple</v-icon>
          <div class="text-h6 mt-4">暂无仓库</div>
          <div class="text-body-2 text-medium-emphasis mt-1">点击右上角新建仓库开始使用</div>
        </div>
      </div>
  
      <CreateRepo v-model="showCreateDialog" />
      <RepoSettings v-model="showSettings" :repo="selectedRepo" />
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { useRepositoryStore } from './repository'
  import type { Repository } from './repository'
  import CreateRepo from './components/CreateRepo.vue'
  import RepoSettings from './components/RepoSettings.vue'
  
  const repositoryStore = useRepositoryStore()
  const showCreateDialog = ref(false)
  const showSettings = ref(false)
  const selectedRepo = ref<Repository | null>(null)
  

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const openSettings = (repo: Repository) => {
    selectedRepo.value = repo
    showSettings.value = true
  }
  </script>
  
  <style scoped>
  .repo-list {
    display: grid;
    gap: 16px;
  }
  
  .repo-item {
    background-color: rgb(var(--v-theme-surface));
    padding: 24px;
    border: 10px solid rgb(var(--v-theme-outline));
    border-radius: 6px;
    transition: border-color 0.2s, transform 0.2s;
  
  }
  
  .repo-item:hover {
    border-color: rgb(var(--v-theme-primary));
    transform: translateY(-1px);
  }
  
  .empty-state {
    padding: 64px;
    text-align: center;
    border: 1px dashed rgb(var(--v-theme-outline));
    border-radius: 6px;
  }
  
  :deep(.v-btn--icon.v-btn--size-small) {
    width: 32px;
    height: 32px;
  }
  </style>
  
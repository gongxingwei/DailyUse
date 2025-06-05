<template>
  <div class="repository-page">
      <!-- 头部区域 -->
      <div class="page-header">
          <div class="header-content w-100">
              <div class="title-section">
                  <h1 class="page-title">我的仓库</h1>
                  <p class="page-subtitle">管理您的知识库和项目文档</p>
              </div>
              <v-btn
                  color="primary"
                  prepend-icon="mdi-plus"
                  variant="elevated"
                  @click="showCreateDialog = true"
                  class="create-btn"
              >
                  新建仓库
              </v-btn>
          </div>
      </div>

      <!-- 统计卡片 -->
      <div v-if="repositoryStore.repositories.length > 0" class="stats-section">
          <v-row>
              <v-col cols="12" sm="6" md="3">
                  <v-card class="stats-card" elevation="2">
                      <v-card-text class="text-center">
                          <v-icon color="primary" size="32" class="mb-2">mdi-folder-multiple</v-icon>
                          <div class="text-h5 font-weight-bold">{{ repositoryStore.repositories.length }}</div>
                          <div class="text-body-2 text-medium-emphasis">总仓库数</div>
                      </v-card-text>
                  </v-card>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                  <v-card class="stats-card" elevation="2">
                      <v-card-text class="text-center">
                          <v-icon color="success" size="32" class="mb-2">mdi-clock-outline</v-icon>
                          <div class="text-h5 font-weight-bold">{{ recentReposCount }}</div>
                          <div class="text-body-2 text-medium-emphasis">最近访问</div>
                      </v-card-text>
                  </v-card>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                  <v-card class="stats-card" elevation="2">
                      <v-card-text class="text-center">
                          <v-icon color="warning" size="32" class="mb-2">mdi-target</v-icon>
                          <div class="text-h5 font-weight-bold">{{ linkedGoalsCount }}</div>
                          <div class="text-body-2 text-medium-emphasis">关联目标</div>
                      </v-card-text>
                  </v-card>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                  <v-card class="stats-card" elevation="2">
                      <v-card-text class="text-center">
                          <v-icon color="info" size="32" class="mb-2">mdi-update</v-icon>
                          <div class="text-h5 font-weight-bold">{{ formatDateShort(lastUpdateTime) }}</div>
                          <div class="text-body-2 text-medium-emphasis">最后更新</div>
                      </v-card-text>
                  </v-card>
              </v-col>
          </v-row>
      </div>

      <!-- 仓库列表 -->
      <div class="content-section">
          <div v-if="repositoryStore.repositories.length > 0" class="repo-list">
              <v-card
                  v-for="repo in repositoryStore.repositories" 
                  :key="repo.title" 
                  class="repo-card"
                  elevation="3"
                  hover
              >
                  <v-card-text class="pa-6">
                      <div class="repo-header">
                          <div class="repo-info">
                              <router-link 
                                  :to="`/repository/${encodeURIComponent(repo.title)}`"
                                  class="repo-title"
                              >
                                  <v-icon class="mr-2" color="primary">mdi-folder</v-icon>
                                  {{ repo.title }}
                              </router-link>
                              
                              <!-- 关联目标标签 -->
                              <v-chip
                                  v-if="repo.relativeGoalId"
                                  color="primary"
                                  variant="tonal"
                                  size="small"
                                  class="ml-2"
                              >
                                  <v-icon start size="small">mdi-target</v-icon>
                                  {{ getGoalTitle(repo.relativeGoalId) }}
                              </v-chip>
                          </div>
                          
                          <v-menu>
                              <template v-slot:activator="{ props }">
                                  <v-btn
                                      icon="mdi-dots-vertical"
                                      variant="text"
                                      size="small"
                                      v-bind="props"
                                      class="action-btn"
                                  />
                              </template>
                              <v-list>
                                  <v-list-item @click="openSettings(repo)">
                                      <v-list-item-title>
                                          <v-icon start>mdi-cog</v-icon>
                                          设置
                                      </v-list-item-title>
                                  </v-list-item>
                                  <v-list-item @click="openInExplorer(repo)">
                                      <v-list-item-title>
                                          <v-icon start>mdi-folder-open</v-icon>
                                          打开文件夹
                                      </v-list-item-title>
                                  </v-list-item>
                              </v-list>
                          </v-menu>
                      </div>

                      <p v-if="repo.description" class="repo-description">
                          {{ repo.description }}
                      </p>

                      <div class="repo-meta">
                          <div class="meta-item">
                              <v-icon size="small" class="mr-1">mdi-folder-outline</v-icon>
                              <span class="text-caption">{{ repo.path }}</span>
                          </div>
                          <div class="meta-item">
                              <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                              <span class="text-caption">更新于 {{ formatDate(repo.updateTime) }}</span>
                          </div>
                      </div>
                  </v-card-text>
              </v-card>
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-state">
              <div class="empty-content">
                  <v-icon color="primary" size="120" class="mb-4 empty-icon">mdi-folder-plus</v-icon>
                  <h3 class="text-h4 mb-3">开始您的知识管理之旅</h3>
                  <p class="text-body-1 text-medium-emphasis mb-6">创建您的第一个仓库，开始整理和管理您的文档资料</p>
                  <v-btn
                      color="primary"
                      size="large"
                      prepend-icon="mdi-plus"
                      variant="elevated"
                      @click="showCreateDialog = true"
                  >
                      创建第一个仓库
                  </v-btn>
              </div>
          </div>
      </div>

      <!-- 对话框 -->
      <RepoDialog v-model="showCreateDialog" />
      <RepoSettings v-model="showSettings" :repo="selectedRepo" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRepositoryStore } from '../stores/repositoryStore'
import { useGoalStore } from '@/modules/Goal/stores/goalStore'
import type { Repository } from '../stores/repositoryStore'
import RepoDialog from '../components/RepoDialog.vue'
import RepoSettings from '../components/RepoSettings.vue'
// utils
import { fileSystem } from '@/shared/utils/fileSystem'
const repositoryStore = useRepositoryStore()
const goalStore = useGoalStore()
const showCreateDialog = ref(false)
const showSettings = ref(false)
const selectedRepo = ref<Repository | null>(null)

// 统计数据
const recentReposCount = computed(() => {
  return repositoryStore.repositories.filter(repo => 
      repo.lastVisitTime && new Date(repo.lastVisitTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length
})

const linkedGoalsCount = computed(() => {
  return repositoryStore.repositories.filter(repo => repo.relativeGoalId).length
})

const lastUpdateTime = computed(() => {
  if (repositoryStore.repositories.length === 0) return new Date().toISOString()
  return repositoryStore.repositories
      .map(repo => repo.updateTime)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
  })
}

const formatDateShort = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
  })
}

const getGoalTitle = (goalId: string) => {
  const goal = goalStore.goals.find(g => g.id === goalId)
  return goal?.title || '未知目标'
}

const openSettings = (repo: Repository) => {
  selectedRepo.value = repo
  showSettings.value = true
}

const openInExplorer = (repo: Repository) => {
  // 打开文件夹的逻辑
  if (!repo.path) {
    console.warn('仓库路径未设置，无法打开文件夹')
    return
  }
  fileSystem.openFileInExplorer(repo.path)
    .then(() => {
      console.log(`已成功打开文件夹: ${repo.path}`)
    })
    .catch((err: Error) => {
      console.error(`打开文件夹失败: ${err.message}`)
    })
}
</script>

<style scoped>
.repository-page {
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.8), rgba(var(--v-theme-background), 0.95));
  padding: 2rem;
}

/* 头部样式 */
.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  max-width: 1200px;
  margin: 0 auto;
}

.title-section {
  flex: 1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(45deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-secondary)));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  font-size: 1.1rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 0.5rem 0 0 0;
}

.create-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.stats-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-outline), 0.1);
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* 内容区域 */
.content-section {
  max-width: 1200px;
  margin: 0 auto;
}

.repo-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.repo-card {
  border-radius: 16px;
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-outline), 0.1);
}

.repo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.repo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.repo-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.repo-title {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  transition: color 0.2s ease;
}

.repo-title:hover {
  color: rgb(var(--v-theme-secondary));
}

.repo-description {
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 1rem 0;
  line-height: 1.6;
}

.repo-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(var(--v-theme-outline), 0.1);
}

.meta-item {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.action-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.action-btn:hover {
  opacity: 1;
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 3rem;
}

.empty-content {
  text-align: center;
  max-width: 500px;
}

.empty-icon {
  animation: gentle-bounce 3s ease-in-out infinite;
}

@keyframes gentle-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .repository-page {
      padding: 1.5rem;
  }
  
  .header-content {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
  }
  
  .repo-list {
      grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .repository-page {
      padding: 1rem;
  }
  
  .page-title {
      font-size: 2rem;
  }
  
  .repo-card {
      margin: 0;
  }
  
  .repo-header {
      flex-direction: column;
      gap: 0.5rem;
  }
}
</style>
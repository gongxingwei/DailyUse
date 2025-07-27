<template>
  <div class="repository-page">
    <!-- 头部区域 -->
    <div class="page-header">
      <div class="header-content w-100">
        <div class="title-section">
          <h1 class="page-title">我的仓库</h1>
          <p class="page-subtitle">管理您的知识库和项目文档</p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-plus" variant="elevated" @click="startCreateRepo"
          class="create-btn">
          新建仓库
        </v-btn>
      </div>
    </div>

    <!-- 仓库列表 -->
    <div class="content-section">
      <div v-if="repositoryStore.repositories.length > 0" class="repo-list">
        <v-card v-for="repo in repositoryStore.repositories" :key="repo.id" class="repo-card" elevation="3" hover>
          <v-card-text class="pa-6">
            <div class="repo-header">
              <div class="repo-info">
                <router-link :to="`/repository/${encodeURIComponent(repo.id)}`" class="repo-title">
                  <v-icon class="mr-2" color="primary">mdi-folder</v-icon>
                  {{ repo.name }}
                </router-link>

                <!-- 关联目标标签 -->
                <v-chip v-if="repo.relatedGoals && repo.relatedGoals.length > 0" color="primary" variant="tonal"
                  size="small" class="ml-2">
                  <v-icon start size="small">mdi-target</v-icon>
                  {{ getGoalTitle(repo.relatedGoals[0]) }}
                </v-chip>
              </div>

              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" class="action-btn" />
                </template>
                <v-list>
                  <v-list-item @click="openSettings(Repository.ensureRepositoryNeverNull(repo))">
                    <v-list-item-title>
                      <v-icon start>mdi-cog</v-icon>
                      设置
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="openInExplorer(Repository.ensureRepositoryNeverNull(repo))">
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
                <span class="text-caption">更新于 {{ formatDate(repo.updatedAt) }}</span>
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
        </div>
      </div>
    </div>

    <!-- 对话框 -->
    <RepoDialog v-model="repoDialog.show" :repository="Repository.ensureRepository(repoDialog.repository)" 
      @create-repo="handleCreateRepository" @edit-repo="handleUpdateRepository" />
    <RepoSettings v-model="showSettings" :repo="Repository.ensureRepositoryNeverNull(selectedRepo)" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRepositoryStore } from '../stores/repositoryStore'
import { useGoalStore } from '@/modules/Goal/presentation/stores/goalStore'
import { Repository } from '@/modules/Repository/domain/aggregates/repository'
import { useRepositoryServices } from '../composables/useRepositoryServices';
import RepoDialog from '../components/RepoDialog.vue'
import RepoSettings from '../components/RepoSettings.vue'
// utils
import { fileSystem } from '@/shared/utils/fileUtils'

const { 
  snackbar,
  handleCreateRepository,
  handleUpdateRepository,
  handleDeleteRepository,
  handleGetRepositoryById,
} = useRepositoryServices()

const repositoryStore = useRepositoryStore()
const goalStore = useGoalStore()
const showSettings = ref(false)
const selectedRepo = ref<Repository | null>(null)

const repoDialog = ref({
  show: false,
  repository: null as Repository | null
})

const startCreateRepo = () => {
  repoDialog.value = {
    show: true,
    repository: null
  }
}

const startEditRepo = (repo: Repository) => {
  repoDialog.value = {
    show: true,
    repository: repo
  }
}

// 统计数据
const recentReposCount = computed(() => {
  return repositoryStore.repositories.filter(repo =>
    repo.updatedAt && new Date(repo.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length
})

const linkedGoalsCount = computed(() => {
  return repositoryStore.repositories.filter(repo => repo.relatedGoals && repo.relatedGoals.length > 0).length
})

const lastUpdateTime = computed(() => {
  if (repositoryStore.repositories.length === 0) return new Date().toISOString()
  return repositoryStore.repositories
    .map(repo => repo.updatedAt)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
})

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateShort = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

const getGoalTitle = (goalUuid: string) => {
  const goal = goalStore.goals.find(g => g.uuid === goalUuid)
  return goal?.name || '未知目标'
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
  min-height: 100%;
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.8), rgba(var(--v-theme-background), 0.95));
  padding: 1rem;
}

/* 头部样式 */
.page-header {
  margin-bottom: 2rem;
  height: 80px;
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

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
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
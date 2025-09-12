<template>
  <div class="repository-page">
    <!-- 头部区域 -->
    <div class="page-header">
      <div class="header-content w-100">
        <div class="title-section">
          <h1 class="page-title">我的仓库</h1>
          <p class="page-subtitle">管理您的知识库和项目文档</p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-plus" variant="elevated" @click="startCreateRepo" class="create-btn">
          新建仓库
        </v-btn>
      </div>
    </div>

    <!-- 仓库列表 -->
    <div class="content-section">
      <div v-if="repositories.length > 0" class="repo-list">
        <v-card v-for="repo in repositories" :key="repo.uuid" class="repo-card" elevation="3" hover>
          <v-card-text class="pa-6">
            <div class="repo-header">
              <div class="repo-info">
                <router-link :to="`/repository/${encodeURIComponent(repo.uuid)}`" class="repo-title">
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
                  <v-list-item @click="openSettings(repo)">
                    <v-list-item-title>
                      <v-icon start>mdi-cog</v-icon>
                      设置
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="openInBrowser(repo)">
                    <v-list-item-title>
                      <v-icon start>mdi-open-in-new</v-icon>
                      在浏览器中查看
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="editRepo(repo)">
                    <v-list-item-title>
                      <v-icon start>mdi-pencil</v-icon>
                      编辑
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="deleteRepo(repo)" class="text-error">
                    <v-list-item-title>
                      <v-icon start>mdi-delete</v-icon>
                      删除
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>

            <p v-if="repo.description" class="repo-description">
              {{ repo.description }}
            </p>

            <div class="repo-meta">
              <v-chip size="small" variant="tonal" :color="getStatusColor(repo.status)">
                {{ getStatusText(repo.status) }}
              </v-chip>
              <v-chip size="small" variant="outlined" class="ml-2">
                {{ repo.type }}
              </v-chip>
              <span class="ml-auto text-caption text-medium-emphasis">
                更新于 {{ formatDate(repo.updatedAt) }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <v-card class="empty-card" elevation="0">
          <v-card-text class="text-center pa-12">
            <v-icon size="80" color="primary" class="mb-4">
              mdi-folder-multiple-outline
            </v-icon>
            <h2 class="text-h4 mb-4">开始创建您的第一个仓库</h2>
            <p class="text-body-1 text-medium-emphasis mb-6">
              仓库是组织和管理您的知识文档的最佳方式
            </p>
            <v-btn color="primary" variant="elevated" size="large" prepend-icon="mdi-plus" @click="startCreateRepo">
              创建第一个仓库
            </v-btn>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { formatDateWithTemplate } from '../../../shared/utils/dateUtils';
// TODO: 迁移仓库相关的store和类型
// import { useRepositoryStore } from '../stores/repositoryStore';

// 临时类型定义
interface Repository {
  uuid: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'deleted';
  type: string;
  relatedGoals?: string[];
  updatedAt: Date;
  [key: string]: any;
}

// 临时数据
const repositories = ref<Repository[]>([]);

onMounted(() => {
  // TODO: 加载仓库数据
  loadRepositories();
});

const loadRepositories = async () => {
  // TODO: 实现仓库数据加载
  console.log('加载仓库数据');
};

const formatDate = (date: Date | string) => {
  return formatDateWithTemplate(date, 'YYYY-MM-DD HH:mm');
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success';
    case 'archived': return 'warning';
    case 'deleted': return 'error';
    default: return 'primary';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '活跃';
    case 'archived': return '已归档';
    case 'deleted': return '已删除';
    default: return status;
  }
};

const getGoalTitle = (goalUuid: string) => {
  // TODO: 根据goalUuid获取目标标题
  return `目标-${goalUuid.slice(0, 8)}`;
};

// TODO: 实现这些方法
const startCreateRepo = () => {
  console.log('创建新仓库');
};

const openSettings = (repo: Repository) => {
  console.log('打开设置', repo);
};

const openInBrowser = (repo: Repository) => {
  console.log('在浏览器中查看', repo);
};

const editRepo = (repo: Repository) => {
  console.log('编辑仓库', repo);
};

const deleteRepo = (repo: Repository) => {
  console.log('删除仓库', repo);
};
</script>

<style scoped>
.repository-page {
  height: 100vh;
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.8), rgba(var(--v-theme-background), 0.95));
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-section {
  flex: 1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1.1rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0;
}

.content-section {
  flex: 1;
  overflow-y: auto;
}

.repo-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.repo-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.repo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.repo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.repo-info {
  flex: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.repo-title {
  font-size: 1.25rem;
  font-weight: 600;
  text-decoration: none;
  color: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  transition: color 0.2s ease;
}

.repo-title:hover {
  color: rgb(var(--v-theme-primary-darken-1));
}

.repo-description {
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 1rem;
  line-height: 1.5;
}

.repo-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.empty-card {
  background: transparent !important;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .repository-page {
    padding: 1.5rem;
  }

  .repo-list {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .repository-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .repo-list {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

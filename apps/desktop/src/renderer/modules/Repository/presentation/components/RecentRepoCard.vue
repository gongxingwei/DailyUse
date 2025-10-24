<template>
  <div class="recent-repo-section">
    <div class="section-header">
      <div class="header-content">
        <h2 class="section-title">
          <v-icon class="mr-2" color="primary">mdi-history</v-icon>
          最近访问的仓库
        </h2>
        <p class="section-subtitle">快速访问您最近使用的知识库</p>
      </div>
    </div>

    <div v-if="getRecentRepositories.length > 0" class="recent-grid">
      <RepoInfoCard
        v-for="repository in getRecentRepositories"
        :key="repository.name"
        :repository="repository"
        class="recent-item"
      />
    </div>

    <div v-else class="empty-recent">
      <v-card class="empty-card" elevation="2">
        <v-card-text class="text-center pa-8">
          <v-icon color="grey-lighten-1" size="64" class="mb-3">mdi-folder-clock</v-icon>
          <h3 class="text-h6 mb-2">暂无最近访问记录</h3>
          <p class="text-body-2 text-medium-emphasis">开始使用仓库后，最近访问的仓库将显示在这里</p>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Repository } from '../../domain/aggregates/repository';
import RepoInfoCard from '../components/RepoInfoCard.vue';

const getRecentRepositories = computed<Repository[]>(() => {
  return [];
});
</script>

<style scoped>
.recent-repo-section {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-surface), 0.8),
    rgba(var(--v-theme-background), 0.95)
  );
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
}

.section-header {
  margin-bottom: 1.5rem;
}

.header-content {
  text-align: center;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 0;
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.recent-item {
  transition: all 0.3s ease;
}

.empty-recent {
  display: flex;
  justify-content: center;
}

.empty-card {
  border-radius: 12px;
  max-width: 400px;
  width: 100%;
  border: 2px dashed rgba(var(--v-theme-outline), 0.3);
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

@media (max-width: 768px) {
  .recent-repo-section {
    padding: 1rem;
    margin: 1rem 0;
  }

  .recent-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.25rem;
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>

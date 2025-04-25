<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import RepoDialog from '@/modules/Repository/components/RepoDialog.vue'
import { useRepositoryStore } from '@/modules/Repository/stores/repositoryStore';

const { t } = useI18n();
const repositoryStore = useRepositoryStore();

const showCreateDialog = ref(false)
const isMaximized = ref(false)
const isDrawerExpanded = ref(false)

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

const toggleDrawer = () => {
  isDrawerExpanded.value = !isDrawerExpanded.value
}
</script>

<template>
  <v-app>
    <div class="layout-container">
      <!-- 标题栏 -->
      <div class="title-bar custom-border">
        <div class="title-bar-drag-area">
          <button class="function-icon toggle-btn" @click="toggleDrawer">
            <v-icon>{{ isDrawerExpanded ? 'mdi-menu-open' : 'mdi-menu' }}</v-icon>
          </button>
        </div>
        <div class="window-controls">
          <v-btn icon size="small" @click="minimizeWindow">
            <v-icon>mdi-minus</v-icon>
          </v-btn>
          <v-btn icon size="small" @click="maximizeWindow">
            <v-icon>{{ isMaximized ? 'mdi-window-restore' : 'mdi-window-maximize' }}</v-icon>
          </v-btn>
          <v-btn icon size="small" @click="closeWindow">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <div class="content-container">
        <!-- 左侧导航栏 -->
        <v-navigation-drawer location="left" class="navigation-drawer" v-model="isDrawerExpanded" temporary>
          <v-list>
            <v-list-item 
              prepend-icon="mdi-credit-card-outline" 
              :title="t('mainLayout.navigation.summary')" 
              :to="'/summary'"
            ></v-list-item>
            <v-list-item 
              prepend-icon="mdi-fencing" 
              :title="t('mainLayout.navigation.goal')" 
              :to="'/goal-management'"
            ></v-list-item>
            <v-list-item 
              prepend-icon="mdi-list-box" 
              :title="t('mainLayout.navigation.task')" 
              :to="'/task-management'"
            ></v-list-item>
            <v-list-item 
              prepend-icon="mdi-database" 
              :title="t('mainLayout.navigation.repository')" 
              :to="'/repository'"
            ></v-list-item>
            <v-list-item 
              prepend-icon="mdi-bell" 
              :title="t('mainLayout.navigation.reminder')" 
              :to="'/reminder'"
            ></v-list-item>
            <v-list-item 
              prepend-icon="mdi-bell" 
              :title="t('mainLayout.navigation.test')" 
              :to="'/test'"
            ></v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-container>
            <v-row align="center">
              <v-col class="text-left" style="font-size: 0.8rem;">
                {{ t('mainLayout.repository.title') }}
              </v-col>
              <v-col>
                <v-btn color="#4CAF50" prepend-icon="mdi-plus" @click="showCreateDialog = true">
                  {{ t('mainLayout.repository.new') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-container>

          <v-list>
            <v-list-item 
              v-for="repo in repositoryStore.repositories" 
              :key="repo.title"
              :title="repo.title" 
              :to="`/repository/${repo.title}`"
            ></v-list-item>
          </v-list>

          <template v-slot:append>
            <v-divider></v-divider>
            <v-list>
              <v-list-item
                prepend-icon="mdi-account"
                :title="t('mainLayout.navigation.profile')"
                :to="'/profile'"
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-cog"
                :title="t('mainLayout.navigation.settings')"
                :to="'/setting'"
              ></v-list-item>
            </v-list>
          </template>
        </v-navigation-drawer>

        <!-- 主内容区 -->
        <v-main class="main-content">
          <router-view />
        </v-main>
      </div>

      <!-- 创建目标对话框 -->
      <RepoDialog v-model="showCreateDialog" />
    </div>
  </v-app>
</template>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.navigation-drawer {
  height: 100%;
  border-right: 1px solid rgba(128, 128, 128, 0.2);
}

.main-content {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

:deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}

:deep(.v-list) {
  flex-shrink: 0;
}

:deep(.v-navigation-drawer) {
  padding-top: 32px !important;
}

/* 标题栏样式 */
.title-bar {
  height: 32px;
  background-color: rgb(var(--v-theme-surface));
  display: flex;
  align-items: center;
  justify-content: space-between;
  -webkit-app-region: drag;
  user-select: none;
  flex-shrink: 0;
}

.title-bar-drag-area {
  flex: 1;
  display: flex;
  align-items: center;
  padding-left: 12px;
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

.title-bar-drag-area .toggle-btn {
  -webkit-app-region: no-drag;
  margin-right: 8px;
}
</style>
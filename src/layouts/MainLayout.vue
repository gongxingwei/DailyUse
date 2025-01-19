<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRepoStore } from '../stores/repo';
import { useSettingStore } from '../stores/setting';
import CreateRepo from '../components/goals/CreateRepo.vue'

const goalStore = useRepoStore();
const settingStore = useSettingStore();

const theme = computed(() => settingStore.theme)

const showCreateDialog = ref(false)
const isMaximized = ref(false)
const isDrawerExpanded = ref(false)

const minimizeWindow = () => {
  window.electron.windowControl('minimize')
}

const maximizeWindow = () => {
  window.electron.windowControl('maximize')
  isMaximized.value = !isMaximized.value
}

const closeWindow = () => {
  window.electron.windowControl('close')
}

const toggleDrawer = () => {
  isDrawerExpanded.value = !isDrawerExpanded.value
}

</script>

<template>
    <v-app :theme="theme">
        <div class="layout-container">
            <!-- 标题栏 -->
            <div class="title-bar">
                <div class="title-bar-drag-area">
                    <v-btn 
                        icon 
                        size="small" 
                        class="toggle-btn" 
                        @click="toggleDrawer"
                    >
                        <v-icon>{{ isDrawerExpanded ? 'mdi-menu-open' : 'mdi-menu' }}</v-icon>
                    </v-btn>
                </div>
                <div class="window-controls">
                    <v-btn icon size="small" @click="minimizeWindow">
                        <v-icon>mdi-minus</v-icon>
                    </v-btn>
                    <v-btn icon size="small" @click="maximizeWindow">
                        <v-icon>{{ isMaximized ? 'mdi-window-restore' : 'mdi-window-maximize' }}</v-icon>
                    </v-btn>
                    <v-btn icon size="small" color="error" @click="closeWindow">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
            </div>
            
            <div class="content-container">
                <!-- 左侧导航栏 -->
                <v-navigation-drawer
                    location="left"
                    class="navigation-drawer" 
                    v-model="isDrawerExpanded"
                    temporary
                >
                    <v-list>
                        <v-list-item prepend-icon="mdi-home" title="Home" :to="'/'"></v-list-item>
                        <v-list-item prepend-icon="mdi-list-box" title="ToDoList" :to="'/todolist'"></v-list-item>
                        <v-list-item prepend-icon="mdi-database" title="Repository" :to="'/repository'"></v-list-item>
                        <v-list-item prepend-icon="mdi-bell" title="Reminder" :to="'/reminder'"></v-list-item>
                        <v-list-item prepend-icon="mdi-bell" title="Test" :to="'/test'"></v-list-item>
                    </v-list>
                    
                    <v-divider></v-divider>
                    
                    <v-container>
                        <v-row align="center">
                            <v-col class="text-left" style="font-size: 0.8rem;">My Goals</v-col>
                            <v-col>
                                <v-btn 
                                    color="#4CAF50" 
                                    prepend-icon="mdi-plus" 
                                    @click="showCreateDialog = true"
                                >
                                    New
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-container>

                    <v-list>
                        <v-list-item 
                            v-for="repo in goalStore.repos" 
                            :key="repo.title"
                            :title="repo.title" 
                            :to="`/repo/${repo.title}`"
                            @click="console.log('Clicked goal:', repo.title)"
                        ></v-list-item>
                    </v-list>

                    <template v-slot:append>
                        <v-divider></v-divider>
                        <v-list>
                            <v-list-item
                                prepend-icon="mdi-cog"
                                title="设置"
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
            <CreateRepo v-model="showCreateDialog" />
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
    margin-top: 32px !important;
    padding-bottom: 32px !important;
}


/* 标题栏样式 */
.title-bar {
    height: 32px;
    background: #1e1e1e;
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

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useRepoStore } from '../stores/repo';
import CreateRepo from '../components/goals/CreateRepo.vue'

const goalStore = useRepoStore();
const route = useRoute();

const drawer_left = ref(false); 
const drawer_right = ref(false); 

const theme = ref('dark')

const showCreateDialog = ref(false)

// 计算当前页面标题
const currentTitle = computed(() => {
    // 移除开头的 '/' 并将首字母大写
    const path = route.path.slice(1);
    return path ? path.charAt(0).toUpperCase() + path.slice(1) : 'DailyUse';
});

function toggleTheme () {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
}

</script>

<template>
    <v-app :theme="theme">
        <!-- 左侧导航栏 -->
        <v-navigation-drawer v-model="drawer_left" location="left">
            <v-list>
                <v-list-item title="Home" :to="'/'"></v-list-item>
                <v-list-item title="ToDoList" :to="'/todolist'"></v-list-item>
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
        </v-navigation-drawer>
        <!-- 右侧导航栏 profile -->
        <v-navigation-drawer v-model="drawer_right" location="right">
            <v-list>
                <v-list-item title="Profile" router-link to="/profile"></v-list-item>
            </v-list>
        </v-navigation-drawer>
        <!-- 顶部导航栏 -->
        <v-app-bar density="compact">
            <v-app-bar-nav-icon @click="drawer_left = !drawer_left">
                <v-icon>mdi-dots-horizontal</v-icon>
            </v-app-bar-nav-icon>
            <v-app-bar-title class="text-left">{{ currentTitle }}</v-app-bar-title>
            <v-spacer>
                
            </v-spacer>
            <v-btn icon="mdi-magnify"></v-btn>
            <v-btn icon="mdi-dots-vertical"></v-btn>
            <v-btn
                :prepend-icon="theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
                slim
                @click="toggleTheme"
            ></v-btn>
            <v-app-bar-nav-icon @click="drawer_right = !drawer_right">
                <v-avatar>
                    <img src="/profile1.png" alt="Profile" />
                </v-avatar>
            </v-app-bar-nav-icon>
        </v-app-bar>
        <v-main>
            <router-view />
        </v-main>
        <CreateRepo v-model="showCreateDialog" />
    </v-app>
</template>

<style scoped>




</style>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const drawer_left = ref(false); 
const drawer_right = ref(false); 

// 计算当前页面标题
const currentTitle = computed(() => {
    // 移除开头的 '/' 并将首字母大写
    const path = route.path.slice(1);
    return path ? path.charAt(0).toUpperCase() + path.slice(1) : 'DailyUse';
});

</script>

<template>
    <v-app>
        <v-navigation-drawer v-model="drawer_left" location="left">
            <v-list>
                <v-list-item title="Hello" router-link to="/hello"></v-list-item>
                <v-list-item title="Task" router-link to="/task"></v-list-item>
                <v-list-item title="Profile" router-link to="/profile"></v-list-item>
            </v-list>
        </v-navigation-drawer>
        <v-navigation-drawer v-model="drawer_right" location="right">
      <v-list>
        <v-list-item title="Drawer right"></v-list-item>
      </v-list>
    </v-navigation-drawer>

        <v-app-bar density="compact">
            <v-app-bar-nav-icon @click="drawer_left = !drawer_left">
                <v-icon>mdi-dots-horizontal</v-icon>
            </v-app-bar-nav-icon>
            <v-app-bar-title class="text-left">{{ currentTitle }}</v-app-bar-title>
            <v-spacer>
                
            </v-spacer>
            <v-btn icon="mdi-magnify"></v-btn>
            <v-btn icon="mdi-dots-vertical"></v-btn>
            <v-app-bar-nav-icon @click="drawer_right = !drawer_right">
                <v-icon>mdi-dots-horizontal</v-icon>
            </v-app-bar-nav-icon>
        </v-app-bar>
        <v-main>
            <router-view />
        </v-main>
    </v-app>
    <nav>
        <router-link to="/hello">Hello</router-link>
        <router-link to="/task">Task</router-link>
        <router-link to="/profile">Profile</router-link>
        <router-view />
    </nav>
</template>

<style scoped>



</style>

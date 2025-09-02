<template>
    <div class="sidebar">
        <button class="sidebar-btn" @click="toggleRail" title="Logo">
            <img src="../../../assets/DailyUse-24.png" alt="logo" width="36" />
        </button>
        <button class="sidebar-avatar" title="Profile">
            <profile-avatar size="36" />
        </button>
        <button class="sidebar-btn" v-for="item in navItems" :key="item.to" :title="item.title" @click="go(item.to)">
            <span :class="item.icon" style="font-size: 24px;"></span>
        </button>
        <div class="sidebar-divider"></div>
        <div class="sidebar-bottom">
            <button class="sidebar-btn bottom-button" v-for="item in bottomItems" :key="item.to" :title="item.title"
                @click="go(item.to)">
                <span :class="item.icon" style="font-size: 24px;"></span>
            </button>
            <SidebarMoreMenu />
        </div>

    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import ProfileAvatar from '@/modules/account/presentation/components/ProfileAvatar.vue'
import SidebarMoreMenu from './SidebarMoreMenu.vue';
import { useI18n } from 'vue-i18n';
const router = useRouter()
const { t } = useI18n();
const toggleRail = () => {
    // 这里可以实现收缩/展开逻辑
}
const go = (path: string) => {
    router.push(path)
}
const navItems = [
    { icon: 'mdi mdi-credit-card-outline', title: t('mainLayout.navigation.summary'), to: '/summary' },
    { icon: 'mdi mdi-fencing', title: t('mainLayout.navigation.goal'), to: '/goal-management' },
    { icon: 'mdi mdi-list-box', title: t('mainLayout.navigation.task'), to: '/task-management' },
    { icon: 'mdi mdi-database', title: t('mainLayout.navigation.repository'), to: '/repository' },
    { icon: 'mdi mdi-bell', title: t('mainLayout.navigation.reminder'), to: '/reminder' },
    { icon: 'mdi mdi-bell', title: t('mainLayout.navigation.test'), to: '/test' },
]
const bottomItems = [
    { icon: 'mdi mdi-cog', title: t('mainLayout.navigation.settings'), to: '/setting' },
]
</script>

<style scoped>
.sidebar {
    width: 60px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: rgba(var(--v-theme-surface), 0.55);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
}

.sidebar-btn {
    width: 44px;
    height: 44px;
    margin: 8px 0;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    position: relative;
}

.sidebar-btn:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.1);
    border-radius: 8px;
}

.sidebar-divider {
    width: 80%;
    height: 1px;
    background: #e0e0e0;
    margin: 12px 0;
}

.sidebar-bottom {
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: flex-end;
}
</style>
<template>
    <div id="task-management">
        <header class="task-header">
            <div class="task-tabs">
                <button v-for="tab in tabs" :key="tab.value" class="tab-btn" 
                    :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">
                    <v-icon :icon="tab.icon" size="20" />
                    {{ tab.label }}
                </button>
            </div>
        </header>

        <main>
            <!-- 每日任务页面 -->
            <div v-if="activeTab === 'daily'" class="task-content">
                <TaskInstanceManagement />

            </div>
            <!-- 任务管理页面 -->
            <div v-else>
                <TaskTemplateManagement />
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TaskTemplateManagement from '../components/TaskTemplateManagement.vue';
import TaskInstanceManagement from '../components/TaskInstanceManagement.vue';
const activeTab = ref('daily');
const tabs = [
    {
        label: '每日任务',
        value: 'daily',
        icon: 'mdi-calendar-today'
    },
    {
        label: '任务管理',
        value: 'management',
        icon: 'mdi-format-list-checks'
    }
];
</script>

<style scoped>
#task-management {
    padding: 0 150px;
    
}

.task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.task-header-title {
    display: flex;
    align-items: center;
    gap: 2rem;
}
/* 顶部标签样式 */
.tab-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background: rgba(var(--v-border-color), var(--v-border-opacity));
    cursor: pointer;
}
.tab-btn.active {
    background: var(--primary-color);
}
</style>
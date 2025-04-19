<template>
    <v-card class="task-summary-card">
        <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-checkbox-marked-circle-outline" class="mr-2" />
            今日任务
        </v-card-title>

        <v-divider></v-divider>

        <v-list v-if="todayTasks.length > 0">
            <v-list-item v-for="task in todayTasks" :key="task.id" :class="{ 'completed': task.completed }">
                <template v-slot:prepend>
                    <v-checkbox v-model="task.completed" @change="toggleTaskComplete(task)" hide-details class="" />
                </template>

                <div class="d-flex flex-column">
                    <v-list-item-title :class="{ 'text-decoration-line-through': task.completed }" class="mb-1">
                        {{ task.title }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                        {{ formatDateWithTemplate(task.date, 'HH:mm') }}
                    </v-list-item-subtitle>
                </div>

                <template v-slot:append>
                    <div v-if="task.keyResultLinks && task.keyResultLinks.length > 0"
                        class="key-results-container">
                        <v-chip v-for="link in task.keyResultLinks" :key="link.keyResultId" size="x-small"
                            variant="flat" :color="'primary'" class="mr-1">
                            {{ getKeyResultName(link) }}
                            <span class="ml-1">+{{ link.incrementValue }}</span>
                        </v-chip>
                    </div>
                    <span v-else class="text-caption text-disabled">无关联关键结果</span>
                </template>
            </v-list-item>
            <!-- 关联的关键结果 -->


        </v-list>

        <v-card-text v-else class="text-center text-grey">
            <v-icon icon="mdi-check-circle" size="40" color="grey" />
            <div>今日暂无待办任务</div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import { useGoalStore } from '../../Goal/stores/goalStore';
import type { ITaskInstance, KeyResultLink } from '../types/task';
import { formatDateWithTemplate } from '@/shared/utils/dateUtils';

const taskStore = useTaskStore();
const goalStore = useGoalStore();
// 获取今日任务列表
const todayTasks = computed(() => {
    let tasks = taskStore.getTodayTaskInstances.filter(task => !task.completed);
    return tasks;
});

// 切换任务完成状态
const toggleTaskComplete = async (task: ITaskInstance) => {
    try {
        await taskStore.completeTask(task.id);
    } catch (error) {
        console.error('Failed to toggle task status:', error);
    }
};
// 获取关键结果名称的方法
const getKeyResultName = (link: KeyResultLink) => {
    const goal = goalStore.getGoalById(link.goalId);
    const kr = goal?.keyResults.find(kr => kr.id === link.keyResultId);
    return `${goal?.title} - ${kr?.name}`;
};
</script>

<style scoped>
.task-summary-card {
    min-height: 150px;
    max-height: 350px;

    background: rgba(var(--v-theme-surface), 0.8);
    border-radius: 8px;
    
    margin-bottom: 1rem;

    overflow-y: auto;
}

.completed {
    opacity: 0.7;
}

.v-list-item {
    transition: all 0.3s ease;
    border-radius: 4px;

}

.v-list-item:hover {
    background: rgba(var(--v-theme-primary), 0.1);
}

.v-checkbox {
    margin-right: 8px;
}
</style>
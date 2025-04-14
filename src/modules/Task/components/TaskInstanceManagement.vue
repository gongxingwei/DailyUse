<template>
    <div id="task-instance-management">
        <header class="task-header">
            <div class="task-header-title">
                <h2>{{ getHeaderTitle }}</h2>
                <span class="task-count">{{ completedCount }}/{{ totalCount }}</span>
            </div>
        </header>

        <div class="week-selector">
            <div v-for="day in weekDays" :key="day.date" class="day-item" :class="{ active: isSelectedDay(day.date) }"
                @click="selectDay(day.date)">
                <span class="weekday">{{ day.weekday }}</span>
                <span class="date">{{ formatDate(day.date) }}</span>
            </div>
        </div>

        <main class="task-sections">
            <section class="task-section">
                <!-- 没有任务时 -->
                <div v-if="totalCount === 0" class="empty-state">
                    <v-icon icon="mdi-emoticon-happy" size="48" />
                    <h2>😊 休息日</h2>
                </div>
                <!-- 完成所有任务时 -->
                <div v-else-if="totalCount > 0 && incompleteTasks.length === 0" class="celebration"
                    :class="{ 'show': showCelebration }">
                    <div class="celebration-content">
                        <v-icon icon="mdi-party-popper" size="48" />
                        <h2>🎆 恭喜你完成所有任务</h2>
                    </div>
                </div>
                <div v-else>
                    <div class="section-header">
                        <h2>未完成</h2>
                        <span class="count">{{ incompleteTasks.length }}</span>
                    </div>
                    <div class="task-list">
                        <div v-for="task in incompleteTasks" :key="task.id" class="task-item">
                            <button class="complete-button" @click="completeTask(task)">
                                <v-icon icon="mdi-circle-outline" />
                            </button>
                            <div class="task-content">
                                <h3 class="task-title">{{ task.title }}</h3>
                                <div class="task-meta">
                                    <v-icon icon="mdi-clock-outline" />
                                    <span>{{ formatTime(task.date) }}</span>
                                </div>
                                <div v-if="task.keyResultLinks?.length" class="key-results">
                                    <div v-for="link in task.keyResultLinks" :key="link.keyResultId" class="kr-link">
                                        <v-icon icon="mdi-target" />
                                        <span>{{ getKeyResultName(link) }} (+{{ link.incrementValue }})</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </section>

            <!-- 已完成任务，当有已完成任务时才显示 -->
            <section v-if="completedTasks.length > 0" class="task-section">
                <div class="section-header">
                    <h2>已完成</h2>
                    <span class="count">{{ completedTasks.length }}</span>
                </div>
                <div class="task-list">
                    <div v-for="task in completedTasks" :key="task.id" class="task-item completed">
                        <div class="complete-button">
                            <v-icon icon="mdi-checkbox-marked-circle" />
                        </div>
                        <div class="task-content">
                            <h3 class="task-title">{{ task.title }}</h3>
                            <div class="task-meta">
                                <v-icon icon="mdi-clock" />
                                <span>{{ formatTime(task.date) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import { useGoalStore } from '@/modules/Goal/stores/goalStore';
import type { ITaskInstance } from '../types/task';

const taskStore = useTaskStore();
const goalStore = useGoalStore();

// Selected date management
const selectedDate = ref(new Date().toISOString().split('T')[0]);

// Week days calculation
const weekDays = computed(() => {
    const days = [];
    const current = new Date();
    const monday = new Date(current);
    monday.setDate(current.getDate() - current.getDay() + 1);

    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        days.push({
            date: date.toISOString().split('T')[0],
            weekday: '日一二三四五六'[date.getDay()]
        });
    }
    return days;
});

// 任务过滤
const dayTasks = computed(() =>
    taskStore.getAllTaskInstances.filter(task =>
        task.date.startsWith(selectedDate.value)
    )
);

const completedTasks = computed(() =>
    dayTasks.value.filter(task => task.completed)
);

const incompleteTasks = computed(() =>
    dayTasks.value.filter(task => !task.completed)
);

const completedCount = computed(() => completedTasks.value.length);
const totalCount = computed(() => dayTasks.value.length);

// Header title
const getHeaderTitle = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate.value === today) {
        return '今日任务';
    }
    const date = new Date(selectedDate.value);
    return `${date.getMonth() + 1}月${date.getDate()}日任务`;
});

// Utility functions
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getKeyResultName = (link: any) => {
    const goal = goalStore.getGoalById(link.goalId);
    const kr = goal?.keyResults.find(kr => kr.id === link.keyResultId);
    return kr?.name || '';
};

const isSelectedDay = (date: string) => date === selectedDate.value;

const selectDay = (date: string) => {
    selectedDate.value = date;
};

const completeTask = async (task: ITaskInstance) => {
    await taskStore.completeTask(task.id);
};
const showCelebration = ref(false);
// watch(
//     () => incompleteTasks.value.length,
//     (newCount, oldCount = 0) => {
//         if (newCount === 0 && oldCount > 0) {
//             showCelebration.value = true;
//         }
//     },
//     { immediate: true }
// );
watchEffect(() => {
    if (totalCount.value > 0 && incompleteTasks.value.length === 0) {
        showCelebration.value = true;
    }
});
</script>

<style scoped>
.task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.task-header-title {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.task-count {
    color: #666;
    font-size: 1.1rem;
}

.week-selector {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.day-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.day-item:hover {
    background: rgba(255, 255, 255, 0.1);
}

.day-item.active {
    background: var(--primary-color);
    color: white;
}

.weekday {
    font-size: 1.1rem;
    font-weight: 500;
}

.date {
    font-size: 0.9rem;
    color: #666;
}

.task-sections {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.count {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.9rem;
}

.task-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.task-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.complete-button {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 0;
}

.task-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.task-title {
    margin: 0;
    font-size: 1.1rem;
}

.task-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    font-size: 0.9rem;
}

.key-results {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.kr-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    font-size: 0.9rem;
}

.task-item.completed {
    opacity: 0.6;
}

.task-item.completed .task-title {
    text-decoration: line-through;
}

/* 任务区为空时动画 */
.empty-state,
.celebration {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin: 2rem 0;
}

.empty-state h2,
.celebration h2 {
    margin: 1rem 0;
    color: #ccc;
}

.celebration {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s ease;
}

.celebration.show {
    opacity: 1;
    transform: translateY(0);
}

.celebration-content {
    animation: celebrate 0.8s ease;
}

@keyframes celebrate {
    0% {
        transform: scale(0.5);
        opacity: 0;
    }

    50% {
        transform: scale(1.2);
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* Optional: Add floating animation for the icon */
.celebration .iconify {
    animation: float 2s ease-in-out infinite;
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-10px);
    }
}
</style>
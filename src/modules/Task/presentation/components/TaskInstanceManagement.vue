<template>
    <div id="task-instance-management">
        <!-- 头部信息 -->
        <div class="task-header">
            <div class="header-info">
                <div class="title-section">
                    <h2 class="header-title">{{ getHeaderTitle }}</h2>
                    <p class="header-subtitle">{{ getHeaderSubtitle }}</p>
                </div>
                <v-chip 
                    :color="completedCount === totalCount && totalCount > 0 ? 'success' : 'primary'" 
                    variant="elevated"
                    size="large"
                    class="progress-chip"
                >
                    <v-icon start>mdi-check-circle</v-icon>
                    {{ completedCount }}/{{ totalCount }}
                </v-chip>
            </div>
            
            <!-- 进度条 -->
            <div v-if="totalCount > 0" class="progress-section">
                <v-progress-linear
                    :model-value="(completedCount / totalCount) * 100"
                    :color="completedCount === totalCount ? 'success' : 'primary'"
                    height="10"
                    rounded
                    class="progress-bar"
                />
                <span class="progress-text">
                    {{ Math.round((completedCount / totalCount) * 100) }}% 完成
                </span>
            </div>
        </div>

        <!-- 日期选择器 -->
        <v-card class="week-selector-card" elevation="3">
            <v-card-text class="pa-4">
                <div class="week-selector-header">
                    <v-btn
                        icon
                        variant="text"
                        @click="previousWeek"
                        class="week-nav-btn"
                    >
                        <v-icon>mdi-chevron-left</v-icon>
                    </v-btn>
                    <span class="week-title">{{ getWeekTitle }}</span>
                    <v-btn
                        icon
                        variant="text"
                        @click="nextWeek"
                        class="week-nav-btn"
                    >
                        <v-icon>mdi-chevron-right</v-icon>
                    </v-btn>
                </div>
                
                <div class="week-selector">
                    <v-btn
                        v-for="day in weekDays" 
                        :key="day.date"
                        :variant="isSelectedDay(day.date) ? 'flat' : 'text'"
                        :color="isSelectedDay(day.date) ? 'primary' : 'default'"
                        class="day-button"
                        :class="{ 
                            'today': isToday(day.date),
                            'has-tasks': getTaskCountForDate(day.date) > 0
                        }"
                        size="large"
                        @click="selectDay(day.date)"
                    >
                        <div class="day-content">
                            <span class="weekday">{{ day.weekday }}</span>
                            <span class="date">{{ formatDate(day.date) }}</span>
                            <div v-if="getTaskCountForDate(day.date) > 0" class="task-indicator">
                                <v-icon size="small">mdi-circle</v-icon>
                            </div>
                        </div>
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>

        <!-- 任务列表 - 占据剩余空间 -->
        <div class="task-sections">
            <!-- 没有任务时 -->
            <v-card v-if="totalCount === 0" class="empty-state-card" elevation="2">
                <v-card-text class="text-center pa-8">
                    <div class="empty-state-content">
                        <v-icon color="success" size="80" class="mb-4 empty-icon">mdi-beach</v-icon>
                        <h3 class="text-h5 mb-3">休息日</h3>
                        <p class="text-body-1 text-medium-emphasis mb-4">今天没有安排任务，好好休息吧！</p>
                    </div>
                </v-card-text>
            </v-card>

            <!-- 完成所有任务时 -->
            <v-card 
                v-else-if="totalCount > 0 && incompleteTasks.length === 0" 
                class="celebration-card"
                :class="{ 'show': showCelebration }"
                elevation="4"
            >
                <v-card-text class="text-center pa-8">
                    <div class="celebration-content">
                        <div class="celebration-background"></div>
                        <v-icon color="warning" size="80" class="mb-4 celebration-icon">mdi-party-popper</v-icon>
                        <h3 class="text-h4 mb-3">🎉 恭喜完成所有任务！</h3>
                        <p class="text-body-1 text-medium-emphasis mb-4">今天的目标全部达成，表现很棒！</p>
                        <div class="celebration-stats">
                            <v-chip color="success" variant="elevated" class="mr-2">
                                <v-icon start>mdi-check-all</v-icon>
                                完成 {{ completedCount }} 个任务
                            </v-chip>
                            <v-chip color="primary" variant="elevated">
                                <v-icon start>mdi-clock</v-icon>
                                用时 {{ getCompletionTime }}
                            </v-chip>
                        </div>
                    </div>
                </v-card-text>
            </v-card>

            <!-- 任务列表容器 -->
            <div v-else class="task-lists-container">
                <!-- 未完成任务 -->
                <v-card class="task-section-card incomplete-tasks" elevation="3">
                    <v-card-title class="section-header">
                        <div class="header-left">
                            <v-icon color="warning" class="mr-2">mdi-clock-outline</v-icon>
                            <span>待完成任务</span>
                        </div>
                        <div class="header-right">
                            <v-chip color="warning" variant="tonal" size="small" class="mr-2">
                                {{ incompleteTasks.length }}
                            </v-chip>
                        </div>
                    </v-card-title>
                    
                    <v-card-text class="pa-0 task-content">
                        <div class="scrollable-list">
                            <v-list class="task-list">
                                <v-list-item
                                    v-for="(task, index) in incompleteTasks" 
                                    :key="task.id"
                                    class="task-item"
                                    :class="{ 'border-bottom': index < incompleteTasks.length - 1 }"
                                >
                                    <template v-slot:prepend>
                                        <v-btn
                                            icon
                                            variant="text"
                                            color="success"
                                            @click="completeTask(task)"
                                            class="complete-btn"
                                        >
                                            <v-icon>mdi-circle-outline</v-icon>
                                        </v-btn>
                                    </template>

                                    <div class="task-content-wrapper">
                                        <v-list-item-title class="task-title">
                                            {{ task.title }}
                                        </v-list-item-title>

                                        <v-list-item-subtitle class="task-meta">
                                            <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                                            {{ TaskTimeUtils.formatTaskInstanceTimeConfig(task.timeConfig) }}
                                        </v-list-item-subtitle>

                                        <!-- 关键结果链接 -->
                                        <div v-if="task.keyResultLinks?.length" class="key-results mt-2">
                                            <v-chip
                                                v-for="link in task.keyResultLinks" 
                                                :key="link.keyResultId"
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                class="mr-1 mb-1"
                                            >
                                                <v-icon start size="small">mdi-target</v-icon>
                                                {{ getKeyResultName(link) }} (+{{ link.incrementValue }})
                                            </v-chip>
                                        </div>
                                    </div>
                                </v-list-item>
                            </v-list>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- 已完成任务 -->
                <v-card v-if="completedTasks.length > 0" class="task-section-card completed-tasks" elevation="2">
                    <v-card-title class="section-header">
                        <div class="header-left">
                            <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
                            <span>已完成任务</span>
                        </div>
                        <div class="header-right">
                            <v-chip color="success" variant="tonal" size="small">
                                {{ completedTasks.length }}
                            </v-chip>
                        </div>
                    </v-card-title>
                    
                    <v-card-text class="pa-0 task-content">
                        <div class="scrollable-list">
                            <v-list class="task-list">
                                <v-list-item
                                    v-for="(task, index) in completedTasks" 
                                    :key="task.id"
                                    class="task-item completed-task"
                                    :class="{ 'border-bottom': index < completedTasks.length - 1 }"
                                >
                                    <template v-slot:prepend>
                                        <v-icon color="success" class="complete-icon">
                                            mdi-check-circle
                                        </v-icon>
                                    </template>

                                    <div class="task-content-wrapper">
                                        <v-list-item-title class="task-title completed">
                                            {{ task.title }}
                                        </v-list-item-title>

                                        <v-list-item-subtitle class="task-meta">
                                            <v-icon size="small" class="mr-1">mdi-check</v-icon>
                                            完成于 {{ formatTime(task.completedAt?.isoString || task.scheduledTime.isoString) }}
                                        </v-list-item-subtitle>
                                    </div>

                                    <template v-slot:append>
                                        <v-btn
                                            icon
                                            variant="text"
                                            size="small"
                                            @click="undoCompleteTask(task)"
                                            class="undo-btn"
                                        >
                                            <v-icon>mdi-undo</v-icon>
                                        </v-btn>
                                    </template>
                                </v-list-item>
                            </v-list>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import { useGoalStore } from '@/modules/Goal/stores/goalStore';
import { TaskTimeUtils } from '../../domain/utils/taskTimeUtils';
import { useTaskInstanceManagement } from '../composables/useTaskInstanceManagement';

const { selectedDate, currentWeekStart, loading, dayTasks, completedTasks, incompleteTasks,  selectDay, previousWeek, nextWeek, completeTask, undoCompleteTask } = useTaskInstanceManagement();

const taskStore = useTaskStore();
const goalStore = useGoalStore();

// Week days calculation
const weekDays = computed(() => {
    const days = [];
    const monday = new Date(currentWeekStart.value);
    monday.setDate(currentWeekStart.value.getDate() - (currentWeekStart.value.getDay() || 7) + 1);

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

const completedCount = computed(() => completedTasks.value.length);
const totalCount = computed(() => dayTasks.value.length);

// Header title and subtitle
const getHeaderTitle = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate.value === today) {
        return '今日任务';
    }
    const date = new Date(selectedDate.value);
    return `${date.getMonth() + 1}月${date.getDate()}日任务`;
});

const getHeaderSubtitle = computed(() => {
    const date = new Date(selectedDate.value);
    const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    return `${dayName} · ${date.toLocaleDateString('zh-CN')}`;
});

const getWeekTitle = computed(() => {
    const monday = new Date(currentWeekStart.value);
    monday.setDate(currentWeekStart.value.getDate() - (currentWeekStart.value.getDay() || 7) + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return `${monday.getMonth() + 1}月${monday.getDate()}日 - ${sunday.getMonth() + 1}月${sunday.getDate()}日`;
});

const getCompletionTime = computed(() => {
    // 这里可以计算实际完成时间，暂时返回示例
    return '3小时20分钟';
});

// ✅ 修改工具函数使用新的时间数据结构
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}`;
};

const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getKeyResultName = (link: any) => {
    const goal = goalStore.getGoalById(link.goalId);
    const kr = goal?.keyResults.find(kr => kr.id === link.keyResultId);
    return kr?.name || '';
};

// ✅ 修改任务计数逻辑
const getTaskCountForDate = (date: string) => {
    const selectedDateTime = TaskTimeUtils.fromISOString(new Date(date).toISOString());
    const nextDay = TaskTimeUtils.fromISOString(new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString());
    
    return taskStore.getAllTaskInstances.filter(task => {
        if (!task.scheduledTime || typeof task.scheduledTime.timestamp !== 'number') {
            return false;
        }
        
        return task.scheduledTime.timestamp >= selectedDateTime.timestamp &&
               task.scheduledTime.timestamp < nextDay.timestamp;
    }).length;
};

const isSelectedDay = (date: string) => date === selectedDate.value;
const isToday = (date: string) => date === new Date().toISOString().split('T')[0];

const showCelebration = ref(false);

watchEffect(() => {
    if (totalCount.value > 0 && incompleteTasks.value.length === 0) {
        showCelebration.value = true;
    }
});
</script>

<style scoped>
#task-instance-management {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    gap: 1.5rem;
}

/* 头部样式 */
.task-header {
    flex-shrink: 0;
}

.header-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.title-section {
    flex: 1;
}

.header-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: rgb(var(--v-theme-on-surface));
    margin: 0 0 0.25rem 0;
    background: linear-gradient(45deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-secondary)));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.header-subtitle {
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
    margin: 0;
}

.progress-chip {
    font-weight: 600;
    font-size: 1rem;
}

.progress-section {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.progress-bar {
    flex: 1;
}

.progress-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(var(--v-theme-on-surface), 0.7);
    min-width: 80px;
    text-align: right;
}

/* 日期选择器样式 */
.week-selector-card {
    border-radius: 20px;
    flex-shrink: 0;
    background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.8), rgba(var(--v-theme-background), 0.95));
}

.week-selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.week-title {
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.week-nav-btn {
    transition: all 0.2s ease;
}

.week-nav-btn:hover {
    transform: scale(1.1);
}

.week-selector {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.75rem;
}

.day-button {
    height: auto !important;
    min-height: 70px;
    flex-direction: column;
    border-radius: 16px;
    transition: all 0.3s ease;
    position: relative;
}

.day-button.today {
    background: rgba(var(--v-theme-primary), 0.1);
    border: 2px solid rgba(var(--v-theme-primary), 0.3);
}

.day-button.has-tasks .task-indicator {
    position: absolute;
    top: 4px;
    right: 4px;
    color: rgba(var(--v-theme-primary), 0.7);
}

.day-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    position: relative;
    width: 100%;
}

.weekday {
    font-size: 0.875rem;
    font-weight: 700;
}

.date {
    font-size: 1rem;
    font-weight: 600;
}

/* 任务区域样式 */
.task-sections {
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.task-lists-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
}

.task-section-card {
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.incomplete-tasks {
    flex: 2;
    min-height: 300px;
}

.completed-tasks {
    flex: 1;
    min-height: 200px;
}

.section-header {
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08), rgba(var(--v-theme-secondary), 0.08));
    font-weight: 600;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}

.header-left, .header-right {
    display: flex;
    align-items: center;
}

.task-content {
    flex: 1;
    min-height: 0;
}

.scrollable-list {
    height: 100%;
    overflow-y: auto;
}

.task-list {
    background: transparent;
}

.task-item {
    padding: 1.25rem 1.5rem;
    transition: all 0.2s ease;
    min-height: 80px;
}

.task-item:hover {
    background: rgba(var(--v-theme-primary), 0.04);
}

.task-item.border-bottom {
    border-bottom: 1px solid rgba(var(--v-theme-outline), 0.08);
}

.task-content-wrapper {
    flex: 1;
    min-width: 0;
}

.complete-btn, .action-btn, .undo-btn {
    transition: all 0.2s ease;
}

.complete-btn:hover {
    background: rgba(var(--v-theme-success), 0.1);
    transform: scale(1.1);
}

.task-title {
    font-weight: 600;
    font-size: 1rem;
    line-height: 1.4;
}

.task-title.completed {
    text-decoration: line-through;
    opacity: 0.7;
}

.task-meta {
    display: flex;
    align-items: center;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.duration-info {
    margin-left: 0.5rem;
    color: rgba(var(--v-theme-primary), 0.8);
}

.completed-task {
    opacity: 0.8;
}

.complete-icon {
    margin-left: 8px;
}

/* 空状态样式 */
.empty-state-card {
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.05), rgba(var(--v-theme-primary), 0.05));
}

.empty-state-content {
    max-width: 300px;
    margin: 0 auto;
}

.empty-icon {
    animation: gentle-bounce 2s ease-in-out infinite;
}

@keyframes gentle-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

/* 庆祝样式 */
.celebration-card {
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(var(--v-theme-warning), 0.1), rgba(var(--v-theme-success), 0.1));
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s ease;
    position: relative;
    overflow: hidden;
}

.celebration-card.show {
    opacity: 1;
    transform: translateY(0);
}

.celebration-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(var(--v-theme-warning), 0.1) 0%, transparent 70%);
    animation: pulse-celebration 2s ease-in-out infinite;
}

.celebration-content {
    position: relative;
    z-index: 1;
    animation: celebrate 0.8s ease;
}

.celebration-icon {
    animation: float 2s ease-in-out infinite;
}

.celebration-stats {
    margin-top: 1rem;
}

@keyframes celebrate {
    0% {
        transform: scale(0.8) rotate(-5deg);
        opacity: 0;
    }
    50% {
        transform: scale(1.1) rotate(2deg);
    }
    100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
    }
}

@keyframes float {
    0%, 100% {
        transform: translateY(0) rotate(0deg);
    }
    25% {
        transform: translateY(-8px) rotate(2deg);
    }
    75% {
        transform: translateY(-4px) rotate(-1deg);
    }
}

@keyframes pulse-celebration {
    0%, 100% {
        opacity: 0.1;
        transform: scale(1);
    }
    50% {
        opacity: 0.2;
        transform: scale(1.05);
    }
}

/* 关键结果链接 */
.key-results {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.5rem;
}

/* 滚动条样式 */
.scrollable-list::-webkit-scrollbar {
    width: 6px;
}

.scrollable-list::-webkit-scrollbar-track {
    background: rgba(var(--v-theme-outline), 0.05);
    border-radius: 3px;
}

.scrollable-list::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-primary), 0.3);
    border-radius: 3px;
    transition: background 0.2s ease;
}

.scrollable-list::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--v-theme-primary), 0.5);
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .incomplete-tasks {
        flex: 1.5;
    }
}

@media (max-width: 768px) {
    #task-instance-management {
        padding: 1rem;
        gap: 1rem;
    }
    
    .header-info {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }
    
    .progress-section {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .progress-text {
        text-align: center;
    }
    
    .week-selector {
        gap: 0.5rem;
    }
    
    .day-button {
        min-height: 60px;
    }
    
    .weekday {
        font-size: 0.75rem;
    }
    
    .date {
        font-size: 0.875rem;
    }
    
    .task-lists-container {
        gap: 0.75rem;
    }
    
    .task-item {
        padding: 1rem;
        min-height: 70px;
    }
}

@media (max-width: 480px) {
    .header-title {
        font-size: 1.5rem;
    }
    
    .week-selector {
        gap: 0.25rem;
    }
    
    .day-button {
        min-height: 50px;
    }
    
    .weekday {
        font-size: 0.625rem;
    }
    
    .date {
        font-size: 0.75rem;
    }
}
</style>
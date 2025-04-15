<template>
    <div class="gantt-chart">
        <!-- Date Scale -->
        <div class="date-scale">
            <div class="month-row">
                <div v-for="month in months" :key="month.name" 
                     :style="{ width: `${month.daysCount * dayWidth}px` }"
                     class="month-label">
                    {{ month.name }}月
                </div>
            </div>
            <div class="days-row">
                <div v-for="day in days" :key="day.date" 
                     :class="{ 'today': day.isToday }"
                     class="day-label"
                     :style="{ width: `${dayWidth}px` }">
                    {{ day.date }}
                </div>
            </div>
        </div>

        <!-- Goals Timeline -->
        <div class="goals-container">
            <div v-for="goal in sortedGoals" :key="goal.id" class="gantt-row">
                <div class="goal-info">
                    <span class="goal-title">{{ goal.title }}</span>
                </div>
                <div class="timeline" :style="{ width: `${days.length * dayWidth}px` }">
                    <div class="progress-bar-bg" 
                        :style="getGoalBarStyle(goal, false)">
                    </div>
                    <div class="progress-bar-fill" 
                        :style="getGoalBarStyle(goal, true)">
                    </div>
                </div>
            </div>
        </div>

        <!-- Today Indicator -->
        <div class="today-indicator" 
             :style="{ left: `${getTodayPosition()}px` }">
            <div class="indicator-line"></div>
            <span class="indicator-label">今日</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGoalStore } from '../stores/goalStore';
import type { IGoal } from '../types/goal';

const goalStore = useGoalStore();
const dayWidth = 32; // 每个日期的宽度

// 生成日期范围
const dateRange = computed(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 10); // 前10天
    const end = new Date(today);
    end.setDate(today.getDate() + 40);   // 后30天
    return { start, end };
});

// 计算日期和月份数据
const { days, months } = computed(() => {
    const { start, end } = dateRange.value;
    const days = [];
    const months = new Map();
    
    let currentDate = new Date(start);
    while (currentDate <= end) {
        days.push({
            date: currentDate.getDate(),
            isToday: currentDate.toDateString() === new Date().toDateString(),
            fullDate: new Date(currentDate)
        });

        const monthKey = currentDate.getMonth();
        if (!months.has(monthKey)) {
            months.set(monthKey, {
                name: currentDate.getMonth() + 1,
                daysCount: 0
            });
        }
        months.get(monthKey).daysCount++;

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        days,
        months: Array.from(months.values())
    };
}).value;

// 获取目标列表（排除已归档和已删除的）
const sortedGoals = computed(() => {
    const today = new Date();
    return [...goalStore.getAllGoals]
        .filter(goal => {
            if (goal.dirId === 'delete' || goal.dirId === 'archive') return false;
            const endDate = new Date(goal.endTime);
            return endDate >= today;
        })
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
});

// 计算目标条样式
const getGoalBarStyle = (goal: IGoal, isFill: boolean) => {
    const startDate = new Date(goal.startTime);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(goal.endTime);
    endDate.setHours(0, 0, 0, 0);
    const rangeStart = new Date(dateRange.value.start);
    rangeStart.setHours(0, 0, 0, 0);
    
    const startOffset = Math.max(0, 
        (startDate.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    const duration = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    ) + 1;
    
    const width = isFill ? 
        (duration * dayWidth * (goalStore.getGoalProgress(goal.id) / 100)) : 
        (duration * dayWidth);

    // Convert hex color to rgba
    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return {
        left: `${startOffset * dayWidth}px`,
        width: `${width}px`,
        backgroundColor: isFill ? 
            hexToRgba(goal.color, 0.8) : 
            hexToRgba(goal.color, 0.2)
    };
};

// 计算今日指示器位置
const getTodayPosition = () => {
    return (10 * dayWidth); // 因为从前10天开始，所以今天在第10个位置
};
</script>

<style scoped>
.gantt-chart {
    position: relative;
    margin: 1rem 0;
    width: 100%;
    background: rgba(var(--v-theme-surface), 1);
    border-radius: 8px;
    overflow-x: hidden;
}

.date-scale {
    position: sticky;
    top: 0;
    background: rgba(var(--v-theme-surface), 0.95);
    z-index: 1;
}

.month-row {
    display: flex;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.month-label {
    padding: 4px;
    font-weight: 500;
    text-align: center;
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.days-row {
    display: flex;
    padding-top: 4px;
}

.day-label {
    text-align: start;
    font-size: 0.85rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
    min-width: 32px;
}

.day-label.today {
    color: var(--v-theme-error);
    font-weight: bold;
}

.goals-container {
    margin-top: 1rem;
    position: relative;
}

.gantt-row {
    display: flex;
    margin-bottom: 1rem;
    align-items: center;
}

.goal-info {
    min-width: 150px;
    padding-right: 1rem;
    position: absolute;
    left: 0;
}

.goal-title {
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.timeline {
    position: relative;
    height: 24px;
    background: transparent;
}

.progress-bar-bg, .progress-bar-fill {
    position: absolute;
    height: 100%;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.today-indicator {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    z-index: 2;
}

.indicator-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
    background-color: var(--v-theme-error);
}

.indicator-label {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--v-theme-error);
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    white-space: nowrap;
}
</style>
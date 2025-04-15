<template>
    <div class="motivate-card" @click="refreshContent">
        <!-- <div class="motivate-card-header">
            <v-icon :icon="isShowingMotive ? 'mdi-lighthouse' : 'mdi-lightbulb'" size="20" />
            <span>{{ isShowingMotive ? '目标动机' : '可行性分析' }}</span>
            <v-icon icon="mdi-refresh" size="16" class="refresh-icon ml-auto" />
        </div> -->
        <div class="motivate-card-content">
            {{ currentContent || '无' }}
        </div>
        <!-- <div class="motivate-card-footer" v-if="currentGoal">
            <span>来自目标：{{ currentGoal.title }}</span>
        </div> -->
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGoalStore } from '../stores/goalStore';
import type { IGoal } from '../types/goal';

const goalStore = useGoalStore();
const isShowingMotive = ref(true);
const currentContent = ref('');
const currentGoal = ref<IGoal | null>(null);

const getRandomContent = () => {
    const goals = goalStore.getAllGoals;
    if (!goals.length) {
        currentContent.value = '暂无内容';
        currentGoal.value = null;
        return;
    }

    // Randomly decide to show motive or feasibility
    isShowingMotive.value = Math.random() > 0.5;
    
    // Filter goals with non-empty content
    const validGoals = goals.filter(goal => 
        isShowingMotive.value ? goal.motive : goal.feasibility
    );

    if (!validGoals.length) {
        currentContent.value = '暂无内容';
        currentGoal.value = null;
        return;
    }

    // Select random goal
    const randomGoal = validGoals[Math.floor(Math.random() * validGoals.length)];
    currentGoal.value = randomGoal;
    currentContent.value = isShowingMotive.value ? 
        randomGoal.motive : 
        randomGoal.feasibility;
};

const refreshContent = () => {
    getRandomContent();
};

onMounted(() => {
    getRandomContent();
});
</script>

<style scoped>
.motivate-card {
    width: 100%;
    background: rgba(var(--v-theme-surface-variant), 0.1);
    border-radius: 12px;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.motivate-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.motivate-card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    color: var(--v-theme-primary);
    font-weight: 600;
}

.refresh-icon {
    opacity: 0.6;
    transition: all 0.3s ease;
}

.motivate-card:hover .refresh-icon {
    opacity: 1;
    transform: rotate(180deg);
}

.motivate-card-content {
    color: rgba(var(--v-theme-on-surface), 0.9);
    line-height: 1.6;
    font-size: 1.1rem;
    font-weight: 300;
    font-style: italic;
    padding: 0.5rem 0;
    min-height: 50px;
}

.motivate-card-footer {
    margin-top: 1rem;
    font-size: 0.9rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
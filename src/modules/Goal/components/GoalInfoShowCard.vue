<template>
    <div class="goal-card" :style="{ '--goal-color': goal.color || '#FF5733' }">
        <!-- Header: 标题、进度条 -->
        <div class="goal-card-header">
            <h3 class="goal-title">{{ goal.title }}</h3>
            <div class="today-progress" v-if="todayProgress > 0">
                <v-icon icon="mdi-trending-up" />
                <span>+{{ todayProgress }}%</span>
            </div>
        </div>

        <div class="progress-bar">
            <div class="progress-track">
                <div class="progress-fill" :style="{ width: `${goalProgress}%` }"></div>
            </div>
            <span class="progress-text">{{ goalProgress }}%</span>
        </div>
        <!-- 关键结果 -->
        <div class="key-results-grid">
            <!-- <div v-for="keyResult in goal.keyResults" :key="keyResult.id" class="kr-card"
                :style="{ '--progress': `${goalStore.getKeyResultProgress(goal.id, keyResult.id)}%` }">

                <span class="kr-name">{{ keyResult.name }}</span>
                <div class="kr-values">
                    {{ keyResult.startValue }} → {{ keyResult.targetValue }}
                    <button class="increment-btn"
                        @click.stop="startAddRecord(keyResult.id)">
                        <v-icon icon="mdi-plus" size="20"/>
                    </button>
                </div>

            </div> -->
            <div v-for="keyResult in goal.keyResults" :key="keyResult.id" class="kr-card"
                :style="{ '--progress': `${goalStore.getKeyResultProgress(goal.id, keyResult.id)}%` }">
                <KeyResultCard :keyResult="keyResult" :goalId="goal.id" />
            </div>
        </div>

        <RecordDialog :visible="showRecordDialog"
            @save="(record) => handleSaveRecord(record, goal?.id as string, selectedKeyResultId)"
            @cancel="handleCancelAddRecord" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { IGoal } from '../types/goal';
// stores
import { useGoalStore } from '../stores/goalStore';
// 组件
import RecordDialog from './RecordDialog.vue';
import KeyResultCard from './KeyResultCard.vue';
// composables
import { useRecordDialog } from '../composables/useRecordDialog';

const { showRecordDialog, selectedKeyResultId, startAddRecord, handleSaveRecord, handleCancelAddRecord } = useRecordDialog();
const props = defineProps<{
    goal: IGoal;
}>();

const goalStore = useGoalStore();

const goalProgress = computed(() => {
    return goalStore.getGoalProgress(props.goal.id) || 0;
});

const todayProgress = computed(() => {

    return 5; // Example value
});
</script>

<style scoped>
.goal-card {
    background-color: rgb(41, 41, 41);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.goal-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.goal-title {
    margin: 0;
    font-size: 1.2rem;
    color: white;
}

.today-progress {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #4CAF50;
    font-weight: 500;
}

.progress-bar {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
}

.progress-track {
    height: 8px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    flex: 1;
}

.progress-fill {
    height: 100%;
    background-color: var(--goal-color);
    border-radius: 4px;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 0.9rem;
    color: #ccc;
    margin-top: 4px;
    display: block;
}

/* ky */
.key-results-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
    padding: 0;
}

.kr-card {
    position: relative;
    border-radius: 12px;
    padding: 1rem;
    min-width: 100px;
    min-height: 80px;
    background: linear-gradient(to right,
            var(--goal-color) var(--progress),
            transparent var(--progress));
    border: 1px solid var(--goal-color);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
}

.increment-btn {
    position: absolute;

    right: 10px;
    background-color: transparent;
    border: none;
    cursor: pointer;
    color: #ccc;
}
</style>
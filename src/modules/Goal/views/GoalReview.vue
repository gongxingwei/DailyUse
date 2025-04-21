<template>
    <div v-if="loading" class="loading">
        <span>加载中...</span>
    </div>
    <div v-else-if="!currentReview" class="loading">
        <span>加载失败,未获取目标信息</span>
    </div>
    <div v-else id="goal-review">
        <!-- header -->
        <header class="goal-review-header">
            <div>
                <v-btn @click="router.back()" variant="tonal">
                    取消
                </v-btn>
            </div>
            <div class="goal-review-header-content">
                <span style="font-weight: 700;font-size: 2rem;">目标复盘</span>
                <span style="font-weight: 500;">{{ goal.title }}</span>
                <span style="font-weight: 300;">{{ goal.startTime }} 到 {{ goal.endTime }}</span>
            </div>

            <div></div>


        </header>
        <!-- 目标基本相关信息 -->
        <section class="goal-analysis">

            <div class="goal-review-card-container">
                <!-- 目标信息卡片 -->
                <div class="goal-review-card goal-info">
                    <!-- 进度、目标名称 -->
                    <div class="card-header">
                        <div>
                            <span style="font-weight: 300;">进度</span>
                            <span style="font-weight: 700;font-size: 2rem;">{{
                                currentReview.goalProgress.currentProgress }}</span>
                            <span style="font-weight: 300;">%</span>
                        </div>
                        <div>
                            <span>{{ goal.title }}</span>
                        </div>
                    </div>
                    <!-- 关键结果执行情况 -->
                    <div class="card-content">
                        <div v-for="kr in currentReview.keyResultProgress || []" :key="kr.id" class="card-content-item">
                            <span class="item-name">{{ kr.name }}</span>
                            <span class="item-value">{{ kr.currentValue }} -> {{ kr.targetValue }}</span>
                        </div>
                    </div>
                </div>
                <!-- 任务信息卡片 -->
                <div class="goal-review-card task-info">
                    <!-- 任务未完成信息 -->
                    <div class="card-header">
                        <div>
                            <span style="font-weight: 700;font-size: 2rem;">{{ taskStatus.overall.incomplete }}</span>
                            <span style="font-weight: 300;">条任务未完成</span>
                        </div>
                        <div>
                            <span>共有{{ taskStatus.overall.total }}条任务</span>
                        </div>
                    </div>
                    <!-- 具体任务执行情况 -->
                    <div class="card-content">
                        <div v-for="task in taskStatus.taskDetails" :key="task.templateId" class="card-content-item">
                            <span class="item-name">{{ task.title }}</span>
                            <span class="item-value">{{ task.completed }}/{{ task.total }}</span>
                        </div>
                    </div>
                </div>
            </div>

        </section>
        <!-- Self Diagnosis -->
        <section class="self-diagnosis">
            <h2>自我诊断</h2>
            <div class="diagnosis-grid">
                <div class="diagnosis-card">
                    <h3>主要成就</h3>
                    <textarea v-model="currentReview.selfDiagnosis.achievements" placeholder="列出这段时间的主要成就..."
                        rows="4"></textarea>
                </div>
                <div class="diagnosis-card">
                    <h3>遇到的挑战</h3>
                    <textarea v-model="currentReview.selfDiagnosis.challenges" placeholder="记录遇到的主要挑战..."
                        rows="4"></textarea>
                </div>
                <div class="diagnosis-card">
                    <h3>经验总结</h3>
                    <textarea v-model="currentReview.selfDiagnosis.learnings" placeholder="总结经验教训..."
                        rows="4"></textarea>
                </div>
                <div class="diagnosis-card">
                    <h3>下一步计划</h3>
                    <textarea v-model="currentReview.selfDiagnosis.nextSteps" placeholder="制定下一步计划..."
                        rows="4"></textarea>
                </div>
            </div>
        </section>
        <!-- 按钮 -->
        <section class="goal-review-actions">
            <div class="goal-review-button-group">

                <button class="inline-button bg-blue" @click="saveReview()">完成复盘</button>

                <!-- <button class="inline-button" @click="goalReviewStore.submitReview(currentReview)">删除</button> -->

            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, type ComputedRef, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGoalStore } from '../stores/goalStore';
import { useGoalReviewStore } from '../stores/goalReviewStore';
import { useTaskStore } from '@/modules/Task/stores/taskStore';
import { useGoalReview } from '../composables/useGoalReview';
import type { IGoal } from '../types/goal';
import { storeToRefs } from 'pinia';

const loading = ref(true);
const route = useRoute();
const router = useRouter();
const goalStore = useGoalStore();
const goalReviewStore = useGoalReviewStore();
const taskStore = useTaskStore();

const { saveReview } = useGoalReview();
// 当前目标
const goalId = route.params.goalId as string;
// 将 store 中的数据映射到组件中
const { tempReview: currentReview } = storeToRefs(goalReviewStore);
const goal = computed(() => {
    const foundGoal = goalStore.getGoalById(goalId);
    if (!foundGoal) {
        router.push('/404');
        throw new Error('Goal not found');
    }
    return foundGoal;
}) as ComputedRef<IGoal>;
// 任务完成情况
const taskStatus = computed(() => {
    return taskStore.getTaskStatsForGoal(goalId);
});
onMounted(() => {
    if (!goalStore.getGoalById(goalId)) {
        router.push('/404');
        return;
    }
    goalReviewStore.initTempReview(goalId);
    loading.value = false;
});
</script>

<style scoped>
#goal-review {
    width: 100%;
    height: 100%;
    padding: 2rem 150px;
}
/* header */
.goal-review-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

}

.goal-review-header-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

/* 卡片容器 */
.goal-review-card-container {
    display: flex;
    flex-direction: row;
    gap: 1.5rem;
    margin-bottom: 2rem;
    justify-content: center;
}

/* 卡片基础样式 */
.goal-review-card {
    width: 600px;
    max-width: 600px;
    min-width: 400px;
    height: 400px;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    display: flex;
    flex-direction: column;
    padding: 0;
}

.goal-review-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 目标信息卡片 */
.goal-info {
    background: rgba(var(--v-theme-blue), 0.6);
    color: var(--text-light);

    padding: 0;
    overflow: hidden;
}

.goal-info .card-header {
    background-color: rgb(var(--v-theme-deep-blue));
    margin-bottom: 0;


}

/* 任务信息卡片 */
.task-info {
    background: linear-gradient(135deg, rgba(var(--v-theme-red), 0.6), rgb(var(--v-theme-deep-red)));
    color: var(--text-light);

    padding: 0;
    overflow: hidden;
}

.task-info .card-header {
    background-color: rgb(var(--v-theme-deep-red));
    margin-bottom: 0;

}

/* 卡片头部样式 */
.card-header {
    padding: 1rem;

    display: flex;
    flex-direction: column;
    align-items: flex-start;

    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
}

.card-header div:first-child {
    font-size: 1.25rem;
    font-weight: bold;
}

.card-header div:first-child span:nth-child(2) {
    margin: 0 0.5rem;
    font-size: 1.5rem;
}

/* 卡片内容样式 */
.card-content {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.card-content-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    transition: background-color 0.2s ease;
}

.card-content-item:hover {
    background: rgba(255, 255, 255, 0.15);
}

.item-name {
    font-weight: 500;
    flex: 1;
}

.item-value {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: bold;
    min-width: 80px;
    text-align: center;
}

/* 标题样式 */
.goal-analysis h2 {
    color: var(--text-dark);
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: bold;
}

.goal-analysis p {
    color: var(--text-dark);
    margin-bottom: 1.5rem;
    font-size: 1rem;
    opacity: 0.8;
}

/* 响应式布局 */
@media (max-width: 768px) {
    .goal-review-card {
        padding: 1rem;
    }

    .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .card-content-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .item-value {
        align-self: flex-end;
        min-width: 100px;
    }
}

/* Update the diagnosis-card textarea styles */
.diagnosis-card textarea {
    width: 100%;
    height: 150px;
    padding: 1rem;
    background: var(--v-theme-surface);
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    border-radius: 8px;
    resize: none;
    font-size: 1rem;
    line-height: 1.6;
    color: rgb(var(--v-theme-on-surface));
    transition: all 0.2s ease;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.diagnosis-card textarea:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
    background: rgba(var(--v-theme-surface), 0.95);
}

.diagnosis-card textarea:focus {
    outline: none;
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.1);
    background: rgb(var(--v-theme-surface));
}

.diagnosis-card textarea::placeholder {
    color: rgba(var(--v-theme-on-surface), 0.38);
    font-size: 0.95rem;
}

/* Optional: Add a scrollbar styling */
.diagnosis-card textarea::-webkit-scrollbar {
    width: 8px;
}

.diagnosis-card textarea::-webkit-scrollbar-track {
    background: rgba(var(--v-theme-on-surface), 0.05);
    border-radius: 4px;
}

.diagnosis-card textarea::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-primary), 0.2);
    border-radius: 4px;
    transition: background 0.2s ease;
}

.diagnosis-card textarea::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--v-theme-primary), 0.4);
}

/* 响应式布局 */
@media (max-width: 768px) {
    .diagnosis-grid {
        grid-template-columns: 1fr;
    }

    .diagnosis-card {
        padding: 1rem;
    }

    .diagnosis-card textarea {
        min-height: 100px;
    }
}

/* 按钮 */
.goal-review-button-group {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1rem;
}

.inline-button {
    height: 3rem;
    width: 70%;
    color: var(--text-light);
    border: none;
    border-radius: 8px;
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.2s ease;
}

/* 加载状态 */
.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: var(--primary-blue);
    font-size: 1.2rem;
}
</style>
<template>
    <div id="goal-info-show" class="goal-info-show" :style="{ '--goal-color': goalColor }">
        <header class="goal-info-show-header">
            <div class="">
                <button class="btn btn-secondary" @click="$router.back()">
                    <v-icon icon="mdi-arrow-left" size="24" />
                </button>
            </div>
            <span class="text-h5">{{ goal?.title || '为检测到' }}</span>
            <div class="d-flex flex-row ga-2">
                <!-- 编辑按钮 -->
                <button class="btn btn-secondary" @click="startEditGoal(goal?.id as string)">
                    <v-icon icon="mdi-pencil" size="24" />
                </button>
                <!-- 复盘功能下拉按钮（期中复盘、期末复盘、复盘记录） -->
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-trigger">
                        <v-icon icon="mdi-book-edit" size="24" />
                    </button>
                    <div class="dropdown-menu">
                        <div class="dropdown-item" @click="startMidtermReview(goal?.id as string)">
                            <span>期中复盘</span>
                        </div>
                        <!-- <div class="dropdown-item" @click="">
                            <span>期末复盘</span>
                        </div> -->
                        <div class="dropdown-item" @click="viewGoalReviewRecord()">
                            <span>复盘记录</span>
                        </div>
                    </div>
                </div>
                <!-- 更多功能下拉按钮（归档、删除） -->
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-trigger">
                        <v-icon icon="mdi-dots-horizontal" size="24" />
                    </button>
                    <div class="dropdown-menu">
                        <div class="dropdown-item" @click="toggleArchiveGoal(goal?.id as string)">
                            <v-icon icon="mdi-archive" size="20" />
                            <span>{{ isArchived ? '取消归档' : '归档' }}</span>
                        </div>
                        <div class="dropdown-item" @click="toggleDeleteGoal(goal?.id as string)">
                            <v-icon icon="mdi-delete" size="20" />
                            <span>{{ isDeleted ? '取消删除' : '删除' }}</span>
                        </div>
                    </div>
                </div>

            </div>
        </header>
        <main class="goal-info-show-main">
            <!-- 目标完成卡片 -->
            <div v-if="isGoalEnded" class="goal-completion-card">
                <div class="completion-content">
                    <v-icon icon="mdi-flag-checkered" size="24" color="success" />
                    <span class="completion-title">目标已结束</span>
                    <span class="completion-details">共历时 {{ totalDays }} 天，目标进度 {{ goalProgress }}%</span>
                    <v-btn color="primary" variant="tonal" @click="startMidtermReview(goal?.id as string)">
                        复盘目标
                    </v-btn>
                </div>
            </div>
            <div class="goal-info-show-basic">
                <div class="goal-info-show-basic-progress">
                    <svg class="progress-ring" width="130" height="130">
                        <circle class="progress-ring__circle--bg" cx="65" cy="65" r="50" stroke-width="15" />
                        <circle class="progress-ring__circle" cx="65" cy="65" r="50" stroke-width="15"
                            :style="{ strokeDashoffset: getCircleOffset(goalProgress) }" />
                    </svg>
                    <div class="progress-text-container">
                        <div class="progress-value">
                            <span class="number">{{ goalProgress }}</span>
                            <span class="percent">%</span>
                        </div>
                        <span class="progress-label">目标进度</span>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="goal-info-show-basic-time">
                    <!-- 几天后结束 -->
                    <div class="time-remaining">
                        <template v-if="isGoalEnded">
                            <span class="text-h5">已结束</span>
                        </template>
                        <template v-else>
                            <span class="number">{{ remainingDays }}</span>
                            <span>天后结束</span>
                        </template>
                    </div>

                    <!-- 起止时间 -->
                    <div class="goal-info-show-basic-time-text">
                        <v-icon icon="mdi-calendar-range" size="16" />
                        <span>{{ formatDate(goal?.startTime) }} - {{ formatDate(goal?.endTime) }}</span>
                    </div>
                    <!-- 时间进度条 -->
                    <div class="goal-info-show-basic-time-progress-bar">
                        <div class="progress-track">
                            <div class="progress-fill" :style="{ width: `${timeProgress}%` }"></div>
                        </div>
                        <span class="progress-text">{{ timeProgress }}%</span>
                    </div>
                </div>
            </div>
            <!-- 动机&可行性显示 -->
            <div class="motivation-card">
                <div class="motivation-card-header">
                    <v-icon :icon="isShowingMotive ? 'mdi-lighthouse' : 'mdi-lightbulb'" size="20" />
                    <span>{{ isShowingMotive ? '目标动机' : '可行性分析' }}</span>
                </div>
                <div class="motivation-card-content">
                    {{ isShowingMotive ? goal?.motive : goal?.feasibility }}
                </div>
            </div>
            <!-- 关键结果 -->
            <div class="key-results-container">
                <div v-for="keyResult in keyResults" :key="keyResult.id">
                    <KeyResultCard :keyResult="keyResult" :goalId="goal?.id as string" />
                </div>
            </div>
            <!-- 备忘录 -->
            <div class="goal-infomation-show-memo"></div>
        </main>
        <GoalDialog :visible="showGoalDialog" @cancel="cancelGoalEdit" @save="saveGoal" />
        <ConfirmDialog v-model="showDeleteConfirmDialog" title="删除目标" message="确定要删除该目标吗？" confirm-text="确认"
            cancel-text="取消" @confirm="handleDeleteGoal(goal?.id as string)" @cancel="cancelDeleteGoal" />
        <GoalReviewCard :visible="showGoalReviewRecored" @close="closeGoalReviewRecord" />
        <RecordDialog :visible="showRecordDialog"
            @save="(record) => handleSaveRecord(record, goal?.id as string, selectedKeyResultId)"
            @cancel="handleCancelAddRecord" />
    </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
// store
import { useGoalStore } from '../stores/goalStore';
// composables
import { useGoalDialog } from '../composables/useGoalDialog';
import { useGoalReview } from '../composables/useGoalReview';
import { useGoalManagement } from '../composables/useGoalManagement';
import { useRecordDialog } from '../composables/useRecordDialog';
// 组件
import GoalDialog from '../components/GoalDialog.vue';
import GoalReviewCard from '../components/GoalReviewCard.vue';
import RecordDialog from '../components/RecordDialog.vue';
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue';
import KeyResultCard from '../components/KeyResultCard.vue';

const route = useRoute();
const goalStore = useGoalStore();
const { showGoalDialog, startEditGoal, saveGoal, cancelGoalEdit } = useGoalDialog();
const { showGoalReviewRecored, viewGoalReviewRecord, closeGoalReviewRecord, startMidtermReview } = useGoalReview();
const { showDeleteConfirmDialog, handleDeleteGoal, cancelDeleteGoal } = useGoalManagement();
const { showRecordDialog, selectedKeyResultId, startAddRecord, handleSaveRecord, handleCancelAddRecord } = useRecordDialog();
const goal = computed(() => {
    const goalId = route.params.goalId as string;
    if (!goalId) return null;
    return goalStore.getGoalById(goalId);
});
// 得到 goal 中的 颜色
const goalColor = computed(() => goal.value?.color || '#FF5733');
// 得到 goal 中的 关键结果  
const keyResults = computed(() => {
    const goalId = route.params.goalId as string;
    return goalStore.getAllKeyResultsByGoalId(goalId);
});
// 计算目标是否已经归档
const isArchived = computed(() => goal.value?.dirId === 'archive');

const toggleArchiveGoal = (goalId: string) => {
    if (!isArchived.value) {
        goalStore.archiveGoalById(goalId);
    } else {
        goalStore.unarchiveGoalById(goalId);
    }
};
// 计算目标是否已删除
const isDeleted = computed(() => goal.value?.dirId === 'trash');
const toggleDeleteGoal = (goalId: string) => {
    if (!isDeleted.value) {
        goalStore.deleteGoalById(goalId);
    } else {
        goalStore.restoreGoalById(goalId);
    }
};
// 计算目标是否已结束
const isGoalEnded = computed(() => {
    if (!goal.value) return false;
    return new Date(goal.value.endTime) < new Date();
});
// 计算目标的总天数
const totalDays = computed(() => {
    if (!goal.value) return 0;
    const start = new Date(goal.value.startTime);
    const end = new Date(goal.value.endTime);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
});
// 计算时间的进度
const timeProgress = computed(() => {
    if (!goal.value) return 0;

    const startDate = new Date(goal.value.startTime);
    const endDate = new Date(goal.value.endTime);
    const today = new Date();

    const totalTime = endDate.getTime() - startDate.getTime();
    const elapsedTime = today.getTime() - startDate.getTime();

    const progress = (elapsedTime / totalTime) * 100;
    return Math.min(Math.max(progress, 0), 100).toFixed(1);
});
// 计算目标的进度
const goalProgress = computed(() => {
    const goalId = route.params.goalId as string;
    return goalStore.getGoalProgress(goalId) || 0;
});
// 计算圆环的偏移量
const getCircleOffset = (progress: number) => {
    const radius = 50; // 半径
    const circumference = 2 * Math.PI * radius; // 2πr
    return circumference - (progress / 100) * circumference;
};

// 计算关键结果的进度
const getKrProgress = (keyResultId: string) => {
    const goalId = route.params.goalId as string;
    return goalStore.getKeyResultProgress(goalId, keyResultId) || 0;
};

// 计算目标的剩余天数
const remainingDays = computed(() => {
    const goalId = route.params.goalId as string;
    const goal = goalStore.getGoalById(goalId);
    if (!goal) return 0;

    const endDate = new Date(goal.endTime);
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
});
// 动机与可行性显示
const isShowingMotive = ref(Math.random() > 0.5);
// const toggleMotivationDisplay = () => {
//     isShowingMotive.value = !isShowingMotive.value;
// };

function formatDate(dateString: any) {
    if (!dateString) return '';

    const date = new Date(dateString);
    // Format: YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

</script>
<style scoped lang="css">
#goal-info-show {
    width: 100%;
    height: 100%;
    padding: 0 150px;

    background-color: #1e1e1e;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

/* 目标结束卡片 */
.goal-completion-card {
    width: 100%;
    background: rgba(var(--v-theme-surface-variant), 0.1);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.completion-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
}

.completion-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--v-theme-success);
}

.completion-details {
    color: rgba(255, 255, 255, 0.7);
}


.goal-info-show-header {
    width: 100%;
    height: 60px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}

.goal-info-show-main {
    width: 100%;
    height: 100%;
}

/* 基本信息 */
.goal-info-show-basic {

    width: 90%;
    height: 150px;
    background-color: rgb(76, 78, 80);
    border-radius: 10px;
    padding: 20px;


    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    margin-top: 20px;
}

.goal-info-show-basic-progress {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    padding: 1rem;

    display: flex;
    justify-content: center;
    align-items: center;

    position: relative;
}

.goal-info-show-basic-time {
    width: 100%;
    height: 130px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    justify-content: flex-end;
    margin-left: 20px;
    margin-right: 250px;
}


.divider {
    width: 6px;
    height: 60px;
    background-color: #ccc;
    margin: 0 30px;
}


/* 基本信息：目标圆环进度条 */
.progress-ring {
    transform: rotate(-90deg);
    /* Start from top */
    position: absolute;


}

.progress-ring__circle--bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.1);
    stroke-width: 15px;
}

.progress-ring__circle {
    fill: none;
    stroke: var(--goal-color);
    stroke-linecap: round;
    stroke-width: 15px;
    stroke-dasharray: 314.159;
    /* 2 * PI * 50 (radius) */
    transform-origin: center;
    transition: stroke-dashoffset 0.3s ease;
}

.progress-text {
    position: relative;
    color: white;
    font-weight: bold;
    font-size: 1.2rem;
}

/* 基本信息：目标圆环进度条内的文字样式 */
.progress-text-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.progress-value {
    display: flex;
    align-items: flex-start;
    line-height: 1;
}

.progress-value .number {
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
}

.progress-value .percent {
    font-size: 1rem;
    color: #ccc;
    margin-left: 2px;
    margin-top: 4px;
}

.progress-label {
    font-size: 0.75rem;
    color: #ccc;
}

/* 基本信息：剩余时间 */
.time-remaining {
    margin-bottom: 0.5rem;
}

.time-remaining .number {
    font-size: 2rem;
    font-weight: bold;
    color: white;
    margin-bottom: 8px;
    margin-right: 4px;
}

/* 基本信息：时间进度条 */
.goal-info-show-basic-time-progress-bar {
    width: 100%;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.progress-track {
    flex-grow: 1;
    height: 10px;
    /* 进度条高度 */
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background-color: var(--goal-color);
    border-radius: 3px;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 12px;
    color: #ccc;
    min-width: 45px;
}

/* 动机与可行性卡片 */
.motivation-card {
    width: 90%;
    background: rgba(var(--v-theme-surface-variant), 0.1);
    border-radius: 10px;
    padding: 1.5rem;
    margin-top: 1.5rem;
    border-left: 4px solid var(--goal-color);
    transition: all 0.3s ease;
}

.motivation-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.motivation-card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    color: var(--goal-color);
    font-weight: 600;
}

.motivation-card-content {
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    font-size: 1.1rem;
    font-weight: 300;
    font-style: italic;
    padding: 0.5rem 0;
}

/* kr样式 */
.key-results-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-top: 16px;
    padding-right: 140px;
}

/* 响应式布局 */
@media (max-width: 1200px) {
    .key-results-container {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 960px) {
    .key-results-container {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 600px) {
    .key-results-container {
        grid-template-columns: 1fr;
    }
}
</style>
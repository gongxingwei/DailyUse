<template>
    <v-container fluid class="goal-info-container pa-0">
        <!-- 头部导航栏 -->
        <v-toolbar :color="`rgba(var(--v-theme-surface))`" elevation="2" class="goal-info-header flex-shrink-0 mb-4">
            <v-btn icon @click="$router.back()">
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>

            <v-toolbar-title class="text-h6 font-weight-medium">
                {{ goal?.title || '未检测到' }}
            </v-toolbar-title>

            <v-spacer />

            <!-- 编辑按钮 -->
            <v-btn icon @click="startEditGoal(goal?.id as string)">
                <v-icon>mdi-pencil</v-icon>
            </v-btn>

            <!-- 复盘功能菜单 -->
            <v-menu>
                <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props">
                        <v-icon>mdi-book-edit</v-icon>
                    </v-btn>
                </template>
                <v-list>
                    <v-list-item @click="startMidtermReview(goal?.id as string)">
                        <v-list-item-title>期中复盘</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="viewGoalReviewRecord()">
                        <v-list-item-title>复盘记录</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>

            <!-- 更多功能菜单 -->
            <v-menu>
                <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props">
                        <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                </template>
                <v-list>
                    <v-list-item @click="toggleArchiveGoal(goal?.id as string)">
                        <template v-slot:prepend>
                            <v-icon>mdi-archive</v-icon>
                        </template>
                        <v-list-item-title>{{ isArchived ? '取消归档' : '归档' }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="toggleDeleteGoal(goal?.id as string)">
                        <template v-slot:prepend>
                            <v-icon>mdi-delete</v-icon>
                        </template>
                        <v-list-item-title>{{ isDeleted ? '取消删除' : '删除' }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </v-toolbar>

        <!-- 主要内容区域 -->
        <div class="main-content flex-grow-1 px-10">
            <div class="content-wrapper">
                <!-- 目标完成提示卡片 -->
                <v-alert v-if="isGoalEnded" type="success" variant="tonal" class="mb-6" icon="mdi-flag-checkered">
                    <template v-slot:title>
                        目标已结束
                    </template>
                    <div class="d-flex align-center justify-space-between">
                        <span>共历时 {{ totalDays }} 天，目标进度 {{ goalProgress }}%</span>
                        <v-btn color="success" variant="elevated" size="small"
                            @click="startMidtermReview(goal?.id as string)">
                            复盘目标
                        </v-btn>
                    </div>
                </v-alert>

                <!-- 目标基本信息卡片 -->
                <v-card class="mb-6 flex-shrink-0" elevation="2">
                    <v-card-text class="pa-6">
                        <v-row>
                            <!-- 进度圆环 -->
                            <v-col cols="12" md="4" class="d-flex justify-center align-center">
                                <div class="progress-container">
                                    <v-progress-circular :model-value="goalProgress" :color="goalColor" size="120"
                                        width="12" class="progress-circle">
                                        <div class="progress-text-container">
                                            <div class="progress-value">
                                                <span class="text-h4 font-weight-bold">{{ goalProgress }}</span>
                                                <span class="text-h6 text-medium-emphasis">%</span>
                                            </div>
                                            <div class="text-caption text-medium-emphasis">目标进度</div>
                                        </div>
                                    </v-progress-circular>
                                </div>
                            </v-col>

                            <!-- 时间信息 -->
                            <v-col cols="12" md="8">
                                <div class="time-info">
                                    <!-- 剩余天数 -->
                                    <div class="mb-4">
                                        <template v-if="isGoalEnded">
                                            <v-chip color="success" variant="elevated" size="large">
                                                <v-icon start>mdi-check-circle</v-icon>
                                                已结束
                                            </v-chip>
                                        </template>
                                        <template v-else>
                                            <div class="d-flex align-center mb-2">
                                                <span class="text-h3 font-weight-bold text-primary mr-2">{{
                                                    remainingDays }}</span>
                                                <span class="text-h6">天后结束</span>
                                            </div>
                                        </template>
                                    </div>

                                    <!-- 日期范围 -->
                                    <div class="mb-4">
                                        <v-chip variant="outlined" prepend-icon="mdi-calendar-range">
                                            {{ formatDate(goal?.startTime) }} - {{ formatDate(goal?.endTime) }}
                                        </v-chip>
                                    </div>

                                    <!-- 时间进度条 -->
                                    <div>
                                        <div class="d-flex justify-space-between align-center mb-2">
                                            <span class="text-body-2 text-medium-emphasis">时间进度</span>
                                            <span class="text-body-2 font-weight-medium">{{ timeProgress }}%</span>
                                        </div>
                                        <v-progress-linear :model-value="parseFloat(timeProgress)" :color="goalColor"
                                            height="8" rounded />
                                    </div>
                                </div>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <!-- 动机与可行性卡片 -->
                <v-card class="mb-6 flex-shrink-0" elevation="2" :style="{ borderLeft: `4px solid ${goalColor}` }">
                    <v-card-text>
                        <div class="d-flex align-center mb-3">
                            <v-icon :color="goalColor" class="mr-2">
                                {{ isShowingMotive ? 'mdi-lighthouse' : 'mdi-lightbulb' }}
                            </v-icon>
                            <span class="text-h6 font-weight-medium">
                                {{ isShowingMotive ? '目标动机' : '可行性分析' }}
                            </span>
                        </div>
                        <div class="text-body-1 font-italic text-medium-emphasis">
                            {{ isShowingMotive ? goal?.motive : goal?.feasibility }}
                        </div>
                    </v-card-text>
                </v-card>

                <!-- 内容标签页 -->
                <v-card elevation="2" class="tabs-card">
                    <v-tabs v-model="activeTab" :color="goalColor" class="px-4 pt-2 flex-shrink-0">
                        <v-tab value="keyResults">
                            <v-icon start>mdi-target</v-icon>
                            关键结果
                        </v-tab>
                        <v-tab value="repositories">
                            <v-icon start>mdi-source-repository</v-icon>
                            关联仓库
                        </v-tab>
                    </v-tabs>

                    <div class="tab-content">
                        <v-window v-model="activeTab" class="h-100">
                            <!-- 关键结果标签页 -->
                            <v-window-item value="keyResults" class="h-100">
                                <div class="scrollable-content">
                                    <v-row v-if="keyResults.length > 0">
                                        <v-col v-for="keyResult in keyResults" :key="keyResult.id" cols="12" lg="6">
                                            <KeyResultCard :keyResult="keyResult" :goalId="goalId" />
                                        </v-col>
                                    </v-row>
                                    <v-empty-state v-else icon="mdi-target" title="暂无关键结果" text="添加关键结果来跟踪目标进度" />
                                </div>
                            </v-window-item>

                            <!-- 关联仓库标签页 -->
                            <v-window-item value="repositories" class="h-100">
                                <div class="scrollable-content">
                                    <v-row v-if="relativeRepos.length > 0">
                                        <v-col v-for="repo in relativeRepos" :key="repo.title" cols="12" lg="6">
                                            <RepoInfoCard :repository="repo" />
                                        </v-col>
                                    </v-row>
                                    <v-empty-state v-else icon="mdi-source-repository" title="暂无关联仓库"
                                        text="关联代码仓库来跟踪开发进度" />
                                </div>
                            </v-window-item>
                        </v-window>
                    </div>
                </v-card>
            </div>
        </div>

        <!-- 对话框组件 -->
        <GoalDialog :visible="showGoalDialog" @cancel="cancelGoalEdit" @save="saveGoal" />
        <ConfirmDialog v-model="showDeleteConfirmDialog" title="删除目标" message="确定要删除该目标吗？" confirm-text="确认"
            cancel-text="取消" @confirm="handleDeleteGoal(goal?.id as string)" @cancel="cancelDeleteGoal" />
        <GoalReviewCard :visible="showGoalReviewRecored" @close="closeGoalReviewRecord" />
    </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
// store
import { useGoalStore } from '../stores/goalStore';
import { useRepositoryStore } from '@/modules/Repository/stores/repositoryStore';
// composables
import { useGoalDialog } from '../composables/useGoalDialog';
import { useGoalReview } from '../composables/useGoalReview';
import { useGoalManagement } from '../composables/useGoalManagement';

// 组件
import GoalDialog from '../components/GoalDialog.vue';
import GoalReviewCard from '../components/GoalReviewCard.vue';
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue';
import KeyResultCard from '../components/KeyResultCard.vue';
import RepoInfoCard from '@/modules/Repository/components/RepoInfoCard.vue';

const route = useRoute();
const goalStore = useGoalStore();
const repositoryStore = useRepositoryStore();
const { showGoalDialog, startEditGoal, saveGoal, cancelGoalEdit } = useGoalDialog();
const { showGoalReviewRecored, viewGoalReviewRecord, closeGoalReviewRecord, startMidtermReview } = useGoalReview();
const { showDeleteConfirmDialog, handleDeleteGoal, cancelDeleteGoal } = useGoalManagement();

const goal = computed(() => {
    const goalId = route.params.goalId as string;
    if (!goalId) return null;
    return goalStore.getGoalById(goalId);
});

const goalId = computed(() => route.params.goalId as string);
const goalColor = computed(() => goal.value?.color || '#FF5733');
const keyResults = computed(() => {
    const goalId = route.params.goalId as string;
    return goalStore.getAllKeyResultsByGoalId(goalId);
});

const isArchived = computed(() => goal.value?.dirId === 'archive');
const toggleArchiveGoal = (goalId: string) => {
    if (!isArchived.value) {
        goalStore.archiveGoalById(goalId);
    } else {
        goalStore.unarchiveGoalById(goalId);
    }
};

const isDeleted = computed(() => goal.value?.dirId === 'trash');
const toggleDeleteGoal = (goalId: string) => {
    if (!isDeleted.value) {
        goalStore.deleteGoalById(goalId);
    } else {
        goalStore.restoreGoalById(goalId);
    }
};

const isGoalEnded = computed(() => {
    if (!goal.value) return false;
    return new Date(goal.value.endTime) < new Date();
});

const totalDays = computed(() => {
    if (!goal.value) return 0;
    const start = new Date(goal.value.startTime);
    const end = new Date(goal.value.endTime);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
});

const timeProgress = computed(() => {
    if (!goal.value) return '0';
    const startDate = new Date(goal.value.startTime);
    const endDate = new Date(goal.value.endTime);
    const today = new Date();
    const totalTime = endDate.getTime() - startDate.getTime();
    const elapsedTime = today.getTime() - startDate.getTime();
    const progress = (elapsedTime / totalTime) * 100;
    return Math.min(Math.max(progress, 0), 100).toFixed(1);
});

const goalProgress = computed(() => {
    const goalId = route.params.goalId as string;
    return goalStore.getGoalProgress(goalId) || 0;
});

const remainingDays = computed(() => {
    const goalId = route.params.goalId as string;
    const goal = goalStore.getGoalById(goalId);
    if (!goal) return 0;
    const endDate = new Date(goal.endTime);
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

const isShowingMotive = ref(Math.random() > 0.5);

function formatDate(dateString: any) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const activeTab = ref('keyResults');
const relativeRepos = computed(() => {
    const repos = repositoryStore.getRelativeRepoByGoalId(goal.value?.id as string);
    return repos;
});
</script>

<style scoped>
.goal-info-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: linear-gradient(135deg,
      rgba(var(--v-theme-primary), 0.02) 0%,
      rgba(var(--v-theme-surface), 0.91) 100%);
}

.main-content {
    min-height: 0;
    overflow: hidden;
}

.content-wrapper {
    height: 100%;
    padding: 16px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.tabs-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.tab-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.scrollable-content {
    height: 100%;
    overflow-y: auto;
    padding: 16px;
}

.progress-text-container {
    text-align: center;
}

.time-info {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
}
</style>
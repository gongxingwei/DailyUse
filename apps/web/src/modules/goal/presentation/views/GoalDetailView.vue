<!--
  Goal Detail View
  目标详情页面
-->
<template>
    <v-container fluid class="pa-6">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="d-flex justify-center align-center" style="height: 400px;">
            <v-progress-circular indeterminate color="primary" size="64" />
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="d-flex justify-center align-center" style="height: 400px;">
            <v-alert type="error" variant="tonal" class="ma-4">
                {{ error }}
                <template v-slot:append>
                    <v-btn variant="text" color="error" @click="loadGoalDetail">
                        重试
                    </v-btn>
                </template>
            </v-alert>
        </div>

        <!-- 目标不存在 -->
        <div v-else-if="!goal" class="d-flex justify-center align-center" style="height: 400px;">
            <v-empty-state icon="mdi-target-variant" title="目标不存在" text="您要查看的目标可能已被删除或不存在">
                <template v-slot:actions>
                    <v-btn color="primary" variant="elevated" @click="$router.push('/goals')">
                        返回目标列表
                    </v-btn>
                </template>
            </v-empty-state>
        </div>

        <!-- 目标详情内容 -->
        <div v-else>
            <!-- 页面头部 -->
            <div class="d-flex align-center justify-space-between mb-6">
                <div class="d-flex align-center">
                    <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" class="mr-4">
                        <v-icon>mdi-arrow-left</v-icon>
                    </v-btn>
                    <div>
                        <h1 class="text-h4 font-weight-bold">{{ goal.name }}</h1>
                        <div class="d-flex align-center mt-2">
                            <v-chip :color="getStatusColor()" size="small" variant="tonal" class="mr-2">
                                <v-icon start size="12">{{ getStatusIcon() }}</v-icon>
                                {{ getStatusText() }}
                            </v-chip>
                            <span class="text-subtitle-2 text-medium-emphasis">
                                {{ formatDate(goal.startTime) }} - {{ formatDate(goal.endTime) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="d-flex align-center">
                    <v-btn variant="outlined" color="primary" class="mr-2"
                        @click="$router.push(`/goals/${goal.uuid}/edit`)">
                        <v-icon start>mdi-pencil</v-icon>
                        编辑
                    </v-btn>

                    <v-menu>
                        <template v-slot:activator="{ props: menuProps }">
                            <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text">
                                <v-icon>mdi-dots-vertical</v-icon>
                            </v-btn>
                        </template>
                        <v-list>
                            <v-list-item @click="handleStatusAction('toggle')">
                                <template v-slot:prepend>
                                    <v-icon>
                                        {{ goal.lifecycle?.status === 'active' ? 'mdi-pause' : 'mdi-play' }}
                                    </v-icon>
                                </template>
                                <v-list-item-title>
                                    {{ goal.lifecycle?.status === 'active' ? '暂停目标' : '继续目标' }}
                                </v-list-item-title>
                            </v-list-item>

                            <v-list-item v-if="goal.lifecycle?.status !== 'completed'"
                                @click="handleStatusAction('complete')">
                                <template v-slot:prepend>
                                    <v-icon color="success">mdi-check</v-icon>
                                </template>
                                <v-list-item-title>完成目标</v-list-item-title>
                            </v-list-item>

                            <v-list-item v-if="goal.lifecycle?.status !== 'archived'"
                                @click="handleStatusAction('archive')">
                                <template v-slot:prepend>
                                    <v-icon color="warning">mdi-archive</v-icon>
                                </template>
                                <v-list-item-title>归档目标</v-list-item-title>
                            </v-list-item>

                            <v-divider />

                            <v-list-item @click="confirmDelete">
                                <template v-slot:prepend>
                                    <v-icon color="error">mdi-delete</v-icon>
                                </template>
                                <v-list-item-title>删除目标</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </div>
            </div>

            <v-row>
                <!-- 左侧主要内容 -->
                <v-col cols="12" lg="8">
                    <!-- 目标概览卡片 -->
                    <v-card class="mb-6" elevation="2">
                        <v-card-text class="pa-6">
                            <div class="d-flex align-center mb-4">
                                <v-avatar :color="goal.color || '#2196F3'" size="48" class="mr-4" variant="tonal">
                                    <v-icon color="white">mdi-target</v-icon>
                                </v-avatar>
                                <div class="flex-grow-1">
                                    <h2 class="text-h5 font-weight-bold mb-1">{{ goal.name }}</h2>
                                    <p v-if="goal.description" class="text-body-1 text-medium-emphasis mb-0">
                                        {{ goal.description }}
                                    </p>
                                </div>
                                <!-- 进度圆环 -->
                                <v-progress-circular :model-value="goalProgress" :color="goal.color || '#2196F3'"
                                    size="80" width="8">
                                    <span class="text-h6 font-weight-bold">{{ Math.round(goalProgress) }}%</span>
                                </v-progress-circular>
                            </div>

                            <!-- 标签 -->
                            <div v-if="goal.metadata?.tags && goal.metadata.tags.length > 0" class="mb-4">
                                <v-chip v-for="tag in goal.metadata.tags" :key="tag" size="small" variant="outlined"
                                    class="mr-2 mb-2">
                                    {{ tag }}
                                </v-chip>
                            </div>

                            <!-- 进度条 -->
                            <div class="mb-4">
                                <div class="d-flex justify-space-between align-center mb-2">
                                    <span class="text-subtitle-2 text-medium-emphasis">总体进度</span>
                                    <span class="text-subtitle-2 font-weight-bold">{{ Math.round(goalProgress)
                                        }}%</span>
                                </div>
                                <v-progress-linear :model-value="goalProgress" :color="goal.color || '#2196F3'"
                                    height="12" rounded />
                            </div>
                        </v-card-text>
                    </v-card>

                    <!-- 关键结果 -->
                    <v-card class="mb-6" elevation="2" v-if="goal.keyResults && goal.keyResults.length > 0">
                        <v-card-title class="pa-4">
                            <div class="d-flex align-center justify-space-between w-100">
                                <h3 class="text-h6">关键结果</h3>
                                <v-chip size="small" variant="outlined" :color="goal.color || '#2196F3'">
                                    {{ completedKeyResultsCount }}/{{ goal.keyResults.length }} 已完成
                                </v-chip>
                            </div>
                        </v-card-title>

                        <v-divider />

                        <v-card-text class="pa-4">
                            <div v-for="keyResult in goal.keyResults" :key="keyResult.uuid" class="mb-4">
                                <div class="d-flex align-center justify-space-between mb-2">
                                    <h4 class="text-subtitle-1 font-weight-medium">{{ keyResult.name }}</h4>
                                    <span class="text-subtitle-2 font-weight-bold">
                                        {{ keyResult.currentValue || 0 }}/{{ keyResult.targetValue || 100 }}
                                    </span>
                                </div>
                                <v-progress-linear :model-value="getKeyResultProgress(keyResult)"
                                    :color="goal.color || '#2196F3'" height="8" rounded class="mb-2" />
                                <p v-if="keyResult.description" class="text-caption text-medium-emphasis">
                                    {{ keyResult.description }}
                                </p>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>

                <!-- 右侧信息栏 -->
                <v-col cols="12" lg="4">
                    <!-- 基本信息 -->
                    <v-card class="mb-4" elevation="2">
                        <v-card-title class="pa-4">
                            <h3 class="text-h6">基本信息</h3>
                        </v-card-title>
                        <v-divider />
                        <v-card-text class="pa-4">
                            <div class="mb-3">
                                <div class="text-caption text-medium-emphasis mb-1">创建时间</div>
                                <div class="text-body-2">{{ formatDate(goal.lifecycle?.createdAt) }}</div>
                            </div>
                            <div class="mb-3">
                                <div class="text-caption text-medium-emphasis mb-1">开始时间</div>
                                <div class="text-body-2">{{ formatDate(goal.startTime) }}</div>
                            </div>
                            <div class="mb-3">
                                <div class="text-caption text-medium-emphasis mb-1">结束时间</div>
                                <div class="text-body-2">{{ formatDate(goal.endTime) }}</div>
                            </div>
                            <div class="mb-3">
                                <div class="text-caption text-medium-emphasis mb-1">剩余时间</div>
                                <div class="text-body-2" :class="getRemainingDaysColor() + '--text'">
                                    {{ getRemainingDaysText() }}
                                </div>
                            </div>
                            <div v-if="goal.dirUuid">
                                <div class="text-caption text-medium-emphasis mb-1">所属分类</div>
                                <div class="text-body-2">{{ getGoalDirName() }}</div>
                            </div>
                        </v-card-text>
                    </v-card>

                    <!-- 统计信息 -->
                    <v-card elevation="2">
                        <v-card-title class="pa-4">
                            <h3 class="text-h6">统计信息</h3>
                        </v-card-title>
                        <v-divider />
                        <v-card-text class="pa-4">
                            <div class="d-flex justify-space-between align-center mb-3">
                                <span class="text-body-2">关键结果数量</span>
                                <span class="font-weight-bold">{{ goal.keyResults?.length || 0 }}</span>
                            </div>
                            <div class="d-flex justify-space-between align-center mb-3">
                                <span class="text-body-2">已完成关键结果</span>
                                <span class="font-weight-bold text-success">{{ completedKeyResultsCount }}</span>
                            </div>
                            <div class="d-flex justify-space-between align-center mb-3">
                                <span class="text-body-2">总体进度</span>
                                <span class="font-weight-bold">{{ Math.round(goalProgress) }}%</span>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </div>

        <!-- 确认删除对话框 -->
        <v-dialog v-model="deleteDialog.show" max-width="400">
            <v-card>
                <v-card-title class="text-h6">确认删除</v-card-title>
                <v-card-text>
                    您确定要删除目标"{{ goal?.name }}"吗？此操作无法撤销。
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn color="grey" variant="text" @click="deleteDialog.show = false">
                        取消
                    </v-btn>
                    <v-btn color="error" variant="text" @click="handleDelete">
                        删除
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 成功/错误提示 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout">
            {{ snackbar.message }}
        </v-snackbar>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// import { format } from 'date-fns';
// import { zhCN } from 'date-fns/locale';
import { useGoal } from '../composables/useGoal';
import { useGoalStore } from '../stores/goalStore';
import type { Goal } from '@dailyuse/domain-client';

interface Props {
    id: string;
}

const props = defineProps<Props>();
const route = useRoute();
const router = useRouter();

const {
    fetchGoalById,
    deleteGoal,
    activateGoal,
    pauseGoal,
    completeGoal,
    archiveGoal,
    isLoading,
    error
} = useGoal();

const goalStore = useGoalStore();

const goal = ref<Goal | null>(null);

const deleteDialog = reactive({
    show: false
});

const snackbar = reactive({
    show: false,
    message: '',
    color: 'success',
    timeout: 3000
});

// ===== 计算属性 =====

/**
 * 目标进度
 */
const goalProgress = computed(() => {
    if (!goal.value?.keyResults || goal.value.keyResults.length === 0) {
        return 0;
    }

    // 计算基于 currentValue 和 targetValue 的进度
    const totalProgress = goal.value.keyResults.reduce((sum, kr) => {
        const progress = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
        return sum + Math.min(progress, 100);
    }, 0);
    return (totalProgress / goal.value.keyResults.length);
});

/**
 * 已完成的关键结果数量
 */
const completedKeyResultsCount = computed(() => {
    return goal.value?.keyResults?.filter(kr => {
        const progress = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
        return progress >= 100;
    }).length || 0;
});

// ===== 方法 =====

/**
 * 格式化日期
 */
const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // 暂时使用简单的格式化，之后可以替换为 date-fns
    return dateObj.toLocaleDateString('zh-CN');
};

/**
 * 获取状态颜色
 */
const getStatusColor = () => {
    switch (goal.value?.lifecycle?.status) {
        case 'active':
            return 'success';
        case 'paused':
            return 'warning';
        case 'completed':
            return 'primary';
        case 'archived':
            return 'secondary';
        default:
            return 'grey';
    }
};

/**
 * 获取状态图标
 */
const getStatusIcon = () => {
    switch (goal.value?.lifecycle?.status) {
        case 'active':
            return 'mdi-play';
        case 'paused':
            return 'mdi-pause';
        case 'completed':
            return 'mdi-check';
        case 'archived':
            return 'mdi-archive';
        default:
            return 'mdi-help';
    }
};

/**
 * 获取状态文本
 */
const getStatusText = () => {
    switch (goal.value?.lifecycle?.status) {
        case 'active':
            return '进行中';
        case 'paused':
            return '已暂停';
        case 'completed':
            return '已完成';
        case 'archived':
            return '已归档';
        default:
            return '未知状态';
    }
};

/**
 * 获取剩余天数颜色
 */
const getRemainingDaysColor = () => {
    const remaining = getRemainingDays();
    if (remaining < 0) return 'error';
    if (remaining <= 7) return 'warning';
    return 'primary';
};

/**
 * 获取剩余天数文本
 */
const getRemainingDaysText = () => {
    const remaining = getRemainingDays();
    if (remaining < 0) return `已逾期 ${Math.abs(remaining)} 天`;
    if (remaining === 0) return '今天截止';
    return `剩余 ${remaining} 天`;
};

/**
 * 计算剩余天数
 */
const getRemainingDays = () => {
    if (!goal.value?.endTime) return 0;

    const endDate = typeof goal.value.endTime === 'string'
        ? new Date(goal.value.endTime)
        : goal.value.endTime;
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 获取关键结果进度
 */
const getKeyResultProgress = (keyResult: any) => {
    if (!keyResult.targetValue || keyResult.targetValue === 0) return 0;
    const progress = (keyResult.currentValue / keyResult.targetValue) * 100;
    return Math.min(progress, 100);
};

/**
 * 获取目标分类名称
 */
const getGoalDirName = () => {
    if (!goal.value?.dirUuid) return '-';
    const dir = goalStore.getGoalDirByUuid(goal.value.dirUuid);
    return dir?.name || '未知分类';
};

/**
 * 显示提示消息
 */
const showSnackbar = (message: string, color: string = 'success') => {
    snackbar.message = message;
    snackbar.color = color;
    snackbar.show = true;
};

/**
 * 加载目标详情
 */
const loadGoalDetail = async () => {
    try {
        const goalId = props.id || route.params.id as string;
        const response = await fetchGoalById(goalId);
        if (response) {
            goal.value = goalStore.getGoalByUuid(goalId) || null;
        }
    } catch (error) {
        console.error('加载目标详情失败:', error);
        showSnackbar('加载目标详情失败', 'error');
    }
};

/**
 * 处理状态操作
 */
const handleStatusAction = async (action: 'toggle' | 'complete' | 'archive') => {
    if (!goal.value) return;

    try {
        switch (action) {
            case 'toggle':
                if (goal.value.lifecycle?.status === 'active') {
                    await pauseGoal(goal.value.uuid);
                    showSnackbar('目标已暂停', 'warning');
                } else {
                    await activateGoal(goal.value.uuid);
                    showSnackbar('目标已激活', 'success');
                }
                break;
            case 'complete':
                await completeGoal(goal.value.uuid);
                showSnackbar('目标已完成', 'success');
                break;
            case 'archive':
                await archiveGoal(goal.value.uuid);
                showSnackbar('目标已归档', 'info');
                break;
        }

        // 重新加载目标详情
        await loadGoalDetail();
    } catch (error) {
        console.error('操作失败:', error);
        showSnackbar('操作失败，请重试', 'error');
    }
};

/**
 * 确认删除
 */
const confirmDelete = () => {
    deleteDialog.show = true;
};

/**
 * 删除目标
 */
const handleDelete = async () => {
    if (!goal.value) return;

    try {
        await deleteGoal(goal.value.uuid);
        deleteDialog.show = false;
        showSnackbar('目标删除成功', 'success');

        // 延迟跳转
        setTimeout(() => {
            router.push('/goals');
        }, 1000);
    } catch (error) {
        console.error('删除目标失败:', error);
        showSnackbar('删除目标失败', 'error');
    }
};

// ===== 生命周期 =====

onMounted(() => {
    loadGoalDetail();
});
</script>

<style scoped>
.v-card {
    border-radius: 12px;
}

.progress-ring {
    position: relative;
}
</style>

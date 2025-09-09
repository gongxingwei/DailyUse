<template>
    <div class="goal-test-page">
        <v-container>
            <v-row>
                <v-col cols="12">
                    <h1>Goal 模块测试页面</h1>
                </v-col>
            </v-row>

            <!-- 模块状态信息 -->
            <v-row>
                <v-col cols="12" md="4">
                    <v-card>
                        <v-card-title>模块状态</v-card-title>
                        <v-card-text>
                            <v-list>
                                <v-list-item>
                                    <v-list-item-title>初始化状态</v-list-item-title>
                                    <v-list-item-subtitle>
                                        <v-chip :color="isInitialized ? 'success' : 'warning'" small>
                                            {{ isInitialized ? '已初始化' : '未初始化' }}
                                        </v-chip>
                                    </v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <v-list-item-title>加载状态</v-list-item-title>
                                    <v-list-item-subtitle>
                                        <v-chip :color="isLoading ? 'info' : 'success'" small>
                                            {{ isLoading ? '加载中' : '已完成' }}
                                        </v-chip>
                                    </v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item v-if="error">
                                    <v-list-item-title>错误信息</v-list-item-title>
                                    <v-list-item-subtitle>
                                        <v-chip color="error" small>{{ error }}</v-chip>
                                    </v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" md="4">
                    <v-card>
                        <v-card-title>数据统计</v-card-title>
                        <v-card-text>
                            <v-list>
                                <v-list-item>
                                    <v-list-item-title>目标总数</v-list-item-title>
                                    <v-list-item-subtitle>{{ goalStats.total }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <v-list-item-title>活跃目标</v-list-item-title>
                                    <v-list-item-subtitle>{{ goalStats.active }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <v-list-item-title>已完成目标</v-list-item-title>
                                    <v-list-item-subtitle>{{ goalStats.completed }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <v-list-item-title>目录总数</v-list-item-title>
                                    <v-list-item-subtitle>{{ goalDirStats.total }}</v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" md="4">
                    <v-card>
                        <v-card-title>操作面板</v-card-title>
                        <v-card-text>
                            <v-btn @click="forceSync" :loading="isLoading" color="primary" class="ma-2" block>
                                强制同步数据
                            </v-btn>
                            <v-btn @click="clearAllData" :disabled="isLoading" color="warning" class="ma-2" block>
                                清空所有数据
                            </v-btn>
                            <v-btn @click="showCreateDialog = true" :disabled="isLoading" color="success" class="ma-2"
                                block>
                                创建测试目标
                            </v-btn>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- 简单的目标列表 -->
            <v-row>
                <v-col cols="12">
                    <v-card>
                        <v-card-title>目标列表</v-card-title>
                        <v-card-text>
                            <div v-if="isLoading">
                                <v-progress-circular indeterminate color="primary" />
                                <span class="ml-2">加载中...</span>
                            </div>
                            <div v-else-if="allGoals.length === 0">
                                <v-alert type="info">暂无目标数据</v-alert>
                            </div>
                            <v-list v-else>
                                <v-list-item v-for="goal in allGoals" :key="goal.uuid">
                                    <v-list-item-content>
                                        <v-list-item-title>{{ goal.name }}</v-list-item-title>
                                        <v-list-item-subtitle>
                                            {{ goal.description || '无描述' }}
                                        </v-list-item-subtitle>
                                    </v-list-item-content>
                                    <v-list-item-action>
                                        <v-chip :color="getStatusColor(goal.lifecycle.status)" small>
                                            {{ getStatusText(goal.lifecycle.status) }}
                                        </v-chip>
                                    </v-list-item-action>
                                </v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- 目录树 -->
            <v-row>
                <v-col cols="12">
                    <v-card>
                        <v-card-title>目录结构</v-card-title>
                        <v-card-text>
                            <v-list>
                                <v-list-item v-for="node in goalDirTree" :key="node.dir.uuid">
                                    <v-list-item-content>
                                        <v-list-item-title>{{ node.dir.name }}</v-list-item-title>
                                    </v-list-item-content>
                                    <v-list-item-action>
                                        <v-chip small :color="node.dir.isSystemDir ? 'info' : 'default'">
                                            {{ node.goals.length || 0 }} 个目标
                                        </v-chip>
                                    </v-list-item-action>
                                </v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>

        <!-- 创建目标对话框 -->
        <v-dialog v-model="showCreateDialog" max-width="500px">
            <v-card>
                <v-card-title>创建测试目标</v-card-title>
                <v-card-text>
                    <v-form ref="createForm" v-model="createFormValid">
                        <v-text-field v-model="newGoal.name" label="目标名称" :rules="[rules.required]" required />
                        <v-textarea v-model="newGoal.description" label="目标描述" rows="3" />
                        <v-text-field v-model="newGoal.color" label="目标颜色" type="color" />
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn text @click="showCreateDialog = false">取消</v-btn>
                    <v-btn color="primary" :disabled="!createFormValid" :loading="isLoading" @click="createTestGoal">
                        创建
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGoalStore, getGoalWebService } from '@/modules/goal';
import { GoalContracts, ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

// Store 和 Service
const goalStore = useGoalStore();
const goalService = getGoalWebService();

// 响应式数据
const showCreateDialog = ref(false);
const createFormValid = ref(false);

// 新目标表单
const newGoal = ref({
    name: '',
    description: '',
    color: '#1976D2',
});

// 计算属性
const isInitialized = computed(() => goalStore.isInitialized);
const isLoading = computed(() => goalStore.isLoading);
const error = computed(() => goalStore.error);
const allGoals = computed(() => goalStore.getAllGoals);
const goalStats = computed(() => goalStore.getGoalStatistics);
const goalDirStats = computed(() => goalStore.getGoalDirStatistics);
const goalDirTree = computed(() => goalStore.getGoalDirTree);

// 表格配置
const goalHeaders = [
    { text: '标题', value: 'title', sortable: true },
    { text: '描述', value: 'description', sortable: false },
    { text: '状态', value: 'status', sortable: true },
    { text: '进度', value: 'progress', sortable: true },
    { text: '优先级', value: 'priority', sortable: true },
    { text: '操作', value: 'actions', sortable: false, width: '150px' },
];

const priorityOptions = [
    { text: '低', value: 'low' },
    { text: '中', value: 'medium' },
    { text: '高', value: 'high' },
];

// 表单验证规则
const rules = {
    required: (value: string) => !!value || '此字段为必填项',
};

// 方法
const forceSync = async () => {
    try {
        await goalService.forceSync();
    } catch (error) {
        console.error('强制同步失败:', error);
    }
};

const clearAllData = () => {
    goalStore.clearAll();
};

const createTestGoal = async () => {
    try {
        const now = new Date();
        const endTime = new Date(now.getFullYear(), 11, 31); // 年底

        const goalData: GoalContracts.CreateGoalRequest = {
            name: newGoal.value.name,
            description: newGoal.value.description,
            color: newGoal.value.color,
            startTime: now.toISOString(),
            endTime: endTime.toISOString(),
            analysis: {
                motive: '测试目标',
                feasibility: '高',
                importanceLevel: ImportanceLevel.Moderate,
                urgencyLevel: UrgencyLevel.Medium
            },
            dirUuid: undefined, // 使用默认目录
            metadata: {
                tags: [],
                category: 'test'
            }
        };

        await goalService.createGoal(goalData);

        // 重置表单
        newGoal.value = {
            name: '',
            description: '',
            color: '#1976D2',
        };

        showCreateDialog.value = false;
    } catch (error) {
        console.error('创建目标失败:', error);
    }
};

const viewGoal = (goal: any) => {
    console.log('查看目标:', goal);
};

const editGoal = (goal: any) => {
    console.log('编辑目标:', goal);
};

const deleteGoal = async (uuid: string) => {
    try {
        await goalService.deleteGoal(uuid);
    } catch (error) {
        console.error('删除目标失败:', error);
    }
};

const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
        active: 'success',
        paused: 'warning',
        completed: 'info',
        archived: 'default',
    };
    return colors[status] || 'default';
};

const getStatusText = (status: string): string => {
    const texts: Record<string, string> = {
        active: '活跃',
        paused: '暂停',
        completed: '已完成',
        archived: '已归档',
    };
    return texts[status] || status;
};

const getProgressColor = (progress: number): string => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'error';
};

// 生命周期
onMounted(async () => {
    // 确保初始化
    if (!isInitialized.value) {
        await forceSync();
    }
});
</script>

<style scoped>
.goal-test-page {
    min-height: 100vh;
    background-color: #f5f5f5;
}
</style>

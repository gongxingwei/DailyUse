<!--
  Goal Create View
  创建目标页面
-->
<template>
    <v-container fluid class="pa-6">
        <div class="d-flex align-center mb-6">
            <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" class="mr-4">
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <div>
                <h1 class="text-h4 font-weight-bold">创建目标</h1>
                <p class="text-subtitle-1 text-medium-emphasis">设定一个新的目标来指导您的行动</p>
            </div>
        </div>

        <v-card max-width="800" class="mx-auto">
            <v-card-text class="pa-8">
                <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
                    <v-row>
                        <!-- 目标名称 -->
                        <v-col cols="12">
                            <v-text-field v-model="form.name" label="目标名称 *" placeholder="例如：学会Vue3" :rules="nameRules"
                                required variant="outlined" class="mb-4" />
                        </v-col>

                        <!-- 目标描述 -->
                        <v-col cols="12">
                            <v-textarea v-model="form.description" label="目标描述" placeholder="描述这个目标的详细内容和意义..." rows="3"
                                variant="outlined" class="mb-4" />
                        </v-col>

                        <!-- 开始和结束时间 -->
                        <v-col cols="12" md="6">
                            <v-text-field v-model="form.startTime" label="开始时间 *" type="date" :rules="startTimeRules"
                                required variant="outlined" class="mb-4" />
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model="form.endTime" label="结束时间 *" type="date" :rules="endTimeRules"
                                required variant="outlined" class="mb-4" />
                        </v-col>

                        <!-- 目标分类 -->
                        <v-col cols="12" md="6">
                            <v-select v-model="form.dirUuid" :items="goalDirOptions" item-title="name" item-value="uuid"
                                label="目标分类" placeholder="选择目标分类" variant="outlined" class="mb-4">
                                <template v-slot:prepend-item>
                                    <v-list-item @click="openCreateDirDialog">
                                        <template v-slot:prepend>
                                            <v-icon color="primary">mdi-plus</v-icon>
                                        </template>
                                        <v-list-item-title>创建新分类</v-list-item-title>
                                    </v-list-item>
                                    <v-divider />
                                </template>
                            </v-select>
                        </v-col>

                        <!-- 目标颜色 -->
                        <v-col cols="12" md="6">
                            <v-text-field v-model="form.color" label="主题颜色" type="color" variant="outlined"
                                class="mb-4" />
                        </v-col>

                        <!-- 目标标签 -->
                        <v-col cols="12">
                            <v-combobox v-model="form.tags" label="标签" placeholder="添加标签（按回车确认）" chips multiple
                                variant="outlined" class="mb-4" />
                        </v-col>

                        <!-- 关键结果部分 -->
                        <v-col cols="12">
                            <div class="d-flex align-center justify-space-between mb-4">
                                <h3 class="text-h6">关键结果 (OKR)</h3>
                                <v-btn color="primary" variant="outlined" size="small" prepend-icon="mdi-plus"
                                    @click="addKeyResult">
                                    添加关键结果
                                </v-btn>
                            </div>

                            <!-- 关键结果列表 -->
                            <div v-if="form.keyResults.length === 0" class="text-center py-8">
                                <v-icon size="64" color="grey-lighten-1">mdi-target-variant</v-icon>
                                <p class="text-grey-lighten-1 mt-4">暂无关键结果</p>
                                <p class="text-caption text-grey-lighten-1">添加关键结果来量化您的目标进度</p>
                            </div>

                            <v-card v-for="(keyResult, index) in form.keyResults" :key="index" variant="outlined"
                                class="mb-3">
                                <v-card-text class="pa-4">
                                    <div class="d-flex align-start">
                                        <div class="flex-grow-1 mr-4">
                                            <v-text-field v-model="keyResult.name" label="关键结果描述"
                                                placeholder="例如：完成10个Vue3项目" variant="outlined" density="compact"
                                                class="mb-3" />
                                            <v-row no-gutters>
                                                <v-col cols="6" class="pr-2">
                                                    <v-text-field v-model.number="keyResult.currentValue" label="当前值"
                                                        type="number" variant="outlined" density="compact" />
                                                </v-col>
                                                <v-col cols="6" class="pl-2">
                                                    <v-text-field v-model.number="keyResult.targetValue" label="目标值"
                                                        type="number" variant="outlined" density="compact" />
                                                </v-col>
                                            </v-row>
                                        </div>
                                        <v-btn icon="mdi-delete" variant="text" color="error" size="small"
                                            @click="removeKeyResult(index)">
                                            <v-icon>mdi-delete</v-icon>
                                        </v-btn>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-6">
                <v-spacer />
                <v-btn color="grey" variant="text" @click="$router.back()">
                    取消
                </v-btn>
                <v-btn color="primary" variant="elevated" :loading="isLoading" :disabled="!formValid"
                    @click="handleSubmit">
                    创建目标
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- 成功/错误提示 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout">
            {{ snackbar.message }}
        </v-snackbar>
    </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGoal } from '../composables/useGoal';
import type { GoalContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

const router = useRouter();
const { createGoal, goalDirs, isLoading, fetchGoalDirs } = useGoal();

const formRef = ref();
const formValid = ref(false);

// ===== 表单数据 =====

const form = reactive({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    dirUuid: '',
    color: '#2196F3',
    tags: [] as string[],
    keyResults: [] as Array<{
        name: string;
        currentValue: number;
        targetValue: number;
    }>
});

const snackbar = reactive({
    show: false,
    message: '',
    color: 'success',
    timeout: 3000
});

// ===== 表单验证规则 =====

const nameRules = [
    (v: string) => !!v || '目标名称是必填项',
    (v: string) => v.length >= 2 || '目标名称至少需要2个字符',
    (v: string) => v.length <= 100 || '目标名称不能超过100个字符'
];

const startTimeRules = [
    (v: string) => !!v || '开始时间是必填项'
];

const endTimeRules = [
    (v: string) => !!v || '结束时间是必填项',
    (v: string) => {
        if (!v || !form.startTime) return true;
        return new Date(v) > new Date(form.startTime) || '结束时间必须晚于开始时间';
    }
];

// ===== 计算属性 =====

/**
 * 目标分类选项
 */
const goalDirOptions = computed(() => {
    return goalDirs.value.filter(dir => !dir.isSystemDir);
});

// ===== 方法 =====

/**
 * 添加关键结果
 */
const addKeyResult = () => {
    form.keyResults.push({
        name: '',
        currentValue: 0,
        targetValue: 100
    });
};

/**
 * 移除关键结果
 */
const removeKeyResult = (index: number) => {
    form.keyResults.splice(index, 1);
};

/**
 * 打开创建分类对话框
 */
const openCreateDirDialog = () => {
    // TODO: 实现创建分类对话框
    showSnackbar('创建分类功能开发中', 'info');
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
 * 提交表单
 */
const handleSubmit = async () => {
    if (!formValid.value) {
        showSnackbar('请填写完整的表单信息', 'error');
        return;
    }

    try {
        const goalData: GoalContracts.CreateGoalRequest = {
            name: form.name,
            description: form.description || undefined,
            startTime: form.startTime,
            endTime: form.endTime,
            dirUuid: form.dirUuid || undefined,
            color: form.color,
            analysis: {
                motive: '',
                feasibility: 'medium',
                importanceLevel: ImportanceLevel.Moderate,
                urgencyLevel: UrgencyLevel.Medium
            },
            metadata: {
                tags: form.tags.length > 0 ? form.tags : [],
                category: ''
            },
            keyResults: form.keyResults.map(kr => ({
                name: kr.name,
                goalUuid: '', // 创建时暂时为空，服务端会填充
                startValue: 0,
                currentValue: kr.currentValue,
                targetValue: kr.targetValue,
                unit: '个',
                weight: 1
            }))
        };

        await createGoal(goalData);
        showSnackbar('目标创建成功', 'success');

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
            router.push('/goals');
        }, 1000);
    } catch (error) {
        console.error('创建目标失败:', error);
        showSnackbar('创建目标失败，请重试', 'error');
    }
};

/**
 * 初始化默认值
 */
const initializeForm = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

    form.startTime = today.toISOString().split('T')[0];
    form.endTime = nextMonth.toISOString().split('T')[0];
};

// ===== 生命周期 =====

onMounted(async () => {
    try {
        await fetchGoalDirs();
        initializeForm();
    } catch (error) {
        console.error('初始化失败:', error);
        showSnackbar('页面初始化失败', 'error');
    }
});
</script>

<style scoped>
.v-card {
    border-radius: 12px;
}

.v-text-field,
.v-textarea,
.v-select,
.v-combobox {
    margin-bottom: 0;
}
</style>

<template>
    <v-dialog 
        :model-value="visible" 
        max-width="900px" 
        class="task-template-dialog"
        persistent
    >
        <v-card class="dialog-card">
            <!-- 头部 -->
            <v-card-title class="dialog-header">
                <div class="header-content">
                    <div class="header-left">
                        <v-icon 
                            :color="tempTask.id === 'temp' ? 'primary' : 'warning'" 
                            size="32" 
                            class="mr-3"
                        >
                            {{ tempTask.id === 'temp' ? 'mdi-plus-circle' : 'mdi-pencil-circle' }}
                        </v-icon>
                        <div>
                            <h2 class="dialog-title">
                                {{ tempTask.id === 'temp' ? '创建任务模板' : '编辑任务模板' }}
                            </h2>
                            <p class="dialog-subtitle">
                                {{ tempTask.id === 'temp' ? '设置重复任务，提升工作效率' : '修改模板设置' }}
                            </p>
                        </div>
                    </div>
                    <v-btn
                        icon
                        variant="text"
                        @click="handleCancel"
                        class="close-btn"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
            </v-card-title>

            <v-divider />

            <!-- 内容区域 - 可滚动 -->
            <v-card-text class="dialog-content">
                <v-form ref="formRef" class="task-form">
                    <!-- 基本信息区域 -->
                    <div class="form-section">
                        <div class="section-header">
                            <v-icon color="primary" class="mr-2">mdi-information</v-icon>
                            <h3 class="section-title">基本信息</h3>
                        </div>
                        
                        <v-row>
                            <v-col cols="12">
                                <v-text-field 
                                    v-model="tempTask.title" 
                                    label="任务标题" 
                                    placeholder="输入一个清晰的任务标题"
                                    :error-messages="errors.title" 
                                    required
                                    variant="outlined"
                                    prepend-inner-icon="mdi-format-title"
                                    counter="50"
                                />
                            </v-col>
                        </v-row>

                        <v-row>
                            <v-col cols="12">
                                <v-textarea 
                                    v-model="tempTask.description" 
                                    label="任务描述" 
                                    placeholder="详细描述任务内容和要求（可选）"
                                    rows="3" 
                                    variant="outlined"
                                    prepend-inner-icon="mdi-text"
                                    counter="200"
                                />
                            </v-col>
                        </v-row>
                    </div>

                    <!-- 时间设置区域 -->
                    <div class="form-section">
                        <div class="section-header">
                            <v-icon color="success" class="mr-2">mdi-clock-outline</v-icon>
                            <h3 class="section-title">时间设置</h3>
                        </div>

                        <div class="time-section">
                            <v-row>
                                <v-col cols="6">
                                    <v-switch 
                                        v-model="isAllDay" 
                                        :label="isAllDay ? '整日任务' : '指定时间'"
                                        color="primary"
                                        inset
                                        hide-details
                                    />
                                </v-col>
                                <v-col cols="6">
                                    <v-fade-transition>
                                        <v-switch 
                                            v-show="!isAllDay" 
                                            v-model="pointOrRange"
                                            :label="pointOrRange ? '时间点' : '时间段'" 
                                            color="success"
                                            inset
                                            hide-details
                                        />
                                    </v-fade-transition>
                                </v-col>
                            </v-row>

                            <v-expand-transition>
                                <div v-show="!isAllDay" class="time-inputs mt-4">
                                    <v-row>
                                        <v-col cols="6">
                                            <v-text-field 
                                                v-model="tempTask.startTime" 
                                                label="开始时间" 
                                                type="time"
                                                variant="outlined"
                                                prepend-inner-icon="mdi-clock-start"
                                                :rules="timeRules"
                                            />
                                        </v-col>
                                        <v-col cols="6">
                                            <v-fade-transition>
                                                <v-text-field 
                                                    v-show="!pointOrRange" 
                                                    v-model="tempTask.endTime" 
                                                    label="结束时间"
                                                    type="time"
                                                    variant="outlined"
                                                    prepend-inner-icon="mdi-clock-end"
                                                    :rules="endTimeRules"
                                                />
                                            </v-fade-transition>
                                        </v-col>
                                    </v-row>
                                </div>
                            </v-expand-transition>
                        </div>
                    </div>

                    <!-- 重复模式区域 -->
                    <div class="form-section">
                        <div class="section-header">
                            <v-icon color="warning" class="mr-2">mdi-repeat</v-icon>
                            <h3 class="section-title">重复模式</h3>
                        </div>

                        <v-row>
                            <v-col cols="12">
                                <v-select 
                                    v-model="tempTask.repeatPattern.type" 
                                    label="重复类型" 
                                    :items="repeatOptions"
                                    variant="outlined"
                                    prepend-inner-icon="mdi-calendar-sync"
                                />
                            </v-col>
                        </v-row>

                        <!-- 重复日期范围 -->
                        <v-expand-transition>
                            <div v-show="tempTask.repeatPattern.type !== 'none'">
                                <v-row>
                                    <v-col cols="6">
                                        <v-text-field 
                                            v-model="tempTask.repeatPattern.startDate" 
                                            label="开始日期"
                                            type="date" 
                                            :min="today"
                                            variant="outlined"
                                            prepend-inner-icon="mdi-calendar-start"
                                        />
                                    </v-col>
                                    <v-col cols="6">
                                        <v-text-field 
                                            v-model="tempTask.repeatPattern.endDate" 
                                            label="结束日期" 
                                            type="date"
                                            :min="tempTask.repeatPattern.startDate"
                                            variant="outlined"
                                            prepend-inner-icon="mdi-calendar-end"
                                        />
                                    </v-col>
                                </v-row>
                            </div>
                        </v-expand-transition>

                        <!-- 一次性任务日期 -->
                        <v-expand-transition>
                            <div v-if="tempTask.repeatPattern.type === 'none'">
                                <v-row>
                                    <v-col cols="6">
                                        <v-text-field 
                                            v-model="tempTask.repeatPattern.endDate" 
                                            label="执行日期" 
                                            type="date"
                                            :min="today"
                                            variant="outlined"
                                            prepend-inner-icon="mdi-calendar"
                                        />
                                    </v-col>
                                </v-row>
                            </div>
                        </v-expand-transition>

                        <!-- 周重复选择 -->
                        <v-expand-transition>
                            <div v-if="tempTask.repeatPattern.type === 'weekly'" class="week-selector">
                                <p class="text-body-2 mb-3 text-medium-emphasis">选择重复的星期：</p>
                                <v-chip-group 
                                    v-model="tempTask.repeatPattern.days" 
                                    multiple 
                                    selected-class="text-primary"
                                    class="week-chips"
                                >
                                    <v-chip 
                                        v-for="(day, index) in weekDays" 
                                        :key="index" 
                                        :value="index"
                                        filter
                                        variant="outlined"
                                        class="week-chip"
                                    >
                                        <v-icon start>mdi-calendar-week</v-icon>
                                        周{{ day }}
                                    </v-chip>
                                </v-chip-group>
                            </div>
                        </v-expand-transition>
                    </div>

                    <!-- 提醒设置区域 -->
                    <div class="form-section">
                        <div class="section-header">
                            <v-icon color="info" class="mr-2">mdi-bell-outline</v-icon>
                            <h3 class="section-title">提醒设置</h3>
                        </div>

                        <v-row>
                            <v-col cols="12">
                                <v-switch 
                                    v-model="tempTask.reminderPattern.isReminder"
                                    :label="tempTask.reminderPattern.isReminder ? '已开启提醒' : '关闭提醒'" 
                                    color="info"
                                    inset
                                    hide-details
                                />
                            </v-col>
                        </v-row>

                        <v-expand-transition>
                            <div v-show="tempTask.reminderPattern.isReminder" class="mt-4">
                                <v-row>
                                    <v-col cols="6">
                                        <v-select 
                                            v-model="tempTask.reminderPattern.timeBefore" 
                                            label="提前提醒时间" 
                                            :items="reminderOptions"
                                            item-title="title" 
                                            item-value="value"
                                            variant="outlined"
                                            prepend-inner-icon="mdi-bell-ring"
                                        />
                                    </v-col>
                                </v-row>
                            </div>
                        </v-expand-transition>
                    </div>

                    <!-- 关联关键结果区域 -->
                    <div class="form-section">
                        <div class="section-header">
                            <v-icon color="purple" class="mr-2">mdi-target</v-icon>
                            <h3 class="section-title">关联关键结果</h3>
                            <v-spacer />
                            <v-btn
                                prepend-icon="mdi-plus"
                                variant="outlined"
                                size="small"
                                color="primary"
                                @click="addKeyResultLink"
                            >
                                添加关联
                            </v-btn>
                        </div>

                        <div v-if="tempTask.keyResultLinks?.length === 0" class="empty-state">
                            <v-icon color="grey-lighten-1" size="48" class="mb-2">mdi-target-variant</v-icon>
                            <p class="text-body-2 text-medium-emphasis mb-3">暂未关联任何关键结果</p>
                            <v-btn
                                prepend-icon="mdi-plus"
                                variant="tonal"
                                color="primary"
                                @click="addKeyResultLink"
                            >
                                添加第一个关联
                            </v-btn>
                        </div>

                        <div v-else class="key-result-links">
                            <v-card
                                v-for="(link, index) in tempTask.keyResultLinks" 
                                :key="index"
                                class="link-card mb-3"
                                variant="outlined"
                            >
                                <v-card-text class="pa-4">
                                    <v-row align="center">
                                        <v-col cols="4">
                                            <v-select 
                                                v-model="link.goalId" 
                                                :items="goals" 
                                                item-title="title" 
                                                item-value="id"
                                                label="选择目标" 
                                                variant="outlined"
                                                density="compact"
                                                @update:model-value="handleGoalChange(index)"
                                            />
                                        </v-col>
                                        <v-col cols="4">
                                            <v-select 
                                                v-model="link.keyResultId" 
                                                :items="getKeyResults(link.goalId)"
                                                item-title="name" 
                                                item-value="id" 
                                                label="选择关键结果" 
                                                :disabled="!link.goalId"
                                                variant="outlined"
                                                density="compact"
                                            />
                                        </v-col>
                                        <v-col cols="3">
                                            <v-text-field 
                                                v-model.number="link.incrementValue" 
                                                type="number" 
                                                label="增加值" 
                                                min="0"
                                                variant="outlined"
                                                density="compact"
                                            />
                                        </v-col>
                                        <v-col cols="1">
                                            <v-btn
                                                icon
                                                variant="text"
                                                color="error"
                                                size="small"
                                                @click="removeKeyResultLink(index)"
                                            >
                                                <v-icon>mdi-delete</v-icon>
                                            </v-btn>
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </v-card>
                        </div>
                    </div>
                </v-form>
            </v-card-text>

            <v-divider />

            <!-- 底部操作栏 - 固定位置 -->
            <v-card-actions class="dialog-actions">
                <v-spacer />
                <v-btn 
                    variant="text" 
                    @click="handleCancel"
                    class="cancel-btn"
                >
                    取消
                </v-btn>
                <v-btn 
                    color="primary" 
                    variant="elevated"
                    @click="handleSave" 
                    :disabled="!isValid"
                    :loading="saving"
                    class="save-btn"
                >
                    <v-icon start>mdi-content-save</v-icon>
                    {{ tempTask.id === 'temp' ? '创建模板' : '保存更改' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useGoalStore } from '@/modules/Goal/stores/goalStore';
import { useTaskStore } from '../stores/taskStore';

const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits<{
    (e: 'save'): void;
    (e: 'cancel'): void;
}>();

const goalStore = useGoalStore();
const taskStore = useTaskStore();
const formRef = ref();
const saving = ref(false);

// 与 store 中的 tempTaskTemplate 进行双向绑定
const tempTask = computed({
    get: () => taskStore.tempTaskTemplate,
    set: (value) => {
        taskStore.tempTaskTemplate = value;
    }
});

// 时间相关
const isAllDay = ref(false);
const pointOrRange = ref(false);
const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

// 选项数据
const repeatOptions = [
    { title: '不重复', value: 'none' },
    { title: '每天', value: 'daily' },
    { title: '每周', value: 'weekly' },
];

const reminderOptions = [
    { title: '提前5分钟', value: '5' },
    { title: '提前10分钟', value: '10' },
    { title: '提前15分钟', value: '15' },
    { title: '提前30分钟', value: '30' },
    { title: '提前60分钟', value: '60' }
];

// 验证规则
const timeRules = [
    (v: string) => !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v) || '请输入有效时间'
];

const endTimeRules = [
    (v: string) => !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v) || '请输入有效时间',
    (v: string) => !v || !tempTask.value.startTime || v > tempTask.value.startTime || '结束时间必须晚于开始时间'
];

// 监听时间选择
watch([isAllDay, pointOrRange], ([newIsAllDay, newPointOrRange]) => {
    if (newIsAllDay) {
        tempTask.value.startTime = undefined;
        tempTask.value.endTime = undefined;
    } else if (newPointOrRange) {
        tempTask.value.endTime = undefined;
    }
});

watch(
    () => props.visible,
    (newVal) => {
        if (newVal) {
            // 重置状态
            saving.value = false;
        }
    }
);

const errors = reactive({
    title: '',
});

const goals = computed(() => goalStore.getAllGoals);

const isValid = computed(() => {
    return tempTask.value.title.trim() !== '' && !errors.title;
});

const today = new Date().toISOString().split('T')[0];

// Methods
const validateForm = () => {
    errors.title = tempTask.value.title.trim() === '' ? '请输入任务标题' : '';
    return !errors.title;
};

const addKeyResultLink = () => {
    if (!tempTask.value.keyResultLinks) {
        tempTask.value.keyResultLinks = [];
    }
    tempTask.value.keyResultLinks.push({
        goalId: '',
        keyResultId: '',
        incrementValue: 1,
    });
};

const removeKeyResultLink = (index: number) => {
    tempTask.value.keyResultLinks?.splice(index, 1);
};

const getKeyResults = (goalId: string) => {
    const goal = goals.value.find(g => g.id === goalId);
    return goal?.keyResults || [];
};

const handleGoalChange = (index: number) => {
    const link = tempTask.value.keyResultLinks?.[index];
    if (link) {
        link.keyResultId = '';
    }
};

const handleSave = async () => {
    if (!validateForm()) return;
    
    saving.value = true;
    try {
        await new Promise(resolve => setTimeout(resolve, 500)); // 模拟保存延迟
        emit('save');
    } finally {
        saving.value = false;
    }
};

const handleCancel = () => {
    emit('cancel');
};
</script>

<style scoped>
.task-template-dialog {
    display: flex;
    align-items: flex-start;
    padding-top: 5vh;
}

.dialog-card {
    border-radius: 16px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* 防止内容溢出 */
}

/* 头部样式 */
.dialog-header {
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05), rgba(var(--v-theme-secondary), 0.05));
    padding: 1.5rem 2rem;
    flex-shrink: 0; /* 头部固定 */
}

.header-content {
    display: flex;
    align-items: center;
    width: 100%;
}

.header-left {
    display: flex;
    align-items: center;
    flex: 1;
}

.dialog-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: rgb(var(--v-theme-on-surface));
}

.dialog-subtitle {
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
    margin: 0.25rem 0 0 0;
}

.close-btn {
    transition: all 0.2s ease;
}

.close-btn:hover {
    transform: scale(1.1);
}

/* 内容区域 - 可滚动 */
.dialog-content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
    min-height: 0; /* 关键：允许flex子元素缩小 */
}

.task-form {
    max-width: 100%;
}

/* 表单区域 */
.form-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: rgba(var(--v-theme-surface), 0.5);
    border-radius: 12px;
    border: 1px solid rgba(var(--v-theme-outline), 0.08);
}

.section-header {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
}

.section-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    color: rgb(var(--v-theme-on-surface));
}

/* 时间设置 */
.time-section {
    background: rgba(var(--v-theme-success), 0.05);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(var(--v-theme-success), 0.1);
}

.time-inputs {
    min-height: 60px;
}

/* 周选择器 */
.week-selector {
    background: rgba(var(--v-theme-warning), 0.05);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(var(--v-theme-warning), 0.1);
}

.week-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.week-chip {
    font-weight: 500;
}

/* 关键结果链接 */
.empty-state {
    text-align: center;
    padding: 2rem;
    background: rgba(var(--v-theme-surface-variant), 0.3);
    border-radius: 8px;
    border: 2px dashed rgba(var(--v-theme-outline), 0.2);
}

.key-result-links {
    max-height: 300px;
    overflow-y: auto;
}

.link-card {
    transition: all 0.2s ease;
    border-radius: 8px;
}

.link-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
}

/* 底部操作 - 固定位置 */
.dialog-actions {
    padding: 1rem 2rem;
    background: rgba(var(--v-theme-surface), 0.9);
    border-top: 1px solid rgba(var(--v-theme-outline), 0.08);
    flex-shrink: 0; /* 底部固定 */
    backdrop-filter: blur(8px); /* 添加模糊效果 */
}

.save-btn {
    font-weight: 600;
    letter-spacing: 0.5px;
}

/* 过渡动画 */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-expand-transition-enter-from,
.v-expand-transition-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

.v-fade-transition-enter-active,
.v-fade-transition-leave-active {
    transition: opacity 0.25s ease;
}

.v-fade-transition-enter-from,
.v-fade-transition-leave-to {
    opacity: 0;
}

/* 滚动条样式 */
.dialog-content::-webkit-scrollbar,
.key-result-links::-webkit-scrollbar {
    width: 6px;
}

.dialog-content::-webkit-scrollbar-track,
.key-result-links::-webkit-scrollbar-track {
    background: rgba(var(--v-theme-outline), 0.05);
    border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb,
.key-result-links::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-primary), 0.3);
    border-radius: 3px;
    transition: background 0.2s ease;
}

.dialog-content::-webkit-scrollbar-thumb:hover,
.key-result-links::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--v-theme-primary), 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .dialog-header {
        padding: 1rem;
    }
    
    .dialog-content {
        padding: 1rem;
    }
    
    .form-section {
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    .dialog-actions {
        padding: 1rem;
    }
    
    .header-left {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
    }
    
    .dialog-title {
        font-size: 1.25rem;
    }
}
</style>
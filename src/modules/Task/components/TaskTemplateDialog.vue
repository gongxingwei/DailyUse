<template>
    <v-dialog :model-value="visible" max-width="800px" class="task-template-dialog">
        <v-card class="dialog-card">
            <v-card-title class="d-flex justify-space-between">
                <v-btn variant="text" @click="handleCancel">取消</v-btn>
                <span>{{ tempTask.id === 'temp' ? '新建任务模板' : '编辑任务模板' }}</span>
                <v-btn color="primary" @click="handleSave" :disabled="!isValid">
                    保存
                </v-btn>
            </v-card-title>

            <v-card-text class="dialog-content">
                <v-form>
                    <!-- 任务标题 -->
                    <v-text-field v-model="tempTask.title" label="任务标题" :error-messages="errors.title" required />

                    <!-- 任务描述 -->
                    <v-textarea v-model="tempTask.description" label="任务描述（可选）" rows="3" />
                    <!-- 任务具体时间 -->
                    <div class="time-section">
                        <v-row>
                            <v-col cols="6">
                                <v-switch v-model="isAllDay" :label="isAllDay ? '整日' : '具体时间'"></v-switch>
                            </v-col>
                            <v-col cols="6">
                                <v-fade-transition>
                                    <v-switch v-show="!isAllDay" v-model="pointOrRange"
                                        :label="pointOrRange ? '时间点' : '时间段'" />
                                </v-fade-transition>
                            </v-col>
                        </v-row>
                        <v-expand-transition>
                            <div v-show="!isAllDay" class="time-inputs">
                                <v-row>
                                    <v-col cols="6">
                                        <v-text-field v-model="tempTask.startTime" label="开始时间" type="time"
                                            :rules="[v => !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v) || '请输入有效时间']" />
                                    </v-col>
                                    <v-col cols="6">
                                        <v-fade-transition>
                                            <v-text-field v-show="!pointOrRange" v-model="tempTask.endTime" label="结束时间"
                                                type="time" :rules="[
                                                    v => !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v) || '请输入有效时间',
                                                    v => !v || !tempTask.startTime || v > tempTask.startTime || '结束时间必须晚于开始时间'
                                                ]" />
                                        </v-fade-transition>
                                    </v-col>
                                </v-row>
                            </div>
                        </v-expand-transition>
                    </div>
                    <!-- 任务周期 -->
                    <div class="repeat-section">
                        <v-row>
                            <v-col cols="12">
                                <v-select v-model="tempTask.repeatPattern.type" label="重复" :items="[
                                    { title: '不重复', value: 'none' },
                                    { title: '每天', value: 'daily' },
                                    { title: '每周', value: 'weekly' },
                                ]" />
                            </v-col>
                        </v-row>

                        <v-expand-transition>
                            <div v-show="tempTask.repeatPattern.type !== 'none'">
                                <v-row>
                                    <v-col cols="6">
                                        <v-text-field v-model="tempTask.repeatPattern.startDate" label="开始日期"
                                            type="date" :min="today" />
                                    </v-col>
                                    <v-col cols="6">
                                        <v-text-field v-model="tempTask.repeatPattern.endDate" label="结束日期" type="date"
                                            :min="tempTask.repeatPattern.startDate" />
                                    </v-col>
                                </v-row>
                            </div>
                        </v-expand-transition>

                        <v-expand-transition>
                            <div v-if="tempTask.repeatPattern.type === 'none'">
                                <v-row>
                                    <v-col cols="6">
                                        <v-text-field v-model="tempTask.repeatPattern.endDate" label="执行日期" type="date"
                                            :min="today" />
                                    </v-col>
                                </v-row>
                            </div>
                        </v-expand-transition>

                        <!-- 周重复选择 -->
                        <v-expand-transition>
                            <div v-if="tempTask.repeatPattern.type === 'weekly'" class="mt-2">
                                <v-btn-toggle v-model="tempTask.repeatPattern.days" multiple class="d-flex flex-wrap">
                                    <v-btn v-for="(day, index) in weekDays" :key="index" :value="index"
                                        density="comfortable" class="flex-1">
                                        {{ day }}
                                    </v-btn>
                                </v-btn-toggle>
                            </div>
                        </v-expand-transition>
                    </div>
                    <!-- 提醒设置 -->
                    <div class="reminder-section">
                        <v-row>
                            <v-col cols="12">
                                <v-switch v-model="tempTask.reminderPattern.isReminder"
                                    :label="tempTask.reminderPattern.isReminder ? '开启提醒' : '关闭提醒'" />
                            </v-col>
                        </v-row>

                        <v-expand-transition>
                            <div v-show="tempTask.reminderPattern.isReminder">
                                <v-row>
                                    <v-col cols="6">
                                        <v-select v-model="tempTask.reminderPattern.timeBefore" label="提前提醒时间" :items="[
                                            { title: '提前5分钟', value: '5' },
                                            { title: '提前10分钟', value: '10' },
                                            { title: '提前15分钟', value: '15' },
                                            { title: '提前30分钟', value: '30' },
                                            { title: '提前60分钟', value: '60' }
                                        ]" item-title="title" item-value="value" />
                                    </v-col>
                                </v-row>
                            </div>
                        </v-expand-transition>
                    </div>


                    <!-- 关联关键结果 -->
                    <v-card-subtitle>关联的关键结果</v-card-subtitle>
                    <div v-for="(link, index) in tempTask.keyResultLinks" :key="index">
                        <v-row align="center" class="my-2">
                            <v-col cols="4">
                                <v-select v-model="link.goalId" :items="goals" item-title="title" item-value="id"
                                    label="选择目标" @update:model-value="handleGoalChange(index)" />
                            </v-col>
                            <v-col cols="4">
                                <v-select v-model="link.keyResultId" :items="getKeyResults(link.goalId)"
                                    item-title="name" item-value="id" label="选择关键结果" :disabled="!link.goalId" />
                            </v-col>
                            <v-col cols="3">
                                <v-text-field v-model.number="link.incrementValue" type="number" label="增加值" min="0" />
                            </v-col>
                            <v-col cols="1">
                                <v-btn icon="mdi-close" size="small" variant="text"
                                    @click="removeKeyResultLink(index)" />
                            </v-col>
                        </v-row>
                    </div>

                    <v-btn prepend-icon="mdi-plus" variant="outlined" class="mt-4" @click="addKeyResultLink">
                        添加关联的关键结果
                    </v-btn>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useGoalStore } from '@/modules/Goal/stores/goalStore';
import { useTaskStore } from '../stores/taskStore';
// utils

const props = defineProps<{
    visible: boolean;
}>();

watch(
    () => props.visible,
    (newVal) => {
        if (newVal) {
            console.log('Dialog opened');
        }
    }
);
const emit = defineEmits<{
    (e: 'save'): void;
    (e: 'cancel'): void;
}>();

const goalStore = useGoalStore();
const taskStore = useTaskStore();
// 与 store 中的 tempTaskTemplate 进行双向绑定
const tempTask = computed({
    get: () => taskStore.tempTaskTemplate,
    set: (value) => {
        taskStore.tempTaskTemplate = value;
    }
});

// 时间
const isAllDay = ref(false);
const pointOrRange = ref(false);
const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
// 监听时间选择
watch([isAllDay, pointOrRange], ([newIsAllDay, newPointOrRange]) => {
    if (newIsAllDay) {
        tempTask.value.startTime = undefined;
        tempTask.value.endTime = undefined;
    } else if (newPointOrRange) {
        tempTask.value.endTime = undefined;
    }
});
const errors = reactive({
    title: '',
});

const goals = computed(() => goalStore.getAllGoals);

const isValid = computed(() => {
    return tempTask.value.title.trim() !== '' && !errors.title;
});

// Methods
const validateForm = () => {
    errors.title = tempTask.value.title.trim() === '' ? '请输入任务标题' : '';
    return !errors.title;
};

const addKeyResultLink = () => {
    tempTask.value.keyResultLinks?.push({
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

const handleSave = () => {
    if (!validateForm()) return;
    emit('save');
};

const handleCancel = () => {
    emit('cancel');
};

const today = new Date();


</script>
<style lang="css" scoped>
.task-template-dialog {
    display: flex;
    align-items: flex-start;
    padding-top: 10vh;
}

.dialog-card {
    min-height: 500px;
    display: flex;
    flex-direction: column;
}

.dialog-content {
    flex: 1;
    max-height: 600px;
    overflow-y: auto;
    padding: 20px;
}

.time-section {
    margin: 1rem 0;
    padding: 1rem;
    background-color: rgba(var(--v-theme-surface-variant), 0.1);
    border-radius: 8px;
    min-height: 120px;
    position: relative;
}

.time-inputs {
    position: relative;
    min-height: 60px;
}

/* Transition styles */
.v-expand-transition {
    transition: all 0.3s ease-out;
}

.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
    transition: all 0.3s ease-out;
    max-height: 300px;
}

.v-expand-transition-enter-from,
.v-expand-transition-leave-to {
    max-height: 0;
    opacity: 0;
}

.v-fade-transition-enter-active,
.v-fade-transition-leave-active {
    transition: opacity 0.3s ease;
}

.v-fade-transition-enter-from,
.v-fade-transition-leave-to {
    opacity: 0;
}
</style>
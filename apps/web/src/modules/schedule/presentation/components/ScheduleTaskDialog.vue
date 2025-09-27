<template>
    <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="800"
        persistent>
        <v-card>
            <v-card-title class="text-h5 d-flex align-center">
                <v-icon class="mr-2">mdi-calendar-plus</v-icon>
                {{ isEditing ? '编辑调度任务' : '创建调度任务' }}
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text class="pa-6">
                <v-form ref="form" v-model="formValid" @submit.prevent="save">
                    <v-row>
                        <!-- 基本信息 -->
                        <v-col cols="12">
                            <h3 class="text-h6 mb-4">基本信息</h3>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model="formData.name" label="任务名称" :rules="[v => !!v || '请输入任务名称']"
                                variant="outlined" density="compact" required />
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-select v-model="formData.taskType" :items="taskTypes" label="任务类型"
                                :rules="[v => !!v || '请选择任务类型']" variant="outlined" density="compact" required />
                        </v-col>

                        <v-col cols="12">
                            <v-textarea v-model="formData.description" label="任务描述" variant="outlined" density="compact"
                                rows="3" />
                        </v-col>

                        <!-- 调度配置 -->
                        <v-col cols="12">
                            <h3 class="text-h6 mb-4 mt-4">调度配置</h3>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-select v-model="formData.recurrence.type" :items="recurrenceTypes" label="重复类型"
                                :rules="[v => !!v || '请选择重复类型']" variant="outlined" density="compact" required
                                @update:model-value="onRecurrenceTypeChange" />
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-select v-model="formData.priority" :items="priorities" label="优先级"
                                :rules="[v => !!v || '请选择优先级']" variant="outlined" density="compact" required />
                        </v-col>

                        <!-- Cron 表达式 (当选择自定义时显示) -->
                        <v-col v-if="formData.recurrence.type === 'CUSTOM'" cols="12">
                            <v-text-field v-model="formData.recurrence.cronExpression" label="Cron 表达式"
                                :rules="[v => !!v || '请输入 Cron 表达式']" variant="outlined" density="compact"
                                hint="例如: * * * * * (每分钟), 0 9 * * 1-5 (工作日上午9点)" persistent-hint required />
                        </v-col>

                        <!-- 间隔设置 (当选择间隔时显示) -->
                        <v-col v-if="formData.recurrence.type === 'INTERVAL'" cols="12" md="6">
                            <v-text-field v-model.number="formData.recurrence.interval" label="间隔时间"
                                :rules="[v => v > 0 || '间隔时间必须大于0']" variant="outlined" density="compact" type="number"
                                min="1" required />
                        </v-col>

                        <v-col v-if="formData.recurrence.type === 'INTERVAL'" cols="12" md="6">
                            <v-select v-model="intervalUnit" :items="intervalUnits" label="时间单位" variant="outlined"
                                density="compact" required />
                        </v-col>

                        <!-- 开始时间 -->
                        <v-col cols="12" md="6">
                            <v-text-field v-model="scheduledDate" label="开始日期" type="date" variant="outlined"
                                density="compact" required />
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model="scheduledTime" label="开始时间" type="time" variant="outlined"
                                density="compact" required />
                        </v-col>

                        <!-- 提醒设置 -->
                        <v-col cols="12">
                            <h3 class="text-h6 mb-4 mt-4">提醒设置</h3>
                        </v-col>

                        <v-col cols="12">
                            <v-checkbox v-model="alertMethods" value="POPUP" label="弹窗提醒" density="compact" />
                            <v-checkbox v-model="alertMethods" value="SOUND" label="声音提醒" density="compact" />
                            <v-checkbox v-model="alertMethods" value="SYSTEM_NOTIFICATION" label="系统通知"
                                density="compact" />
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-slider v-model="formData.alertConfig.soundVolume" label="声音音量" min="0" max="100"
                                step="10" thumb-label :disabled="!alertMethods.includes('SOUND')" />
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-slider v-model="formData.alertConfig.popupDuration" label="弹窗持续时间(秒)" min="5" max="60"
                                step="5" thumb-label :disabled="!alertMethods.includes('POPUP')" />
                        </v-col>

                        <!-- 延后设置 -->
                        <v-col cols="12">
                            <v-checkbox v-model="formData.alertConfig.allowSnooze" label="允许延后提醒" density="compact" />
                        </v-col>

                        <!-- 启用状态 -->
                        <v-col cols="12">
                            <v-checkbox v-model="formData.enabled" label="立即启用任务" density="compact" />
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="px-6 py-4">
                <v-spacer></v-spacer>
                <v-btn @click="$emit('update:modelValue', false)" :disabled="saving">
                    取消
                </v-btn>
                <v-btn color="primary" @click="save" :loading="saving" :disabled="!formValid">
                    {{ isEditing ? '更新' : '创建' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useSnackbar } from '@/shared/composables/useSnackbar';

// Props & Emits
const props = defineProps({
    modelValue: Boolean,
    task: Object,
});

const emit = defineEmits(['update:modelValue', 'saved']);

// 响应式数据
const form = ref<any>(null);
const formValid = ref(false);
const saving = ref(false);
const scheduledDate = ref('');
const scheduledTime = ref('');
const alertMethods = ref<string[]>([]);
const intervalUnit = ref('minutes');

// 表单数据
const formData = ref({
    name: '',
    description: '',
    taskType: 'GENERAL_REMINDER',
    priority: 'MEDIUM',
    enabled: true,
    recurrence: {
        type: 'ONCE',
        interval: 1,
        cronExpression: '',
    },
    alertConfig: {
        methods: [] as string[],
        soundVolume: 80,
        popupDuration: 10,
        allowSnooze: true,
        snoozeOptions: [1, 5, 10],
    },
    payload: {},
});

// 选项数据
const taskTypes = [
    { title: '通用提醒', value: 'GENERAL_REMINDER' },
    { title: '任务提醒', value: 'TASK_REMINDER' },
    { title: '目标提醒', value: 'GOAL_REMINDER' },
];

const recurrenceTypes = [
    { title: '仅一次', value: 'ONCE' },
    { title: '每日', value: 'DAILY' },
    { title: '每周', value: 'WEEKLY' },
    { title: '每月', value: 'MONTHLY' },
    { title: '间隔执行', value: 'INTERVAL' },
    { title: '自定义 (Cron)', value: 'CUSTOM' },
];

const priorities = [
    { title: '高', value: 'HIGH' },
    { title: '中', value: 'MEDIUM' },
    { title: '低', value: 'LOW' },
];

const intervalUnits = [
    { title: '分钟', value: 'minutes' },
    { title: '小时', value: 'hours' },
    { title: '天', value: 'days' },
];

// 计算属性
const isEditing = computed(() => !!props.task);

const { showSuccess, showError } = useSnackbar();

// 监听器
watch(() => props.task, (newTask) => {
    if (newTask) {
        loadTaskData(newTask);
    } else {
        resetForm();
    }
});

watch(() => props.modelValue, (visible) => {
    if (visible && !props.task) {
        resetForm();
    }
});

watch(alertMethods, (methods) => {
    formData.value.alertConfig.methods = methods;
});

// 方法
function resetForm() {
    formData.value = {
        name: '',
        description: '',
        taskType: 'GENERAL_REMINDER',
        priority: 'MEDIUM',
        enabled: true,
        recurrence: {
            type: 'ONCE',
            interval: 1,
            cronExpression: '',
        },
        alertConfig: {
            methods: ['POPUP'],
            soundVolume: 80,
            popupDuration: 10,
            allowSnooze: true,
            snoozeOptions: [1, 5, 10],
        },
        payload: {
            type: 'GENERAL_REMINDER',
            data: {
                message: '',
                priority: 'medium',
            },
        },
    };

    alertMethods.value = ['POPUP'];
    scheduledDate.value = new Date().toISOString().substr(0, 10);
    scheduledTime.value = new Date().toTimeString().substr(0, 5);
    intervalUnit.value = 'minutes';

    if (form.value) {
        form.value.resetValidation();
    }
}

function loadTaskData(task: any) {
    formData.value = {
        name: task.name || '',
        description: task.description || '',
        taskType: task.taskType || 'GENERAL_REMINDER',
        priority: task.priority || 'MEDIUM',
        enabled: task.enabled,
        recurrence: {
            type: task.recurrence?.type || 'ONCE',
            interval: task.recurrence?.interval || 1,
            cronExpression: task.recurrence?.cronExpression || '',
        },
        alertConfig: {
            methods: task.alertConfig?.methods || ['POPUP'],
            soundVolume: task.alertConfig?.soundVolume || 80,
            popupDuration: task.alertConfig?.popupDuration || 10,
            allowSnooze: task.alertConfig?.allowSnooze !== false,
            snoozeOptions: task.alertConfig?.snoozeOptions || [1, 5, 10],
        },
        payload: task.payload || {
            type: 'GENERAL_REMINDER',
            data: {
                message: '',
                priority: 'medium',
            },
        },
    };

    alertMethods.value = task.alertConfig?.methods || ['POPUP'];

    if (task.scheduledTime) {
        const date = new Date(task.scheduledTime);
        scheduledDate.value = date.toISOString().substr(0, 10);
        scheduledTime.value = date.toTimeString().substr(0, 5);
    }
}

function onRecurrenceTypeChange(type: string) {
    // 根据类型设置默认的 cron 表达式
    switch (type) {
        case 'DAILY':
            formData.value.recurrence.cronExpression = '0 9 * * *'; // 每天上午9点
            break;
        case 'WEEKLY':
            formData.value.recurrence.cronExpression = '0 9 * * 1'; // 每周一上午9点
            break;
        case 'MONTHLY':
            formData.value.recurrence.cronExpression = '0 9 1 * *'; // 每月1号上午9点
            break;
        case 'ONCE':
            formData.value.recurrence.cronExpression = '';
            break;
        default:
            break;
    }
}

function buildScheduledTime() {
    const date = new Date(`${scheduledDate.value}T${scheduledTime.value}`);
    return date.toISOString();
}

function buildCronExpression() {
    if (formData.value.recurrence.type === 'CUSTOM') {
        return formData.value.recurrence.cronExpression;
    }

    if (formData.value.recurrence.type === 'INTERVAL') {
        const interval = formData.value.recurrence.interval;
        switch (intervalUnit.value) {
            case 'minutes':
                return `*/${interval} * * * *`;
            case 'hours':
                return `0 */${interval} * * *`;
            case 'days':
                return `0 9 */${interval} * *`;
            default:
                return `*/${interval} * * * *`;
        }
    }

    return formData.value.recurrence.cronExpression;
}

async function save() {
    if (!form.value?.validate()) {
        return;
    }

    saving.value = true;
    try {
        const requestData = {
            ...formData.value,
            scheduledTime: buildScheduledTime(),
            recurrence: {
                ...formData.value.recurrence,
                cronExpression: buildCronExpression(),
            },
            payload: {
                type: formData.value.taskType,
                data: {
                    message: formData.value.description || formData.value.name,
                    priority: formData.value.priority.toLowerCase(),
                },
            },
        };

        const url = isEditing.value
            ? `/api/v1/schedules/${props.task?.uuid}`
            : '/api/v1/schedules';

        const method = isEditing.value ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `${isEditing.value ? '更新' : '创建'}任务失败`);
        }

        showSuccess(`任务${isEditing.value ? '更新' : '创建'}成功`);
        emit('saved');
    } catch (error) {
        console.error('保存任务失败:', error);
        showError((error as Error).message || '保存失败');
    } finally {
        saving.value = false;
    }
}
</script>

<style scoped>
.v-card {
    border-radius: 12px;
}

.v-form {
    width: 100%;
}
</style>
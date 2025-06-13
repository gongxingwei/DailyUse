<template>
    <v-form ref="formRef" v-model="isValid" class="task-template-form">
        <!-- 基础信息 -->
        <v-card class="mb-4" elevation="0" variant="outlined">
            <v-card-title class="section-title">
                <v-icon class="mr-2">mdi-information-outline</v-icon>
                基础信息
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12">
                        <v-text-field v-model="localTemplate.title" label="任务标题" placeholder="请输入任务标题"
                            :rules="titleRules" variant="outlined" required counter="100" />
                    </v-col>
                    <v-col cols="12">
                        <v-textarea v-model="localTemplate.description" label="任务描述" placeholder="请输入任务描述（可选）"
                            :rules="descriptionRules" variant="outlined" rows="3" counter="1000" no-resize />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-select v-model="localTemplate.priority" label="优先级" :items="priorityOptions"
                            variant="outlined" required />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="localTemplate.metadata.category" label="分类" placeholder="请输入分类"
                            variant="outlined" required />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- 时间配置 -->
        <v-card class="mb-4" elevation="0" variant="outlined">
            <v-card-title class="section-title">
                <v-icon class="mr-2">mdi-clock-outline</v-icon>
                时间配置
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12">
                        <v-radio-group v-model="localTemplate.timeConfig.type" label="任务类型" inline>
                            <v-radio label="全天任务" value="allDay" />
                            <v-radio label="指定时间" value="timed" />
                            <v-radio label="时间段" value="timeRange" />
                        </v-radio-group>
                    </v-col>

                    <!-- 开始时间 -->
                    <v-col cols="12" md="6">
                        <v-text-field v-model="startDateInput" label="开始日期" type="date" variant="outlined" required
                            @update:model-value="updateStartDate" />
                    </v-col>
                    <v-col cols="12" md="6" v-if="localTemplate.timeConfig.type !== 'allDay'">
                        <v-text-field v-model="startTimeInput" label="开始时间" type="time" variant="outlined" required
                            @update:model-value="updateStartTime" />
                    </v-col>

                    <!-- 结束时间（仅时间段类型） -->
                    <v-col cols="12" md="6" v-if="localTemplate.timeConfig.type === 'timeRange'">
                        <v-text-field v-model="endDateInput" label="结束日期" type="date" variant="outlined"
                            @update:model-value="updateEndDate" />
                    </v-col>
                    <v-col cols="12" md="6" v-if="localTemplate.timeConfig.type === 'timeRange'">
                        <v-text-field v-model="endTimeInput" label="结束时间" type="time" variant="outlined"
                            @update:model-value="updateEndTime" />
                    </v-col>

                    <!-- 预估时长 -->
                    <v-col cols="12" md="6">
                        <v-text-field v-model.number="localTemplate.metadata.estimatedDuration" label="预估时长（分钟）"
                            type="number" variant="outlined" min="1" max="1440" />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- 重复规则 -->
        <v-card class="mb-4" elevation="0" variant="outlined">
            <v-card-title class="section-title">
                <v-icon class="mr-2">mdi-repeat</v-icon>
                重复规则
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-select v-model="localTemplate.timeConfig.recurrence.type" label="重复类型"
                            :items="recurrenceTypes" variant="outlined"
                            @update:model-value="handleRecurrenceTypeChange" />
                    </v-col>
                    <v-col cols="12" md="6" v-if="localTemplate.timeConfig.recurrence.type !== 'none'">
                        <v-text-field v-model.number="localTemplate.timeConfig.recurrence.interval" label="重复间隔"
                            type="number" variant="outlined" min="1" max="365" />
                    </v-col>

                    <!-- 周重复选项 -->
                    <v-col cols="12" v-if="localTemplate.timeConfig.recurrence.type === 'weekly'">
                        <v-chip-group v-model="selectedWeekdays" multiple @update:model-value="updateWeekdays">
                            <v-chip v-for="(day, index) in weekdayOptions" :key="index" :value="index" filter
                                variant="outlined">
                                {{ day }}
                            </v-chip>
                        </v-chip-group>
                    </v-col>

                    <!-- 结束条件 -->
                    <v-col cols="12" v-if="localTemplate.timeConfig.recurrence.type !== 'none'">
                        <v-radio-group v-model="localTemplate.timeConfig.recurrence.endCondition.type" label="结束条件"
                            @update:model-value="handleEndConditionChange">
                            <v-radio label="永不结束" value="never" />
                            <v-radio label="指定日期结束" value="date" />
                            <v-radio label="指定次数结束" value="count" />
                        </v-radio-group>
                    </v-col>

                    <v-col cols="12" md="6" v-if="localTemplate.timeConfig.recurrence.endCondition.type === 'date'">
                        <v-text-field v-model="endConditionDateInput" label="结束日期" type="date" variant="outlined"
                            @update:model-value="updateEndConditionDate" />
                    </v-col>
                    <v-col cols="12" md="6" v-if="localTemplate.timeConfig.recurrence.endCondition.type === 'count'">
                        <v-text-field v-model.number="localTemplate.timeConfig.recurrence.endCondition.count"
                            label="重复次数" type="number" variant="outlined" min="1" max="999" />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- 提醒设置 -->
        <v-card class="mb-4" elevation="0" variant="outlined">
            <v-card-title class="section-title">
                <v-icon class="mr-2">mdi-bell-outline</v-icon>
                提醒设置
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12">
                        <v-switch v-model="localTemplate.timeConfig.reminder.enabled" label="启用提醒" color="primary" />
                    </v-col>

                    <template v-if="localTemplate.timeConfig.reminder.enabled">
                        <!-- 提醒列表 -->
                        <v-col cols="12">
                            <div class="d-flex justify-space-between align-center mb-3">
                                <h4>提醒时间</h4>
                                <v-btn size="small" color="primary" variant="outlined" @click="addReminder">
                                    <v-icon start>mdi-plus</v-icon>
                                    添加提醒
                                </v-btn>
                            </div>

                            <v-card v-for="(alert, index) in localTemplate.timeConfig.reminder.alerts" :key="alert.id"
                                class="mb-2" variant="outlined">
                                <v-card-text class="py-2">
                                    <v-row align="center">
                                        <v-col cols="12" md="3">
                                            <v-select v-model="alert.type" label="通知方式" :items="reminderTypes"
                                                variant="outlined" density="compact" item-title="title"
                                                item-value="value" :item-props="getReminderItemProps">
                                                <!-- 自定义选项显示 -->
                                                <template #item="{ props, item }">
                                                    <v-list-item v-bind="props" :disabled="item.raw.disabled"
                                                        :class="{ 'text-grey-400': item.raw.disabled }">
                                                        <template #title>
                                                            <div class="d-flex align-center">
                                                                <span>{{ item.raw.title }}</span>
                                                                <v-chip v-if="item.raw.disabled" size="x-small"
                                                                    color="warning" variant="outlined" class="ml-2">
                                                                    未实现
                                                                </v-chip>
                                                            </div>
                                                        </template>
                                                    </v-list-item>
                                                </template>
                                            </v-select>
                                        </v-col>
                                        <v-col cols="12" md="3">
                                            <v-select v-model="alert.timing.type" label="提醒时机"
                                                :items="reminderTimingTypes" variant="outlined" density="compact"
                                                item-title="title" item-value="value" />
                                        </v-col>
                                        <v-col cols="12" md="3" v-if="alert.timing.type === 'relative'">
                                            <v-text-field v-model.number="alert.timing.minutesBefore" label="提前分钟"
                                                type="number" variant="outlined" density="compact" min="1" max="10080"
                                                :rules="minutesBeforeRules" />
                                        </v-col>
                                        <v-col cols="12" md="3" v-else-if="alert.timing.type === 'absolute'">
                                            <v-text-field v-model="alert.timing.absoluteTime" label="绝对时间" type="time"
                                                variant="outlined" density="compact" />
                                        </v-col>
                                        <v-col cols="12" md="2">
                                            <v-btn icon variant="text" color="error" size="small"
                                                @click="removeReminder(index)">
                                                <v-icon>mdi-delete</v-icon>
                                            </v-btn>
                                        </v-col>
                                        <v-col cols="12" v-if="alert.message !== undefined">
                                            <v-text-field v-model="alert.message" label="自定义消息" variant="outlined"
                                                density="compact" placeholder="留空使用默认消息" />
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </v-card>
                        </v-col>

                        <!-- 稍后提醒设置 -->
                        <v-col cols="12">
                            <v-switch v-model="localTemplate.timeConfig.reminder.snooze.enabled" label="允许稍后提醒"
                                color="primary" />
                        </v-col>
                        <v-col cols="12" md="6" v-if="localTemplate.timeConfig.reminder.snooze.enabled">
                            <v-text-field v-model.number="localTemplate.timeConfig.reminder.snooze.interval"
                                label="稍后提醒间隔（分钟）" type="number" variant="outlined" min="1" max="60" />
                        </v-col>
                        <v-col cols="12" md="6" v-if="localTemplate.timeConfig.reminder.snooze.enabled">
                            <v-text-field v-model.number="localTemplate.timeConfig.reminder.snooze.maxCount"
                                label="最大重复次数" type="number" variant="outlined" min="1" max="10" />
                        </v-col>
                    </template>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- 调度策略 -->
        <v-card class="mb-4" elevation="0" variant="outlined">
            <v-card-title class="section-title">
                <v-icon class="mr-2">mdi-calendar-clock</v-icon>
                调度策略
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-switch v-model="localTemplate.schedulingPolicy.allowReschedule" label="允许重新调度"
                            color="primary" />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-switch v-model="localTemplate.schedulingPolicy.skipWeekends" label="跳过周末" color="primary" />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-switch v-model="localTemplate.schedulingPolicy.skipHolidays" label="跳过节假日" color="primary" />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-switch v-model="localTemplate.schedulingPolicy.workingHoursOnly" label="仅工作时间"
                            color="primary" />
                    </v-col>
                    <v-col cols="12" md="6" v-if="localTemplate.schedulingPolicy.allowReschedule">
                        <v-text-field v-model.number="localTemplate.schedulingPolicy.maxDelayDays" label="最大延迟天数"
                            type="number" variant="outlined" min="1" max="30" />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- 标签和其他设置 -->
        <v-card elevation="0" variant="outlined">
            <v-card-title class="section-title">
                <v-icon class="mr-2">mdi-tag-outline</v-icon>
                其他设置
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-combobox v-model="localTemplate.metadata.tags" label="标签" placeholder="输入标签后按回车"
                            variant="outlined" multiple chips clearable />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-select v-model="localTemplate.metadata.difficulty" label="难度等级" :items="difficultyOptions"
                            variant="outlined" />
                    </v-col>
                    <v-col cols="12">
                        <v-text-field v-model="localTemplate.metadata.location" label="地点" placeholder="任务执行地点（可选）"
                            variant="outlined" />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { TimeUtils } from '../utils/timeUtils';
import type { TaskTemplate } from '../types/task';

interface Props {
    modelValue: TaskTemplate;
    isEditMode?: boolean;
}

interface Emits {
    (e: 'update:modelValue', value: TaskTemplate): void;
}

const props = withDefaults(defineProps<Props>(), {
    isEditMode: false
});

const emit = defineEmits<Emits>();

const formRef = ref();
const isValid = ref(false);

// 创建本地副本
const localTemplate = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

// 表单输入字段
const startDateInput = ref('');
const startTimeInput = ref('');
const endDateInput = ref('');
const endTimeInput = ref('');
const endConditionDateInput = ref('');
const selectedWeekdays = ref<number[]>([]);



// 表单选项
const priorityOptions = [
    { title: '低优先级', value: 4 },
    { title: '普通', value: 3 },
    { title: '重要', value: 2 },
    { title: '紧急', value: 1 }
];

const recurrenceTypes = [
    { title: '不重复', value: 'none' },
    { title: '每日', value: 'daily' },
    { title: '每周', value: 'weekly' },
    { title: '每月', value: 'monthly' },
    { title: '每年', value: 'yearly' }
];

const weekdayOptions = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const reminderTimingTypes = [
    { title: '相对时间', value: 'relative' },
    { title: '绝对时间', value: 'absolute' }
];

const reminderTypes = [
    { title: '通知', value: 'notification', disabled: false },
    { title: '邮件', value: 'email', disabled: true },
    { title: '声音', value: 'sound', disabled: true },
    { title: '短信', value: 'sms', disabled: true }
];
const getReminderItemProps = (item: any) => {
    return {
        disabled: item.disabled,
        title: item.disabled ? `${item.title} (暂未实现)` : item.title
    };
};

const difficultyOptions = [
    { title: '非常简单', value: 1 },
    { title: '简单', value: 2 },
    { title: '普通', value: 3 },
    { title: '困难', value: 4 },
    { title: '非常困难', value: 5 }
];

// 验证规则
const titleRules = [
    (v: string) => !!v || '任务标题是必填的',
    (v: string) => (v && v.length <= 100) || '任务标题不能超过100个字符'
];

const descriptionRules = [
    (v: string) => !v || v.length <= 1000 || '任务描述不能超过1000个字符'
];

const minutesBeforeRules = [
    (v: number) => !!v || '提前分钟数是必填的',
    (v: number) => v > 0 || '提前分钟数必须大于0',
    (v: number) => v <= 10080 || '提前分钟数不能超过7天(10080分钟)'
];


// 初始化表单数据
const initializeFormData = () => {
    if (localTemplate.value?.timeConfig?.baseTime?.start) {
        const startTime = localTemplate.value.timeConfig.baseTime.start;
        startDateInput.value = TimeUtils.formatDateToInput(startTime);
        startTimeInput.value = TimeUtils.formatTimeToInput(startTime);
    }

    if (localTemplate.value?.timeConfig?.baseTime?.end) {
        const endTime = localTemplate.value.timeConfig.baseTime.end;
        endDateInput.value = TimeUtils.formatDateToInput(endTime);
        endTimeInput.value = TimeUtils.formatTimeToInput(endTime);
    }

    if (localTemplate.value?.timeConfig?.recurrence?.endCondition?.endDate) {
        endConditionDateInput.value = TimeUtils.formatDateToInput(localTemplate.value.timeConfig.recurrence.endCondition.endDate);
    }

    if (localTemplate.value?.timeConfig?.recurrence?.config?.weekdays) {
        selectedWeekdays.value = [...localTemplate.value.timeConfig.recurrence.config.weekdays];
    }
};

// 更新时间函数
const updateStartDate = (dateStr: string) => {
    if (!dateStr) return;
    const [year, month, day] = dateStr.split('-').map(Number);
    localTemplate.value.timeConfig.baseTime.start = {
        ...localTemplate.value.timeConfig.baseTime.start,
        date: { year, month, day },
        timestamp: new Date(year, month - 1, day,
            localTemplate.value.timeConfig.baseTime.start.time?.hour || 0,
            localTemplate.value.timeConfig.baseTime.start.time?.minute || 0
        ).getTime(),
        isoString: new Date(year, month - 1, day,
            localTemplate.value.timeConfig.baseTime.start.time?.hour || 0,
            localTemplate.value.timeConfig.baseTime.start.time?.minute || 0
        ).toISOString()
    };
};

const updateStartTime = (timeStr: string) => {
    if (!timeStr) return;
    const [hour, minute] = timeStr.split(':').map(Number);
    localTemplate.value.timeConfig.baseTime.start = {
        ...localTemplate.value.timeConfig.baseTime.start,
        time: { hour, minute },
        timestamp: new Date(
            localTemplate.value.timeConfig.baseTime.start.date.year,
            localTemplate.value.timeConfig.baseTime.start.date.month - 1,
            localTemplate.value.timeConfig.baseTime.start.date.day,
            hour, minute
        ).getTime(),
        isoString: new Date(
            localTemplate.value.timeConfig.baseTime.start.date.year,
            localTemplate.value.timeConfig.baseTime.start.date.month - 1,
            localTemplate.value.timeConfig.baseTime.start.date.day,
            hour, minute
        ).toISOString()
    };
};

const updateEndDate = (dateStr: string) => {
    if (!dateStr || !localTemplate.value.timeConfig.baseTime.end) return;
    const [year, month, day] = dateStr.split('-').map(Number);
    localTemplate.value.timeConfig.baseTime.end = {
        ...localTemplate.value.timeConfig.baseTime.end,
        date: { year, month, day },
        timestamp: new Date(year, month - 1, day,
            localTemplate.value.timeConfig.baseTime.end.time?.hour || 0,
            localTemplate.value.timeConfig.baseTime.end.time?.minute || 0
        ).getTime(),
        isoString: new Date(year, month - 1, day,
            localTemplate.value.timeConfig.baseTime.end.time?.hour || 0,
            localTemplate.value.timeConfig.baseTime.end.time?.minute || 0
        ).toISOString()
    };
};

const updateEndTime = (timeStr: string) => {
    if (!timeStr || !localTemplate.value.timeConfig.baseTime.end) return;
    const [hour, minute] = timeStr.split(':').map(Number);
    localTemplate.value.timeConfig.baseTime.end = {
        ...localTemplate.value.timeConfig.baseTime.end,
        time: { hour, minute },
        timestamp: new Date(
            localTemplate.value.timeConfig.baseTime.end.date.year,
            localTemplate.value.timeConfig.baseTime.end.date.month - 1,
            localTemplate.value.timeConfig.baseTime.end.date.day,
            hour, minute
        ).getTime(),
        isoString: new Date(
            localTemplate.value.timeConfig.baseTime.end.date.year,
            localTemplate.value.timeConfig.baseTime.end.date.month - 1,
            localTemplate.value.timeConfig.baseTime.end.date.day,
            hour, minute
        ).toISOString()
    };
};

const updateEndConditionDate = (dateStr: string) => {
    if (!dateStr) return;
    const [year, month, day] = dateStr.split('-').map(Number);
    localTemplate.value.timeConfig.recurrence.endCondition.endDate = {
        date: { year, month, day },
        timestamp: new Date(year, month - 1, day).getTime(),
        isoString: new Date(year, month - 1, day).toISOString()
    };
};

// 重复规则处理
const handleRecurrenceTypeChange = (type: string) => {
    if (type === 'none') {
        localTemplate.value.timeConfig.recurrence.endCondition = {
            type: 'never'
        };
    }
};

const handleEndConditionChange = (type: string | null) => {
    if (!type) {
        console.warn('endCondition type is null, setting default to "never"');
        localTemplate.value.timeConfig.recurrence.endCondition = {
            type: 'never'
        };
        return;
    }
    localTemplate.value.timeConfig.recurrence.endCondition = {
        type: type as any,
        ...(type === 'count' && { count: 1 })
    };
};

const updateWeekdays = (weekdays: number[]) => {
    if (!localTemplate.value.timeConfig.recurrence.config) {
        localTemplate.value.timeConfig.recurrence.config = {};
    }
    localTemplate.value.timeConfig.recurrence.config.weekdays = [...weekdays];
};

// 提醒管理
const addReminder = () => {
    const newAlert = {
        id: uuidv4(),
        timing: {
            type: 'relative' as const,
            minutesBefore: 15,
            // 如果是绝对时间，添加默认值
            absoluteTime: undefined
        },
        type: 'notification' as const,
        message: ''
    };
    localTemplate.value.timeConfig.reminder.alerts.push(newAlert);
};

const removeReminder = (index: number) => {
    if (localTemplate.value.timeConfig.reminder.alerts.length > index) {
        localTemplate.value.timeConfig.reminder.alerts.splice(index, 1);
    }
};

// 添加提醒数据验证函数
const validateReminderData = () => {
    if (!localTemplate.value.timeConfig.reminder.enabled) {
        return true;
    }

    for (const alert of localTemplate.value.timeConfig.reminder.alerts) {
        // 验证提醒类型
        if (!alert.type) {
            console.error('提醒类型不能为空');
            return false;
        }

        // 验证时间配置
        if (!alert.timing || !alert.timing.type) {
            console.error('提醒时机类型不能为空');
            return false;
        }

        if (alert.timing.type === 'relative') {
            if (!alert.timing.minutesBefore || alert.timing.minutesBefore <= 0) {
                console.error('相对时间提醒必须设置有效的提前分钟数');
                return false;
            }
        } else if (alert.timing.type === 'absolute') {
            if (!alert.timing.absoluteTime) {
                console.error('绝对时间提醒必须设置具体时间');
                return false;
            }
        }
    }

    return true;
};

const watchReminderTimingType = () => {
    watch(() => localTemplate.value.timeConfig.reminder.alerts, (alerts) => {
        alerts.forEach(alert => {
            if (alert.timing.type === 'relative') {
                // 清理绝对时间数据
                alert.timing.absoluteTime = undefined;
                // 确保有默认的提前分钟数
                if (!alert.timing.minutesBefore) {
                    alert.timing.minutesBefore = 15;
                }
            } else if (alert.timing.type === 'absolute') {
                // 清理相对时间数据
                alert.timing.minutesBefore = undefined;
                // 确保有默认的绝对时间
                if (!alert.timing.absoluteTime) {
                    alert.timing.absoluteTime = TimeUtils.now();
                }
            }
        });
    }, { deep: true });
};

watchReminderTimingType();

// 监听模板变化，初始化表单数据
watch(() => props.modelValue, () => {
    initializeFormData();
}, { immediate: true });

// 暴露验证方法
defineExpose({
    validate: async () => {
        const formValid = await formRef.value?.validate();
        const reminderValid = validateReminderData();
        return formValid && reminderValid;
    },
    isValid: computed(() => isValid.value && validateReminderData())
});
</script>

<style scoped>
.task-template-form {
    max-width: 100%;
}

.section-title {
    color: rgb(var(--v-theme-primary));
    font-weight: 600;
    padding: 1rem 1.5rem 0.5rem;
}

.v-card {
    border-radius: 12px;
}

.v-card-text {
    padding: 1rem 1.5rem;
}

.v-chip-group {
    gap: 0.5rem;
}

.reminder-item {
    border: 1px solid rgba(var(--v-theme-outline), 0.12);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.5rem;
}

/* 禁用选项的样式 */
:deep(.v-list-item--disabled) {
    opacity: 0.6;
}

:deep(.v-list-item--disabled .v-list-item__content) {
    color: rgba(var(--v-theme-on-surface), 0.38) !important;
}

/* 未实现标签的样式 */
.v-chip.v-chip--size-x-small {
    height: 18px;
    font-size: 10px;
}
</style>
<template>
    <div class="card">
        <div class="card-header">
            <div class="card-title h5">{{ reminder.title }}</div>
            <div class="card-function-area">
                <button class="function-icon" @click="showInfoDialog = true"><v-icon>mdi-information</v-icon></button>
                <button class="function-icon" @click="editDialog"><v-icon>mdi-pencil</v-icon></button>
                <button class="function-icon" @click="showConfirmDialog = true"><v-icon>mdi-delete</v-icon></button>
            </div>
        </div>
        <div class="card-body">
            <div class="reminder-content">{{ reminder.body }}</div>
            <div class="reminder-meta">
                <span class="reminder-time">
                    提醒时间: {{ formatTimeConfig(reminder.timeConfig) }}
                </span>
                <div class="reminder-toggle">
                    <span class="toggle-label">是否启用提醒</span>
                    <input type="checkbox" :checked="reminder.enabled" class="toggle-input" @change="toggleEnabled" />
                </div>
            </div>
        </div>
    </div>
    <!-- Info Dialog -->
    <v-dialog v-model="showInfoDialog" max-width="500">
        <v-card>
            <v-card-title class="text-h5">提醒详情</v-card-title>
            <v-card-text>
                <div class="info-content">
                    <div class="info-item">
                        <div class="info-label">标题</div>
                        <div class="info-value">{{ reminder.title }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">内容</div>
                        <div class="info-value">{{ reminder.body }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">提醒时间</div>
                        <div class="info-value">{{ formatTimeConfig(reminder.timeConfig) }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">优先级</div>
                        <div class="info-value">
                            <v-chip
                                :color="urgencyColor"
                                size="small"
                            >
                                {{ urgencyText }}
                            </v-chip>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">状态</div>
                        <div class="info-value">
                            <v-chip :color="reminder.enabled ? 'success' : 'warning'" size="small">
                                {{ reminder.enabled ? '已启用' : '已禁用' }}
                            </v-chip>
                        </div>
                    </div>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="text" @click="showInfoDialog = false">
                    关闭
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Edit Dialog -->
    <v-dialog v-model="showEditDialog" max-width="500">
        <v-card>
            <v-card-title class="text-h5">编辑提醒</v-card-title>
            <v-card-text>
                <v-form ref="form" @submit.prevent="handleSave">
                    <v-text-field v-model="editForm.title" label="标题" required></v-text-field>
                    <v-textarea v-model="editForm.body" label="内容" rows="3"></v-textarea>
                    <v-select v-model="editForm.urgency" :items="urgencyOptions" label="优先级" required></v-select>
                    <!-- Time Configuration -->
                    <v-select
                        v-model="editForm.timeConfig.mode"
                        :items="timeModeOptions"
                        label="提醒方式"
                        required
                        @change="handleTimeModeChange"
                    ></v-select>

                    <template v-if="editForm.timeConfig.mode === 'once'">
                        <v-text-field
                            v-model="editForm.timeConfig.timestamp"
                            type="datetime-local"
                            label="提醒时间"
                            required
                        ></v-text-field>
                    </template>

                    <template v-else-if="editForm.timeConfig.mode === 'daily'">
                        <v-text-field
                            v-model="editForm.timeConfig.dailyTime"
                            type="time"
                            label="每日提醒时间"
                            required
                        ></v-text-field>
                    </template>

                    <template v-else-if="editForm.timeConfig.mode === 'interval'">
                        <div class="d-flex align-center gap-2">
                            <v-text-field
                                v-model.number="editForm.timeConfig.interval.value"
                                type="number"
                                label="间隔值"
                                :min="1"
                                :max="editForm.timeConfig.interval.unit === 'minutes' ? 59 : 23"
                                required
                            ></v-text-field>
                            <v-select
                                v-model="editForm.timeConfig.interval.unit"
                                :items="intervalUnitOptions"
                                label="间隔单位"
                                style="width: 120px"
                            ></v-select>
                        </div>
                    </template>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="error" variant="text" @click="showEditDialog = false">
                    取消
                </v-btn>
                <v-btn color="primary" variant="text" @click="handleSave">
                    保存
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <ConfirmDialog
        v-model="showConfirmDialog"
        title="删除提醒"
        message="确定要删除这个提醒吗？"
        cancelText="取消"
        confirmText="确定"
        @cancel="showConfirmDialog = false"
        @confirm="deleteReminder"
    />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useReminderStore } from '../reminderStore';
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue';
import type { Reminder } from '../reminderStore';
import type { UrgencyLevel, TimeMode, TimeConfig, ScheduleUnit } from '@/shared/types/time';

interface Props {
    reminder: Reminder;
}

const props = defineProps<Props>();
const emit = defineEmits(['edit', 'info', 'delete']);
const reminderStore = useReminderStore();

const showInfoDialog = ref(false);
const showEditDialog = ref(false);
const showConfirmDialog = ref(false);
const editForm = ref({
    title: '',
    body: '',
    timeConfig: {
        mode: 'once' as TimeMode,
        timestamp: '',
        dailyTime: '',
        interval: {
            value: 30,
            unit: 'minutes' as ScheduleUnit
        }
    },
    urgency: 'normal' as UrgencyLevel
});
const urgencyOptions = [
    { title: '普通', value: 'normal' as UrgencyLevel },
    { title: '重要', value: 'critical' as UrgencyLevel },
    { title: '紧急', value: 'low' as UrgencyLevel }
];
const urgencyColor = computed(() => {
    switch (props.reminder.urgency) {
        case 'critical':
            return 'error';
        case 'low':
            return 'success';
        default:
            return 'info';
    }
});

const urgencyText = computed(() => {
    switch (props.reminder.urgency) {
        case 'critical':
            return '重要';
        case 'low':
            return '紧急';
        default:
            return '普通';
    }
});

const timeModeOptions = [
    { title: '单次提醒', value: 'once' },
    { title: '每日提醒', value: 'daily' },
    { title: '间隔提醒', value: 'interval' }
];

const intervalUnitOptions = [
    { title: '分钟', value: 'minutes' },
    { title: '小时', value: 'hours' }
];

const editDialog = () => {
    InitializeEditReminderDialog();
    showEditDialog.value = true;
};

const handleTimeModeChange = () => {
    switch (editForm.value.timeConfig.mode) {
        case 'once':
            editForm.value.timeConfig.dailyTime = '';
            editForm.value.timeConfig.interval = { value: 30, unit: 'minutes' };
            break;
        case 'daily':
            editForm.value.timeConfig.timestamp = '';
            editForm.value.timeConfig.interval = { value: 30, unit: 'minutes' };
            break;
        case 'interval':
            editForm.value.timeConfig.timestamp = '';
            editForm.value.timeConfig.dailyTime = '';
            break;
    }
};

const InitializeEditReminderDialog = () => {
    editForm.value = {
        title: props.reminder.title,
        body: props.reminder.body,
        timeConfig: {
            mode: props.reminder.timeConfig.mode,
            timestamp: props.reminder.timeConfig.timestamp || '',
            dailyTime: props.reminder.timeConfig.dailyTime || '',
            interval: props.reminder.timeConfig.interval ? {
                value: props.reminder.timeConfig.interval.value,
                unit: props.reminder.timeConfig.interval.unit
            } : {
                value: 30,
                unit: 'minutes' as const
            }
        },
        urgency: props.reminder.urgency || 'normal'
    };
    showEditDialog.value = true;
};

const formatTimeConfig = (timeConfig: TimeConfig | undefined): string => {
    if (!timeConfig) {
        return '无效的时间配置';
    }
    switch (timeConfig.mode) {
        case 'once':
            return new Date(timeConfig.timestamp!).toLocaleString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                month: '2-digit',
                day: '2-digit'
            });
        case 'daily':
            return `每日 ${timeConfig.dailyTime}`;
        case 'interval':
            const unit = timeConfig.interval!.unit === 'minutes' ? '分钟' : '小时';
            return `每${timeConfig.interval!.value}${unit}`;
        default:
            return '无效的时间配置';
    }
};

const handleSave = () => {
    const updatedReminder = {
        ...props.reminder,
        title: editForm.value.title,
        body: editForm.value.body,
        timeConfig: editForm.value.timeConfig,
        urgency: editForm.value.urgency
    };
    reminderStore.updateReminder(updatedReminder);
    showEditDialog.value = false;
};

// Delete button handler
const deleteReminder = () => {
    reminderStore.removeReminder(props.reminder.id);
    showConfirmDialog.value = false;
};

const toggleEnabled = (event: Event) => {
    const checkbox = event.target as HTMLInputElement;
    const updatedReminder = {
        ...props.reminder,
        enabled: checkbox.checked
    };
    reminderStore.updateReminder(updatedReminder);
};



</script>

<style scoped>
.reminder-content {
    font-size: 0.9rem;
    line-height: 1.5;
    color: rgba(var(--v-theme-on-surface), 0.87);
    margin-bottom: 0.5rem;
}

.reminder-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.reminder-time {
    display: block;
}

.reminder-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.toggle-label {
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.toggle-input {
    appearance: none;
    width: 40px;
    height: 20px;
    background-color: rgba(var(--v-theme-on-surface), 0.12);
    border-radius: 10px;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;
}

.toggle-input:checked {
    background-color: rgb(var(--v-theme-primary));
}

.toggle-input::before {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    background-color: white;
    transition: transform 0.3s ease;
}

.toggle-input:checked::before {
    transform: translateX(20px);
}

.toggle-input:hover {
    opacity: 0.8;
}

.toggle-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
}

.info-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.info-label {
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.info-value {
    font-size: 1rem;
    color: rgba(var(--v-theme-on-surface), 0.87);
}
</style>
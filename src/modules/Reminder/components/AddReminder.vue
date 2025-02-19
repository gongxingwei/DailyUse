<template>
    <div>
        <!-- 触发按钮 -->
        <button class="add-btn" @click="showDialog = true">
            <span class="icon">+</span>
            添加提醒
        </button>

        <!-- 添加提醒对话框 -->
        <div v-if="showDialog" class="dialog-overlay">
            <div class="dialog">
                <div class="dialog-header">
                    <h2>新建提醒</h2>
                    <button class="close-btn" @click="handleCancel">×</button>
                </div>
                
                <div class="dialog-body">
                    <form @submit.prevent="handleSave">
                        <div class="form-group">
                            <label for="title">标题 <span class="required">*</span></label>
                            <input
                                id="title"
                                type="text"
                                v-model.trim="form.title"
                                required
                                maxlength="50"
                                placeholder="请输入标题"
                            >
                            <span class="error-text" v-if="form.title.length > 50">
                                标题不能超过50个字符
                            </span>
                        </div>

                        <div class="form-group">
                            <label for="body">内容</label>
                            <textarea
                                id="body"
                                v-model.trim="form.body"
                                rows="3"
                                placeholder="请输入内容"
                            ></textarea>
                        </div>

                        <div class="form-group">
                            <label for="urgency">优先级 <span class="required">*</span></label>
                            <select
                                id="urgency"
                                v-model="form.urgency"
                                required
                            >
                                <option
                                    v-for="option in urgencyOptions"
                                    :key="option.value"
                                    :value="option.value"
                                >
                                    {{ option.title }}
                                </option>
                            </select>
                        </div>

                        <!-- 时间模式选择 -->
                <div class="form-group">
                    <label for="timeMode">提醒方式 <span class="required">*</span></label>
                    <select
                        id="timeMode"
                        v-model="form.timeConfig.mode"
                        required
                        @change="handleTimeModeChange"
                    >
                        <option value="once">单次提醒</option>
                        <option value="daily">每日提醒</option>
                        <option value="interval">间隔提醒</option>
                    </select>
                </div>

                <!-- 时间配置 -->
                <div class="form-group">
                    <template v-if="form.timeConfig.mode === 'once'">
                        <label for="timestamp">提醒时间 <span class="required">*</span></label>
                        <input
                            id="timestamp"
                            type="datetime-local"
                            v-model="form.timeConfig.timestamp"
                            required
                        >
                    </template>

                    <template v-else-if="form.timeConfig.mode === 'daily'">
                        <label for="dailyTime">每日提醒时间 <span class="required">*</span></label>
                        <input
                            id="dailyTime"
                            type="time"
                            v-model="form.timeConfig.dailyTime"
                            required
                        >
                    </template>

                    <template v-else-if="form.timeConfig.mode === 'interval'">
                        <label>间隔时间 <span class="required">*</span></label>
                        <div class="interval-group">
                            <input
                                type="number"
                                v-model.number="form.timeConfig.interval.value"
                                :min="1"
                                :max="form.timeConfig.interval.unit === 'minutes' ? 59 : 23"
                                required
                                class="interval-input"
                            >
                            <select
                                v-model="form.timeConfig.interval.unit"
                                class="interval-unit"
                            >
                                <option value="minutes">分钟</option>
                                <option value="hours">小时</option>
                            </select>
                        </div>
                    </template>
                </div>
                    </form>
                </div>

                <div class="dialog-footer">
                    <button class="btn cancel-btn" @click="handleCancel">取消</button>
                    <button class="btn save-btn" @click="handleSave">保存</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useReminderStore } from '../reminderStore';
import { v4 as uuidv4 } from 'uuid';
import type { UrgencyLevel, TimeMode } from '@/shared/types/time';

const reminderStore = useReminderStore();
const showDialog = ref(false);
const form = reactive({
    title: '',
    body: '',
    timeConfig: {
        mode: 'once' as TimeMode,
        timestamp: '',
        dailyTime: '',
        interval: {
            value: 30,
            unit: 'minutes' as const
        }
    },
    urgency: 'normal' as UrgencyLevel
});


const urgencyOptions = [
    { title: '普通', value: 'normal' as UrgencyLevel },
    { title: '重要', value: 'critical' as UrgencyLevel },
    { title: '紧急', value: 'low' as UrgencyLevel }
];



const handleTimeModeChange = () => {
    // 重置其他时间配置
    switch (form.timeConfig.mode) {
        case 'once':
            form.timeConfig.dailyTime = '';
            form.timeConfig.interval = { value: 30, unit: 'minutes' };
            break;
        case 'daily':
            form.timeConfig.timestamp = '';
            form.timeConfig.interval = { value: 30, unit: 'minutes' };
            break;
        case 'interval':
            form.timeConfig.timestamp = '';
            form.timeConfig.dailyTime = '';
            break;
    }
};

const resetForm = () => {
    form.title = '';
    form.body = '';
    form.timeConfig = {
        mode: 'once',
        timestamp: '',
        dailyTime: '',
        interval: {
            value: 30,
            unit: 'minutes'
        }
    };
    form.urgency = 'normal';
};
const handleCancel = () => {
    resetForm();
    showDialog.value = false;
};

const handleSave = () => {
    if (!form.title || !isTimeConfigValid()) {
        return;
    }

    const newReminder = {
        id: uuidv4(),
        title: form.title.trim(),
        body: form.body.trim(),
        timeConfig: form.timeConfig,
        urgency: form.urgency,
        enabled: true
    };

    reminderStore.addReminder(newReminder);
    handleCancel();
};

const isTimeConfigValid = (): boolean => {
    switch (form.timeConfig.mode) {
        case 'once':
            return !!form.timeConfig.timestamp;
        case 'daily':
            return !!form.timeConfig.dailyTime;
        case 'interval':
            return !!form.timeConfig.interval.value && 
                   form.timeConfig.interval.value > 0 && 
                   (form.timeConfig.interval.unit === 'minutes' ? 
                        form.timeConfig.interval.value <= 59 : 
                        form.timeConfig.interval.value <= 23);
        default:
            return false;
    }
};
</script>

<style scoped>
.add-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background-color: rgb(var(--v-theme-primary));
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.add-btn:hover {
    background-color: rgba(var(--v-theme-primary), 0.8);
}

.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.dialog {
    background: rgb(var(--v-theme-surface));
    border-radius: 8px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.dialog-header {
    padding: 16px;
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dialog-header h2 {
    margin: 0;
    font-size: 1.25rem;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.dialog-body {
    padding: 16px;
}

.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: rgba(var(--v-theme-on-surface), 0.87);
}

.required {
    color: #ff4d4f;
}

input, textarea, select {
    width: 100%;
    padding: 8px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
    background: rgb(var(--v-theme-surface));
    color: rgba(var(--v-theme-on-surface), 0.87);
}

input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: rgb(var(--v-theme-primary));
}

.error-text {
    color: #ff4d4f;
    font-size: 0.875rem;
    margin-top: 4px;
}

.dialog-footer {
    padding: 16px;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
}

.cancel-btn {
    background-color: transparent;
    color: #ff4d4f;
}

.save-btn {
    background-color: rgb(var(--v-theme-primary));
    color: white;
}

.cancel-btn:hover {
    background-color: rgba(255, 77, 79, 0.1);
}

.save-btn:hover {
    background-color: rgba(var(--v-theme-primary), 0.8);
}

.interval-group {
    display: flex;
    gap: 8px;
    align-items: center;
}

.interval-input {
    width: 100px;
}

.interval-unit {
    width: 100px;
}
</style>
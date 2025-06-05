<template>
  <div>
    <!-- 触发按钮 -->
    <v-btn color="primary" variant="elevated" size="large" class="add-reminder-btn" @click="showDialog = true">
      <v-icon start>mdi-plus</v-icon>
      添加提醒
    </v-btn>

    <!-- 添加提醒对话框 -->
    <v-dialog v-model="showDialog" max-width="650" persistent scrollable>
      <v-card class="add-dialog">
        <!-- 对话框头部 -->
        <v-card-title class="dialog-header pa-6">
          <div class="d-flex align-center">
            <v-avatar size="40" color="white" class="mr-3">
              <v-icon color="primary">mdi-bell-plus</v-icon>
            </v-avatar>
            <div>
              <h2 class="text-h5 font-weight-bold text-white mb-1">新建提醒</h2>
              <p class="text-body-2 text-white opacity-90 mb-0">创建一个新的提醒事项</p>
            </div>
          </div>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="formRef" @submit.prevent="handleSave">
            <!-- 基本信息 -->
            <v-card variant="outlined" class="mb-6">
              <v-card-title class="d-flex align-center pa-4"
                style="background: linear-gradient(135deg, rgba(var(--v-theme-info), 0.5) 0%, rgba(var(--v-theme-info), 0.1) 100%);">
                <v-icon class="mr-2" color="primary">mdi-information</v-icon>
                基本信息
              </v-card-title>
              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12">
                    <v-text-field v-model.trim="form.title" label="提醒标题" prepend-inner-icon="mdi-format-title"
                      variant="outlined" required maxlength="50" counter="50" placeholder="请输入提醒标题"
                      density="comfortable" :error-messages="titleError"></v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-textarea v-model.trim="form.body" label="提醒内容" prepend-inner-icon="mdi-text" variant="outlined"
                      rows="3" placeholder="请输入提醒内容（可选）" density="comfortable"></v-textarea>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-select v-model="form.urgency" :items="urgencyOptions" label="优先级" prepend-inner-icon="mdi-flag"
                      variant="outlined" required density="comfortable">
                      <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                          <template #prepend>
                            <v-icon :color="getUrgencyColor(item.raw.value)">
                              {{ getUrgencyIcon(item.raw.value) }}
                            </v-icon>
                          </template>
                        </v-list-item>
                      </template>
                    </v-select>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- 时间配置 -->
            <v-card variant="outlined">
              <v-card-title class="d-flex align-center pa-4"
                style="background: linear-gradient(135deg, rgba(var(--v-theme-accent), 0.5) 0%, rgba(var(--v-theme-accent), 0.1) 100%);">
                <v-icon class="mr-2" color="accent">mdi-clock</v-icon>
                时间配置
              </v-card-title>
              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select v-model="form.timeConfig.mode" :items="timeModeOptions" label="提醒方式"
                      prepend-inner-icon="mdi-repeat" variant="outlined" required density="comfortable"
                      @update:model-value="handleTimeModeChange"></v-select>
                  </v-col>

                  <v-col cols="12">
                    <!-- 单次提醒 -->
                    <v-expand-transition>
                      <div v-if="form.timeConfig.mode === 'once'">
                        <v-text-field v-model="form.timeConfig.timestamp" type="datetime-local" label="提醒时间"
                          prepend-inner-icon="mdi-calendar-clock" variant="outlined" required density="comfortable"
                          :min="minDateTime"></v-text-field>
                      </div>
                    </v-expand-transition>

                    <!-- 每日提醒 -->
                    <v-expand-transition>
                      <div v-if="form.timeConfig.mode === 'daily'">
                        <v-text-field v-model="form.timeConfig.dailyTime" type="time" label="每日提醒时间"
                          prepend-inner-icon="mdi-clock-time-four" variant="outlined" required
                          density="comfortable"></v-text-field>
                      </div>
                    </v-expand-transition>

                    <!-- 间隔提醒 -->
                    <v-expand-transition>
                      <div v-if="form.timeConfig.mode === 'interval'">
                        <v-card variant="tonal" color="primary" class="pa-4">
                          <h4 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
                            <v-icon class="mr-2">mdi-timer</v-icon>
                            间隔设置
                          </h4>
                          <v-row>
                            <v-col cols="8">
                              <v-text-field v-model.number="form.timeConfig.interval.value" type="number" label="间隔值"
                                :min="1" :max="form.timeConfig.interval.unit === 'minutes' ? 59 : 23" variant="outlined"
                                required density="comfortable"></v-text-field>
                            </v-col>
                            <v-col cols="4">
                              <v-select v-model="form.timeConfig.interval.unit" :items="intervalUnitOptions" label="单位"
                                variant="outlined" density="comfortable"></v-select>
                            </v-col>
                          </v-row>

                          <v-alert type="info" variant="tonal" density="compact" class="mt-3">
                            <template #prepend>
                              <v-icon>mdi-information-outline</v-icon>
                            </template>
                            每{{ form.timeConfig.interval.value }}{{ getUnitText(form.timeConfig.interval.unit) }}提醒一次
                          </v-alert>
                        </v-card>
                      </div>
                    </v-expand-transition>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-form>
        </v-card-text>

        <!-- 对话框操作按钮 -->
        <v-card-actions class="pa-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" size="large" @click="handleCancel">
            取消
          </v-btn>
          <v-btn color="primary" variant="elevated" size="large" @click="handleSave" :disabled="!isFormValid"
            :loading="saving">
            <v-icon start>mdi-content-save</v-icon>
            保存提醒
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useReminderStore } from '../stores/reminderStore';
import { v4 as uuidv4 } from 'uuid';
import type { UrgencyLevel, TimeMode } from '@/shared/types/time';

const reminderStore = useReminderStore();
const showDialog = ref(false);
const saving = ref(false);
const formRef = ref();

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

const timeModeOptions = [
  { title: '单次提醒', value: 'once' },
  { title: '每日提醒', value: 'daily' },
  { title: '间隔提醒', value: 'interval' }
];

const intervalUnitOptions = [
  { title: '分钟', value: 'minutes' },
  { title: '小时', value: 'hours' }
];

// 计算属性
const minDateTime = computed(() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  return now.toISOString().slice(0, 16);
});

const titleError = computed(() => {
  if (form.title.length > 50) {
    return ['标题不能超过50个字符'];
  }
  return [];
});

const isFormValid = computed(() => {
  return form.title.trim() && isTimeConfigValid() && titleError.value.length === 0;
});

// 方法
const getUrgencyColor = (urgency: UrgencyLevel) => {
  switch (urgency) {
    case 'critical': return 'error';
    case 'low': return 'success';
    default: return 'info';
  }
};

const getUrgencyIcon = (urgency: UrgencyLevel) => {
  switch (urgency) {
    case 'critical': return 'mdi-alert';
    case 'low': return 'mdi-chevron-up';
    default: return 'mdi-minus';
  }
};

const getUnitText = (unit: string) => {
  return unit === 'minutes' ? '分钟' : '小时';
};

const handleTimeModeChange = () => {
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

const handleSave = async () => {
  if (!isFormValid.value) return;

  saving.value = true;

  try {
    const newReminder = {
      id: uuidv4(),
      title: form.title.trim(),
      body: form.body.trim(),
      timeConfig: form.timeConfig,
      urgency: form.urgency,
      enabled: true
    };

    await reminderStore.addReminder(newReminder);
    handleCancel();
  } catch (error) {
    console.error('保存提醒失败:', error);
  } finally {
    saving.value = false;
  }
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
.add-reminder-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  padding: 0 24px;
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.add-reminder-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--v-theme-primary), 0.4);
}

.add-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .add-reminder-btn {
    width: 100%;
  }
}
</style>
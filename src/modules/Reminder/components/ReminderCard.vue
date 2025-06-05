<template>
  <v-card :class="[
    'reminder-card',
    `urgency-${reminder.urgency}`,
    { 'card-disabled': !reminder.enabled }
  ]" elevation="2" variant="elevated">
    <!-- 优先级装饰条 -->
    <div class="priority-stripe" :class="`stripe-${reminder.urgency}`"></div>

    <v-card-text class="pa-4">
      <!-- 卡片头部 -->
      <div class="d-flex align-start justify-space-between mb-3">
        <div class="flex-grow-1">
          <h3 class="text-h6 font-weight-bold mb-2">{{ reminder.title }}</h3>
          <div class="d-flex align-center gap-2 mb-2">
            <v-chip :color="urgencyColor" size="small" variant="tonal" class="font-weight-medium">
              <v-icon size="12" start>{{ urgencyIcon }}</v-icon>
              {{ urgencyText }}
            </v-chip>
            <v-chip :color="reminder.enabled ? 'success' : 'warning'" size="small" variant="tonal">
              <v-icon size="12" start>
                {{ reminder.enabled ? 'mdi-check-circle' : 'mdi-pause-circle' }}
              </v-icon>
              {{ reminder.enabled ? '已启用' : '已禁用' }}
            </v-chip>
          </div>
        </div>

        <!-- 操作按钮组 -->
        <v-btn-group variant="text" density="compact">
          <v-btn icon="mdi-information-outline" size="small" color="info" @click="showInfoDialog = true">
            <v-icon>mdi-information-outline</v-icon>

          </v-btn>
          <v-btn icon="mdi-pencil-outline" size="small" color="green" @click="editDialog">
            <v-icon>mdi-pencil-outline</v-icon>

          </v-btn>
          <v-btn icon="mdi-delete-outline" size="small" color="error" @click="showConfirmDialog = true">
            <v-icon>mdi-delete-outline</v-icon>

          </v-btn>
        </v-btn-group>
      </div>

      <!-- 卡片内容 -->
      <div class="reminder-content mb-3">
        <div class="d-flex align-start mb-2">
          <v-icon size="16" class="mt-1 mr-2 text-medium-emphasis">mdi-text</v-icon>
          <span class="text-body-2">{{ reminder.body || '无详细内容' }}</span>
        </div>
        <div class="d-flex align-center">
          <v-icon size="16" class="mr-2 text-medium-emphasis">mdi-clock-outline</v-icon>
          <span class="text-body-2 text-medium-emphasis">
            {{ formatTimeConfig(reminder.timeConfig) }}
          </span>
        </div>
      </div>

      <!-- 开关控制 -->
      <v-divider class="mb-3"></v-divider>
      <div class="d-flex align-center justify-space-between">
        <span class="text-body-2 text-medium-emphasis">启用提醒</span>
        <v-switch :model-value="reminder.enabled" @update:model-value="toggleEnabled" color="primary" density="compact"
          hide-details></v-switch>
      </div>
    </v-card-text>

    <!-- 详情对话框 -->
    <v-dialog v-model="showInfoDialog" max-width="500">
      <v-card class="info-dialog">
        <v-card-title class="d-flex align-center pa-4 bg-primary text-white">
          <v-icon class="mr-2">mdi-information</v-icon>
          提醒详情
        </v-card-title>

        <v-card-text class="pa-4">
          <v-list lines="two">
            <v-list-item>
              <template #prepend>
                <v-icon>mdi-format-title</v-icon>
              </template>
              <v-list-item-title>标题</v-list-item-title>
              <v-list-item-subtitle>{{ reminder.title }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-text</v-icon>
              </template>
              <v-list-item-title>内容</v-list-item-title>
              <v-list-item-subtitle>{{ reminder.body || '无' }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-clock</v-icon>
              </template>
              <v-list-item-title>提醒时间</v-list-item-title>
              <v-list-item-subtitle>{{ formatTimeConfig(reminder.timeConfig) }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-flag</v-icon>
              </template>
              <v-list-item-title>优先级</v-list-item-title>
              <template #append>
                <v-chip :color="urgencyColor" size="small" variant="tonal">
                  <v-icon size="12" start>{{ urgencyIcon }}</v-icon>
                  {{ urgencyText }}
                </v-chip>
              </template>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-power</v-icon>
              </template>
              <v-list-item-title>状态</v-list-item-title>
              <template #append>
                <v-chip :color="reminder.enabled ? 'success' : 'warning'" size="small" variant="tonal">
                  <v-icon size="12" start>
                    {{ reminder.enabled ? 'mdi-check' : 'mdi-pause' }}
                  </v-icon>
                  {{ reminder.enabled ? '已启用' : '已禁用' }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="elevated" @click="showInfoDialog = false">
            关闭
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 编辑对话框 -->
    <v-dialog v-model="showEditDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center pa-4 bg-primary text-white">
          <v-icon class="mr-2">mdi-pencil</v-icon>
          编辑提醒
        </v-card-title>

        <v-card-text class="pa-4">
          <v-form ref="form" @submit.prevent="handleSave">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="editForm.title" label="标题" prepend-inner-icon="mdi-format-title"
                  variant="outlined" required density="comfortable"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="editForm.body" label="内容" prepend-inner-icon="mdi-text" variant="outlined" rows="3"
                  density="comfortable"></v-textarea>
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="editForm.urgency" :items="urgencyOptions" label="优先级" prepend-inner-icon="mdi-flag"
                  variant="outlined" density="comfortable"></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="editForm.timeConfig.mode" :items="timeModeOptions" label="提醒方式"
                  prepend-inner-icon="mdi-clock" variant="outlined" density="comfortable"
                  @update:model-value="handleTimeModeChange"></v-select>
              </v-col>

              <!-- 时间配置 -->
              <v-col cols="12">
                <v-expand-transition>
                  <div v-if="editForm.timeConfig.mode === 'once'">
                    <v-text-field v-model="editForm.timeConfig.timestamp" type="datetime-local" label="提醒时间"
                      prepend-inner-icon="mdi-calendar-clock" variant="outlined" density="comfortable"
                      required></v-text-field>
                  </div>
                </v-expand-transition>

                <v-expand-transition>
                  <div v-if="editForm.timeConfig.mode === 'daily'">
                    <v-text-field v-model="editForm.timeConfig.dailyTime" type="time" label="每日提醒时间"
                      prepend-inner-icon="mdi-clock-time-four" variant="outlined" density="comfortable"
                      required></v-text-field>
                  </div>
                </v-expand-transition>

                <v-expand-transition>
                  <div v-if="editForm.timeConfig.mode === 'interval'">
                    <v-row>
                      <v-col cols="8">
                        <v-text-field v-model.number="editForm.timeConfig.interval.value" type="number" label="间隔值"
                          :min="1" :max="editForm.timeConfig.interval.unit === 'minutes' ? 59 : 23" variant="outlined"
                          density="comfortable" required></v-text-field>
                      </v-col>
                      <v-col cols="4">
                        <v-select v-model="editForm.timeConfig.interval.unit" :items="intervalUnitOptions" label="单位"
                          variant="outlined" density="comfortable"></v-select>
                      </v-col>
                    </v-row>
                  </div>
                </v-expand-transition>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showEditDialog = false">
            取消
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="handleSave">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 确认删除对话框 -->
    <ConfirmDialog v-model="showConfirmDialog" title="删除提醒" message="确定要删除这个提醒吗？" cancelText="取消" confirmText="确定"
      @cancel="showConfirmDialog = false" @confirm="deleteReminder" />
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useReminderStore } from '../stores/reminderStore';
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue';
import type { Reminder } from '../stores/reminderStore';
import type { UrgencyLevel, TimeMode, TimeConfig, ScheduleUnit } from '@/shared/types/time';

interface Props {
  reminder: Reminder;
}

const props = defineProps<Props>();
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

const timeModeOptions = [
  { title: '单次提醒', value: 'once' },
  { title: '每日提醒', value: 'daily' },
  { title: '间隔提醒', value: 'interval' }
];

const intervalUnitOptions = [
  { title: '分钟', value: 'minutes' },
  { title: '小时', value: 'hours' }
];

const urgencyColor = computed(() => {
  switch (props.reminder.urgency) {
    case 'critical': return 'error';
    case 'low': return 'success';
    default: return 'info';
  }
});

const urgencyIcon = computed(() => {
  switch (props.reminder.urgency) {
    case 'critical': return 'mdi-alert';
    case 'low': return 'mdi-chevron-up';
    default: return 'mdi-minus';
  }
});

const urgencyText = computed(() => {
  switch (props.reminder.urgency) {
    case 'critical': return '重要';
    case 'low': return '紧急';
    default: return '普通';
  }
});

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

const deleteReminder = () => {
  reminderStore.removeReminder(props.reminder.id);
  showConfirmDialog.value = false;
};

const toggleEnabled = (enabled: boolean | null) => {
  const isEnabled = enabled ?? false;
  const updatedReminder = {
    ...props.reminder,
    enabled: isEnabled
  };
  reminderStore.updateReminder(updatedReminder);
};
</script>

<style scoped>
.reminder-card {
  position: relative;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.reminder-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-disabled {
  opacity: 0.7;
}

.priority-stripe {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  z-index: 1;
}

.stripe-critical {
  background: linear-gradient(180deg, #f87171 0%, #dc2626 100%);
}

.stripe-low {
  background: linear-gradient(180deg, #34d399 0%, #10b981 100%);
}

.stripe-normal {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
}

.gap-2 {
  gap: 0.5rem;
}

.info-dialog {
  border-radius: 12px;
}
</style>
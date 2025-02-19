<template>
  <v-dialog v-model="dialogVisible" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">{{ todo?.title }}</v-card-title>
      
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <div class="text-subtitle-1">内容：</div>
              <div class="text-body-1">{{ todo?.description || '无' }}</div>
            </v-col>
            
            <v-col cols="12">
              <div class="text-subtitle-1">任务时间：</div>
              <div class="text-body-1">{{ formatTimeConfig(todo?.timeConfig) }}</div>
            </v-col>

            <v-col cols="12">
              <div class="text-subtitle-1">提醒设置：</div>
              <div class="text-body-1">
                {{ todo?.needReminder ? formatAdvanceTime(todo.advanceTime) : '未启用提醒' }}
              </div>
            </v-col>

            <v-col cols="12">
              <div class="text-subtitle-1">优先级：</div>
              <div class="text-body-1">{{ formatUrgency(todo?.urgency) }}</div>
            </v-col>

            <v-col cols="12">
              <div class="text-subtitle-1">状态：</div>
              <div class="text-body-1">{{ todo?.completed ? '已完成' : '未完成' }}</div>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="dialogVisible = false">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Todo } from '@/modules/Todo/todoStore';
import type { TimeConfig, UrgencyLevel, AdvanceTime } from '@/shared/types/time';

interface Props {
  modelValue: boolean;
  todo: Todo | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  todo: null
});

const emit = defineEmits(['update:modelValue']);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const formatAdvanceTime = (advanceTime?: AdvanceTime): string => {
  if (!advanceTime) return '无提前通知';
  
  const parts: string[] = [];
  if (advanceTime.hours) {
    parts.push(`${advanceTime.hours}小时`);
  }
  if (advanceTime.minutes) {
    parts.push(`${advanceTime.minutes}分钟`);
  }
  if (advanceTime.seconds) {
    parts.push(`${advanceTime.seconds}秒`);
  }
  
  return parts.length > 0 ? `提前${parts.join('')}通知` : '无提前通知';
};

const formatTimeConfig = (timeConfig: TimeConfig | undefined): string => {
  if (!timeConfig) {
    return '未设置';
  }

  switch (timeConfig.mode) {
    case 'once':
      if (!timeConfig.timestamp) return '未设置具体时间';
      return new Date(timeConfig.timestamp).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'daily':
      return timeConfig.dailyTime ? `每日 ${timeConfig.dailyTime}` : '未设置每日时间';
    case 'interval':
      if (!timeConfig.interval) return '未设置间隔';
      const unit = timeConfig.interval.unit === 'minutes' ? '分钟' : '小时';
      return `每 ${timeConfig.interval.value} ${unit}`;
    default:
      return '无效的时间配置';
  }
};

const formatUrgency = (urgency: UrgencyLevel | undefined): string => {
  if (!urgency) return '未设置';
  
  const urgencyMap: Record<UrgencyLevel, string> = {
    'normal': '普通',
    'critical': '重要',
    'low': '紧急'
  };
  
  return urgencyMap[urgency] || '未知优先级';
};
</script>
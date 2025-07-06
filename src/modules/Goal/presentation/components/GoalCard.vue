<template>
  <v-card
    class="goal-card mb-4"
    elevation="2"
    :style="{ borderLeft: `4px solid ${goal.color}` }"
    @click="navigateToGoalInfo"
  >
    <v-card-text class="pa-6">
      <!-- 目标标题和状态 -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <v-avatar
            :color="goal.color"
            size="40"
            class="mr-3"
            variant="tonal"
          >
            <v-icon color="white">mdi-target</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-bold mb-1">{{ goal.title }}</h3>
            <v-chip
              :color="getStatusColor()"
              size="small"
              variant="tonal"
              class="font-weight-medium"
            >
              <v-icon start size="12">{{ getStatusIcon() }}</v-icon>
              {{ getStatusText() }}
            </v-chip>
          </div>
        </div>
        
        <!-- 进度圆环 -->
        <v-progress-circular
          :model-value="progress"
          :color="goal.color"
          size="48"
          width="6"
          class="progress-ring"
        >
          <span class="text-caption font-weight-bold">{{ progress }}%</span>
        </v-progress-circular>
      </div>

      <!-- 时间信息 -->
      <div class="d-flex align-center mb-4">
        <v-icon :color="goal.color" size="20" class="mr-2">mdi-calendar-range</v-icon>
        <span class="text-body-2 text-medium-emphasis">
          {{ formatDate(goal.startTime) }} - {{ formatDate(goal.endTime) }}
        </span>
        <v-spacer />
        <v-chip
          :color="getRemainingDaysColor()"
          size="small"
          variant="outlined"
          class="font-weight-medium"
        >
          <v-icon start size="12">mdi-clock-outline</v-icon>
          {{ getRemainingDaysText() }}
        </v-chip>
      </div>

      <!-- 进度条 -->
      <div class="mb-2">
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-caption text-medium-emphasis">目标进度</span>
          <span class="text-caption font-weight-bold">{{ progress }}%</span>
        </div>
        <v-progress-linear
          :model-value="progress"
          :color="goal.color"
          height="8"
          rounded
          class="progress-bar"
        />
      </div>

      <!-- 关键结果数量 -->
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon color="medium-emphasis" size="16" class="mr-1">mdi-target</v-icon>
          <span class="text-caption text-medium-emphasis">
            {{ getKeyResultsCount() }} 个关键结果
          </span>
        </div>
        <v-btn
          :color="goal.color"
          variant="text"
          size="small"
          append-icon="mdi-arrow-right"
          class="text-caption"
        >
          查看详情
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Goal } from '@/modules/Goal/types/goal'
import { useGoalStore } from '../stores/goalStore.new'
import { useRouter } from 'vue-router'

const goalStore = useGoalStore()
const router = useRouter()

const props = defineProps<{
  goal: Goal
}>()

const navigateToGoalInfo = () => {
  router.push({
    name: 'goal-info',
    params: { goalId: props.goal.id }
  });
};

const progress = computed(() => {
  return goalStore.getGoalProgress(props.goal.id) || 0;
});

const formatDate = (date: string) => {
  const dateObj = new Date(date)
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(
    dateObj.getDate()
  ).padStart(2, '0')}`
}

const isGoalEnded = computed(() => {
  return new Date(props.goal.endTime) < new Date();
});

const remainingDays = computed(() => {
  const endDate = new Date(props.goal.endTime);
  const today = new Date();
  const timeDiff = endDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

const getStatusColor = () => {
  if (isGoalEnded.value) return 'success';
  if (remainingDays.value < 7) return 'warning';
  return 'primary';
};

const getStatusIcon = () => {
  if (isGoalEnded.value) return 'mdi-check-circle';
  if (remainingDays.value < 7) return 'mdi-alert-circle';
  return 'mdi-play-circle';
};

const getStatusText = () => {
  if (isGoalEnded.value) return '已结束';
  if (remainingDays.value < 7) return '即将到期';
  return '进行中';
};

const getRemainingDaysColor = () => {
  if (isGoalEnded.value) return 'success';
  if (remainingDays.value < 7) return 'error';
  if (remainingDays.value < 30) return 'warning';
  return 'primary';
};

const getRemainingDaysText = () => {
  if (isGoalEnded.value) return '已结束';
  if (remainingDays.value < 0) return '已过期';
  return `${remainingDays.value} 天`;
};

const getKeyResultsCount = () => {
  return props.goal.keyResults?.length || 0;
};
</script>

<style scoped>
.goal-card {
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
}

.goal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-left-width: 6px !important;
}

.progress-ring {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 渐变背景效果 */
.goal-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--goal-color, transparent), transparent);
  opacity: 0.5;
}
</style>
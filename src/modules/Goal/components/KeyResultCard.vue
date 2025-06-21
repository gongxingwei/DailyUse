<template>
  <v-card class="key-result-card" :class="{ 'key-result-card--completed': progress >= 100 }" variant="outlined"
    elevation="0" :hover="true" @click="navigateToKeyResultInfo">
    <!-- 进度背景层 -->
    <div class="progress-background" :style="{
      background: `linear-gradient(90deg, ${goal?.color || '#FF5733'} 0%, ${goal?.color || '#FF5733'}88 100%)`,
      width: `${progress}%`,
    }"></div>

    <!-- 卡片头部 -->
    <v-card-title class="pa-4 pb-2">
      <div class="d-flex align-center justify-space-between w-100">
        <div class="key-result-title">
          <h3 class="text-h6 font-weight-bold mb-0">{{ keyResult.name }}</h3>
          <div class="d-flex align-center mt-1">
            <v-icon :color="progress >= 100 ? 'success' : 'medium-emphasis'" size="16" class="mr-1">
              {{ progress >= 100 ? 'mdi-check-circle' : 'mdi-target' }}
            </v-icon>
            <span class="text-caption text-medium-emphasis">
              权重: {{ keyResult.weight }}
            </span>
          </div>
        </div>

        <!-- 进度圆环 -->
        <v-progress-circular :model-value="progress" :color="goal?.color || 'primary'" size="48" width="4"
          class="progress-ring">
          <span class="text-caption font-weight-bold">{{ Math.round(progress) }}%</span>
        </v-progress-circular>
      </div>
    </v-card-title>

    <!-- 卡片内容 -->
    <v-card-text class="pa-4 pt-0">
      <div class="d-flex align-center justify-space-between">
        <!-- 数值显示 -->
        <div class="value-display">
          <v-chip :color="goal?.color || 'primary'" variant="tonal" size="small" class="mr-2">
            <span class="font-weight-bold">{{ keyResult.currentValue }}</span>
          </v-chip>
          <v-icon size="16" color="medium-emphasis">mdi-arrow-right</v-icon>
          <v-chip color="surface-variant" variant="outlined" size="small" class="ml-2">
            <span class="font-weight-bold">{{ keyResult.targetValue }}</span>
          </v-chip>
        </div>

        <!-- 添加记录按钮 -->
        <v-btn :color="goal?.color || 'primary'" icon="mdi-plus" size="small" variant="tonal" class="add-record-btn"
          @click.stop="startAddRecord(keyResult.id)">
          <v-icon>mdi-plus</v-icon>
          <v-tooltip activator="parent" location="bottom">
            添加记录
          </v-tooltip>
        </v-btn>
      </div>

      <!-- 进度条 -->
      <div class="mt-3">
        <v-progress-linear :model-value="progress" :color="goal?.color || 'primary'" height="6" rounded
          class="progress-bar" />
        <div class="d-flex justify-space-between align-center mt-1">
          <span class="text-caption text-medium-emphasis">进度</span>
          <span class="text-caption font-weight-medium">
            {{ keyResult.currentValue }} / {{ keyResult.targetValue }}
          </span>
        </div>
      </div>
    </v-card-text>

    <!-- 完成状态覆盖层 -->
    <div v-if="progress >= 100" class="completion-overlay">
      <v-icon color="success" size="32">mdi-check-circle</v-icon>
      <span class="text-caption font-weight-bold text-success">已完成</span>
    </div>
    <!-- 记录对话框 -->
    <RecordDialog :visible="showRecordDialog"
      @save="(record) => handleSaveRecord(record, props.goalId, props.keyResult.id)" @cancel="handleCancelAddRecord" />
  </v-card>


</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { computed } from 'vue';
import type { KeyResult } from '../types/goal';
import RecordDialog from './RecordDialog.vue';
import { useRecordDialog } from '../composables/useRecordDialog';
import { useGoalStore } from '../stores/goalStore';

const router = useRouter();
const goalStore = useGoalStore();
const { showRecordDialog, startAddRecord, handleSaveRecord, handleCancelAddRecord } = useRecordDialog();

const props = defineProps<{
  keyResult: KeyResult;
  goalId: string;
}>();

const goal = computed(() => goalStore.getGoalById(props.goalId));

const progress = computed(() => {
  return Math.min((props.keyResult.currentValue / props.keyResult.targetValue) * 100, 100);
});

const navigateToKeyResultInfo = () => {
  router.push({
    name: 'key-result-info',
    params: {
      goalId: props.goalId,
      keyResultId: props.keyResult.id
    }
  });
};
</script>

<style scoped>
.key-result-card {
  position: relative;
  border-radius: 16px;
  cursor: pointer;
  min-height: 180px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  background: rgb(var(--v-theme-surface));
}

.key-result-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.key-result-card--completed {
  border-color: rgba(var(--v-theme-success), 0.3);
}

.progress-background {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  opacity: 0.1;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 0;
}

.key-result-card--completed .progress-background {
  opacity: 0.15;
}

.v-card-title,
.v-card-text {
  position: relative;
  z-index: 1;
}

.progress-ring {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.value-display {
  display: flex;
  align-items: center;
}

.add-record-btn {
  transition: all 0.2s ease;
}

.add-record-btn:hover {
  transform: scale(1.1);
}

.progress-bar {
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.completion-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(var(--v-theme-surface), 0.9);
  border-radius: 12px;
  padding: 8px;
  backdrop-filter: blur(4px);
  z-index: 2;
}

/* 完成状态的特殊样式 */
.key-result-card--completed .key-result-title h3 {
  color: rgb(var(--v-theme-success));
}

/* 响应式设计 */
@media (max-width: 600px) {
  .key-result-card {
    min-height: 160px;
  }

  .value-display {
    flex-wrap: wrap;
    gap: 4px;
  }
}
</style>
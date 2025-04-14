<template>
  <v-container class="goal-container pa-0">
    <!-- 头部、标题 -->
    <div class="goal-header px-6 py-4">
      <div class="d-flex align-center justify-space-between">
        <h1 class="text-h5 font-weight-medium">{{ t('goal.title') }}</h1>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="">
          {{ t('goal.create') }}
        </v-btn>
      </div>
    </div>

    <!-- 主体 -->
    <div class="goal-content px-6">
      <!-- 侧边栏（目标节点） -->
      <div class="goal-dir">
        <GoalDir @selected-goal-dir-id="selectDir"/>
      </div>
      <!-- 目标列表 -->
      <div class="goal-list">
        <!-- 有则显示 -->
        <div v-if="goalsInCurDir.length">
          <GoalCard v-for="goal in goalsInCurDir" :key="goal.id" :goal="goal" />
        </div>
        <!-- 如果为空 -->
        <div class="empty-state" v-else>
          <v-icon size="64" color="grey-lighten-1">mdi-folder-multiple</v-icon>
          <div class="text-h6 mt-4">{{ t('goal.empty') }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">{{ t('goal.emptyTip') }}</div>
        </div>
      </div>
    </div>

    <!-- <RelativeRepo v-model="showRelativeRepo" :goalId="editingGoalId || 0" />
    <RelativeTodo v-model="showRelativeTodo" :goalId="editingGoalId || 0" />
    <Confirm v-model:model-value="showConfirmDialog" :title="t('goal.deleteTitle')" :message="t('goal.deleteConfirm')"
      :confirm-text="t('common.1')" :cancel-text="t('common.2')" @confirm="handleConfirm" @cancel="handleCancel" /> -->
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useGoalStore } from '@/modules/Goal/stores/goalStore'
// 组件
import GoalDir from '../components/GoalDir.vue'
import GoalCard from '@/modules/Goal/components/GoalCard.vue'
import Confirm from '@/shared/components/Confirm.vue'

// composables
import { useGoalManagement } from '@/modules/Goal/composables/useGoalManagement'
import { useGoalDialog } from '../composables/useGoalDialog'
const { t } = useI18n()
const goalStore = useGoalStore()

const { selectDir, goalsInCurDir } = useGoalManagement()

</script>

<style scoped>
.goal-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.goal-header {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.goal-content {
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow-y: auto;
  padding-top: 16px;
}

/* 目标文件夹区域 */
.goal-dir {
  width: 200px;
}

/* 目标列表区域 */
.goal-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}
</style>
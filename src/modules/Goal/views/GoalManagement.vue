<template>
  <v-container class="goal-container pa-0">
    <!-- 头部、标题 -->
    <div class="goal-header px-6 py-4">
      <div class="d-flex align-center justify-space-between">
        <h1 class="text-h5 font-weight-medium">{{ t('goal.title') }}</h1>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="startCreateGoal">
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
        <!-- 过滤器（全部、进行中、已结束 -->
        <div class="status-tabs">
                <button v-for="tab in statusTabs" :key="tab.value" class="tab-btn"
                    :class="{ active: selectedStatus === tab.value }" @click="selectedStatus = tab.value">
                    {{ tab.label }}
                    <span class="count">{{ getGoalCountByStatus(tab.value) }}</span>
                </button>
            </div>
        <!-- 有则显示 -->
        <div v-if="(goalsInCurStatus ?? []).length">
          <GoalCard v-for="goal in goalsInCurStatus" :key="goal.id" :goal="goal" />
        </div>
        <!-- 如果为空 -->
        <div class="empty-state" v-else>
          <v-icon size="64" color="grey-lighten-1">mdi-folder-multiple</v-icon>
          <div class="text-h6 mt-4">{{ t('goal.empty') }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">{{ t('goal.emptyTip') }}</div>
        </div>
      </div>
    </div>
    <GoalDialog :visible="showGoalDialog" @save="saveGoal" @cancel="cancelGoalEdit"/>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
// 组件
import GoalDir from '../components/GoalDir.vue'
import GoalCard from '@/modules/Goal/components/GoalCard.vue'
import GoalDialog from '../components/GoalDialog.vue'

// composables
import { useGoalManagement } from '@/modules/Goal/composables/useGoalManagement'
import { useGoalDialog } from '../composables/useGoalDialog'
const { t } = useI18n()

const { selectDir, statusTabs, selectedStatus, goalsInCurStatus, getGoalCountByStatus } = useGoalManagement()
const { showGoalDialog, startCreateGoal, cancelGoalEdit, saveGoal } = useGoalDialog()
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
  padding: 0.5rem 1rem;
  width: 200px;
  background-color: rgb(var(--v-theme-surface));
}
/* 分类标签 */
.status-tabs {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: rgb(var(--v-theme-surface));
  color: var(--v-primary);
  cursor: pointer;
}
.tab-btn.active {
  background-color: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-primary));
}
/* 目标列表区域 */
.goal-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  overflow-y: auto;
  background-color: rgb(var(--v-theme-background));
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
<template>
  <v-container class="goal-management h-100 d-flex flex-column overflow-y-hidden pa-0">
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
    <div class="h-100 px-6 d-flex flex-row flex-grow-1 pt-4">
      <!-- 侧边栏（目标节点） -->
      <div class="goal-management_sidebar flex-shrink-0" style="width: 200px;">
        <GoalDir @selected-goal-dir-id="selectDir" />
      </div>
      <!-- 目标列表 -->
      <div class="goal-management_main d-flex flex-column flex-grow-1">
        <!-- 过滤器（全部、进行中、已结束 -->
        <div class="goal-management-tabs d-flex flex-row mb-4">
          <v-btn v-for="tab in statusTabs" :key="tab.value" variant='flat' style="width: 150px;"
            class="tab-btn flex-grow-1 d-flex align-center justify-center" :class="{ 'tab-selected': selectedStatus === tab.value }"
            @click="selectedStatus = tab.value">
            <span class="w-100 d-flex flex-row align-center justify-center">
              {{ tab.label }}
              <v-chip size="small" :color="selectedStatus === tab.value ? 'white' : 'primary'" class="ml-10">
                {{ getGoalCountByStatus(tab.value) }}
              </v-chip>
            </span>
          </v-btn>
        </div>
        <!-- 有则显示 -->
        <div v-if="(goalsInCurStatus ?? []).length" class="flex-grow-1">
          <GoalCard v-for="goal in goalsInCurStatus" :key="goal.id" :goal="goal" />
        </div>
        <!-- 如果为空 -->
        <div class="empty-state d-flex flex-column align-center justify-center h-100" v-else style="min-height: 300px;">
          <v-icon size="64" color="grey-lighten-1">mdi-folder-multiple</v-icon>
          <div class="text-h6 mt-4">{{ t('goal.empty') }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">{{ t('goal.emptyTip') }}</div>
        </div>
      </div>
    </div>
    <GoalDialog :visible="showGoalDialog" @save="saveGoal" @cancel="cancelGoalEdit" />
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
.goal-header {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* 侧边栏（目标文件夹） */
.goal-management_sidebar {
  background-color: rgb(var(--v-theme-surface));

  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* 主体（目标列表） */
.goal-management_main {
  background-color: rgb(var(--v-theme-surface));
  /* border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); */
}

/* 标签（过滤器） */
/* .goal-management-tabs {
  background-color: rgb(var(--v-theme-background));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
} */

.tab-btn {
  background-color: rgb(var(--v-theme-background));

  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-bottom: none;
}

.tab-selected {
  background-color: rgb(var(--v-theme-onsurface));
  color: rgb(var(--v-theme-on-primary));
}

</style>
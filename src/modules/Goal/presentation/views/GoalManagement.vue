<template>
  <div class="goal-management d-flex flex-column h-100">
    <!-- 页面头部 - 固定高度 -->
    <v-card class="goal-header flex-shrink-0" elevation="1" rounded="0">
      <v-card-text class="pa-6">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-avatar size="48" color="primary" variant="tonal" class="mr-4">
              <v-icon size="24">mdi-target</v-icon>
            </v-avatar>
            <div>
              <h1 class="text-h4 font-weight-bold text-primary mb-1">{{ t('goal.title') }}</h1>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">管理您的目标和关键结果</p>
            </div>
          </div>
          
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-plus"
            variant="elevated"
            class="create-btn"
            @click="startCreateGoal"
          >
            {{ t('goal.create') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 主体内容 - 占据剩余空间 -->
    <div class="main-content flex-grow-1 pa-6 overflow-hidden">
      <div class="content-wrapper h-100">
        <v-row no-gutters class="h-100">
          <!-- 侧边栏 - 目标节点 -->
          <v-col cols="12" md="3" class="pr-md-6 mb-6 mb-md-0 h-100">
            <GoalDir @selected-goal-dir-id="selectDir" class="h-100" />
          </v-col>
          
          <!-- 目标列表区域 -->
          <v-col cols="12" md="9" class="h-100">
            <v-card class="goal-main h-100 d-flex flex-column" elevation="2">
              <!-- 状态过滤器 - 固定高度 -->
              <v-card-title class="pa-4 flex-shrink-0">
                <div class="d-flex align-center justify-space-between w-100">
                  <h2 class="text-h6 font-weight-medium">目标列表</h2>
                  
                  <!-- 状态标签 -->
                  <v-chip-group
                    v-model="selectedStatusIndex"
                    selected-class="text-primary"
                    mandatory
                    class="status-tabs"
                  >
                    <v-chip
                      v-for="(tab, index) in statusTabs"
                      :key="tab.value"
                      :value="index"
                      variant="outlined"
                      filter
                      class="status-chip"
                    >
                      {{ tab.label }}
                      <v-badge
                        :content="getGoalCountByStatus(tab.value)"
                        :color="selectedStatusIndex === index ? 'primary' : 'surface-bright'"
                        inline
                        class="ml-2"
                      />
                    </v-chip>
                  </v-chip-group>
                </div>
              </v-card-title>

              <v-divider class="flex-shrink-0" />

              <!-- 目标列表内容 - 可滚动区域 -->
              <v-card-text class="goal-list-content pa-4 flex-grow-1 overflow-y-auto">
                <!-- 有目标时显示 -->
                <div v-if="goalsInCurStatus?.length">
                  <v-row>
                    <v-col
                      v-for="goal in goalsInCurStatus"
                      :key="goal.id"
                      cols="12"
                      lg="6"
                      xl="4"
                    >
                      <GoalCard :goal="goal" />
                    </v-col>
                  </v-row>
                </div>
                
                <!-- 空状态 -->
                <div v-else class="d-flex align-center justify-center h-100">
                  <v-empty-state
                    icon="mdi-target"
                    :title="t('goal.empty')"
                    :text="t('goal.emptyTip')"
                  >
                    <template v-slot:actions>
                      <v-btn
                        color="primary"
                        variant="elevated"
                        prepend-icon="mdi-plus"
                        @click="startCreateGoal"
                      >
                        创建一个目标
                      </v-btn>
                    </template>
                  </v-empty-state>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- 目标对话框 -->
    <GoalDialog 
      :visible="showGoalDialog" 
      @save="saveGoal" 
      @cancel="cancelGoalEdit" 
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import GoalDir from '../components/GoalDir.vue'
import GoalCard from '@/modules/Goal/components/GoalCard.vue'
import GoalDialog from '../components/GoalDialog.vue'
import { useGoalManagement } from '@/modules/Goal/composables/useGoalManagement'
import { useGoalDialog } from '../composables/useGoalDialog'

const { t } = useI18n()
const { selectDir, statusTabs, selectedStatus, goalsInCurStatus, getGoalCountByStatus } = useGoalManagement()
const { showGoalDialog, startCreateGoal, cancelGoalEdit, saveGoal } = useGoalDialog()

// 计算选中的状态索引
const selectedStatusIndex = computed({
  get: () => statusTabs.findIndex(tab => tab.value === selectedStatus.value),
  set: (index) => {
    if (index >= 0 && index < statusTabs.length) {
      selectedStatus.value = statusTabs[index].value
    }
  }
})
</script>

<style scoped>
.goal-management {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.02) 0%, rgba(var(--v-theme-surface), 1) 100%);
  /* 确保占据全部视口高度 */
  height: 100vh;
  /* 防止页面滚动 */
  overflow: hidden;
}

.goal-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-secondary), 0.05) 100%);
  border-radius: 0 0 24px 24px;
  /* 确保头部不会被压缩 */
  min-height: auto;
}

.create-btn {
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.4);
}

.main-content {
  /* 确保主体内容占据剩余空间 */
  min-height: 0;
}

.content-wrapper {
  /* 确保内容包装器占据全部高度 */
  min-height: 100%;
}

.goal-main {
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  /* 确保卡片占据全部可用高度 */
  min-height: 100%;
}

.status-tabs {
  gap: 8px;
  /* 防止标签换行 */
  flex-wrap: nowrap;
}

.status-chip {
  transition: all 0.2s ease;
  border-radius: 12px;
  /* 防止标签被压缩 */
  flex-shrink: 0;
}

.status-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.goal-list-content {
  /* 移除固定最小高度，让它自适应 */
  min-height: 0;
  /* 确保内容区域可以滚动 */
  overflow-y: auto;
  /* 设置最大高度以确保滚动生效 */
  max-height: 100%;
}

/* 滚动条美化 */
.goal-list-content::-webkit-scrollbar {
  width: 6px;
}

.goal-list-content::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 3px;
}

.goal-list-content::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.3);
  border-radius: 3px;
}

.goal-list-content::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.5);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .goal-header .v-card-text {
    padding: 1rem !important;
  }
  
  .create-btn {
    min-width: auto;
  }
  
  .status-tabs {
    flex-wrap: wrap;
  }
  
  /* 移动端调整布局 */
  .main-content {
    padding: 1rem !important;
  }
  
  /* 移动端时垂直布局 */
  .content-wrapper .v-row {
    flex-direction: column;
  }
  
  .content-wrapper .v-col:first-child {
    height: auto;
    max-height: 200px;
    margin-bottom: 1rem;
    padding-right: 0 !important;
  }
  
  .content-wrapper .v-col:last-child {
    flex: 1;
    min-height: 0;
  }
}

/* 确保在小屏幕上也能正确显示 */
@media (max-width: 600px) {
  .goal-management {
    height: 100vh;
    height: 100dvh; /* 支持动态视口高度 */
  }
}
</style>
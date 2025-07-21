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
            @click="openGoalDialog"
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
                      :key="goal.uuid"
                      cols="12"
                      lg="6"
                      xl="4"
                    >
                      <GoalCard 
                        :goal="goal" 
                        @edit-goal="handleEditGoal"
                        @delete-goal="handleDeleteGoal"
                        @add-key-result="handleAddKeyResult"
                        @edit-key-result="handleEditKeyResult"
                        @review-goal="handleReviewGoal"
                      />
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
                        @click="openGoalDialog"
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
    <!-- 目标复盘对话框 -->
    <GoalReviewCard
      :visible="showReviewDialog"
      @close="closeReviewDialog"
      @edit="handleEditReview"
      @delete="handleDeleteReview"
    />
    
    <!-- 目标对话框 -->
    <GoalDialog 
      :visible="goalDialog.showDialog"
      :mode="goalDialog.mode"
      :goal-data="goalDialog.goalData"
      @save="handleSaveGoal"
      @cancel="handleCancelGoal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getGoalDomainApplicationService } from '@/modules/Goal/application/services/goalDomainApplicationService';
import { useGoalManagement } from '../composables/useGoalManagement';
import GoalCard from '../components/GoalCard.vue';
import GoalDir from '../components/GoalDir.vue';
import GoalDialog from '../components/GoalDialog.vue';
import GoalReviewCard from '../components/GoalReviewCard.vue';
import type { IGoal } from '@/modules/Goal/domain/types/goal';

// I18n
const { t } = useI18n();

// Services
const goalService = getGoalDomainApplicationService();

// 使用 useGoalManagement composable
const { 
  selectDir, 
  statusTabs, 
  selectedStatus, 
  goalsInCurStatus, 
  getGoalCountByStatus 
} = useGoalManagement();

// 目标对话框状态管理
const goalDialog = ref({
  showDialog: false,
  mode: 'create' as 'create' | 'edit',
  goalData: null as IGoal | null
});

// 本地状态
const showReviewDialog = ref(false);

// 计算选中的状态索引
const selectedStatusIndex = computed({
  get: () => statusTabs.findIndex(tab => tab.value === selectedStatus.value),
  set: (index) => {
    if (index >= 0 && index < statusTabs.length) {
      selectedStatus.value = statusTabs[index].value;
    }
  }
});

// 目标对话框相关方法
const openGoalDialog = () => {
  goalDialog.value = {
    showDialog: true,
    mode: 'create',
    goalData: null
  };
};

const handleEditGoal = (goal: IGoal) => {
  goalDialog.value = {
    showDialog: true,
    mode: 'edit',
    goalData: goal
  };
};

const handleSaveGoal = async (goalData: any) => {
  try {
    let result;
    
    if (goalDialog.value.mode === 'edit' && goalDialog.value.goalData) {
      // 编辑现有目标
      const goalUpdateData = {
        ...goalData,
        uuid: goalDialog.value.goalData.uuid
      };
      result = await goalService.updateGoal(goalUpdateData);
    } else {
      // 创建新目标
      const goalCreateData = {
        title: goalData.title,
        description: goalData.description,
        color: goalData.color,
        dirId: goalData.dirId,
        startTime: goalData.startTime,
        endTime: goalData.endTime,
        note: goalData.note,
        keyResults: goalData.keyResults || [],
        analysis: goalData.analysis
      };
      result = await goalService.createGoal(goalCreateData);
    }
    
    if (result.success) {
      const action = goalDialog.value.mode === 'edit' ? '更新' : '创建';
      console.log(`✅ 目标${action}成功`);
      // 关闭对话框
      goalDialog.value.showDialog = false;
      // 刷新数据
      await goalService.syncAllData();
    } else {
      console.error('❌ 目标保存失败:', result.message);
      alert('保存失败：' + result.message);
    }
  } catch (error) {
    console.error('❌ 保存目标时发生错误:', error);
    alert('保存目标时发生错误，请稍后重试');
  }
};

const handleCancelGoal = () => {
  goalDialog.value.showDialog = false;
  console.log('🚫 取消目标编辑');
};

// 关键结果对话框相关方法 - 现在由 GoalDialog 内部处理
const handleAddKeyResult = (goalUuid: string) => {
  console.log('🎯 添加关键结果事件已转移到 GoalDialog 内部处理:', goalUuid);
  // 这个方法现在只是为了兼容 GoalCard 的事件，实际处理在 GoalDialog 内部
};

const handleEditKeyResult = (goalUuid: string, keyResult: any) => {
  console.log('✏️ 编辑关键结果事件已转移到 GoalDialog 内部处理:', goalUuid, keyResult);
  // 这个方法现在只是为了兼容 GoalCard 的事件，实际处理在 GoalDialog 内部
};

const handleDeleteGoal = async (goalUuid: string) => {
  // 使用更友好的确认对话框
  if (confirm('⚠️ 确定要删除这个目标吗？\n\n删除后将无法恢复，包括所有关联的关键结果和记录。')) {
    try {
      const result = await goalService.deleteGoal(goalUuid);
      if (result.success) {
        console.log('✅ 目标删除成功');
        // 刷新数据
        await goalService.syncAllData();
      } else {
        console.error('❌ 目标删除失败:', result.message);
        alert('删除失败：' + result.message);
      }
    } catch (error) {
      console.error('❌ 删除目标时发生错误:', error);
      alert('删除目标时发生错误，请稍后重试');
    }
  }
};

const handleReviewGoal = (goalUuid: string) => {
  showReviewDialog.value = true;
  console.log('🔍 开始目标复盘:', goalUuid);
};

const closeReviewDialog = () => {
  showReviewDialog.value = false;
};

const handleEditReview = (reviewId: string) => {
  console.log('📝 编辑复盘记录:', reviewId);
  // TODO: 实现编辑复盘记录功能
};

const handleDeleteReview = (reviewId: string) => {
  console.log('🗑️ 删除复盘记录:', reviewId);
  // TODO: 实现删除复盘记录功能
};
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

/* 卡片悬停效果 */
.goal-main {
  transition: all 0.3s ease;
}

.goal-main:hover {
  box-shadow: 0 8px 32px rgba(var(--v-theme-primary), 0.1);
}

/* 空状态优化 */
.v-empty-state {
  opacity: 0.8;
  transition: all 0.3s ease;
}

.v-empty-state:hover {
  opacity: 1;
}

/* 徽章样式优化 */
.v-badge {
  font-size: 0.75rem;
  font-weight: 600;
}

/* 头像样式优化 */
.v-avatar {
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.2);
}
</style>

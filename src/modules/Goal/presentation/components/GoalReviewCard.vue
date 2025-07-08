<template>
    <v-dialog
      v-model="$props.visible"
      max-width="900"
      max-height="90vh"
      persistent
      scrollable
      class="goal-review-dialog"
    >
      <v-card class="review-card">
        <!-- 对话框头部 -->
        <v-card-title class="review-header pa-6">
          <div class="d-flex align-center justify-space-between w-100">
            <div class="d-flex align-center">
              <v-icon color="primary" size="28" class="mr-3">mdi-book-edit</v-icon>
              <span class="text-h5 font-weight-bold">复盘记录</span>
            </div>
            
            <v-btn
              icon="mdi-close"
              variant="text"
              color="medium-emphasis"
              @click="handleClose"
            >
              <v-icon>mdi-close</v-icon>
              <v-tooltip activator="parent" location="bottom">
                关闭
              </v-tooltip>
            </v-btn>
          </div>
        </v-card-title>
  
        <v-divider />
  
        <!-- 复盘列表内容 -->
        <v-card-text class="review-content pa-6">
          <!-- 空状态 -->
          <v-empty-state
            v-if="!allReviews?.length"
            icon="mdi-book-edit-outline"
            title="暂无复盘记录"
            text="开始记录您的目标复盘，追踪成长轨迹"
            class="my-8"
          >
            <template v-slot:actions>
              <v-btn
                color="primary"
                variant="elevated"
                prepend-icon="mdi-plus"
                @click="handleCreate"
              >
                创建复盘记录
              </v-btn>
            </template>
          </v-empty-state>
  
          <!-- 复盘记录列表 -->
          <div v-else class="review-list">
            <v-card
              v-for="review in displayReviews"
              :key="review.id"
              class="review-item mb-4"
              variant="outlined"
              elevation="0"
              :hover="true"
            >
              <v-card-text class="pa-4">
                <v-row align="center">
                  <!-- 左侧信息 -->
                  <v-col cols="12" md="8">
                    <div class="review-info">
                      <!-- 复盘标题 -->
                      <div class="d-flex align-center mb-2">
                        <v-icon :color="getReviewTypeColor(review.type)" size="16" class="mr-2">
                          {{ getReviewTypeIcon(review.type) }}
                        </v-icon>
                        <span class="text-h6 font-weight-medium">{{ review.title }}</span>
                        <v-chip 
                          :color="getReviewTypeColor(review.type)" 
                          size="small" 
                          variant="tonal" 
                          class="ml-2"
                        >
                          {{ getReviewTypeText(review.type) }}
                        </v-chip>
                      </div>
                      
                      <!-- 时间信息 -->
                      <div class="d-flex align-center mb-2">
                        <v-icon color="primary" size="16" class="mr-2">mdi-clock-outline</v-icon>
                        <span class="text-body-2 text-medium-emphasis">
                          {{ formatDateWithTemplate(new Date(review.reviewDate.timestamp), 'YYYY/MM/DD HH:mm') }}
                        </span>
                      </div>
                      
                      <!-- 复盘内容预览 -->
                      <div v-if="review.content.achievements" class="d-flex align-center">
                        <v-icon color="info" size="16" class="mr-2">mdi-text-short</v-icon>
                        <span class="text-body-2 text-medium-emphasis text-truncate">
                          成果: {{ review.content.achievements.substring(0, 50) }}...
                        </span>
                      </div>
                    </div>
                  </v-col>
  
                  <!-- 右侧操作按钮 -->
                  <v-col cols="12" md="4" class="d-flex justify-end align-center">
                    <div class="action-buttons">
                      <v-btn
                        color="primary"
                        variant="outlined"
                        size="small"
                        prepend-icon="mdi-eye"
                        class="mr-2"
                        @click="handleView(review.id)"
                      >
                        查看
                      </v-btn>
                      
                      <v-btn
                        color="primary"
                        variant="text"
                        size="small"
                        prepend-icon="mdi-pencil"
                        class="mr-2"
                        @click="handleEdit(review.id)"
                      >
                        编辑
                      </v-btn>
                      
                      <v-btn
                        color="error"
                        variant="text"
                        size="small"
                        icon="mdi-delete"
                        @click="handleDelete(review.id)"
                      >
                        <v-icon>mdi-delete</v-icon>
                        <v-tooltip activator="parent" location="bottom">
                          删除记录
                        </v-tooltip>
                      </v-btn>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import { useGoalReview } from '../composables/useGoalReview';
  import { formatDateWithTemplate } from '@/shared/utils/dateUtils';
  import type { IGoalReview } from '@/modules/Goal/domain/types/goal';
  
  const props = defineProps<{
    visible: boolean;
    goalId?: string;
  }>();
  
  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'edit', reviewId: string): void;
    (e: 'delete', reviewId: string): void;
    (e: 'view', reviewId: string): void;
    (e: 'create'): void;
  }>();
  
  const { allReviews } = useGoalReview();
  
  // 计算属性 - 根据目标ID筛选复盘记录
  const displayReviews = computed(() => {
    if (props.goalId) {
      return allReviews.value.filter(review => review.goalId === props.goalId);
    }
    return allReviews.value;
  });
  
  // 复盘类型相关方法
  const getReviewTypeColor = (type: IGoalReview['type']): string => {
    const colors = {
      weekly: 'primary',
      monthly: 'secondary',
      midterm: 'warning',
      final: 'success',
      custom: 'info'
    };
    return colors[type] || 'primary';
  };
  
  const getReviewTypeIcon = (type: IGoalReview['type']): string => {
    const icons = {
      weekly: 'mdi-calendar-week',
      monthly: 'mdi-calendar-month',
      midterm: 'mdi-calendar-check',
      final: 'mdi-trophy',
      custom: 'mdi-calendar-star'
    };
    return icons[type] || 'mdi-calendar';
  };
  
  const getReviewTypeText = (type: IGoalReview['type']): string => {
    const texts = {
      weekly: '周复盘',
      monthly: '月复盘',
      midterm: '中期复盘',
      final: '最终复盘',
      custom: '自定义复盘'
    };
    return texts[type] || '复盘';
  };
  
  // 事件处理
  const handleClose = () => emit('close');
  
  const handleEdit = (reviewId: string) => {
    emit('edit', reviewId);
    handleClose();
  };
  
  const handleDelete = (reviewId: string) => {
    if (confirm('确定要删除这条复盘记录吗？')) {
      emit('delete', reviewId);
    }
  };
  
  const handleView = (reviewId: string) => {
    emit('view', reviewId);
    handleClose();
  };
  
  const handleCreate = () => {
    emit('create');
    handleClose();
  };
  </script>
  
  <style scoped>
  .review-card {
    border-radius: 16px;
    overflow: hidden;
  }
  
  .review-header {
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-primary), 0.02) 100%);
  }
  
  .review-content {
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .review-item {
    border-radius: 12px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(var(--v-theme-outline), 0.12);
  }
  
  .review-item:hover {
    border-color: rgba(var(--v-theme-primary), 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  
  .action-buttons {
    gap: 8px;
  }
  
  /* 滚动条美化 */
  .review-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .review-content::-webkit-scrollbar-track {
    background: rgba(var(--v-theme-surface-variant), 0.1);
    border-radius: 3px;
  }
  
  .review-content::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-primary), 0.3);
    border-radius: 3px;
  }
  
  .review-content::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--v-theme-primary), 0.5);
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .action-buttons {
      width: 100%;
      justify-content: flex-start;
      margin-top: 8px;
    }
  }
  </style>
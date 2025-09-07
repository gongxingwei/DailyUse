<template>
  <!-- 只在 goal 存在时渲染对话框，防止 props 校验警告 -->
  <v-dialog
    v-if="goal"
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
          <v-btn icon="mdi-close" variant="text" color="medium-emphasis" @click="handleClose">
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
          v-if="!goal.reviews?.length"
          icon="mdi-book-edit-outline"
          title="暂无复盘记录"
          text="开始记录您的目标复盘，追踪成长轨迹"
          class="my-8"
        />
        <!-- 复盘记录列表 -->
        <div v-else class="review-list">
          <v-card
            v-for="review in goal.reviews"
            :key="review.uuid"
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
                      <v-chip :color="getReviewTypeColor(review.type)" size="small" variant="tonal" class="ml-2">
                        {{ getReviewTypeText(review.type) }}
                      </v-chip>
                    </div>
                    <!-- 时间信息 -->
                    <div class="d-flex align-center mb-2">
                      <v-icon color="primary" size="16" class="mr-2">mdi-clock-outline</v-icon>
                      <span class="text-body-2 text-medium-emphasis">
                        {{ format(review.reviewDate, 'yyyy/MM/dd HH:mm') }}
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
                      @click="handleView(review.uuid)"
                    >
                      查看
                    </v-btn>
                    <v-btn
                      color="error"
                      variant="text"
                      size="small"
                      icon="mdi-delete"
                      @click="handleDelete(review.uuid)"
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
import { GoalReview } from '@renderer/modules/Goal/domain/entities/goalReview';
import { Goal } from '@renderer/modules/Goal/domain/aggregates/goal';
import { format } from 'date-fns';

// 允许 goal 为 null，防止类型校验警告
defineProps<{
  visible: boolean;
  goal: Goal | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'delete', reviewId: string): void;
  (e: 'view', reviewId: string): void;
  (e: 'update:modelValue', value: boolean): void;
}>();

// 复盘类型相关方法
const getReviewTypeColor = (type: GoalReview['type']): string => {
  const colors = {
    weekly: 'primary',
    monthly: 'secondary',
    midterm: 'warning',
    final: 'success',
    custom: 'info'
  };
  return colors[type] || 'primary';
};

const getReviewTypeIcon = (type: GoalReview['type']): string => {
  const icons = {
    weekly: 'mdi-calendar-week',
    monthly: 'mdi-calendar-month',
    midterm: 'mdi-calendar-check',
    final: 'mdi-trophy',
    custom: 'mdi-calendar-star'
  };
  return icons[type] || 'mdi-calendar';
};

const getReviewTypeText = (type: GoalReview['type']): string => {
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

const handleDelete = (reviewId: string) => {
  if (confirm('确定要删除这条复盘记录吗？')) {
    emit('delete', reviewId);
  }
};

const handleView = (reviewId: string) => {
  emit('view', reviewId);
  handleClose();
};
</script>

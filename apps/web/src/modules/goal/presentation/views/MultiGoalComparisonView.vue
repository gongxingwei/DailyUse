<!--
  MultiGoalComparisonView.vue
  多目标对比主视图 - STORY-016
-->

<template>
  <v-container fluid class="multi-goal-comparison-view pa-4">
    <!-- 页面标题 -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" />
          <h1 class="text-h4 ml-2">
            <v-icon class="mr-2">mdi-compare</v-icon>
            多目标对比分析
          </h1>
          <v-spacer />

          <!-- 导出按钮 -->
          <v-btn
            v-if="selectedGoals.length >= 2"
            color="primary"
            prepend-icon="mdi-download"
            @click="handleExport"
          >
            导出对比
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- 目标选择器 -->
    <v-row v-if="selectedGoals.length < 2">
      <v-col cols="12" md="8" offset-md="2" lg="6" offset-lg="3">
        <multi-goal-selector ref="selectorRef" @compare="handleGoalSelection" />
      </v-col>
    </v-row>

    <!-- 已选目标卡片 -->
    <v-row v-if="selectedGoals.length >= 2">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-target-variant</v-icon>
            已选目标 ({{ selectedGoals.length }})

            <v-spacer />

            <v-btn variant="text" size="small" prepend-icon="mdi-pencil" @click="resetSelection">
              重新选择
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-chip
              v-for="goal in selectedGoals"
              :key="goal.uuid"
              class="mr-2"
              :color="goal.color || 'primary'"
              closable
              @click:close="removeGoal(goal.uuid)"
            >
              <v-icon start>mdi-target</v-icon>
              {{ goal.title }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 对比视图网格 -->
    <v-row v-if="selectedGoals.length >= 2" class="mt-4">
      <v-col v-for="goal in selectedGoals" :key="goal.uuid" :cols="getColSize()">
        <v-card class="goal-card" elevation="2">
          <v-card-title class="d-flex align-center">
            <v-chip size="small" :color="goal.color || 'primary'" class="mr-2">
              <v-icon start>mdi-target</v-icon>
            </v-chip>
            <span class="text-h6">{{ goal.title }}</span>

            <v-spacer />

            <!-- 目标状态 -->
            <v-chip size="small" :color="getStatusColor(goal)">
              {{ getStatusText(goal) }}
            </v-chip>
          </v-card-title>

          <v-card-text>
            <!-- 目标基本信息 -->
            <div class="mb-4">
              <div class="text-caption text-grey mb-1">描述</div>
              <div class="text-body-2">
                {{ goal.description || '暂无描述' }}
              </div>
            </div>

            <!-- 关键指标 -->
            <v-row dense class="mb-4">
              <v-col cols="6">
                <v-card variant="outlined" class="pa-2">
                  <div class="text-caption text-grey">进度</div>
                  <div class="text-h6 text-primary">{{ goal.progressPercentage || 0 }}%</div>
                </v-card>
              </v-col>
              <v-col cols="6">
                <v-card variant="outlined" class="pa-2">
                  <div class="text-caption text-grey">关键结果</div>
                  <div class="text-h6 text-success">{{ goal.keyResults?.length || 0 }} 个</div>
                </v-card>
              </v-col>
            </v-row>

            <!-- DAG 可视化 -->
            <div class="dag-preview mt-4">
              <goal-dag-visualization
                :ref="(el: any) => registerDagRef(goal.uuid, el)"
                :goal-uuid="goal.uuid"
                :sync-viewport="true"
                :compact="true"
                @viewport-change="(viewport: any) => handleViewportChange(goal.uuid, viewport)"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 对比统计面板 -->
    <v-row v-if="selectedGoals.length >= 2" class="mt-4">
      <v-col cols="12">
        <comparison-stats-panel :goals="selectedGoals" />
      </v-col>
    </v-row>

    <!-- 空状态 -->
    <v-row v-if="selectedGoals.length === 0">
      <v-col cols="12" class="text-center pa-12">
        <v-icon size="120" color="grey-lighten-2"> mdi-compare </v-icon>
        <h2 class="text-h5 text-grey mt-4">选择目标开始对比</h2>
        <p class="text-body-1 text-grey mt-2">请使用上方的选择器选择 2-4 个目标进行对比分析</p>
      </v-col>
    </v-row>

    <!-- 导出对话框 -->
    <v-dialog v-model="exportDialog" max-width="400">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-download</v-icon>
          导出对比视图
        </v-card-title>

        <v-card-text>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            将当前对比视图导出为 PNG 图片
          </v-alert>

          <div class="export-info">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2" size="small">mdi-check-circle</v-icon>
              <span class="text-body-2">包含 {{ selectedGoals.length }} 个目标</span>
            </div>
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2" size="small">mdi-check-circle</v-icon>
              <span class="text-body-2">包含 DAG 可视化图</span>
            </div>
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2" size="small">mdi-check-circle</v-icon>
              <span class="text-body-2">包含对比统计数据</span>
            </div>
            <div class="d-flex align-center">
              <v-icon class="mr-2" size="small">mdi-check-circle</v-icon>
              <span class="text-body-2">高分辨率输出 (2x)</span>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="exportDialog = false"> 取消 </v-btn>
          <v-btn color="primary" variant="elevated" @click="confirmExport">
            <v-icon start>mdi-download</v-icon>
            导出
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import MultiGoalSelector from '../components/comparison/MultiGoalSelector.vue';
import GoalDAGVisualization from '../components/dag/GoalDAGVisualization.vue';
import ComparisonStatsPanel from '../components/comparison/ComparisonStatsPanel.vue';

// Router
const router = useRouter();

// State
const selectedGoals = ref<any[]>([]);
const selectorRef = ref<InstanceType<typeof MultiGoalSelector> | null>(null);
const dagRefs = ref<Map<string, InstanceType<typeof GoalDAGVisualization>>>(new Map());
const exportDialog = ref(false);

// 视口同步状态
const currentViewport = ref<{ zoom: number; center: [number, number] } | null>(null);
const isUpdatingViewport = ref(false);

// Methods
const handleGoalSelection = (goals: any[]) => {
  selectedGoals.value = goals;
  // 清空 DAG refs
  dagRefs.value.clear();
};

const removeGoal = (goalUuid: string) => {
  const index = selectedGoals.value.findIndex((g) => g.uuid === goalUuid);
  if (index !== -1) {
    selectedGoals.value.splice(index, 1);
    dagRefs.value.delete(goalUuid);
  }
};

const resetSelection = () => {
  selectedGoals.value = [];
  dagRefs.value.clear();
  selectorRef.value?.clearSelection();
};

const goBack = () => {
  router.push('/goals');
};

const handleExport = () => {
  exportDialog.value = true;
};

const confirmExport = async () => {
  if (selectedGoals.value.length < 2) {
    console.warn('至少需要 2 个目标才能导出对比视图');
    exportDialog.value = false;
    return;
  }

  try {
    // 使用 html2canvas 捕获整个对比视图
    const { default: html2canvas } = await import('html2canvas');

    // 获取对比视图容器
    const comparisonContainer = document.querySelector('.multi-goal-comparison-view');
    if (!comparisonContainer) {
      console.error('找不到对比视图容器');
      exportDialog.value = false;
      return;
    }

    // 关闭对话框
    exportDialog.value = false;

    // 等待对话框关闭动画完成
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 生成截图
    const canvas = await html2canvas(comparisonContainer as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 2, // 高分辨率
      logging: false,
      useCORS: true,
    });

    // 转换为 Blob 并下载
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `goal-comparison-${selectedGoals.value.length}-goals-${timestamp}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        console.log('对比视图已导出');
      }
    }, 'image/png');
  } catch (error) {
    console.error('导出对比视图失败:', error);
    exportDialog.value = false;
  }
};

// 视口同步处理
const handleViewportChange = (
  goalUuid: string,
  viewport: { zoom: number; center: [number, number] },
) => {
  if (isUpdatingViewport.value) return;

  isUpdatingViewport.value = true;
  currentViewport.value = viewport;

  // 同步所有其他 DAG 图表
  dagRefs.value.forEach((dagRef, uuid) => {
    if (uuid !== goalUuid && dagRef && dagRef.updateViewport) {
      dagRef.updateViewport(viewport);
    }
  });

  // 延迟重置标志
  setTimeout(() => {
    isUpdatingViewport.value = false;
  }, 100);
};

// 注册 DAG 组件引用
const registerDagRef = (goalUuid: string, ref: any) => {
  if (ref) {
    dagRefs.value.set(goalUuid, ref);
  }
};

// UI Helpers
const getColSize = (): number => {
  const count = selectedGoals.value.length;
  if (count === 2) return 6; // 2列
  if (count === 3) return 4; // 3列
  return 3; // 4列
};

const getStatusColor = (goal: any): string => {
  const colorMap: Record<string, string> = {
    NOT_STARTED: 'grey',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    ARCHIVED: 'warning',
  };
  return colorMap[goal.status] || 'default';
};

const getStatusText = (goal: any): string => {
  const textMap: Record<string, string> = {
    NOT_STARTED: '未开始',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    ARCHIVED: '已归档',
  };
  return textMap[goal.status] || goal.status;
};
</script>

<style scoped>
.multi-goal-comparison-view {
  min-height: 100vh;
}

.goal-card {
  height: 100%;
}

.dag-preview {
  margin-top: 16px;
}
</style>

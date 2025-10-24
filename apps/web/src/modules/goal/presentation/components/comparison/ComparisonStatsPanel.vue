<!--
  ComparisonStatsPanel.vue
  多目标对比统计面板 - 显示详细的对比指标
-->

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-chart-box</v-icon>
      对比统计分析

      <v-spacer />

      <!-- 视图切换 -->
      <v-btn-toggle v-model="viewMode" density="compact" mandatory divided>
        <v-btn value="table" size="small">
          <v-icon>mdi-table</v-icon>
        </v-btn>
        <v-btn value="chart" size="small">
          <v-icon>mdi-chart-bar</v-icon>
        </v-btn>
      </v-btn-toggle>
    </v-card-title>

    <v-card-text>
      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'">
        <v-simple-table>
          <template #default>
            <thead>
              <tr>
                <th class="text-left font-weight-bold">指标</th>
                <th v-for="goal in goals" :key="goal.uuid" class="text-left">
                  <div class="d-flex align-center">
                    <v-chip size="x-small" :color="goal.color || 'primary'" class="mr-2" />
                    <span class="text-subtitle-2">{{ goal.title }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 关键结果数量 -->
              <tr>
                <td class="font-weight-medium">关键结果数量</td>
                <td v-for="goal in goals" :key="`kr-count-${goal.uuid}`">
                  <v-chip size="small" color="primary" variant="outlined">
                    {{ getKRCount(goal) }} 个
                  </v-chip>
                </td>
              </tr>

              <!-- 整体进度 -->
              <tr>
                <td class="font-weight-medium">整体进度</td>
                <td v-for="goal in goals" :key="`progress-${goal.uuid}`">
                  <div class="d-flex align-center">
                    <v-progress-linear
                      :model-value="getProgress(goal)"
                      :color="getProgressColor(getProgress(goal))"
                      height="8"
                      rounded
                      class="flex-grow-1"
                    />
                    <span class="text-caption ml-2 font-weight-bold">
                      {{ getProgress(goal) }}%
                    </span>
                  </div>
                </td>
              </tr>

              <!-- 权重总和 -->
              <tr>
                <td class="font-weight-medium">权重总和</td>
                <td v-for="goal in goals" :key="`weight-${goal.uuid}`">
                  <v-chip
                    size="small"
                    :color="getTotalWeight(goal) === 100 ? 'success' : 'error'"
                    variant="flat"
                  >
                    {{ getTotalWeight(goal) }}%
                  </v-chip>
                </td>
              </tr>

              <!-- 平均权重 -->
              <tr>
                <td class="font-weight-medium">平均权重</td>
                <td v-for="goal in goals" :key="`avg-weight-${goal.uuid}`">
                  <span class="text-body-2"> {{ getAverageWeight(goal) }}% </span>
                </td>
              </tr>

              <!-- 状态 -->
              <tr>
                <td class="font-weight-medium">状态</td>
                <td v-for="goal in goals" :key="`status-${goal.uuid}`">
                  <v-chip size="small" :color="getStatusColor(goal)">
                    {{ getStatusText(goal) }}
                  </v-chip>
                </td>
              </tr>

              <!-- 创建时间 -->
              <tr>
                <td class="font-weight-medium">创建时间</td>
                <td v-for="goal in goals" :key="`created-${goal.uuid}`" class="text-caption">
                  {{ formatDate(goal.createdAt) }}
                </td>
              </tr>

              <!-- 更新时间 -->
              <tr>
                <td class="font-weight-medium">最后更新</td>
                <td v-for="goal in goals" :key="`updated-${goal.uuid}`" class="text-caption">
                  {{ formatDate(goal.updatedAt) }}
                </td>
              </tr>

              <!-- 时间跨度 -->
              <tr>
                <td class="font-weight-medium">活跃天数</td>
                <td v-for="goal in goals" :key="`days-${goal.uuid}`">
                  <span class="text-body-2"> {{ getActiveDays(goal) }} 天 </span>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </div>

      <!-- 图表视图 -->
      <div v-else class="chart-view">
        <v-row>
          <!-- 关键结果数量对比 -->
          <v-col cols="12" md="6">
            <div class="chart-card pa-4">
              <div class="text-subtitle-2 mb-3 font-weight-bold">关键结果数量对比</div>
              <div class="d-flex align-center justify-space-around">
                <div v-for="goal in goals" :key="`kr-chart-${goal.uuid}`" class="text-center">
                  <div
                    class="stat-circle"
                    :style="{
                      backgroundColor: goal.color || '#2196F3',
                      width: `${Math.max(60, getKRCount(goal) * 10)}px`,
                      height: `${Math.max(60, getKRCount(goal) * 10)}px`,
                    }"
                  >
                    <div class="stat-value">{{ getKRCount(goal) }}</div>
                  </div>
                  <div class="text-caption mt-2">{{ goal.title }}</div>
                </div>
              </div>
            </div>
          </v-col>

          <!-- 进度对比 -->
          <v-col cols="12" md="6">
            <div class="chart-card pa-4">
              <div class="text-subtitle-2 mb-3 font-weight-bold">进度对比</div>
              <div v-for="goal in goals" :key="`progress-chart-${goal.uuid}`" class="mb-3">
                <div class="d-flex align-center mb-1">
                  <v-chip size="x-small" :color="goal.color || 'primary'" class="mr-2" />
                  <span class="text-caption">{{ goal.title }}</span>
                  <v-spacer />
                  <span class="text-caption font-weight-bold"> {{ getProgress(goal) }}% </span>
                </div>
                <v-progress-linear
                  :model-value="getProgress(goal)"
                  :color="getProgressColor(getProgress(goal))"
                  height="12"
                  rounded
                />
              </div>
            </div>
          </v-col>

          <!-- 权重分布 -->
          <v-col cols="12">
            <div class="chart-card pa-4">
              <div class="text-subtitle-2 mb-3 font-weight-bold">权重分布分析</div>
              <v-row>
                <v-col
                  v-for="goal in goals"
                  :key="`weight-dist-${goal.uuid}`"
                  :cols="12 / goals.length"
                >
                  <div class="text-center mb-2">
                    <v-chip size="small" :color="goal.color || 'primary'">
                      {{ goal.title }}
                    </v-chip>
                  </div>
                  <div class="weight-stats">
                    <div class="stat-row">
                      <span class="text-caption">总和:</span>
                      <v-chip
                        size="x-small"
                        :color="getTotalWeight(goal) === 100 ? 'success' : 'error'"
                      >
                        {{ getTotalWeight(goal) }}%
                      </v-chip>
                    </div>
                    <div class="stat-row">
                      <span class="text-caption">平均:</span>
                      <span class="text-body-2 font-weight-bold">
                        {{ getAverageWeight(goal) }}%
                      </span>
                    </div>
                    <div class="stat-row">
                      <span class="text-caption">最大:</span>
                      <span class="text-body-2">{{ getMaxWeight(goal) }}%</span>
                    </div>
                    <div class="stat-row">
                      <span class="text-caption">最小:</span>
                      <span class="text-body-2">{{ getMinWeight(goal) }}%</span>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- 汇总洞察 -->
      <v-divider class="my-4" />

      <div class="insights-section">
        <div class="text-subtitle-2 mb-3 font-weight-bold">
          <v-icon class="mr-2" size="small">mdi-lightbulb-on</v-icon>
          对比洞察
        </div>

        <v-row>
          <v-col cols="12" md="4">
            <v-card variant="outlined" class="pa-3">
              <div class="text-caption text-grey mb-1">进度最快</div>
              <div class="d-flex align-center">
                <v-chip
                  size="small"
                  :color="getHighestProgressGoal()?.color || 'success'"
                  class="mr-2"
                />
                <span class="text-body-2 font-weight-bold">
                  {{ getHighestProgressGoal()?.title || '-' }}
                </span>
                <v-spacer />
                <span class="text-h6 text-success">
                  {{ getProgress(getHighestProgressGoal()) }}%
                </span>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card variant="outlined" class="pa-3">
              <div class="text-caption text-grey mb-1">KR 数量最多</div>
              <div class="d-flex align-center">
                <v-chip size="small" :color="getMostKRsGoal()?.color || 'primary'" class="mr-2" />
                <span class="text-body-2 font-weight-bold">
                  {{ getMostKRsGoal()?.title || '-' }}
                </span>
                <v-spacer />
                <span class="text-h6 text-primary">
                  {{ getKRCount(getMostKRsGoal()) }}
                </span>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card variant="outlined" class="pa-3">
              <div class="text-caption text-grey mb-1">活跃时间最长</div>
              <div class="d-flex align-center">
                <v-chip size="small" :color="getOldestGoal()?.color || 'warning'" class="mr-2" />
                <span class="text-body-2 font-weight-bold">
                  {{ getOldestGoal()?.title || '-' }}
                </span>
                <v-spacer />
                <span class="text-h6 text-warning"> {{ getActiveDays(getOldestGoal()) }}天 </span>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  goals: any[];
}>();

// State
const viewMode = ref<'table' | 'chart'>('table');

// Helper Methods
const getKRCount = (goal: any): number => {
  return goal?.keyResults?.length || 0;
};

const getProgress = (goal: any): number => {
  return goal?.progressPercentage || 0;
};

const getTotalWeight = (goal: any): number => {
  if (!goal?.keyResults) return 0;
  return goal.keyResults.reduce((sum: number, kr: any) => sum + (kr.weight || 0), 0);
};

const getAverageWeight = (goal: any): number => {
  const count = getKRCount(goal);
  if (count === 0) return 0;
  return Math.round(getTotalWeight(goal) / count);
};

const getMaxWeight = (goal: any): number => {
  if (!goal?.keyResults || goal.keyResults.length === 0) return 0;
  return Math.max(...goal.keyResults.map((kr: any) => kr.weight || 0));
};

const getMinWeight = (goal: any): number => {
  if (!goal?.keyResults || goal.keyResults.length === 0) return 0;
  return Math.min(...goal.keyResults.map((kr: any) => kr.weight || 0));
};

const getActiveDays = (goal: any): number => {
  if (!goal?.createdAt) return 0;
  const now = Date.now();
  const created = goal.createdAt;
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
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

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'success';
  if (progress >= 50) return 'primary';
  if (progress >= 20) return 'warning';
  return 'error';
};

const formatDate = (timestamp: number | null | undefined): string => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Insights
const getHighestProgressGoal = () => {
  if (!props.goals || props.goals.length === 0) return null;
  return props.goals.reduce((max, goal) => (getProgress(goal) > getProgress(max) ? goal : max));
};

const getMostKRsGoal = () => {
  if (!props.goals || props.goals.length === 0) return null;
  return props.goals.reduce((max, goal) => (getKRCount(goal) > getKRCount(max) ? goal : max));
};

const getOldestGoal = () => {
  if (!props.goals || props.goals.length === 0) return null;
  return props.goals.reduce((oldest, goal) =>
    (goal.createdAt || 0) < (oldest.createdAt || 0) ? goal : oldest,
  );
};
</script>

<style scoped>
.v-simple-table {
  width: 100%;
}

.v-simple-table th,
.v-simple-table td {
  padding: 12px 16px !important;
}

.chart-view {
  min-height: 300px;
}

.chart-card {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  height: 100%;
}

.stat-circle {
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  transition: all 0.3s ease;
}

.stat-value {
  font-size: 24px;
}

.weight-stats {
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.insights-section {
  margin-top: 16px;
}
</style>

<template>
  <div class="goal-dag-visualization">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-graph-outline</v-icon>
        目标权重分布图
        
        <v-spacer />
        
        <!-- 权重总和警告 -->
        <v-chip
          v-if="totalWeight !== 100"
          color="error"
          size="small"
          class="mr-2"
        >
          <v-icon start>mdi-alert</v-icon>
          权重总和: {{ totalWeight }}%
        </v-chip>
        
        <!-- 布局类型切换 -->
        <v-btn-toggle
          v-model="layoutType"
          density="compact"
          mandatory
          divided
        >
          <v-btn value="force" size="small">
            <v-icon start>mdi-lightning-bolt</v-icon>
            力导向
          </v-btn>
          <v-btn value="hierarchical" size="small">
            <v-icon start>mdi-file-tree</v-icon>
            分层
          </v-btn>
        </v-btn-toggle>
        
        <!-- 重置布局按钮 -->
        <v-btn
          v-if="hasCustomLayout"
          icon="mdi-refresh"
          variant="text"
          size="small"
          class="ml-2"
          @click="resetLayout"
        >
          <v-icon>mdi-refresh</v-icon>
          <v-tooltip activator="parent" location="bottom">
            重置布局
          </v-tooltip>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- 权重异常提示 -->
        <v-alert
          v-if="totalWeight !== 100"
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          <template #title>权重分配异常</template>
          当前所有 KeyResult 权重总和为 {{ totalWeight }}%，应该为 100%。
          请调整各 KeyResult 的权重值。
        </v-alert>

        <!-- 加载状态 -->
        <v-progress-linear v-if="isLoading" indeterminate color="primary" />

        <!-- 空状态 -->
        <v-alert
          v-else-if="!currentGoal || !hasKeyResults"
          type="info"
          variant="tonal"
        >
          {{ !currentGoal ? '正在加载目标数据...' : '该 Goal 暂无 KeyResult' }}
        </v-alert>

        <!-- DAG 图表 -->
        <div v-else ref="containerRef" class="dag-container">
          <v-chart
            ref="chartRef"
            class="chart"
            :option="dagOption"
            autoresize
            @click="handleNodeClick"
          />
        </div>

        <!-- 图例说明 -->
        <div v-if="hasKeyResults" class="legend-section mt-4">
          <v-divider class="mb-3" />
          <div class="d-flex align-center flex-wrap gap-3">
            <v-chip size="small" color="primary" variant="flat">
              <v-icon start>mdi-circle</v-icon>
              Goal 节点
            </v-chip>
            <v-chip size="small" color="success" variant="flat">
              <v-icon start>mdi-circle</v-icon>
              权重 70-100%
            </v-chip>
            <v-chip size="small" color="warning" variant="flat">
              <v-icon start>mdi-circle</v-icon>
              权重 30-70%
            </v-chip>
            <v-chip size="small" color="error" variant="flat">
              <v-icon start>mdi-circle</v-icon>
              权重 0-30%
            </v-chip>
            <v-spacer />
            <div class="text-caption text-grey">
              节点大小表示权重，边宽度表示权重占比
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { use } from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import VChart from 'vue-echarts';
import { useGoal } from '../../composables/useGoal';
import { useResizeObserver } from '@vueuse/core';

use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GraphChart,
  CanvasRenderer,
]);

const props = defineProps<{
  goalUuid: string;
}>();

const emit = defineEmits<{
  (e: 'node-click', data: { id: string; type: 'goal' | 'kr' }): void;
}>();

const { currentGoal, isLoading, getGoalAggregateView } = useGoal();
const chartRef = ref();
const containerRef = ref<HTMLElement>();
const layoutType = ref<'force' | 'hierarchical'>('force');
const hasCustomLayout = ref(false);
const containerSize = ref({ width: 800, height: 600 });

// 计算属性
const hasKeyResults = computed(() => {
  return currentGoal.value?.keyResults && currentGoal.value.keyResults.length > 0;
});

const totalWeight = computed(() => {
  if (!currentGoal.value?.keyResults) return 0;
  return currentGoal.value.keyResults.reduce((sum: number, kr: any) => sum + kr.weight, 0);
});

// 颜色映射函数
const getWeightColor = (weight: number): string => {
  if (weight >= 70) return '#4CAF50'; // 绿色 - 高权重
  if (weight >= 30) return '#FF9800'; // 橙色 - 中权重
  return '#F44336'; // 红色 - 低权重
};

// 分层布局计算
const calculateHierarchicalLayout = () => {
  if (!currentGoal.value) return { nodes: [], links: [] };

  const containerWidth = 800;
  const goalY = 100;
  const krY = 300;
  const krs = currentGoal.value.keyResults;

  const nodes = [];
  
  // Goal 节点居中
  nodes.push({
    id: currentGoal.value.uuid,
    name: currentGoal.value.title,
    x: containerWidth / 2,
    y: goalY,
    symbolSize: 80,
    itemStyle: { color: '#2196F3' },
    category: 0,
    fixed: true,
  });

  // KR 节点均匀分布
  const krSpacing = krs.length > 1 ? containerWidth / (krs.length + 1) : containerWidth / 2;
  krs.forEach((kr: any, index: number) => {
    nodes.push({
      id: kr.uuid,
      name: kr.title,
      value: kr.weight,
      x: krSpacing * (index + 1),
      y: krY,
      symbolSize: 40 + kr.weight * 0.4,
      itemStyle: { color: getWeightColor(kr.weight) },
      category: 1,
      fixed: true,
    });
  });

  const links = krs.map((kr: any) => ({
    source: currentGoal.value!.uuid,
    target: kr.uuid,
    lineStyle: {
      width: Math.max(1, kr.weight / 10),
      color: totalWeight.value !== 100 ? '#f44336' : '#999',
    },
  }));

  return { nodes, links };
};

// Force 布局配置
const calculateForceLayout = () => {
  if (!currentGoal.value) return { nodes: [], links: [] };

  const krs = currentGoal.value.keyResults;

  const nodes = [
    {
      id: currentGoal.value.uuid,
      name: currentGoal.value.title,
      symbolSize: 80,
      itemStyle: { color: '#2196F3' },
      category: 0,
    },
    ...krs.map((kr: any) => ({
      id: kr.uuid,
      name: kr.title,
      value: kr.weight,
      symbolSize: 40 + kr.weight * 0.4,
      itemStyle: { color: getWeightColor(kr.weight) },
      category: 1,
    })),
  ];

  const links = krs.map((kr: any) => ({
    source: currentGoal.value!.uuid,
    target: kr.uuid,
    lineStyle: {
      width: Math.max(1, kr.weight / 10),
      color: totalWeight.value !== 100 ? '#f44336' : '#999',
    },
  }));

  return { nodes, links };
};

// DAG 图表配置
const dagOption = computed<EChartsOption>(() => {
  if (!currentGoal.value || !hasKeyResults.value) return {};

  // 从 localStorage 加载保存的布局
  const savedLayout = loadLayout(props.goalUuid);
  
  let graphData;
  if (layoutType.value === 'hierarchical') {
    graphData = calculateHierarchicalLayout();
  } else {
    graphData = calculateForceLayout();
  }

  // 应用保存的坐标
  if (savedLayout && layoutType.value === 'force') {
    graphData.nodes.forEach((node: any) => {
      const saved = savedLayout.find((s: any) => s.id === node.id);
      if (saved) {
        node.x = saved.x;
        node.y = saved.y;
        node.fixed = true;
      }
    });
    hasCustomLayout.value = true;
  } else {
    hasCustomLayout.value = false;
  }

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const isGoal = params.data.category === 0;
          if (isGoal) {
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">
                  <span style="color: #2196F3;">●</span> Goal
                </div>
                <div>${params.data.name}</div>
              </div>
            `;
          } else {
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">
                  <span style="color: ${params.data.itemStyle.color};">●</span> KeyResult
                </div>
                <div>${params.data.name}</div>
                <div style="margin-top: 4px;">
                  <span style="color: #666;">权重:</span> 
                  <span style="font-weight: bold; color: ${params.data.itemStyle.color};">${params.data.value}%</span>
                </div>
              </div>
            `;
          }
        } else if (params.dataType === 'edge') {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold;">权重分配</div>
              <div style="margin-top: 4px; color: #666;">
                边宽度表示权重占比
              </div>
            </div>
          `;
        }
        return '';
      },
    },
    legend: {
      data: ['Goal', 'KeyResult'],
      bottom: 10,
    },
    animationDuration: 1000,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: layoutType.value === 'force' ? 'force' : 'none',
        data: graphData.nodes,
        links: graphData.links,
        categories: [
          { name: 'Goal', itemStyle: { color: '#2196F3' } },
          { name: 'KeyResult' },
        ],
        roam: true,
        draggable: true,
        label: {
          show: true,
          position: 'right',
          fontSize: 12,
          formatter: '{b}',
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 5,
          },
        },
        force: {
          repulsion: 300,
          edgeLength: [150, 250],
          layoutAnimation: true,
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 10],
      },
    ],
  };
});

// 保存布局到 localStorage
const saveLayout = (goalUuid: string, positions: any[]) => {
  try {
    localStorage.setItem(
      `dag-layout-${goalUuid}`,
      JSON.stringify(positions)
    );
    hasCustomLayout.value = true;
  } catch (error) {
    console.error('Failed to save layout:', error);
  }
};

// 从 localStorage 加载布局
const loadLayout = (goalUuid: string) => {
  try {
    const saved = localStorage.getItem(`dag-layout-${goalUuid}`);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load layout:', error);
    return null;
  }
};

// 重置布局
const resetLayout = () => {
  try {
    localStorage.removeItem(`dag-layout-${props.goalUuid}`);
    hasCustomLayout.value = false;
    // 强制重新渲染图表
    nextTick(() => {
      if (chartRef.value) {
        chartRef.value.setOption(dagOption.value, true);
      }
    });
  } catch (error) {
    console.error('Failed to reset layout:', error);
  }
};

// 处理节点点击
const handleNodeClick = (params: any) => {
  if (params.dataType === 'node') {
    const isGoal = params.data.category === 0;
    emit('node-click', {
      id: params.data.id,
      type: isGoal ? 'goal' : 'kr',
    });
  }
};

// 监听拖拽事件保存坐标
watch(chartRef, (chart) => {
  if (chart && layoutType.value === 'force') {
    const instance = chart.chart;
    instance.on('graphRoam', (params: any) => {
      if (params.type === 'graphRoam') {
        // 延迟保存以避免频繁写入
        setTimeout(() => {
          const option = instance.getOption();
          const series = option.series?.[0];
          if (series?.data) {
            const positions = series.data.map((node: any) => ({
              id: node.id,
              x: node.x,
              y: node.y,
            }));
            saveLayout(props.goalUuid, positions);
          }
        }, 500);
      }
    });
  }
});

// 监听布局类型变化，保存到 localStorage
watch(layoutType, (newType) => {
  try {
    localStorage.setItem('dag-layout-type', newType);
  } catch (error) {
    console.error('Failed to save layout type:', error);
  }
});

// 响应式容器尺寸监听
useResizeObserver(containerRef, (entries) => {
  const entry = entries[0];
  const { width, height } = entry.contentRect;
  
  if (width > 0 && height > 0) {
    containerSize.value = { width, height };
    
    // 如果是分层布局，重新计算节点位置
    if (layoutType.value === 'hierarchical') {
      nextTick(() => {
        if (chartRef.value) {
          chartRef.value.setOption(dagOption.value, true);
        }
      });
    }
  }
});

// 初始化
onMounted(async () => {
  // 加载布局类型偏好
  try {
    const savedType = localStorage.getItem('dag-layout-type');
    if (savedType === 'force' || savedType === 'hierarchical') {
      layoutType.value = savedType;
    }
  } catch (error) {
    console.error('Failed to load layout type:', error);
  }

  // 加载 Goal 数据
  if (props.goalUuid && props.goalUuid !== currentGoal.value?.uuid) {
    await getGoalAggregateView(props.goalUuid);
  }
});
</script>

<style scoped>
.goal-dag-visualization {
  width: 100%;
}

.dag-container {
  width: 100%;
  min-width: 600px;
  min-height: 400px;
  height: 600px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
  position: relative;
}

.chart {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.legend-section {
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.gap-3 {
  gap: 12px;
}
</style>

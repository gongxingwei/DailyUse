# STORY-GOAL-002-007: KR 权重快照 - UI 权重趋势图

> **Story ID**: STORY-GOAL-002-007  
> **Epic**: EPIC-GOAL-002 - KR 权重快照  
> **Sprint**: Sprint 2a  
> **Story Points**: 3 SP  
> **优先级**: P1 (Should Have)  
> **负责人**: Frontend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 用户  
**我想要** 查看 KR 权重随时间变化的趋势图  
**以便于** 直观了解权重调整的趋势和规律

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: ECharts 折线图展示

```gherkin
Scenario: 展示权重趋势折线图
  Given 用户打开权重趋势图页面
  When 选择时间范围（如"最近 30 天"）
  Then 应该展示折线图
  And X 轴为时间
  And Y 轴为权重（0-100）
  And 每个 KeyResult 一条折线
  And 不同 KR 使用不同颜色
  And 支持图例点击显示/隐藏折线

Scenario: 折线图交互
  When 鼠标悬停在折线上
  Then 应该显示 Tooltip
  And Tooltip 包含:
    - 时间点
    - KeyResult 名称
    - 权重值
    - 权重变化量
```

### Scenario 2: 时间范围筛选

```gherkin
Scenario: 快速时间范围选择
  When 用户点击"最近 7 天"
  Then 图表应该更新为最近 7 天的数据

  Examples:
  | 快捷选项    | 时间范围        |
  | 最近 7 天   | 今天-7天        |
  | 最近 30 天  | 今天-30天       |
  | 最近 3 个月 | 今天-90天       |
  | 自定义      | 用户选择的范围  |
```

### Scenario 3: 性能优化

```gherkin
Scenario: 大数据量采样
  Given 时间范围内有 1000+ 个快照
  When 加载趋势图
  Then 应该进行数据采样（最多 200 个点）
  And 保留关键转折点
  And 渲染时间 < 500ms
```

---

## 📋 任务清单 (Task Breakdown)

- [ ] **Task 1.1**: 创建 `WeightTrendChart.vue`
  - [ ] 集成 ECharts 5.x
  - [ ] 实现折线图配置
  - [ ] 实现响应式布局

- [ ] **Task 1.2**: 创建时间范围选择器
  - [ ] 快捷选项按钮组
  - [ ] 自定义日期范围选择器

- [ ] **Task 1.3**: 数据采样算法
  - [ ] 实现 LTTB (Largest-Triangle-Three-Buckets) 算法
  - [ ] 或使用 ECharts 内置采样

---

## 🔧 技术实现细节

### WeightTrendChart.vue

```vue
<template>
  <div class="weight-trend-chart">
    <el-card>
      <template #header>
        <div class="header">
          <span>权重趋势</span>
          <TimeRangeSelector v-model="timeRange" />
        </div>
      </template>

      <div ref="chartRef" class="chart-container" style="height: 400px" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import * as echarts from 'echarts';
import { useWeightTrend } from '../composables/useWeightTrend';

const props = defineProps<{
  goalUuid: string;
}>();

const chartRef = ref<HTMLElement>();
const timeRange = ref({ start: Date.now() - 30 * 24 * 60 * 60 * 1000, end: Date.now() });

const { data, isLoading } = useWeightTrend(
  props.goalUuid,
  computed(() => timeRange.value.start),
  computed(() => timeRange.value.end),
);

let chart: echarts.ECharts;

onMounted(() => {
  chart = echarts.init(chartRef.value!);

  const option = {
    title: { text: 'KR 权重趋势' },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        // 自定义 Tooltip
      },
    },
    legend: {
      data: data.value?.keyResults.map((kr) => kr.title) ?? [],
    },
    xAxis: {
      type: 'time',
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '权重 (%)',
    },
    series:
      data.value?.keyResults.map((kr) => ({
        name: kr.title,
        type: 'line',
        data: kr.data.map((d) => [d.time, d.weight]),
        smooth: true,
      })) ?? [],
  };

  chart.setOption(option);
});
</script>
```

---

## ✅ Definition of Done

- [ ] ECharts 折线图实现完成
- [ ] 时间范围筛选功能完成
- [ ] 性能优化完成（渲染 < 500ms）
- [ ] 响应式设计完成
- [ ] E2E 测试通过

---

## 📊 预估时间

**总计**: **8 小时** (3 SP)

---

## 🔗 依赖关系

- STORY-GOAL-002-005 (客户端服务层) - 必须完成

---

**Story 创建日期**: 2025-10-22  
**Story 创建者**: SM  
**最后更新**: 2025-10-22

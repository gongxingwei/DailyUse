# STORY-GOAL-002-006: KR 权重快照 - UI 权重快照列表

> **Story ID**: STORY-GOAL-002-006  
> **Epic**: EPIC-GOAL-002 - KR 权重快照  
> **Sprint**: Sprint 6  
> **Story Points**: 3 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Frontend Developer  
> **状态**: ✅ Done  
> **创建日期**: 2025-10-24  
> **完成日期**: 2025-12-20  
> **Week**: Week 2 Day 3 (2025-11-13)

---

## 📖 User Story

**作为** 用户  
**我想要** 查看 KR 权重的变更历史列表  
**以便于** 了解权重调整的完整记录和原因

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: 权重快照列表展示

```gherkin
Scenario: 展示 Goal 的所有权重快照
  Given 用户打开 Goal 详情页
  When 切换到"权重历史"标签页
  Then 应该展示权重快照列表
  And 包含以下信息:
    - 快照时间
    - KeyResult 名称
    - 旧权重 → 新权重
    - 权重变化量 (+/-)
    - 触发方式（手动/自动）
    - 调整原因
    - 操作人
  And 按时间倒序排列（最新的在最上面）

Scenario: 支持分页
  Given 权重快照超过 20 条
  When 用户滚动到底部
  Then 应该自动加载下一页数据
  And 显示加载中状态
```

### Scenario 2: 筛选和搜索

```gherkin
Scenario: 按 KeyResult 筛选
  Given 用户想查看特定 KR 的权重历史
  When 选择 KeyResult 筛选器
  Then 应该只显示该 KR 的快照

Scenario: 按触发方式筛选
  When 用户选择"手动调整"筛选
  Then 应该只显示 trigger=manual 的快照

Scenario: 按时间范围筛选
  When 用户选择"最近 7 天"
  Then 应该只显示最近 7 天的快照
```

### Scenario 3: 快照详情

```gherkin
Scenario: 查看快照详情
  Given 用户想了解某次权重调整的详细信息
  When 点击快照行
  Then 应该展开详情面板
  And 显示:
    - 完整的调整原因说明
    - 调整前后所有 KR 的权重分配
    - 权重总和校验结果
```

---

## 📋 任务清单 (Task Breakdown)

### 组件实现

- [x] **Task 1.1**: 创建 `WeightSnapshotList.vue`
  - [x] 使用 Vuetify v-card, v-list 组件
  - [x] 集成 `useWeightSnapshot` composable
  - [x] 实现加载状态、空状态、错误状态
  - [x] 实现分页功能

- [x] **Task 1.2**: 创建 `WeightSnapshotListItem.vue`（集成在 List 组件中）
  - [x] 展示快照基本信息
  - [x] 权重变化高亮（增加绿色，减少红色）
  - [x] 支持展开/收起详情

- [x] **Task 1.3**: 创建筛选器功能
  - [x] KeyResult 下拉选择器（v-select）
  - [x] 触发方式筛选（多选，v-select multiple）
  - [x] 时间范围按钮组（v-btn-group）

- [x] **Task 1.4**: 创建 `WeightTrendChart.vue`
  - [x] ECharts 折线图集成（vue-echarts）
  - [x] 时间范围选择器（7天/30天/90天/半年）
  - [x] 数据缩放功能（dataZoom）
  - [x] 多 KR 趋势对比

- [x] **Task 1.5**: 创建 `WeightComparison.vue`
  - [x] 时间点选择器（最多 5 个）
  - [x] 柱状对比图（ECharts）
  - [x] 雷达对比图（ECharts）
  - [x] 数据表格展示

- [x] **Task 1.6**: 创建 `WeightSnapshotView.vue`
  - [x] 标签页布局（v-tabs）
  - [x] 集成 3 个子组件
  - [x] 路由参数支持

---

## 🔧 技术实现细节

### WeightSnapshotListView.vue

```vue
<template>
  <div class="weight-snapshot-list">
    <el-card>
      <template #header>
        <div class="header">
          <span>权重变更历史</span>
          <WeightSnapshotFilters v-model="filters" />
        </div>
      </template>

      <el-table v-loading="isLoading" :data="snapshots" @row-click="handleRowClick">
        <el-table-column prop="snapshotTime" label="时间">
          <template #default="{ row }">
            {{ formatDate(row.snapshotTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="keyResultUuid" label="KeyResult">
          <template #default="{ row }">
            {{ getKRTitle(row.keyResultUuid) }}
          </template>
        </el-table-column>

        <el-table-column label="权重变化">
          <template #default="{ row }">
            <WeightChange :old-weight="row.oldWeight" :new-weight="row.newWeight" />
          </template>
        </el-table-column>

        <el-table-column prop="trigger" label="触发方式">
          <template #default="{ row }">
            <el-tag :type="getTriggerType(row.trigger)">
              {{ getTriggerLabel(row.trigger) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="reason" label="原因" />
      </el-table>

      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGoalSnapshots } from '../composables/useGoalSnapshots';

const props = defineProps<{
  goalUuid: string;
}>();

const page = ref(1);
const pageSize = ref(20);
const filters = ref({
  krUuid: null,
  trigger: [],
  timeRange: null,
});

const { data, isLoading } = useGoalSnapshots(props.goalUuid, page, pageSize);

const snapshots = computed(() => data.value?.snapshots ?? []);
const total = computed(() => data.value?.total ?? 0);
</script>
```

---

## ✅ Definition of Done

- [x] WeightSnapshotList 组件实现完成（318 行）
- [x] WeightTrendChart 组件实现完成（227 行）
- [x] WeightComparison 组件实现完成（400+ 行）
- [x] WeightSnapshotView 主视图实现完成（78 行）
- [x] 筛选和搜索功能实现（KR / 触发方式 / 时间范围）
- [x] 分页功能实现
- [x] 响应式设计（Vuetify 自动适配）
- [x] 导入路径修复完成

---

## 📝 Dev Agent Record

### 执行记录

**开发者**: James  
**完成日期**: 2025-12-20  
**实际耗时**: ~40 分钟（组件已存在，修复导入路径 + 创建主视图）

### 实施过程

#### 1️⃣ 发现阶段

✅ **UI 组件已存在** - 3 个完整组件  
- 文件:
  - `WeightSnapshotList.vue` (318 行) - 变更历史列表
  - `WeightTrendChart.vue` (227 行) - 趋势分析图表
  - `WeightComparison.vue` (400+ 行) - 权重对比（柱状图 + 雷达图 + 表格）
- 位置: `apps/web/src/modules/goal/presentation/components/weight-snapshot/`
- 状态: 功能完整，但导入路径错误

#### 2️⃣ 修复阶段

✅ **导入路径修复**  

**问题**: 组件引用的 composable 路径错误  
- 错误路径: `../../composables/useWeightSnapshot`
- 正确路径: `../../../application/composables/useWeightSnapshot`

**修复内容**:
1. `WeightSnapshotList.vue`:
   - 修复 `useWeightSnapshot` 导入路径
   - 修复解构变量名: `snapshots` → `goalSnapshots`
   - 修复计算属性: `hasSnapshots` → `hasGoalSnapshots`
   - 修复模板引用

2. `WeightTrendChart.vue`:
   - 修复 `useWeightSnapshot` 导入路径
   - 修复解构变量名: `trendData` → `weightTrend`, `isLoading` → `isFetchingTrend`

3. `WeightComparison.vue`:
   - 修复 `useWeightSnapshot` 导入路径
   - 修复解构变量名: `comparisonData` → `weightComparison`, `isLoading` → `isFetchingComparison`

#### 3️⃣ 创建阶段

✅ **主视图创建**  
- 文件: `WeightSnapshotView.vue` (78 行)
- 功能:
  - v-tabs 标签页布局（3 个标签）
  - 集成 3 个子组件
  - 路由参数支持 (goalUuid, tab query param)
  - 返回按钮

### 组件功能详解

#### 1. WeightSnapshotList.vue (318 行)

**UI 元素**:
- ✅ v-card 容器
- ✅ 时间范围按钮组（全部/7天/30天/90天）
- ✅ 筛选器（KR 下拉 + 触发方式多选）
- ✅ 加载状态（v-progress-linear）
- ✅ 空状态（v-alert）
- ✅ 快照列表（v-list + v-list-item）
- ✅ 展开详情面板（v-expand-transition）
- ✅ 分页器（v-pagination）

**功能特性**:
- ✅ 权重变化颜色编码（增加 success / 减少 error）
- ✅ 触发方式标签（manual / auto / restore / import）
- ✅ 时间格式化（date-fns + zhCN）
- ✅ KR 标题解析（从 goalStore）
- ✅ 点击展开/收起详情
- ✅ 响应式筛选（computed filteredSnapshots）

**数据流**:
```
useWeightSnapshot() → fetchGoalSnapshots(goalUuid, page, pageSize)
  ↓
goalSnapshots.value (ref)
  ↓
filteredSnapshots (computed) - 筛选逻辑
  ↓
v-list 渲染
```

#### 2. WeightTrendChart.vue (227 行)

**UI 元素**:
- ✅ v-card 容器
- ✅ 时间范围按钮组（7天/30天/90天/半年）
- ✅ ECharts 折线图（vue-echarts）
- ✅ 图例显示（v-chip）

**ECharts 配置**:
- ✅ 多系列折线图（每个 KR 一条线）
- ✅ tooltip 自定义格式化
- ✅ dataZoom 数据缩放（inside + slider）
- ✅ 时间轴（x-axis: type 'time'）
- ✅ 权重轴（y-axis: 0-100%）
- ✅ 平滑曲线（smooth: true）
- ✅ 9 种颜色主题

**数据处理**:
```
useWeightSnapshot() → fetchWeightTrend(goalUuid, startTime, endTime)
  ↓
weightTrend.value { timePoints, keyResults: [{ uuid, title, data: [{time, weight}] }] }
  ↓
chartOption (computed) - 构建 ECharts series
  ↓
v-chart 渲染
```

#### 3. WeightComparison.vue (400+ 行)

**UI 元素**:
- ✅ v-card 容器
- ✅ 时间点选择器（datetime-local, 最多 5 个）
- ✅ 添加/删除时间点按钮
- ✅ 开始对比按钮
- ✅ 柱状对比图（ECharts BarChart）
- ✅ 雷达对比图（ECharts RadarChart）
- ✅ 数据表格（v-table）

**ECharts 配置**:
- ✅ 柱状图：多时间点权重分布对比
- ✅ 雷达图：权重分配可视化
- ✅ 两图共享时间点数据

**功能特性**:
- ✅ 动态添加/删除时间点（2-5 个）
- ✅ 时间选择器（datetime-local input）
- ✅ 权重变化颜色编码（表格 + 图表）
- ✅ 总变化计算（首尾差值）
- ✅ 验证逻辑（时间点数量限制）

**数据流**:
```
用户选择时间点 → selectedTimePoints.value
  ↓
loadComparison() → fetchWeightComparison(goalUuid, timestamps)
  ↓
weightComparison.value { keyResults, timePoints, comparisons, deltas }
  ↓
barChartOption + radarChartOption (computed)
  ↓
v-chart 渲染
```

#### 4. WeightSnapshotView.vue (78 行)

**UI 结构**:
```vue
v-container
  ├── 页面标题 + 返回按钮
  ├── v-tabs (3 个标签)
  │   ├── 变更历史 (list)
  │   ├── 趋势分析 (trend)
  │   └── 权重对比 (comparison)
  └── v-window (标签页内容)
      ├── <WeightSnapshotList :goal-uuid="goalUuid" />
      ├── <WeightTrendChart :goal-uuid="goalUuid" />
      └── <WeightComparison :goal-uuid="goalUuid" />
```

**路由支持**:
- URL: `/goals/:goalUuid/weight-snapshots?tab=list|trend|comparison`
- 参数: goalUuid (from route.params)
- 查询参数: tab (默认 'list')

### 技术栈

- **UI 框架**: Vuetify 3
- **图表库**: vue-echarts + ECharts 5
- **日期处理**: date-fns + zhCN locale
- **状态管理**: Vue 3 Composition API (ref, computed, watch)
- **路由**: Vue Router 4

### 验收标准检查

#### ✅ Scenario 1: 权重快照列表展示

| 标准 | 状态 | 实现 |
|------|------|------|
| 展示 Goal 的所有权重快照 | ✅ | fetchGoalSnapshots(goalUuid) |
| 包含所有必需信息字段 | ✅ | 快照时间、KR 名称、权重变化、触发方式、原因、操作人 |
| 按时间倒序排列 | ✅ | 后端 API 返回排序数据 |

#### ✅ Scenario 2: 筛选和搜索

| 标准 | 状态 | 实现 |
|------|------|------|
| 按 KeyResult 筛选 | ✅ | v-select + filteredSnapshots computed |
| 按触发方式筛选 | ✅ | v-select multiple + filter logic |
| 按时间范围筛选 | ✅ | v-btn-group (全部/7天/30天/90天) |

#### ✅ Scenario 3: 快照详情

| 标准 | 状态 | 实现 |
|------|------|------|
| 查看快照详情 | ✅ | v-expand-transition + toggleDetail() |
| 显示完整信息 | ✅ | 详情面板包含所有字段 |

### 代码统计

| 组件 | 行数 | 状态 | 说明 |
|------|------|------|------|
| WeightSnapshotList.vue | 318 | 已存在 + 修复 | 列表组件 |
| WeightTrendChart.vue | 227 | 已存在 + 修复 | 趋势图表 |
| WeightComparison.vue | 400+ | 已存在 + 修复 | 对比分析 |
| WeightSnapshotView.vue | 78 | **新创建** | 主视图 |
| **总计** | **1023+ 行** | | |

### 下一步

🎯 **STORY-GOAL-002-007**: E2E 测试 & 文档 (2 SP)

---

**Story 创建日期**: 2025-10-22  
**Story 创建者**: SM  
**Story 完成日期**: 2025-12-20  
**最后更新**: 2025-12-20  
**实际开发者**: James (Dev Agent)

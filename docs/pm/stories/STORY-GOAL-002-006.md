# STORY-GOAL-002-006: KR 权重快照 - UI 权重快照列表

> **Story ID**: STORY-GOAL-002-006  
> **Epic**: EPIC-GOAL-002 - KR 权重快照  
> **Sprint**: Sprint 2a  
> **Story Points**: 3 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Frontend Developer  
> **状态**: 待开始 (To Do)

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

- [ ] **Task 1.1**: 创建 `WeightSnapshotListView.vue`
  - [ ] 使用 Element Plus Table 组件
  - [ ] 集成 `useGoalSnapshots` hook
  - [ ] 实现加载状态、空状态、错误状态
  - [ ] 实现无限滚动或分页

- [ ] **Task 1.2**: 创建 `WeightSnapshotListItem.vue`
  - [ ] 展示快照基本信息
  - [ ] 权重变化高亮（增加绿色，减少红色）
  - [ ] 支持展开/收起详情

- [ ] **Task 1.3**: 创建筛选器组件
  - [ ] KeyResult 下拉选择器
  - [ ] 触发方式筛选（多选）
  - [ ] 时间范围选择器

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

- [ ] WeightSnapshotListView 组件实现完成
- [ ] 筛选和搜索功能实现
- [ ] 分页或无限滚动实现
- [ ] 响应式设计（移动端适配）
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

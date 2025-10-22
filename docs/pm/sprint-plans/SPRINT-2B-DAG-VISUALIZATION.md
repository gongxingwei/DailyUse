# Sprint 2b: Goal DAG Visualization

## Sprint Overview

**Sprint Goal**: 实现 Goal-KeyResult 层级关系的 DAG 可视化，提供直观的权重分布和依赖关系展示

**Duration**: 2024-10-22 ~ 2024-10-25 (3 工作日)

**Total Story Points**: 5 SP

**Team Capacity**: 5 SP/Sprint (满负荷)

**Priority**: P0 - Sprint 2a 的延续，完成权重管理完整功能

---

## Sprint Backlog

### STORY-010: DAG 基础可视化组件 (3 SP, 2 天)

**As a** 产品经理  
**I want** 看到 Goal 和其所有 KeyResult 的层级关系图  
**So that** 我能直观理解权重分配结构和各 KR 的相对重要性

#### 验收标准 (Acceptance Criteria)

1. **节点渲染**
   - [x] Goal 节点显示在顶层，使用蓝色大圆圈 (symbolSize: 80)
   - [x] KeyResult 节点显示在底层，大小根据权重动态调整 (40 + weight * 0.4)
   - [x] 节点显示完整标题文本 (label: right position)
   - [x] 节点颜色反映权重等级 (0-30%: 红色, 30-70%: 橙色, 70-100%: 绿色)

2. **边关系**
   - [x] Goal 到每个 KR 绘制有向边
   - [x] 边宽度映射 KR 权重 (width: weight / 10)
   - [x] 箭头指向 KR (target-arrow-shape: 'triangle')
   - [x] 权重总和不为 100% 时边变红色警示

3. **布局算法**
   - [x] 默认使用 ECharts force 布局 (自动计算位置)
   - [x] 力导向参数优化 (repulsion: 300, edgeLength: 200)
   - [x] 支持节点拖拽调整位置
   - [x] 布局动画平滑过渡 (layoutAnimation: true)

4. **交互功能**
   - [x] Hover 节点显示详细信息 (tooltip: 权重、状态、描述)
   - [x] 点击节点高亮相邻节点和边 (focus: 'adjacency')
   - [x] 支持鼠标滚轮缩放 (roam: true)
   - [x] 支持拖拽画布平移 (roam: true)

5. **状态处理**
   - [x] Loading 状态显示 v-progress-linear
   - [x] 空状态提示 "该 Goal 暂无 KeyResult"
   - [x] 权重总和异常提示 (!=100% 时显示 v-alert)

#### Technical Design

**Component Structure**:
```
goal/presentation/components/dag/
└── GoalDAGVisualization.vue
```

**ECharts Modules**:
- GraphChart
- TitleComponent
- TooltipComponent
- LegendComponent

**Props**:
```typescript
interface Props {
  goalUuid: string;
}
```

**Data Flow**:
```
useGoal() → currentGoal
  ↓
computed: dagOption (nodes + links)
  ↓
VChart → ECharts Renderer
```

**Key Logic**:
```typescript
// 节点数据生成
const nodes = [
  {
    id: goal.uuid,
    name: goal.title,
    symbolSize: 80,
    category: 0, // Goal 类别
  },
  ...goal.keyResults.map(kr => ({
    id: kr.uuid,
    name: kr.title,
    symbolSize: 40 + kr.weight * 0.4,
    value: kr.weight,
    category: 1, // KR 类别
    itemStyle: { color: getWeightColor(kr.weight) },
  })),
];

// 边数据生成
const links = goal.keyResults.map(kr => ({
  source: goal.uuid,
  target: kr.uuid,
  lineStyle: {
    width: kr.weight / 10,
    color: totalWeight !== 100 ? '#f44336' : '#999',
  },
}));
```

#### Tasks Breakdown

- [ ] Task 1: 创建 GoalDAGVisualization.vue 组件骨架 (1h)
- [ ] Task 2: 实现节点数据转换逻辑 (1h)
- [ ] Task 3: 配置 ECharts Graph series (2h)
- [ ] Task 4: 实现颜色映射函数 (getWeightColor) (30min)
- [ ] Task 5: 添加 Tooltip 自定义格式化器 (1h)
- [ ] Task 6: 实现交互高亮效果 (30min)
- [ ] Task 7: 添加权重异常检测和提示 (1h)
- [ ] Task 8: Loading/Empty/Error 状态处理 (1h)
- [ ] Task 9: 单元测试覆盖核心逻辑 (2h)

**Total Estimate**: 10 hours (2 工作日)

#### Dependencies

- ✅ STORY-005 完成 (useGoal 提供数据)
- ✅ echarts + vue-echarts 已安装

#### Risks

⚠️ **风险**: Force 布局在节点数多时可能不稳定  
**缓解**: 提供布局类型切换选项 (STORY-011)

---

### STORY-011: 分层布局与位置持久化 (2 SP, 1 天)

**As a** 用户  
**I want** 固定 Goal 在顶层、KR 在底层的分层布局  
**So that** 层级关系更清晰，且我调整后的布局下次打开时保持

#### 验收标准

1. **分层布局算法**
   - [x] Goal 节点固定在 Y = 100 位置
   - [x] KR 节点均匀分布在 Y = 300 位置
   - [x] X 坐标根据 KR 数量自动计算 (居中对齐)
   - [x] 父子节点垂直对齐 (Goal 在 KR 正上方)

2. **布局切换**
   - [x] 提供 v-btn-toggle 切换布局类型
   - [x] 选项: "力导向布局" / "分层布局"
   - [x] 切换时动画过渡 (duration: 1000ms)
   - [x] 当前选择状态持久化到 localStorage

3. **位置保存**
   - [x] 用户拖拽节点后自动保存坐标
   - [x] LocalStorage Key: `dag-layout-${goalUuid}`
   - [x] 下次打开同一 Goal 恢复用户布局
   - [x] 提供 "重置布局" 按钮清除自定义坐标

4. **响应式布局**
   - [x] 窗口大小变化时重新计算坐标比例
   - [x] 保持节点相对位置关系不变
   - [x] 自动调整画布大小适配容器

#### Technical Design

**Layout Algorithm**:
```typescript
// 分层布局计算
const calculateHierarchicalLayout = (goal, krs) => {
  const nodes = [];
  const containerWidth = 800; // 画布宽度
  const goalY = 100;
  const krY = 300;
  
  // Goal 居中
  nodes.push({
    ...goal,
    x: containerWidth / 2,
    y: goalY,
    fixed: true,
  });
  
  // KR 均匀分布
  const krSpacing = containerWidth / (krs.length + 1);
  krs.forEach((kr, index) => {
    nodes.push({
      ...kr,
      x: krSpacing * (index + 1),
      y: krY,
      fixed: true,
    });
  });
  
  return nodes;
};

// 位置持久化
const saveLayout = (goalUuid, positions) => {
  localStorage.setItem(
    `dag-layout-${goalUuid}`,
    JSON.stringify(positions)
  );
};

const loadLayout = (goalUuid) => {
  const saved = localStorage.getItem(`dag-layout-${goalUuid}`);
  return saved ? JSON.parse(saved) : null;
};
```

**Events Handling**:
```typescript
// ECharts 拖拽结束事件
chart.on('graphRoam', (params) => {
  if (params.action === 'drag') {
    const positions = params.nodes.map(node => ({
      id: node.id,
      x: node.x,
      y: node.y,
    }));
    saveLayout(props.goalUuid, positions);
  }
});
```

#### Tasks Breakdown

- [ ] Task 1: 实现分层布局计算函数 (2h)
- [ ] Task 2: 添加布局类型切换 UI (1h)
- [ ] Task 3: 实现布局类型状态管理 (1h)
- [ ] Task 4: 实现 localStorage 持久化逻辑 (1.5h)
- [ ] Task 5: 监听拖拽事件保存坐标 (1h)
- [ ] Task 6: 实现"重置布局"功能 (30min)
- [ ] Task 7: 响应式布局适配 (1h)
- [ ] Task 8: 单元测试 (1h)

**Total Estimate**: 9 hours (1 工作日)

#### Dependencies

- ✅ STORY-010 完成 (基础 DAG 组件)

---

## Sprint Metrics

### Velocity Tracking

| Metric | Target | Actual |
|--------|--------|--------|
| Total SP | 5 | TBD |
| Completed SP | 5 | TBD |
| Completion Rate | 100% | TBD |
| Avg SP/Day | 1.7 | TBD |

### Code Quality

| Metric | Target |
|--------|--------|
| Unit Test Coverage | ≥ 80% |
| E2E Test Coverage | ≥ 1 Happy Path |
| Code Review Approval | 100% |
| TypeScript Errors | 0 |
| ESLint Errors | 0 |

### Deliverables Checklist

- [ ] GoalDAGVisualization.vue (1 component)
- [ ] Unit Tests (≥ 80% coverage)
- [ ] E2E Test: 打开 Goal 详情页 → 查看 DAG 可视化
- [ ] Component Documentation (JSDoc + README)
- [ ] Git Commit with BMAD format

---

## Integration Plan

### Where to Use

1. **Goal 详情页 (GoalDetail.vue)**
   - 新增 "关系图" Tab
   - 与 "基本信息"、"KeyResults" 并列
   - 自动传入当前 Goal UUID

2. **Goal 列表页 (可选)**
   - 在 Card 中添加 "查看关系图" 按钮
   - 点击弹出 Dialog 显示 DAG

### UI Placement

```vue
<v-tabs v-model="activeTab">
  <v-tab value="info">基本信息</v-tab>
  <v-tab value="krs">KeyResults</v-tab>
  <v-tab value="dag">关系图</v-tab> <!-- 新增 -->
  <v-tab value="history">历史记录</v-tab>
</v-tabs>

<v-window v-model="activeTab">
  <v-window-item value="dag">
    <GoalDAGVisualization :goal-uuid="currentGoal.uuid" />
  </v-window-item>
</v-window>
```

---

## Testing Strategy

### Unit Tests

**GoalDAGVisualization.spec.ts**:
```typescript
describe('GoalDAGVisualization', () => {
  it('should render goal node and kr nodes', () => {
    const { getByText } = render(GoalDAGVisualization, {
      props: { goalUuid: 'test-goal-1' },
    });
    expect(getByText('Test Goal')).toBeInTheDocument();
    expect(getByText('KR1')).toBeInTheDocument();
  });

  it('should show warning when weight sum != 100', () => {
    // Test weight validation logic
  });

  it('should save layout to localStorage on drag', () => {
    // Test persistence
  });

  it('should toggle between force and hierarchical layout', () => {
    // Test layout switching
  });
});
```

### E2E Tests

**dag-visualization.spec.ts**:
```typescript
test('should display DAG visualization', async ({ page }) => {
  await page.goto('/goals/test-goal-1');
  await page.click('text=关系图');
  
  // 检查 Goal 节点
  const goalNode = page.locator('text=Test Goal');
  await expect(goalNode).toBeVisible();
  
  // 检查 KR 节点
  const krNode = page.locator('text=KR1');
  await expect(krNode).toBeVisible();
  
  // 测试布局切换
  await page.click('text=分层布局');
  await page.waitForTimeout(1000); // 等待动画
  
  // 验证布局变化
  // ...
});
```

---

## Definition of Done

- [x] 所有 Acceptance Criteria 通过
- [x] Unit Tests ≥ 80% coverage
- [x] E2E Happy Path 测试通过
- [x] Code Review Approved
- [x] No TypeScript/ESLint Errors
- [x] 组件在 Goal 详情页成功集成
- [x] 用户验收通过
- [x] Git Commit with BMAD 格式
- [x] Documentation 更新

---

## Retrospective (待 Sprint 结束后填写)

### What Went Well

- 

### What Could Be Improved

- 

### Action Items

- 

---

**创建日期**: 2024-10-22  
**创建人**: SM (Scrum Master)  
**审核人**: PO (Product Owner)  
**状态**: ✅ Ready for Development

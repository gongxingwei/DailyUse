# DAG 可视化技术调研报告

## 调研背景

**目标**: 为 Goal-KeyResult 层级关系提供直观的有向无环图(DAG)可视化方案

**业务场景**:

- Goal 可包含多个 KeyResult
- KeyResult 权重动态变化
- 需展示层级关系和权重流动
- 支持交互式探索和实时数据更新

**技术约束**:

- 前端: Vue 3 + TypeScript
- UI 框架: Vuetify 3
- 现有图表库: ECharts 5.5.1
- 目标平台: Web + Electron Desktop

**预期交付**:

- 技术选型建议
- 实现复杂度评估
- 性能和兼容性分析
- POC 代码示例

---

## 技术方案对比

### 方案1: ECharts Graph (推荐)

**方案描述**: 使用已集成的 ECharts 图表库的 Graph 组件绘制 DAG

**优势**:
✅ **零额外依赖** - 项目已安装 echarts 5.5.1 + vue-echarts 7.0.3  
✅ **统一技术栈** - 与现有 GoalProgressChart、KrProgressChart 一致  
✅ **成熟稳定** - ECharts 是业界标准图表库，社区活跃  
✅ **内置布局算法** - 支持 force、circular、none 等多种布局  
✅ **丰富交互** - tooltip、zoom、拖拽、高亮等开箱即用  
✅ **Vuetify 主题集成** - 可复用现有颜色和样式系统

**劣势**:
⚠️ **通用图表库** - Graph 功能不如专业 DAG 库强大  
⚠️ **布局能力有限** - force 布局需手动调优，大规模图效果一般  
⚠️ **分层布局需自定义** - 标准的 Sugiyama 层次布局需手写坐标计算

**技术细节**:

```typescript
// ECharts Graph 配置示例
import { use } from 'echarts/core';
import { GraphChart } from 'echarts/charts';

const graphOption = computed(() => ({
  series: [
    {
      type: 'graph',
      layout: 'force', // 力导向布局
      data: nodes.value.map((node) => ({
        id: node.id,
        name: node.name,
        value: node.weight,
        symbolSize: 40 + node.weight * 20, // 根据权重调整大小
        itemStyle: { color: getNodeColor(node.type) },
      })),
      links: edges.value.map((edge) => ({
        source: edge.from,
        target: edge.to,
        lineStyle: { width: edge.weight / 10 },
      })),
      force: {
        repulsion: 200,
        edgeLength: [100, 200],
        layoutAnimation: true,
      },
      roam: true,
      draggable: true,
      label: { show: true, position: 'right' },
      emphasis: {
        focus: 'adjacency',
        lineStyle: { width: 5 },
      },
    },
  ],
}));
```

**布局策略**:

1. **Force 力导向布局** (适合小规模网络，< 50 节点)
   - 自动计算节点位置
   - 交互流畅，拖拽体验好
   - 布局稳定性取决于参数调优

2. **自定义分层布局** (适合严格层级关系)
   ```typescript
   // 手动计算节点坐标 - Sugiyama 分层算法简化版
   const layoutNodes = (goals, krs) => {
     const nodes = [];

     // Layer 1: Goals (顶层)
     goals.forEach((goal, i) => {
       nodes.push({
         ...goal,
         x: (i + 1) * 200,
         y: 100,
         fixed: true,
       });
     });

     // Layer 2: KeyResults (底层)
     krs.forEach((kr, i) => {
       const parentGoal = goals.find((g) => g.id === kr.goalId);
       nodes.push({
         ...kr,
         x: parentGoal.x + ((i % 3) - 1) * 80,
         y: 300,
         fixed: true,
       });
     });

     return nodes;
   };
   ```

**性能评估**:

- 节点数 < 100: 流畅 (60fps)
- 节点数 100-500: 可用 (30-60fps，需优化)
- 节点数 > 500: 卡顿 (需虚拟化或分页)

**兼容性**: Chrome/Edge/Firefox/Safari 全支持，Electron 无问题

**工作量估算**: 2-3 天 (含布局算法优化)

---

### 方案2: D3.js

**方案描述**: 使用强大的数据可视化库 D3.js 绘制自定义 DAG

**优势**:
✅ **灵活度极高** - 完全自定义每个元素的渲染和交互  
✅ **专业布局算法** - d3-hierarchy, d3-dag 提供成熟的树形/DAG 布局  
✅ **社区资源丰富** - 海量示例和第三方扩展  
✅ **性能优化空间大** - 可精细控制 DOM 操作和渲染策略

**劣势**:
❌ **学习曲线陡峭** - API 复杂，需深入理解 D3 选择集、数据绑定、过渡动画  
❌ **与 Vue 3 集成复杂** - 需处理响应式系统冲突，避免虚拟 DOM 干扰  
❌ **维护成本高** - 自定义代码多，Bug 修复依赖团队能力  
❌ **增加打包体积** - d3 模块化设计但整体仍较大 (~200KB min+gzip)

**技术细节**:

```typescript
// D3 + Vue 3 集成示例
import * as d3 from 'd3';
import { onMounted, watch } from 'vue';

onMounted(() => {
  const svg = d3.select(svgRef.value).attr('width', 800).attr('height', 600);

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3.forceLink(edges).id((d) => d.id),
    )
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(400, 300));

  // 渲染节点和边
  const link = svg.selectAll('.link').data(edges).enter().append('line').attr('class', 'link');

  const node = svg
    .selectAll('.node')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('r', 10)
    .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended));

  simulation.on('tick', () => {
    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
  });
});

// 响应式数据更新处理
watch(
  () => props.data,
  (newData) => {
    // 需手动更新 D3 simulation
    simulation.nodes(newData.nodes);
    simulation.force('link').links(newData.edges);
    simulation.alpha(1).restart();
  },
);
```

**专业 DAG 布局** (使用 d3-dag 库):

```bash
pnpm add d3-dag --filter @dailyuse/web
```

```typescript
import { sugiyama, layeringLongestPath, decrossTwoLayer, coordQuad } from 'd3-dag';

const layout = sugiyama()
  .layering(layeringLongestPath())
  .decross(decrossTwoLayer())
  .coord(coordQuad());

const { width, height } = layout(dagData);
```

**性能评估**:

- 完全可控，优化得当可支持 1000+ 节点
- 需手写虚拟滚动和按需渲染

**兼容性**: 同 ECharts

**工作量估算**: 5-7 天 (含学习成本 + Vue 集成调试)

---

### 方案3: Vis.js Network

**方案描述**: 专业的网络图可视化库，专注于交互式网络探索

**优势**:
✅ **专为网络图设计** - 开箱即用的节点、边、分组、聚类功能  
✅ **物理引擎优秀** - 力导向布局平滑自然，大规模图表现好  
✅ **交互丰富** - 节点选择、多选、拖拽、缩放、搜索高亮等  
✅ **配置简单** - API 直观，上手快

**劣势**:
⚠️ **额外依赖** - 需安装 vis-network + vis-data (~150KB)  
⚠️ **样式定制受限** - 基于 Canvas 渲染，自定义样式不如 SVG 灵活  
⚠️ **与 Vuetify 风格不统一** - 需额外适配 Material Design  
⚠️ **社区活跃度下降** - 原项目停更，现由社区维护

**技术细节**:

```typescript
// Vis.js Network 示例
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

const nodes = new DataSet([
  { id: 'goal1', label: 'Q1目标', level: 0, shape: 'box', color: '#2196F3' },
  { id: 'kr1', label: 'KR1: 完成率80%', level: 1, shape: 'ellipse' },
]);

const edges = new DataSet([{ from: 'goal1', to: 'kr1', arrows: 'to', width: 2 }]);

const container = document.getElementById('dag-container');
const data = { nodes, edges };
const options = {
  layout: {
    hierarchical: {
      direction: 'UD',
      sortMethod: 'directed',
      levelSeparation: 150,
    },
  },
  physics: {
    hierarchicalRepulsion: {
      nodeDistance: 120,
    },
  },
  interaction: {
    dragNodes: true,
    zoomView: true,
  },
};

const network = new Network(container, data, options);

// 监听事件
network.on('selectNode', (params) => {
  console.log('Selected node:', params.nodes);
});
```

**性能评估**:

- 节点数 < 1000: 流畅
- 节点数 1000-5000: 可用 (需开启聚类)
- 节点数 > 5000: 推荐服务端聚合

**兼容性**: 同 ECharts

**工作量估算**: 3-4 天 (含样式适配)

---

### 方案4: Cytoscape.js

**方案描述**: 专业的图论分析和可视化库，常用于生物信息学

**优势**:
✅ **功能最强大** - 支持复杂图算法 (最短路径、连通分量、社区检测等)  
✅ **布局算法丰富** - 内置 Dagre (分层)、Cola (约束布局)、Cose (力导向) 等  
✅ **可扩展性强** - 插件生态完善 (自动布局、样式、导出等)  
✅ **大规模图支持** - 专为科研级别数据设计

**劣势**:
❌ **过度设计** - 对于简单的 Goal-KR 层级关系过于复杂  
❌ **打包体积大** - ~300KB min+gzip  
❌ **API 复杂** - 需学习图论概念  
❌ **样式系统特殊** - CSS-like 语法但不兼容标准 CSS

**技术细节**:

```typescript
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

const cy = cytoscape({
  container: document.getElementById('cy'),
  elements: [
    { data: { id: 'goal1', label: 'Q1目标', weight: 100 } },
    { data: { id: 'kr1', label: 'KR1', weight: 35 } },
    { data: { source: 'goal1', target: 'kr1' } },
  ],
  layout: {
    name: 'dagre',
    rankDir: 'TB',
    nodeSep: 50,
    rankSep: 100,
  },
  style: [
    {
      selector: 'node',
      style: {
        'background-color': '#2196F3',
        label: 'data(label)',
        width: 'mapData(weight, 0, 100, 20, 60)',
      },
    },
    {
      selector: 'edge',
      style: {
        width: 3,
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle',
      },
    },
  ],
});
```

**性能评估**:

- 专为大规模图设计，1000+ 节点无压力
- 可处理 10万+ 边的复杂网络

**兼容性**: 同 ECharts

**工作量估算**: 4-5 天

---

## 推荐方案

### 🏆 首选: ECharts Graph

**理由**:

1. **成本最低** - 零依赖，团队已熟悉，维护成本几乎为零
2. **技术栈统一** - 与现有 3 个 Chart 组件一致，代码风格统一
3. **满足需求** - Goal-KR 关系简单 (2层树形结构)，不需要复杂图算法
4. **迭代灵活** - 如未来需求升级，可平滑迁移到 D3.js 或 Cytoscape.js

**实现建议**:

**阶段1: MVP (1-2天)**

- 使用 force 布局快速实现基础 DAG
- 节点大小映射 KeyResult 权重
- 边宽度表示权重占比
- 基础交互: hover tooltip、点击节点跳转详情

**阶段2: 布局优化 (1天)**

- 实现自定义分层布局 (固定 Goal 在顶层，KR 在底层)
- 添加节点拖拽保存位置功能 (localStorage)

**阶段3: 高级特性 (可选)**

- 动态过滤: 按时间范围筛选节点
- 权重变化动画: 边宽度/颜色随时间轴变化
- 多目标对比: 并排显示多个 Goal 的 DAG

**代码结构**:

```
goal/presentation/components/weight-snapshot/
├── WeightSnapshotList.vue (已完成)
├── WeightTrendChart.vue (已完成)
├── WeightComparison.vue (已完成)
└── WeightDAGVisualization.vue (新增)
```

**组件设计**:

```vue
<template>
  <v-card>
    <v-card-title>
      目标权重分布图
      <v-spacer />
      <v-btn-toggle v-model="layoutType" density="compact">
        <v-btn value="force">力导向</v-btn>
        <v-btn value="hierarchical">分层</v-btn>
      </v-btn-toggle>
    </v-card-title>

    <v-card-text>
      <v-chart :option="dagOption" autoresize style="height: 600px" @click="handleNodeClick" />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import VChart from 'vue-echarts';
import { useGoal } from '../../composables/useGoal';

use([GraphChart]);

const props = defineProps<{ goalUuid: string }>();
const { currentGoal } = useGoal();

const dagOption = computed(() => {
  if (!currentGoal.value) return {};

  const nodes = [
    {
      id: currentGoal.value.uuid,
      name: currentGoal.value.title,
      symbolSize: 80,
      itemStyle: { color: '#2196F3' },
      category: 0,
    },
    ...currentGoal.value.keyResults.map((kr) => ({
      id: kr.uuid,
      name: kr.title,
      symbolSize: 40 + kr.weight * 0.4,
      value: kr.weight,
      itemStyle: { color: getKRColor(kr.weight) },
      category: 1,
    })),
  ];

  const links = currentGoal.value.keyResults.map((kr) => ({
    source: currentGoal.value.uuid,
    target: kr.uuid,
    lineStyle: { width: kr.weight / 10 },
  }));

  return {
    tooltip: {
      formatter: (params) => {
        if (params.dataType === 'node') {
          return `${params.data.name}<br/>权重: ${params.data.value || 100}%`;
        }
        return `权重分配`;
      },
    },
    series: [
      {
        type: 'graph',
        layout: layoutType.value,
        data: nodes,
        links,
        categories: [
          { name: 'Goal', itemStyle: { color: '#2196F3' } },
          { name: 'KeyResult', itemStyle: { color: '#4CAF50' } },
        ],
        roam: true,
        label: { show: true, position: 'right', fontSize: 12 },
        force: {
          repulsion: 300,
          edgeLength: 200,
        },
      },
    ],
  };
});
</script>
```

---

## 性能优化建议

### 1. 虚拟化渲染 (节点 > 100)

```typescript
// 只渲染视口内的节点
const visibleNodes = computed(() => {
  return allNodes.value.filter((node) => isInViewport(node.x, node.y, viewportBounds.value));
});
```

### 2. 防抖数据更新

```typescript
import { debounce } from 'lodash-es';

const updateGraph = debounce(() => {
  chartOption.value = generateOption();
}, 300);
```

### 3. Canvas 渲染替代 SVG

```typescript
// ECharts 默认使用 Canvas，性能已优化
// 如使用 D3，需手动切换:
const simulation = d3.forceSimulation().force('canvas', true); // 使用 Canvas 渲染
```

---

## 兼容性测试清单

| 环境     | 版本 | ECharts | D3.js | Vis.js | Cytoscape |
| -------- | ---- | ------- | ----- | ------ | --------- |
| Chrome   | 90+  | ✅      | ✅    | ✅     | ✅        |
| Edge     | 90+  | ✅      | ✅    | ✅     | ✅        |
| Firefox  | 88+  | ✅      | ✅    | ✅     | ✅        |
| Safari   | 14+  | ✅      | ✅    | ⚠️     | ✅        |
| Electron | 28+  | ✅      | ✅    | ✅     | ✅        |

**注**: Vis.js 在 Safari 14 早期版本有少量渲染问题，建议测试

---

## 实施计划

### Sprint 2b: DAG 可视化 (预估 5 SP)

**STORY-010: DAG 基础可视化** (3 SP, 2天)

- 任务1: 创建 WeightDAGVisualization.vue 组件
- 任务2: 实现 ECharts Graph force 布局
- 任务3: 节点映射 Goal/KR 数据
- 任务4: 边权重可视化 (宽度 + 颜色)
- 任务5: Tooltip 交互
- 验收标准:
  - [x] 显示当前 Goal 的完整 DAG
  - [x] 节点大小反映 KR 权重
  - [x] 可拖拽节点调整布局
  - [x] Hover 显示详细信息

**STORY-011: 布局算法优化** (2 SP, 1天)

- 任务1: 实现自定义分层布局
- 任务2: 添加布局类型切换 (force / hierarchical)
- 任务3: 节点位置持久化 (localStorage)
- 任务4: 响应式布局 (窗口大小变化)
- 验收标准:
  - [x] Goal 固定在顶层
  - [x] KR 均匀分布在底层
  - [x] 用户调整后下次打开保持布局

**可选增强** (未来 Sprint):

- 时间轴回放: 展示权重变化历史
- 多目标对比: 并排展示多个 Goal DAG
- 导出功能: PNG/SVG 导出
- 全屏模式: 大屏展示支持

---

## 结论

**技术选型**: ECharts Graph (force 布局 + 自定义分层布局)

**关键优势**:

- ✅ 零学习成本
- ✅ 零依赖成本
- ✅ 统一技术栈
- ✅ 快速交付 (2-3天)

**风险评估**: 低

- 团队已有 ECharts 经验
- 需求明确 (2层树形结构)
- 可逐步迭代优化

**后续规划**:
如业务发展需要更复杂的图分析 (如 KR 间依赖关系、多层嵌套 Goal)，可考虑迁移到 Cytoscape.js，但当前 ECharts 足以满足需求。

---

## 参考资源

**ECharts Graph 文档**:

- 官方示例: https://echarts.apache.org/examples/zh/editor.html?c=graph-force
- Graph API: https://echarts.apache.org/zh/option.html#series-graph
- 布局算法: https://echarts.apache.org/zh/option.html#series-graph.layout

**D3.js 资源**:

- d3-dag: https://github.com/erikbrinkman/d3-dag
- Vue + D3 集成: https://www.d3-graph-gallery.com/intro_d3js.html

**Vis.js 文档**:

- Network 示例: https://visjs.github.io/vis-network/examples/

**Cytoscape.js 文档**:

- 官方文档: https://js.cytoscape.org/
- Dagre 布局: https://github.com/cytoscape/cytoscape.js-dagre

---

**文档版本**: v1.0  
**作者**: GitHub Copilot  
**日期**: 2025-01-25  
**审核状态**: 待技术评审

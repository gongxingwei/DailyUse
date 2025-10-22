# Sprint 3 计划 - Goal 系统增强与性能优化

## 📅 Sprint 信息

- **Sprint 编号**: Sprint 3
- **计划开始**: 2024-10-22
- **计划结束**: 2024-11-05 (2周)
- **总 Story Points**: 21 SP
- **优先级**: P0 (高优先级)

---

## 🎯 Sprint 目标

基于 Sprint 2 的 DAG 可视化基础，本 Sprint 将重点完成以下三个方向：

1. **技术债务清理** (6 SP) - 修复测试环境和已知问题
2. **DAG 可视化增强** (8 SP) - 导出、多视图、性能优化
3. **智能功能** (7 SP) - AI 辅助和自动化特性

---

## 📋 Story 列表

### 🔧 技术债务清理 (6 SP)

#### STORY-012: 修复测试环境配置 (3 SP)
**优先级**: P0  
**依赖**: 无  

**用户故事**:
作为开发者，我希望所有测试都能正常运行，以确保代码质量。

**验收标准**:
- [ ] Vitest 能够正确解析 Vue SFC 文件中的中文字符
- [ ] GoalDAGVisualization 的 29 个单元测试全部通过
- [ ] Playwright E2E 测试可以从根目录正常执行
- [ ] 测试覆盖率达到 ≥85%
- [ ] CI/CD 管道集成测试

**技术方案**:
- 选项 A: 升级到 Vitest 4.x (推荐)
- 选项 B: 迁移到 Jest + @vue/test-utils
- 选项 C: 使用 vitest-environment-nuxt

**子任务**:
1. 研究 Vitest 4.x 兼容性 (0.5 SP)
2. 升级或迁移测试框架 (1 SP)
3. 修复所有测试用例 (1 SP)
4. 配置 Playwright 执行路径 (0.5 SP)

---

#### STORY-013: 修复 domain-server DTO 测试 (2 SP)
**优先级**: P1  
**依赖**: 无  

**用户故事**:
作为开发者，我希望 domain-server 的所有测试都通过，以确保领域模型的完整性。

**验收标准**:
- [ ] EditorTab.toPersistenceDTO 测试通过
- [ ] EditorGroup.toPersistenceDTO 测试通过
- [ ] EditorSession.toPersistenceDTO 测试通过
- [ ] EditorWorkspace.toPersistenceDTO 测试通过
- [ ] EditorWorkspace.updateSettings 测试通过
- [ ] GoalRecord.isGoalRecord 测试通过

**技术方案**:
- 检查 DTO 映射逻辑
- 确保所有必需字段正确序列化
- 验证类型检查逻辑

**子任务**:
1. 分析失败原因 (0.5 SP)
2. 修复 Editor 模块测试 (1 SP)
3. 修复 Goal 模块测试 (0.5 SP)

---

#### STORY-014: 性能基准测试与优化 (1 SP)
**优先级**: P2  
**依赖**: 无  

**用户故事**:
作为用户，我希望应用响应迅速，即使处理大量数据时也能流畅运行。

**验收标准**:
- [ ] 建立性能基准测试套件
- [ ] DAG 渲染性能: <100ms (50 nodes), <500ms (200 nodes)
- [ ] 首屏加载: <3s
- [ ] 交互响应: <100ms

**技术方案**:
- 使用 Lighthouse CI
- Vitest benchmark 功能
- Chrome DevTools Performance

**子任务**:
1. 创建性能测试框架 (0.5 SP)
2. 收集基准数据 (0.5 SP)

---

### 🎨 DAG 可视化增强 (8 SP)

#### STORY-015: DAG 图表导出功能 (2 SP)
**优先级**: P0  
**依赖**: STORY-010  

**用户故事**:
作为用户，我希望能将 DAG 图导出为图片或 PDF，以便在报告或分享中使用。

**验收标准**:
- [ ] 支持导出为 PNG 格式 (高质量，可配置尺寸)
- [ ] 支持导出为 SVG 格式 (矢量图)
- [ ] 支持导出为 PDF 格式 (包含标题和时间戳)
- [ ] 导出前预览功能
- [ ] 自定义导出选项 (背景色、水印、分辨率)

**技术方案**:
```typescript
// ECharts 内置导出
chart.getDataURL({
  type: 'png',
  pixelRatio: 2,
  backgroundColor: '#fff'
})

// 使用 html2canvas + jsPDF
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
```

**UI 设计**:
- 工具栏添加 "导出" 按钮
- 弹窗选择格式和配置
- 下载进度提示

**子任务**:
1. PNG/SVG 导出实现 (1 SP)
2. PDF 导出实现 (0.5 SP)
3. 导出配置 UI (0.5 SP)

---

#### STORY-016: 多 Goal 对比视图 (3 SP)
**优先级**: P1  
**依赖**: STORY-010  

**用户故事**:
作为用户，我希望能同时查看多个 Goal 的 DAG 图，以便对比它们的结构和权重分布。

**验收标准**:
- [ ] 支持选择 2-4 个 Goal 进行对比
- [ ] 并排显示多个 DAG 图 (网格布局)
- [ ] 统一的颜色方案和缩放比例
- [ ] 高亮相似的结构模式
- [ ] 对比统计数据 (KR 数量、权重分布、完成度)

**技术方案**:
```vue
<template>
  <v-row>
    <v-col v-for="goal in selectedGoals" :key="goal.uuid" :cols="12 / selectedGoals.length">
      <GoalDAGVisualization :goal-uuid="goal.uuid" :sync-zoom="true" />
    </v-col>
  </v-row>
</template>
```

**UI 设计**:
- Goal 选择器 (多选下拉)
- 网格布局切换 (2列/3列/4列)
- 同步缩放/平移选项

**子任务**:
1. 多视图容器组件 (1 SP)
2. 同步交互逻辑 (1 SP)
3. 对比统计面板 (1 SP)

---

#### STORY-017: DAG 时间线动画 (2 SP)
**优先级**: P2  
**依赖**: STORY-005, STORY-010  

**用户故事**:
作为用户，我希望能回放 Goal 权重的变化历史，以动画形式直观看到演进过程。

**验收标准**:
- [ ] 基于权重快照数据生成时间线
- [ ] 平滑动画过渡 (节点大小、边宽度变化)
- [ ] 播放控制 (播放/暂停/速度调节)
- [ ] 时间轴拖动到任意时刻
- [ ] 显示关键事件标记 (权重调整、KR 完成等)

**技术方案**:
```typescript
// ECharts timeline 组件
option = {
  timeline: {
    data: snapshots.map(s => s.createdAt),
    axisType: 'time',
    autoPlay: true,
    playInterval: 1000
  },
  options: snapshots.map(s => ({
    series: [{
      data: calculateNodes(s),
      links: calculateLinks(s)
    }]
  }))
}
```

**子任务**:
1. 时间线数据转换 (0.5 SP)
2. 动画实现 (1 SP)
3. 播放控制 UI (0.5 SP)

---

#### STORY-018: 大规模 DAG 性能优化 (1 SP)
**优先级**: P1  
**依赖**: STORY-010  

**用户故事**:
作为用户，我希望即使 Goal 有很多 KeyResult 时，DAG 图也能流畅渲染。

**验收标准**:
- [ ] 支持 100+ 节点的流畅渲染 (60 FPS)
- [ ] 虚拟渲染技术 (只渲染可见区域)
- [ ] 按需加载节点详情
- [ ] 渐进式渲染 (先显示骨架，再填充细节)

**技术方案**:
- ECharts progressive rendering
- Canvas 分层渲染
- 节点聚合 (超过阈值时自动分组)

**子任务**:
1. 渐进式渲染实现 (0.5 SP)
2. 节点聚合逻辑 (0.5 SP)

---

### 🤖 智能功能 (7 SP)

#### STORY-019: AI 辅助权重分配 (3 SP)
**优先级**: P0  
**依赖**: STORY-003  

**用户故事**:
作为用户，我希望 AI 能根据 KeyResult 的描述智能推荐权重分配，减少手动调整。

**验收标准**:
- [ ] 分析 KeyResult 标题和描述
- [ ] 基于关键词、复杂度、优先级推荐权重
- [ ] 提供 3 种分配策略 (均衡、重点突出、阶梯式)
- [ ] 解释推荐理由
- [ ] 一键应用推荐权重

**技术方案**:
```typescript
// 使用 OpenAI API 或本地 NLP 模型
interface WeightRecommendation {
  krUuid: string;
  suggestedWeight: number;
  reason: string;
  confidence: number;
}

async function recommendWeights(keyResults: KeyResult[]): Promise<WeightRecommendation[]> {
  // 关键词分析
  const keywords = extractKeywords(keyResults);
  
  // 复杂度评分
  const complexity = analyzeComplexity(keyResults);
  
  // 权重计算
  return calculateWeights(keywords, complexity);
}
```

**AI 模型**:
- 选项 A: OpenAI GPT-4 API
- 选项 B: 本地 TensorFlow.js 模型
- 选项 C: 规则引擎 (基于关键词)

**子任务**:
1. AI 模型集成 (1 SP)
2. 权重计算算法 (1 SP)
3. 推荐 UI (1 SP)

---

#### STORY-020: 智能 Goal 模板推荐 (2 SP)
**优先级**: P1  
**依赖**: STORY-002  

**用户故事**:
作为用户，我希望系统能根据我的历史 Goal 和行业最佳实践，推荐合适的 Goal 模板。

**验收标准**:
- [ ] 分析用户历史 Goal 模式
- [ ] 推荐 5-10 个相关模板
- [ ] 显示模板的成功率和使用频率
- [ ] 支持自定义模板保存
- [ ] 模板市场 (分享和下载)

**技术方案**:
- 协同过滤推荐算法
- TF-IDF 文本相似度
- 用户行为分析

**子任务**:
1. 推荐算法实现 (1 SP)
2. 模板市场 UI (1 SP)

---

#### STORY-021: 自动化状态转换规则增强 (2 SP)
**优先级**: P2  
**依赖**: STORY-008  

**用户故事**:
作为用户，我希望系统能自动检测异常状态并提供修复建议。

**验收标准**:
- [ ] 检测长期无更新的 Goal (超过 30 天)
- [ ] 检测权重分配异常 (某个 KR 权重过高/过低)
- [ ] 检测进度停滞 (多个周期无变化)
- [ ] 提供自动修复建议 (归档、调整权重、拆分 KR)
- [ ] 批量应用修复

**技术方案**:
```typescript
interface HealthCheck {
  type: 'stale' | 'weight_anomaly' | 'progress_stall';
  severity: 'warning' | 'error';
  suggestion: string;
  autoFix?: () => void;
}

function diagnoseGoal(goal: Goal): HealthCheck[] {
  const checks: HealthCheck[] = [];
  
  // 检测停滞
  if (daysSinceLastUpdate(goal) > 30) {
    checks.push({
      type: 'stale',
      severity: 'warning',
      suggestion: '考虑归档或重新激活此 Goal',
      autoFix: () => goal.archive()
    });
  }
  
  return checks;
}
```

**子任务**:
1. 健康检查逻辑 (1 SP)
2. 修复建议 UI (1 SP)

---

## 📊 Sprint 3 容量规划

**总 Story Points**: 21 SP

### 按优先级分布
- **P0 (必须完成)**: 11 SP (52%)
  - STORY-012: 测试环境 (3 SP)
  - STORY-015: DAG 导出 (2 SP)
  - STORY-019: AI 权重分配 (3 SP)
  - STORY-014: 性能基准 (1 SP)
  - STORY-018: 大规模优化 (1 SP)
  - STORY-013: DTO 测试修复 (2 SP) 部分

- **P1 (高优先级)**: 7 SP (33%)
  - STORY-013: DTO 测试 (剩余 1 SP)
  - STORY-016: 多 Goal 对比 (3 SP)
  - STORY-020: 模板推荐 (2 SP)

- **P2 (中优先级)**: 3 SP (15%)
  - STORY-017: 时间线动画 (2 SP)
  - STORY-021: 状态转换增强 (2 SP) 部分
  - STORY-014: 性能优化 (剩余部分)

### 按类别分布
- **技术债务**: 6 SP (29%)
- **功能增强**: 8 SP (38%)
- **智能功能**: 7 SP (33%)

### 风险评估
- **高风险**: STORY-019 (AI 集成，技术复杂度高)
- **中风险**: STORY-012 (测试框架迁移)
- **低风险**: STORY-015, STORY-016, STORY-017

---

## 🎯 Sprint 目标优先级

### 第一周 (0-5 工作日)
**目标**: 完成 P0 任务，确保技术债务清理

1. **Day 1-2**: STORY-012 测试环境修复 (3 SP)
2. **Day 3**: STORY-015 DAG 导出 (2 SP)
3. **Day 4-5**: STORY-019 AI 权重分配 (3 SP)

**里程碑**: 测试覆盖率 ≥85%，DAG 导出功能上线

### 第二周 (6-10 工作日)
**目标**: 完成 P1 任务，交付智能功能

1. **Day 6**: STORY-013 DTO 测试修复 (2 SP)
2. **Day 7-8**: STORY-016 多 Goal 对比 (3 SP)
3. **Day 9**: STORY-020 模板推荐 (2 SP)
4. **Day 10**: STORY-017/018/021 (时间允许时)

**里程碑**: 所有 P0/P1 任务完成，AI 功能上线

---

## 📈 成功指标

### 技术指标
- [ ] 测试覆盖率: ≥85%
- [ ] 单元测试通过率: 100%
- [ ] E2E 测试通过率: 100%
- [ ] DAG 渲染性能: <100ms (50 nodes)
- [ ] 首屏加载时间: <3s

### 功能指标
- [ ] DAG 导出成功率: ≥95%
- [ ] AI 权重推荐准确度: ≥70% (用户接受率)
- [ ] 模板推荐相关性: ≥60%

### 用户满意度
- [ ] 用户反馈评分: ≥4.5/5
- [ ] Bug 数量: <5 个 (Severity ≥ Medium)

---

## 🔄 迭代计划

### Sprint 3.1 (Week 1)
**Focus**: 技术债务 + DAG 导出

- STORY-012: 测试环境修复
- STORY-015: DAG 导出功能
- STORY-019: AI 权重分配 (开始)

### Sprint 3.2 (Week 2)
**Focus**: 智能功能 + 多视图

- STORY-019: AI 权重分配 (完成)
- STORY-016: 多 Goal 对比
- STORY-013: DTO 测试修复
- STORY-020: 模板推荐

---

## 📝 Notes

### 技术选型建议
1. **测试框架**: 建议升级到 Vitest 4.x 而非迁移到 Jest
2. **AI 模型**: 优先使用规则引擎，后续可接入 OpenAI API
3. **导出库**: html2canvas + jsPDF (成熟稳定)

### 依赖关系
```
STORY-012 (测试环境)
  └─> STORY-013 (DTO 测试)
  
STORY-010 (DAG 基础)
  ├─> STORY-015 (导出)
  ├─> STORY-016 (多视图)
  ├─> STORY-017 (时间线)
  └─> STORY-018 (性能优化)
  
STORY-003 (权重建议)
  └─> STORY-019 (AI 权重)
  
STORY-002 (创建向导)
  └─> STORY-020 (模板推荐)
  
STORY-008 (状态转换)
  └─> STORY-021 (状态增强)
```

---

**创建时间**: 2024-10-22 18:30  
**负责 SM**: AI Scrum Master  
**负责 DEV**: AI Development Team  
**状态**: ✅ 规划完成，等待开发启动

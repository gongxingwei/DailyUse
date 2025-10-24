# STORY-GOAL-002-008: KR 权重快照 - UI 权重对比视图

> **Story ID**: STORY-GOAL-002-008  
> **Epic**: EPIC-GOAL-002 - KR 权重快照  
> **Sprint**: Sprint 2a  
> **Story Points**: 2 SP  
> **优先级**: P2 (Nice to Have)  
> **负责人**: Frontend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 用户  
**我想要** 对比不同时间点的 KR 权重分配  
**以便于** 分析权重调整策略的变化

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: 多时间点对比表格

```gherkin
Scenario: 选择时间点进行对比
  Given 用户打开权重对比页面
  When 选择 2-5 个时间点
  Then 应该展示对比表格
  And 每行一个 KeyResult
  And 每列一个时间点的权重
  And 高亮权重增加（绿色）和减少（红色）

Scenario: 显示权重变化趋势
  When 对比多个时间点
  Then 每个 KR 行应显示趋势指示器
  And ↑ 表示整体上升
  And ↓ 表示整体下降
  And → 表示基本持平
```

---

## 📋 任务清单 (Task Breakdown)

- [ ] **Task 1.1**: 创建 `WeightComparisonView.vue`
- [ ] **Task 1.2**: 时间点选择器（最多 5 个）
- [ ] **Task 1.3**: 对比表格实现
- [ ] **Task 1.4**: 权重变化高亮和趋势指示器

---

## ✅ Definition of Done

- [ ] 对比表格实现完成
- [ ] 时间点选择功能完成（2-5 个）
- [ ] 权重变化高亮完成
- [ ] E2E 测试通过

---

## 📊 预估时间

**总计**: **6 小时** (2 SP)

---

**Story 创建日期**: 2025-10-22  
**Story 创建者**: SM  
**最后更新**: 2025-10-22

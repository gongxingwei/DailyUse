# Schedule 模块功能文档# Schedule 模块功能构思（MVP & MMP）

本目录收录 Schedule 模块的所有 Feature Spec 文档。本目录收录 Schedule 模块的所有“超越 CRUD”功能构思与详细设计文档。

## 📋 功能列表## 功能总览

| 编号 | 功能名称 | 优先级 | 文档 |### Phase 1 (MVP - 2周)

|------|---------|--------|------|

| SCHEDULE-001 | 日程冲突检测 | P0 | [01-conflict-detection.md](./01-conflict-detection.md) |1. Cron 表达式可视化与校验

| SCHEDULE-003 | 日历同步 | P1 | [03-calendar-sync.md](./03-calendar-sync.md) |2. 时区安全与漂移校正

| SCHEDULE-004 | 周视图 | P1 | [04-week-view.md](./04-week-view.md) |3. 最大执行次数与重试/退避策略

| SCHEDULE-005 | 时间热力图 | P2 | [05-time-heatmap.md](./05-time-heatmap.md) |4. 调度任务健康监控与告警

| SCHEDULE-006 | 日程搜索过滤 | P3 | [06-search-filter.md](./06-search-filter.md) |

### Phase 2 (MMP - 4周)

## 📊 统计信息

5. 跨模块统一调度看板

- **总功能数**: 56. 动态调度优先级调整

- **P0 功能**: 1 个7. 调度任务依赖与串并行编排

- **P1 功能**: 2 个8. 调度执行历史与趋势分析

- **P2 功能**: 1 个

- **P3 功能**: 1 个---

---每个功能均有独立详细文档，详见本文件夹下各 .md 文件。

_最后更新: 2025-10-21_

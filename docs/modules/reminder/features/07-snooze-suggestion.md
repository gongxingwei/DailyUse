# SNOOZE 智能建议

## 概述

根据用户历史 SNOOZE 行为，智能推荐最佳延迟时间，提升提醒完成率。

## 目标与价值

- SNOOZE 转完成率 +15%
- 降低用户遗忘率

## 主要设计点

- 分析 ReminderHistory 中 SNOOZE 行为
- 推荐常用延迟时长，支持一键选择
- 字段对齐 notificationConfig.actions

## MMP 路径

- 后端行为分析与推荐算法，前端推荐入口

## 验收标准

- 推荐时长与用户习惯高度相关
- SNOOZE 后完成率明显提升

# DDD聚合根数据库重构 - 移除冗余字段

## 重构概述

移除KeyResult和GoalRecord表中的冗余accountUuid字段，完全实现DDD聚合根控制模式。

## 当前问题分析

### 冗余字段识别
1. **KeyResult表**: 同时有 `account_uuid` 和 `goal_uuid`（冗余）
2. **GoalRecord表**: 同时有 `account_uuid`、`goal_uuid` 和 `key_result_uuid`（严重冗余）
3. **GoalReview表**: 只有 `goal_uuid`（✅ 已经正确）

### 理想的DDD设计
```
Goal (account_uuid) 
  ├── KeyResult (goal_uuid only)
  │   └── GoalRecord (key_result_uuid only)
  └── GoalReview (goal_uuid only) ✅
```

## 实施计划

### 阶段1: 创建数据库迁移脚本
### 阶段2: 更新Prisma Schema
### 阶段3: 更新DTO接口
### 阶段4: 更新仓储实现
### 阶段5: 验证和测试

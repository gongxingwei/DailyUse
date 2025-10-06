# Reminder Cron Scheduling Migration - Integration Testing Guide

## 概述
本文档提供了测试新的 Cron 调度架构的完整指南。

## 前置条件
1. 数据库迁移已完成
2. RecurringScheduleTask 表已创建
3. API 服务正在运行
4. 前端应用已构建并运行

## 测试场景

### 测试 1: 每日提醒 (Daily Reminder)

#### 目标
创建一个每天上午 9:00 触发的提醒，验证 Cron 表达式正确生成。

#### 步骤
1. 登录应用
2. 导航到提醒模块
3. 创建新提醒模板:
   - 标题: "每日晨间提醒"
   - 消息: "开始新的一天!"
   - 优先级: normal
   - 时间配置:
     - 类型: daily
     - 时间: 09:00

#### 预期结果
- ✅ 提醒模板创建成功
- ✅ RecurringScheduleTask 记录被创建
- ✅ Cron 表达式为: `0 0 9 * * *`
- ✅ 调度状态显示为 "已启用"
- ✅ 下次执行时间正确显示

#### 验证数据库
```sql
SELECT uuid, name, cron_expression, trigger_type, enabled, status
FROM recurring_schedule_tasks
WHERE source_module = 'reminder' AND source_entity_id = '<template_uuid>';
```

---

### 测试 2: 每周提醒 (Weekly Reminder)

#### 目标
创建每周一、三、五下午 2:30 触发的提醒。

#### 步骤
1. 创建新提醒模板:
   - 标题: "每周工作提醒"
   - 消息: "检查本周任务"
   - 优先级: high
   - 时间配置:
     - 类型: weekly
     - 时间: 14:30
     - 星期: [1, 3, 5] (周一、三、五)

#### 预期结果
- ✅ Cron 表达式为: `0 30 14 * * 1,3,5`
- ✅ Cron 描述: "每周一, 周三 和 周五 在 14:30"
- ✅ 下次执行时间为本周最近的星期一/三/五 14:30

---

### 测试 3: 每月提醒 (Monthly Reminder)

#### 目标
创建每月 1 号和 15 号上午 10:00 触发的提醒。

#### 步骤
1. 创建新提醒模板:
   - 标题: "月度账单提醒"
   - 消息: "支付账单"
   - 优先级: urgent
   - 时间配置:
     - 类型: monthly
     - 时间: 10:00
     - 日期: [1, 15]

#### 预期结果
- ✅ Cron 表达式为: `0 0 10 1,15 * *`
- ✅ Cron 描述: "每月 1 和 15 号 在 10:00"
- ✅ 下次执行时间为本月或下月的 1 号或 15 号 10:00

---

### 测试 4: 启用/禁用提醒

#### 目标
验证启用/禁用提醒时，RecurringScheduleTask 的状态同步更新。

#### 步骤
1. 创建一个每日提醒
2. 禁用该提醒
3. 查看调度状态
4. 重新启用该提醒
5. 再次查看调度状态

#### 预期结果
**禁用时:**
- ✅ RecurringScheduleTask.enabled = false
- ✅ RecurringScheduleTask.status = 'PAUSED'
- ✅ 前端显示 "已禁用" 状态
- ✅ SchedulerService 移除定时器

**启用时:**
- ✅ RecurringScheduleTask.enabled = true
- ✅ RecurringScheduleTask.status = 'ACTIVE'
- ✅ 前端显示 "已启用" 状态
- ✅ SchedulerService 注册新定时器

---

### 测试 5: 删除提醒模板

#### 目标
验证删除提醒模板时，关联的 RecurringScheduleTask 也被删除。

#### 步骤
1. 创建一个每日提醒
2. 记录 templateUuid
3. 删除该提醒模板
4. 查询 recurring_schedule_tasks 表

#### 预期结果
- ✅ 提醒模板被删除
- ✅ 关联的 RecurringScheduleTask 被删除
- ✅ SchedulerService 移除定时器
- ✅ 前端列表中不再显示该提醒

#### 验证数据库
```sql
SELECT COUNT(*)
FROM recurring_schedule_tasks
WHERE source_module = 'reminder' AND source_entity_id = '<deleted_template_uuid>';
-- 应该返回 0
```

---

### 测试 6: 更新时间配置

#### 目标
验证更新提醒时间配置时，Cron 表达式正确更新。

#### 步骤
1. 创建每日 9:00 提醒
2. 更新时间为每日 15:00
3. 查看 Cron 表达式
4. 更新为每周二、四 10:30
5. 再次查看 Cron 表达式

#### 预期结果
**初始创建:**
- ✅ Cron: `0 0 9 * * *`

**更新为 15:00:**
- ✅ Cron: `0 0 15 * * *`
- ✅ nextRunAt 被重新计算

**更新为每周:**
- ✅ Cron: `0 30 10 * * 2,4`
- ✅ nextRunAt 更新为下一个周二或周四 10:30

---

### 测试 7: 单次提醒 (Once Trigger)

#### 目标
创建一次性提醒，验证 ONCE 触发类型。

#### 步骤
1. 创建新提醒模板:
   - 标题: "重要会议提醒"
   - 消息: "参加会议"
   - 优先级: urgent
   - 时间配置:
     - 类型: once
     - 调度时间: 2025-10-13 14:00:00

#### 预期结果
- ✅ RecurringScheduleTask.triggerType = 'ONCE'
- ✅ RecurringScheduleTask.scheduledTime = 指定时间
- ✅ RecurringScheduleTask.cronExpression = null
- ✅ 调度状态显示具体执行时间
- ✅ 执行后自动标记为 COMPLETED

---

## API 端点测试

### 1. 获取调度状态
```http
GET /reminders/templates/:templateUuid/schedule-status
Authorization: Bearer <token>
```

**预期响应:**
```json
{
  "code": 200,
  "message": "Schedule status retrieved successfully",
  "data": {
    "hasSchedule": true,
    "enabled": true,
    "nextRunAt": "2025-10-07T09:00:00.000Z",
    "lastRunAt": null,
    "executionCount": 0,
    "recentExecutions": [],
    "cronExpression": "0 0 9 * * *",
    "cronDescription": "每天 在 09:00",
    "triggerType": "CRON",
    "status": "ACTIVE"
  }
}
```

---

## 前端组件测试

### ScheduleStatusCard 组件

#### 测试点
1. **加载状态** - 显示骨架屏
2. **空状态** - 未设置调度时显示提示
3. **Cron 信息显示** - 正确显示 Cron 表达式和描述
4. **时间显示** - 下次/上次执行时间正确格式化
5. **执行历史** - 展开面板显示历史记录
6. **状态徽章** - 根据 enabled 和 status 显示正确颜色
7. **自动刷新** - 启用 autoRefresh 时定期更新

---

## 性能测试

### 1. 大量提醒性能
- 创建 100 个每日提醒
- 验证 SchedulerService 正常管理所有定时器
- 检查内存使用情况

### 2. 并发更新
- 同时更新多个提醒的时间配置
- 验证数据一致性
- 检查是否有竞态条件

---

## 回归测试

### 确保未破坏现有功能
- ✅ 创建提醒模板
- ✅ 更新提醒模板
- ✅ 删除提醒模板
- ✅ 分组管理
- ✅ 权限控制
- ✅ 搜索和过滤

---

## 已知问题和限制

### 1. 废弃的实例相关 API
以下 API 端点已废弃，但暂时保留以兼容旧代码:
- `POST /reminders/templates/:id/instances`
- `GET /reminders/templates/:id/instances`
- `PUT /reminders/templates/:id/instances/:instanceId`
- `DELETE /reminders/templates/:id/instances/:instanceId`

### 2. ReminderInstanceSidebar 组件
- 该组件仍然尝试获取实例数据
- 建议替换为使用 ScheduleStatusCard

---

## 测试清单

- [ ] 测试 1: 每日提醒
- [ ] 测试 2: 每周提醒
- [ ] 测试 3: 每月提醒
- [ ] 测试 4: 启用/禁用
- [ ] 测试 5: 删除模板
- [ ] 测试 6: 更新时间配置
- [ ] 测试 7: 单次提醒
- [ ] API 端点测试
- [ ] 前端组件测试
- [ ] 性能测试
- [ ] 回归测试

---

## 成功标准

所有测试通过且满足以下条件:
1. ✅ Cron 表达式正确生成
2. ✅ 调度任务正确创建和更新
3. ✅ 前端正确显示调度状态
4. ✅ 数据库状态一致
5. ✅ 无内存泄漏
6. ✅ 无竞态条件
7. ✅ 错误处理正确
8. ✅ 日志记录完整

---

## 下一步行动

1. 执行所有测试场景
2. 记录测试结果
3. 修复发现的问题
4. 更新文档
5. 准备生产部署

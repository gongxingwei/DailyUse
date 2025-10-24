# Schedule 模块 API 快速参考

## 🚀 快速开始

### 认证

所有端点都需要 Bearer token：

```http
Authorization: Bearer <your-jwt-token>
```

### Base URL

```
http://localhost:3000/api/schedules
```

## 📋 任务管理 API

### 1. 创建任务

```http
POST /api/schedules/tasks
Content-Type: application/json

{
  "name": "每日提醒任务",
  "description": "每天早上9点提醒",
  "sourceModule": "reminder",
  "sourceEntityId": "reminder-uuid-123",
  "schedule": {
    "cronExpression": "0 9 * * *",
    "timezone": "Asia/Shanghai",
    "startDate": 1234567890000,
    "endDate": null,
    "maxExecutions": null
  },
  "retryConfig": {
    "enabled": true,
    "maxRetries": 3,
    "retryDelay": 5000,
    "backoffMultiplier": 2,
    "maxRetryDelay": 60000
  },
  "payload": {
    "reminderMessage": "该起床了！"
  },
  "tags": ["important", "daily"]
}
```

### 2. 获取任务列表

```http
GET /api/schedules/tasks
```

### 3. 获取任务详情

```http
GET /api/schedules/tasks/:taskUuid
```

### 4. 查找待执行任务

```http
GET /api/schedules/tasks/due?beforeTime=2025-10-12T00:00:00Z&limit=10
```

### 5. 暂停任务

```http
POST /api/schedules/tasks/:taskUuid/pause
```

### 6. 恢复任务

```http
POST /api/schedules/tasks/:taskUuid/resume
```

### 7. 完成任务

```http
POST /api/schedules/tasks/:taskUuid/complete
Content-Type: application/json

{
  "reason": "所有执行完成"
}
```

### 8. 取消任务

```http
POST /api/schedules/tasks/:taskUuid/cancel
Content-Type: application/json

{
  "reason": "用户取消"
}
```

### 9. 删除任务

```http
DELETE /api/schedules/tasks/:taskUuid
```

### 10. 批量创建任务

```http
POST /api/schedules/tasks/batch
Content-Type: application/json

{
  "tasks": [
    {
      "name": "任务1",
      "sourceModule": "reminder",
      "sourceEntityId": "entity-1",
      "schedule": { ... }
    },
    {
      "name": "任务2",
      "sourceModule": "task",
      "sourceEntityId": "entity-2",
      "schedule": { ... }
    }
  ]
}
```

### 11. 批量删除任务

```http
POST /api/schedules/tasks/batch/delete
Content-Type: application/json

{
  "taskUuids": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
}
```

### 12. 更新任务元数据

```http
PATCH /api/schedules/tasks/:taskUuid/metadata
Content-Type: application/json

{
  "payload": {
    "newField": "newValue"
  },
  "tagsToAdd": ["urgent"],
  "tagsToRemove": ["daily"]
}
```

## 📊 统计信息 API

### 1. 获取统计信息

```http
GET /api/schedules/statistics
```

**响应示例**:

```json
{
  "code": 200,
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "accountUuid": "account-uuid",
    "totalTasks": 10,
    "activeTasks": 8,
    "pausedTasks": 1,
    "completedTasks": 1,
    "failedTasks": 0,
    "totalExecutions": 150,
    "successfulExecutions": 145,
    "failedExecutions": 5,
    "moduleStatistics": {
      "reminder": {
        "totalTasks": 5,
        "activeTasks": 4,
        "totalExecutions": 100,
        "successfulExecutions": 98,
        "failedExecutions": 2
      },
      "task": { ... },
      "goal": { ... },
      "notification": { ... }
    }
  }
}
```

### 2. 获取模块统计

```http
GET /api/schedules/statistics/module/:module

# 示例
GET /api/schedules/statistics/module/reminder
GET /api/schedules/statistics/module/task
```

### 3. 获取所有模块统计

```http
GET /api/schedules/statistics/modules
```

### 4. 重新计算统计

```http
POST /api/schedules/statistics/recalculate
```

### 5. 重置统计

```http
POST /api/schedules/statistics/reset
```

### 6. 删除统计

```http
DELETE /api/schedules/statistics
```

## 🏷️ 数据模型

### ScheduleConfig (调度配置)

```typescript
{
  cronExpression: string | null; // Cron 表达式 "0 9 * * *"
  timezone: string; // 时区 "Asia/Shanghai"
  startDate: number | null; // 开始时间 (epoch ms)
  endDate: number | null; // 结束时间 (epoch ms)
  maxExecutions: number | null; // 最大执行次数
}
```

### RetryPolicy (重试策略)

```typescript
{
  enabled: boolean; // 是否启用重试
  maxRetries: number; // 最大重试次数
  retryDelay: number; // 初始重试延迟 (ms)
  backoffMultiplier: number; // 退避倍数
  maxRetryDelay: number; // 最大重试延迟 (ms)
}
```

### TaskMetadata (任务元数据)

```typescript
{
  payload: any | null;               // 任务载荷
  tags: string[];                    // 标签
  priority: string;                  // 优先级
  timeout: number;                   // 超时时间 (ms)
}
```

### SourceModule (来源模块)

```typescript
type SourceModule =
  | 'reminder' // 提醒模块
  | 'task' // 任务模块
  | 'goal' // 目标模块
  | 'notification'; // 通知模块
```

### ScheduleTaskStatus (任务状态)

```typescript
type ScheduleTaskStatus =
  | 'active' // 活跃
  | 'paused' // 暂停
  | 'completed' // 完成
  | 'failed' // 失败
  | 'cancelled'; // 取消
```

## 🔍 查询参数

### 查找待执行任务

```http
GET /api/schedules/tasks/due?beforeTime=<ISO8601>&limit=<number>
```

- `beforeTime`: ISO 8601 格式时间戳（默认：当前时间）
- `limit`: 返回数量限制（可选）

## 🚨 错误响应

### 400 - 验证错误

```json
{
  "code": 400,
  "success": false,
  "message": "Invalid UUID format"
}
```

### 401 - 未认证

```json
{
  "code": 401,
  "success": false,
  "message": "Authentication required"
}
```

### 403 - 无权限

```json
{
  "code": 403,
  "success": false,
  "message": "You do not have permission to access this schedule task"
}
```

### 404 - 未找到

```json
{
  "code": 404,
  "success": false,
  "message": "Schedule task not found"
}
```

### 500 - 服务器错误

```json
{
  "code": 500,
  "success": false,
  "message": "Failed to create schedule task"
}
```

## 📝 Cron 表达式示例

```
0 9 * * *         # 每天早上9点
0 */2 * * *       # 每2小时
0 0 * * 0         # 每周日午夜
0 0 1 * *         # 每月1号午夜
0 0 1 1 *         # 每年1月1号午夜
*/5 * * * *       # 每5分钟
0 9-17 * * 1-5    # 工作日 9am-5pm 每小时
```

## 🧪 测试用例

### 创建简单的每日任务

```bash
curl -X POST http://localhost:3000/api/schedules/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "每日备份",
    "sourceModule": "task",
    "sourceEntityId": "backup-task-1",
    "schedule": {
      "cronExpression": "0 2 * * *",
      "timezone": "UTC"
    }
  }'
```

### 查询待执行任务

```bash
curl -X GET "http://localhost:3000/api/schedules/tasks/due?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 暂停任务

```bash
curl -X POST http://localhost:3000/api/schedules/tasks/TASK_UUID/pause \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 💡 最佳实践

1. **Cron 表达式**: 使用标准的 5 段式 cron 表达式
2. **时区**: 明确指定时区，避免混淆
3. **重试策略**: 根据任务类型配置合理的重试参数
4. **标签**: 使用标签组织和过滤任务
5. **元数据**: 在 payload 中存储任务执行所需的数据
6. **批量操作**: 大量任务操作时使用批量 API
7. **统计监控**: 定期检查统计信息，监控任务健康状态

## 🔗 相关文档

- [完整实现文档](./SCHEDULE_MODULE_IMPLEMENTATION_COMPLETE.md)
- [Prisma Schema 重构](../../apps/api/prisma/schema.prisma)
- [领域服务](../../packages/domain-server/src/schedule/)
- [Repository 实现](../../apps/api/src/modules/schedule/infrastructure/)

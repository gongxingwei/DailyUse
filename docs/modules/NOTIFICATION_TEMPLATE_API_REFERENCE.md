# Notification Template API Quick Reference

## 概述

通知模板 API 提供了完整的模板管理功能，遵循 DDD 聚合根控制模式。所有端点都需要 JWT 认证。

**Base URL**: `/api/v1/notification-templates`

---

## 端点列表

### 1. 创建模板

**POST** `/notification-templates`

创建新的通知模板。

**请求头**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求体**:
```json
{
  "uuid": "string (required)",
  "name": "string (required, unique)",
  "type": "NotificationType (required)",
  "titleTemplate": "string (required)",
  "contentTemplate": "string (required)",
  "defaultPriority": "NotificationPriority (required)",
  "defaultChannels": ["NotificationChannel"] (required),
  "variables": ["string"] (required),
  "icon": "string (optional)",
  "defaultActions": [NotificationAction] (optional),
  "enabled": "boolean (optional, default: true)"
}
```

**响应** `201 Created`:
```json
{
  "code": "SUCCESS",
  "message": "Notification template created successfully",
  "data": {
    "uuid": "string",
    "name": "string",
    "type": "NotificationType",
    ...
  }
}
```

**错误**:
- `400 VALIDATION_ERROR`: 模板名称已存在或验证失败

---

### 2. 获取模板列表

**GET** `/notification-templates`

查询模板列表，支持筛选和分页。

**查询参数**:
- `type` (optional): 按类型筛选
- `enabled` (optional): 按启用状态筛选 (true/false)
- `nameContains` (optional): 按名称模糊搜索
- `limit` (optional): 返回数量限制 (default: 50)
- `offset` (optional): 分页偏移量 (default: 0)

**示例**:
```
GET /notification-templates?type=task_reminder&enabled=true&limit=20&offset=0
```

**响应** `200 OK`:
```json
{
  "code": "SUCCESS",
  "message": "Notification templates retrieved successfully",
  "data": {
    "data": [
      {
        "uuid": "string",
        "name": "string",
        "type": "string",
        "enabled": true,
        ...
      }
    ],
    "total": 100
  }
}
```

---

### 3. 获取模板详情

**GET** `/notification-templates/:id`

获取单个模板的完整信息。

**路径参数**:
- `id`: 模板 UUID

**响应** `200 OK`:
```json
{
  "code": "SUCCESS",
  "message": "Notification template retrieved successfully",
  "data": {
    "uuid": "string",
    "name": "string",
    "type": "NotificationType",
    "titleTemplate": "string",
    "contentTemplate": "string",
    "defaultPriority": "NORMAL",
    "defaultChannels": ["in_app", "sse"],
    "variables": ["userName", "taskName"],
    "enabled": true,
    "lifecycle": {
      "createdAt": 1704614400000,
      "updatedAt": 1704614400000
    }
  }
}
```

**错误**:
- `404 NOT_FOUND`: 模板不存在

---

### 4. 更新模板

**PUT** `/notification-templates/:id`

更新现有模板的属性。

**请求体** (所有字段都是可选的):
```json
{
  "name": "string",
  "titleTemplate": "string",
  "contentTemplate": "string",
  "defaultPriority": "NotificationPriority",
  "defaultChannels": ["NotificationChannel"],
  "variables": ["string"],
  "icon": "string",
  "defaultActions": [NotificationAction]
}
```

**响应** `200 OK`:
```json
{
  "code": "SUCCESS",
  "message": "Notification template updated successfully",
  "data": { ... }
}
```

**错误**:
- `404 NOT_FOUND`: 模板不存在
- `400 VALIDATION_ERROR`: 验证失败或名称冲突

---

### 5. 删除模板

**DELETE** `/notification-templates/:id`

删除指定的模板。

**响应** `200 OK`:
```json
{
  "code": "SUCCESS",
  "message": "Notification template deleted successfully",
  "data": {
    "deletedId": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

**错误**:
- `404 NOT_FOUND`: 模板不存在

---

### 6. 预览模板渲染 ⭐

**POST** `/notification-templates/:id/preview`

使用提供的变量预览模板渲染后的效果。

**请求体**:
```json
{
  "variables": {
    "userName": "张三",
    "taskName": "完成报告",
    "dueTime": "2025-01-10 18:00"
  }
}
```

**响应** `200 OK`:
```json
{
  "code": "SUCCESS",
  "message": "Notification template preview generated successfully",
  "data": {
    "title": "任务提醒：完成报告",
    "content": "亲爱的 张三，您有一个任务 完成报告 将在 2025-01-10 18:00 到期。",
    "variables": {
      "userName": "张三",
      "taskName": "完成报告",
      "dueTime": "2025-01-10 18:00"
    }
  }
}
```

**错误**:
- `404 NOT_FOUND`: 模板不存在
- `400 VALIDATION_ERROR`: 缺少必需的模板变量

---

### 7. 启用模板

**POST** `/notification-templates/:id/enable`

启用被禁用的模板。

**响应** `200 OK`:
```json
{
  "code": "SUCCESS",
  "message": "Notification template enabled successfully",
  "data": {
    "uuid": "string",
    "enabled": true,
    ...
  }
}
```

**错误**:
- `404 NOT_FOUND`: 模板不存在

---

### 8. 禁用模板

**POST** `/notification-templates/:id/disable`

禁用模板，禁用后不能用于创建新通知。

**响应** `200 OK`:
```json
{
  "code": "SUCCESS",
  "message": "Notification template disabled successfully",
  "data": {
    "uuid": "string",
    "enabled": false,
    ...
  }
}
```

**错误**:
- `404 NOT_FOUND`: 模板不存在

---

## 枚举类型

### NotificationType

```typescript
enum NotificationType {
  info = 'info',
  success = 'success',
  warning = 'warning',
  error = 'error',
  system = 'system',
  task_reminder = 'task_reminder',
  goal_milestone = 'goal_milestone',
  schedule_reminder = 'schedule_reminder',
  notification = 'notification',
  custom = 'custom'
}
```

### NotificationPriority

```typescript
enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}
```

### NotificationChannel

```typescript
enum NotificationChannel {
  in_app = 'in_app',
  sse = 'sse',
  system = 'system',
  email = 'email',
  sms = 'sms',
  push = 'push'
}
```

---

## 模板变量语法

模板中使用 `{{variableName}}` 语法定义变量占位符。

**示例**:
```
标题模板: "任务提醒：{{taskName}}"
内容模板: "亲爱的 {{userName}}，您有一个任务 {{taskName}} 将在 {{dueTime}} 到期。"
变量列表: ["userName", "taskName", "dueTime"]
```

**渲染时**:
```json
{
  "variables": {
    "userName": "张三",
    "taskName": "完成季度报告",
    "dueTime": "2025-01-10 18:00"
  }
}
```

**渲染结果**:
```
标题: "任务提醒：完成季度报告"
内容: "亲爱的 张三，您有一个任务 完成季度报告 将在 2025-01-10 18:00 到期。"
```

---

## 使用模板创建通知

创建模板后，可以在通知 API 中使用：

**POST** `/api/v1/notifications/from-template`

```json
{
  "templateUuid": "550e8400-e29b-41d4-a716-446655440001",
  "variables": {
    "userName": "张三",
    "taskName": "完成报告",
    "dueTime": "2025-01-10 18:00"
  },
  "channels": ["in_app", "sse"],
  "priority": "NORMAL"
}
```

---

## 错误响应格式

所有错误响应都遵循统一格式：

```json
{
  "code": "ERROR_CODE",
  "message": "Error description",
  "timestamp": 1704614400000
}
```

**常见错误码**:
- `VALIDATION_ERROR` (400): 请求参数验证失败
- `UNAUTHORIZED` (401): 未提供或无效的 JWT Token
- `NOT_FOUND` (404): 资源不存在
- `INTERNAL_ERROR` (500): 服务器内部错误

---

## Curl 示例

### 创建模板

```bash
curl -X POST http://localhost:3000/api/v1/notification-templates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "550e8400-e29b-41d4-a716-446655440001",
    "name": "task_reminder_template",
    "type": "task_reminder",
    "titleTemplate": "任务提醒：{{taskName}}",
    "contentTemplate": "亲爱的 {{userName}}，您有一个任务 {{taskName}} 将在 {{dueTime}} 到期。",
    "defaultPriority": "NORMAL",
    "defaultChannels": ["in_app", "sse"],
    "variables": ["userName", "taskName", "dueTime"],
    "enabled": true
  }'
```

### 预览模板

```bash
curl -X POST http://localhost:3000/api/v1/notification-templates/550e8400-e29b-41d4-a716-446655440001/preview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "userName": "张三",
      "taskName": "完成报告",
      "dueTime": "2025-01-10 18:00"
    }
  }'
```

### 查询模板列表

```bash
curl -X GET "http://localhost:3000/api/v1/notification-templates?type=task_reminder&enabled=true&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 最佳实践

1. **模板命名**: 使用描述性名称，如 `task_reminder_template`, `goal_milestone_template`
2. **变量命名**: 使用 camelCase，如 `userName`, `taskName`
3. **模板版本控制**: 当需要修改现有模板时，考虑创建新版本而不是直接修改
4. **测试变量**: 使用预览 API 在实际使用前测试模板渲染效果
5. **禁用而非删除**: 不再使用的模板应该禁用而非删除，保留历史记录

---

## 相关文档

- [通知模块架构文档](NOTIFICATION_MODULE_ARCHITECTURE.md)
- [通知快速开始指南](NOTIFICATION_QUICK_START.md)
- [通知模板实现总结](./NOTIFICATION_TEMPLATE_IMPLEMENTATION_SUMMARY.md)
- [Swagger API 文档](http://localhost:3000/api-docs)

---

**最后更新**: 2025-01-07  
**版本**: 1.0.0

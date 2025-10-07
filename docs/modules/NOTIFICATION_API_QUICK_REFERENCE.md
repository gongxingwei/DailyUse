# Notification REST API Quick Reference

## 🚀 API 端点总览

### 基础 URL
```
http://localhost:3000/api/v1
```

### 认证
所有端点需要 JWT Bearer Token：
```
Authorization: Bearer <your-jwt-token>
```

---

## 📬 通知管理 API

### 1. 创建通知
```http
POST /notifications
Content-Type: application/json

{
  "uuid": "string (UUID)",
  "title": "string (required)",
  "content": "string (required)",
  "type": "INFO | WARNING | ERROR | SUCCESS | REMINDER | GOAL | TASK | SCHEDULE | SYSTEM",
  "priority": "LOW | NORMAL | HIGH | URGENT",
  "channels": ["IN_APP", "SSE", "SYSTEM", "EMAIL", "SMS", "PUSH"],
  "icon": "string (optional)",
  "image": "string (optional)",
  "actions": [ // optional
    {
      "id": "string",
      "title": "string",
      "type": "NAVIGATE | EXECUTE | DISMISS",
      "payload": {}
    }
  ],
  "scheduledAt": 1234567890000, // timestamp (optional)
  "expiresAt": 1234567890000, // timestamp (optional)
  "metadata": { // optional
    "sourceType": "goal | task | reminder | schedule | system",
    "sourceId": "string",
    "additionalData": {}
  }
}

Response: NotificationClientDTO (201 Created)
```

### 2. 查询通知列表
```http
GET /notifications?status=SENT&type=REMINDER&limit=20&offset=0&sortBy=createdAt&sortOrder=desc

Query Parameters:
- status: PENDING | SENT | READ | DISMISSED | EXPIRED | FAILED
- type: INFO | WARNING | ERROR | SUCCESS | REMINDER | GOAL | TASK | SCHEDULE | SYSTEM
- channels: IN_APP | SSE | SYSTEM | EMAIL | SMS | PUSH (可多个)
- limit: number (1-100, default: 50)
- offset: number (default: 0)
- sortBy: createdAt | sentAt | readAt | priority
- sortOrder: asc | desc (default: desc)
- createdBefore: timestamp
- createdAfter: timestamp
- scheduledBefore: timestamp
- scheduledAfter: timestamp

Response: NotificationListResponse
{
  "notifications": NotificationClientDTO[],
  "total": number,
  "page": number,
  "limit": number,
  "hasMore": boolean
}
```

### 3. 获取通知详情
```http
GET /notifications/:id

Response: NotificationClientDTO
```

### 4. 删除通知
```http
DELETE /notifications/:id

Response: 200 OK
```

---

## 🔄 状态转换 API（聚合根方法）

### 5. 标记为已读
```http
POST /notifications/:id/read

Response: NotificationClientDTO
- status 变为 READ
- readAt 设置为当前时间
- 发布 NotificationRead 领域事件
```

### 6. 标记为已忽略
```http
POST /notifications/:id/dismiss

Response: NotificationClientDTO
- status 变为 DISMISSED
- dismissedAt 设置为当前时间
- 发布 NotificationDismissed 领域事件
```

---

## 📊 批量操作 API

### 7. 批量标记为已读
```http
POST /notifications/batch-read
Content-Type: application/json

{
  "notificationIds": ["uuid1", "uuid2", "uuid3"]
}

Response: NotificationClientDTO[]
- 验证所有通知所有权
- 原子性批量更新
```

### 8. 批量标记为已忽略
```http
POST /notifications/batch-dismiss
Content-Type: application/json

{
  "notificationIds": ["uuid1", "uuid2", "uuid3"]
}

Response: NotificationClientDTO[]
```

### 9. 批量删除
```http
POST /notifications/batch-delete
Content-Type: application/json

{
  "notificationIds": ["uuid1", "uuid2", "uuid3"]
}

Response: 200 OK
- 级联删除所有 DeliveryReceipt 子实体
```

---

## 📈 统计查询 API

### 10. 获取未读数量
```http
GET /notifications/unread-count

Response: 
{
  "count": number
}
```

### 11. 获取统计信息
```http
GET /notifications/stats

Response: 
{
  "unreadCount": number,
  "totalCount": number,
  "todayCount": number,
  "byType": {},
  "byChannel": {}
}
```

---

## 📄 模板系统 API

### 12. 使用模板创建通知
```http
POST /notifications/from-template
Content-Type: application/json

{
  "templateUuid": "string (required)",
  "variables": { // required
    "userName": "John Doe",
    "goalName": "Complete Project",
    "progress": "75%"
  },
  "channels": ["IN_APP", "SSE"], // optional (覆盖模板默认值)
  "priority": "HIGH", // optional (覆盖模板默认值)
  "scheduledAt": 1234567890000, // optional
  "expiresAt": 1234567890000 // optional
}

Response: NotificationClientDTO (201 Created)
- 自动渲染模板变量
- 应用模板默认配置
```

---

## ⚙️ 用户偏好设置 API

### 13. 获取用户偏好
```http
GET /notification-preferences

Response: NotificationPreferenceDTO
{
  "uuid": "string",
  "accountUuid": "string",
  "enabledTypes": NotificationType[],
  "channelPreferences": {
    "IN_APP": {
      "enabled": boolean,
      "types": NotificationType[],
      "quietHours": {
        "enabled": boolean,
        "startTime": "22:00",
        "endTime": "08:00"
      },
      "settings": {
        "showPreview": boolean,
        "playSound": boolean,
        "soundFile": string,
        "vibrate": boolean,
        "displayDuration": number
      }
    }
  },
  "maxNotifications": number,
  "autoArchiveDays": number,
  "lifecycle": {
    "createdAt": timestamp,
    "updatedAt": timestamp
  }
}
```

### 14. 更新用户偏好
```http
PUT /notification-preferences
Content-Type: application/json

{
  "enabledTypes": ["INFO", "WARNING", "ERROR", "REMINDER"],
  "channelPreferences": {
    "IN_APP": {
      "enabled": true,
      "types": ["INFO", "WARNING", "ERROR"],
      "quietHours": {
        "enabled": true,
        "startTime": "22:00",
        "endTime": "08:00"
      }
    }
  },
  "maxNotifications": 100,
  "autoArchiveDays": 30
}

Response: NotificationPreferenceDTO
```

### 15. 更新指定渠道设置
```http
PATCH /notification-preferences/channels/:channel
Content-Type: application/json

{
  "enabled": true,
  "types": ["INFO", "WARNING", "ERROR"],
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00"
  },
  "settings": {
    "showPreview": true,
    "playSound": true,
    "vibrate": false
  }
}

Response: NotificationPreferenceDTO
```

---

## 📦 DTO 结构

### NotificationClientDTO
```typescript
{
  // 基础字段
  uuid: string;
  accountUuid: string;
  templateUuid?: string;
  title: string;
  content: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  channels: NotificationChannel[];
  icon?: string;
  image?: string;
  actions?: NotificationActionDTO[];
  
  // 时间戳
  scheduledAt?: number;
  sentAt?: number;
  readAt?: number;
  dismissedAt?: number;
  expiresAt?: number;
  
  // 元数据
  metadata?: {
    sourceType?: string;
    sourceId?: string;
    additionalData?: Record<string, any>;
  };
  
  // 生命周期
  lifecycle: {
    createdAt: number;
    updatedAt: number;
  };
  version: number;
  
  // 发送回执
  deliveryReceipts?: DeliveryReceiptClientDTO[];
  
  // ===== 计算属性 =====
  isRead: boolean;
  isDismissed: boolean;
  isExpired: boolean;
  isPending: boolean;
  isSent: boolean;
  isFailed: boolean;
  remainingTime?: number; // 毫秒
  timeSinceSent?: number; // 毫秒
  deliveryStatus: {
    totalChannels: number;
    sentChannels: number;
    deliveredChannels: number;
    failedChannels: number;
    successRate: number; // 0-100
  };
}
```

### DeliveryReceiptClientDTO
```typescript
{
  uuid: string;
  notificationUuid: string;
  channel: NotificationChannel;
  status: DeliveryStatus; // PENDING | SENT | DELIVERED | FAILED | RETRYING
  sentAt?: number;
  deliveredAt?: number;
  failureReason?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}
```

---

## 🔐 错误响应

所有 API 使用统一的错误响应格式：

```json
{
  "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | INTERNAL_ERROR",
  "message": "Error description"
}
```

**HTTP 状态码**：
- `200 OK` - 成功
- `201 Created` - 创建成功
- `400 Bad Request` - 参数错误、业务规则验证失败
- `401 Unauthorized` - 认证失败
- `403 Forbidden` - 权限不足（访问他人通知）
- `404 Not Found` - 资源不存在
- `500 Internal Server Error` - 服务器错误

---

## 🎯 业务规则

### 状态转换规则
```
PENDING → SENT → READ
              → DISMISSED
              → EXPIRED
              → FAILED
```

- ✅ 只能标记 `SENT` 状态的通知为 `READ`
- ✅ 只能标记 `SENT` 状态的通知为 `DISMISSED`
- ✅ 过期的 `PENDING` 通知自动变为 `EXPIRED`

### 用户偏好规则
- ✅ 创建通知时自动检查用户是否启用该类型
- ✅ 过滤用户禁用的渠道
- ✅ 检查免打扰时段（quietHours）
- ✅ 用户未设置偏好时自动创建默认偏好

### 所有权验证
- ✅ 只能操作自己的通知
- ✅ 批量操作验证所有通知所有权
- ✅ 访问他人通知返回 403 Forbidden

---

## 💡 使用建议

### 1. 实时通知推送
```typescript
// 前端监听 SSE
const eventSource = new EventSource('/api/v1/schedules/events');
eventSource.addEventListener('reminder', (event) => {
  const data = JSON.parse(event.data);
  // data.notificationId - 持久化通知ID
  // 可查询完整通知详情
});
```

### 2. 通知列表分页
```typescript
// 首次加载
GET /notifications?limit=20&offset=0&status=SENT

// 加载更多
GET /notifications?limit=20&offset=20&status=SENT
```

### 3. 全部标记已读
```typescript
// 1. 查询所有未读通知
GET /notifications?status=SENT

// 2. 提取所有 ID
const notificationIds = notifications.map(n => n.uuid);

// 3. 批量标记已读
POST /notifications/batch-read
{ "notificationIds": notificationIds }
```

### 4. 使用模板
```typescript
// 1. 创建模板（通过 Template Controller - 待实现）
POST /notification-templates
{
  "name": "goal_reminder",
  "type": "REMINDER",
  "titleTemplate": "目标提醒：{{goalName}}",
  "contentTemplate": "您的目标 {{goalName}} 进度为 {{progress}}",
  "defaultChannels": ["IN_APP", "SSE"],
  "variables": ["goalName", "progress"]
}

// 2. 使用模板创建通知
POST /notifications/from-template
{
  "templateUuid": "xxx",
  "variables": {
    "goalName": "学习 TypeScript",
    "progress": "80%"
  }
}
```

---

## 📚 相关文档

- [Notification DDD 重构完成总结](./NOTIFICATION_DDD_REFACTORING_COMPLETE.md)
- [Notification REST API 实现完成](./NOTIFICATION_REST_API_COMPLETE.md)
- [Notification 模块完整流程](./Notification模块完整流程.md)
- [Notification 快速参考](./NOTIFICATION_QUICK_REFERENCE.md)

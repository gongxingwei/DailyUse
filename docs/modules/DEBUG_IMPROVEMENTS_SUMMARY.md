# Schedule & Notification 模块调试功能改进总结

> **日期**: 2025-01-XX  
> **作者**: DailyUse Team  
> **状态**: ✅ 已完成

## 📋 概述

本次改进移除了后端定时广播事件（避免控制台刷屏），添加了手动触发调试功能，并为 Schedule 和 Notification 模块添加了完整的结构化调试日志。

---

## ✅ 已完成任务

### 1. ✅ 删除后端定时广播事件

**修改文件**: `apps/api/src/modules/schedule/interface/http/SSEController.ts`

**改动**:
- 移除了心跳事件中的 `console.log`，避免每30秒刷屏
- 保留心跳功能，仅移除日志输出
- 添加注释说明：`// 心跳日志已移除，避免控制台刷屏`

**效果**: 控制台不再被心跳日志刷屏，提升开发体验

---

### 2. ✅ 添加后端调试 API

**新增文件**: `apps/api/src/modules/schedule/interface/http/debugController.ts`

**功能**:
- **POST** `/api/v1/schedules/debug/trigger-reminder` - 手动触发测试提醒
- **GET** `/api/v1/schedules/debug/info` - 获取调试信息

**特点**:
- ✅ 使用 JWT 认证保护
- ✅ 使用 `createLogger` 工具提供结构化日志
- ✅ 发送完整的事件链：`ui:show-popup-reminder`、`ui:play-reminder-sound`、`system:show-notification`、`reminder-triggered`
- ✅ 返回详细的调试信息

**请求示例**:
```bash
POST /api/v1/schedules/debug/trigger-reminder
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskName": "测试任务",
  "message": "这是一个测试提醒消息",
  "soundType": "reminder"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "测试提醒已触发",
  "data": {
    "eventTypes": ["ui:show-popup-reminder", "ui:play-reminder-sound", "system:show-notification", "reminder-triggered"],
    "reminderData": { ... },
    "triggeredAt": "2025-01-XX..."
  }
}
```

---

### 3. ✅ 前端添加调试按钮

**修改文件**: `apps/web/src/components/AssetsDemo.vue`

**新增功能**:
- ✅ 在 Assets Demo 页面添加"调试"分区
- ✅ "触发测试提醒"按钮，调用后端调试 API
- ✅ 自动获取当前用户的访问令牌
- ✅ 显示加载状态和错误处理
- ✅ 播放成功/失败音效反馈

**使用方法**:
1. 登录应用
2. 访问 Assets Demo 页面
3. 点击"触发测试提醒"按钮
4. 观察通知弹窗、声音和系统通知

---

### 4. ✅ 增强 Schedule 模块调试日志

**修改文件**: `apps/api/src/modules/schedule/infrastructure/scheduler/ScheduleTaskScheduler.ts`

**改进内容**:
1. **导入结构化日志工具**
   ```typescript
   import { createLogger } from '@dailyuse/utils';
   const logger = createLogger('ScheduleTaskScheduler');
   ```

2. **替换所有 console.log**
   - `logger.info()` - 重要信息（启动、找到任务、执行成功）
   - `logger.warn()` - 警告信息（重复启动、不支持的重复类型）
   - `logger.error()` - 错误信息（任务失败、检查错误）
   - `logger.debug()` - 调试信息（检查时间、未找到任务、配置解析）

3. **增强的日志内容**
   - ✅ 任务匹配详情（ID、标题、类型、调度时间）
   - ✅ 执行流程跟踪（开始、配置解析、事件发送、状态更新）
   - ✅ 下次执行时间计算（重复类型、间隔、计算结果）
   - ✅ 事件发送详情（事件类型、目标、参数）
   - ✅ 错误堆栈和上下文信息

**日志示例**:
```
[INFO] [ScheduleTaskScheduler] 调度器启动成功 { cronPattern: '* * * * *', timezone: 'Asia/Shanghai', checkInterval: '每分钟' }
[DEBUG] [ScheduleTaskScheduler] 开始检查待执行任务 { checkTime: '2025-...', timestamp: 1234567890 }
[INFO] [ScheduleTaskScheduler] 找到待执行任务 { taskCount: 2, taskIds: [...], taskTitles: [...] }
[DEBUG] [ScheduleTaskScheduler] 开始执行任务详情 { taskId: 'xxx', taskTitle: 'Test', taskType: 'REMINDER', ... }
[INFO] [ScheduleTaskScheduler] 发送弹窗提醒事件 { taskId: 'xxx', eventType: 'ui:show-popup-reminder' }
[INFO] [ScheduleTaskScheduler] 计算下次执行时间 { taskId: 'xxx', recurrenceType: 'DAILY', nextExecutionTime: '...', interval: 1 }
[INFO] [ScheduleTaskScheduler] 任务执行成功 { taskId: 'xxx', taskTitle: 'Test' }
```

---

### 5. ✅ 增强 Notification 模块调试日志

**修改文件**: `apps/web/src/modules/notification/application/events/NotificationEventHandlers.ts`

**改进内容**:
1. **导入结构化日志工具**
   ```typescript
   import { eventBus, createLogger } from '@dailyuse/utils';
   const logger = createLogger('NotificationEventHandlers');
   ```

2. **替换所有 console.log/warn/error**
   - `logger.info()` - 事件接收、通知创建/显示/点击、权限变更、配置更新
   - `logger.warn()` - 重复初始化、未知提醒类型
   - `logger.error()` - 处理失败、通知错误
   - `logger.debug()` - 设置监听器、页面可见性变化、应用焦点

3. **增强的日志内容**
   - ✅ SSE 事件接收详情（提醒 ID、来源类型、标题、方法）
   - ✅ 通知创建和显示跟踪（ID、类型、优先级、显示方法、时长）
   - ✅ 事件监听器设置详情（Schedule、内部、系统）
   - ✅ 提醒处理流程（载荷标准化、配置创建、显示结果）
   - ✅ 错误上下文和堆栈信息

**日志示例**:
```
[DEBUG] [NotificationEventHandlers] 设置Schedule事件监听器
[INFO] [NotificationEventHandlers] 收到统一提醒事件 { reminderId: 'xxx', sourceType: 'task', title: 'Test', ... }
[INFO] [NotificationEventHandlers] 处理提醒触发事件 { reminderId: 'xxx', sourceType: 'task', priority: 'HIGH', methods: [...] }
[DEBUG] [NotificationEventHandlers] 通知配置已创建 { notificationId: 'xxx', type: 'TASK', methods: [...], soundEnabled: true }
[INFO] [NotificationEventHandlers] 提醒通知已显示 { notificationId: 'xxx', title: 'Test' }
[INFO] [NotificationEventHandlers] 通知已显示 { notificationId: 'xxx', displayMethod: 'desktop', duration: 5000, title: 'Test' }
[INFO] [NotificationEventHandlers] 通知被点击 { notificationId: 'xxx', actionId: 'mark-done', hasAction: true, ... }
```

---

## 🎯 使用指南

### 手动触发测试提醒

#### 方法1：使用前端按钮（推荐）
1. 登录应用
2. 访问 Assets Demo 页面（开发环境）
3. 滚动到"调试"分区
4. 点击"触发测试提醒"按钮
5. 观察：
   - 控制台结构化日志
   - 通知弹窗
   - 声音播放
   - 系统通知

#### 方法2：使用 API 直接调用
```bash
# 获取访问令牌（从浏览器控制台或 localStorage）
TOKEN="your-access-token-here"

# 触发测试提醒
curl -X POST http://localhost:3888/api/v1/schedules/debug/trigger-reminder \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskName": "测试任务",
    "message": "这是一个测试消息",
    "soundType": "reminder"
  }'

# 获取调试信息
curl -X GET http://localhost:3888/api/v1/schedules/debug/info \
  -H "Authorization: Bearer $TOKEN"
```

### 查看调试日志

#### 后端日志（Schedule 模块）
```bash
# 启动 API 服务器后，观察控制台输出
# 日志格式: [LEVEL] [ScheduleTaskScheduler] message { context }

# 示例:
[INFO] [ScheduleTaskScheduler] 调度器启动成功 { cronPattern: '* * * * *', ... }
[DEBUG] [ScheduleTaskScheduler] 开始检查待执行任务 { checkTime: '...', ... }
[INFO] [ScheduleTaskScheduler] 找到待执行任务 { taskCount: 2, ... }
```

#### 前端日志（Notification 模块）
```bash
# 在浏览器控制台查看
# 日志格式: [LEVEL] [NotificationEventHandlers] message { context }

# 示例:
[INFO] [NotificationEventHandlers] 收到统一提醒事件 { reminderId: '...', ... }
[INFO] [NotificationEventHandlers] 处理提醒触发事件 { ... }
[INFO] [NotificationEventHandlers] 提醒通知已显示 { ... }
```

---

## 📊 日志级别说明

| 级别 | 用途 | 示例场景 |
|------|------|----------|
| `DEBUG` | 详细的调试信息 | 检查时间、配置解析、监听器设置 |
| `INFO` | 一般信息 | 服务启动、任务执行、事件接收 |
| `WARN` | 警告信息 | 重复操作、未知类型、配置问题 |
| `ERROR` | 错误信息 | 执行失败、处理异常、系统错误 |

---

## 🔍 调试流程

### 完整的提醒触发流程

```
1. 触发源
   ├─ 前端按钮点击
   │  └─ AssetsDemo.vue triggerTestReminder()
   │
   └─ 定时调度器
      └─ ScheduleTaskScheduler checkAndExecuteTasks()

2. 后端处理（apps/api）
   ├─ DebugController.triggerTestReminder()
   │  ├─ [INFO] 收到测试提醒请求
   │  ├─ [DEBUG] JWT 认证
   │  ├─ eventBus.emit('ui:show-popup-reminder')
   │  │  └─ [INFO] 发送弹窗提醒事件
   │  ├─ eventBus.emit('ui:play-reminder-sound')
   │  │  └─ [INFO] 发送声音提醒事件
   │  ├─ eventBus.emit('system:show-notification')
   │  │  └─ [INFO] 发送系统通知事件
   │  └─ eventBus.emit('reminder-triggered')
   │     └─ [INFO] 发送通用提醒事件
   │
   └─ SSEController 广播到前端
      └─ [DEBUG] SSE 推送 (心跳日志已移除)

3. 前端处理（apps/web）
   ├─ SSEClient 接收事件
   │  └─ eventBus.emit('reminder-triggered')
   │
   ├─ NotificationEventHandlers 处理
   │  ├─ [INFO] 收到统一提醒事件
   │  ├─ [INFO] 处理提醒触发事件
   │  ├─ [DEBUG] 通知配置已创建
   │  └─ [INFO] 提醒通知已显示
   │
   ├─ NotificationService 显示
   │  ├─ [INFO] 通知已创建
   │  ├─ [INFO] 通知已显示
   │  └─ [INFO] 音频播放
   │
   └─ 用户界面
      ├─ 弹窗通知
      ├─ 声音播放
      └─ 系统通知
```

---

## 📝 技术细节

### 结构化日志优势

1. **统一格式**: 所有日志使用 `createLogger` 生成，格式一致
2. **上下文信息**: 每条日志包含 JSON 格式的上下文数据
3. **易于过滤**: 可以按模块名、日志级别过滤
4. **生产友好**: 便于日志收集和分析工具处理

### Logger API

```typescript
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ModuleName');

// 基本用法
logger.debug('调试信息', { key: 'value' });
logger.info('一般信息', { count: 10 });
logger.warn('警告信息', { reason: 'duplicate' });
logger.error('错误信息', { error: error.message, stack: error.stack });

// 输出格式
// [LEVEL] [ModuleName] message { context }
```

---

## 🚀 后续改进建议

1. **日志持久化**: 考虑将日志保存到文件或远程服务
2. **日志可视化**: 开发日志查看器界面
3. **性能监控**: 添加执行时间和性能指标
4. **日志过滤**: 添加运行时日志级别控制
5. **错误追踪**: 集成错误追踪服务（如 Sentry）

---

## 📚 相关文档

- [Notification 模块架构文档](./NOTIFICATION_MODULE_ARCHITECTURE.md)
- [Schedule 模块重构总结](./SCHEDULE_MODULE_REFACTORING_SUMMARY.md)
- [SSE 实现指南](../systems/SSE_IMPLEMENTATION_GUIDE.md)
- [Logger 使用指南](../logger-usage-guide.md)

---

## ✅ 验收清单

- [x] 移除了 SSE 心跳日志刷屏
- [x] 实现了手动触发测试提醒 API
- [x] 前端添加了调试按钮
- [x] Schedule 模块使用结构化日志
- [x] Notification 模块使用结构化日志
- [x] 日志包含足够的上下文信息
- [x] 所有日志使用正确的级别
- [x] 编写了使用文档

---

**改进日期**: 2025-01-XX  
**完成状态**: ✅ 全部完成  
**开发者**: GitHub Copilot + User

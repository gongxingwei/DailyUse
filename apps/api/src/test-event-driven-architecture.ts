/**
 * Event-Driven Architecture Test Script
 * @description 测试事件驱动架构：Reminder → Schedule → Notification → Frontend SSE
 * @author DailyUse Team
 * @date 2025-01-09
 */

/**
 * 🧪 测试步骤
 *
 * 1. 准备工作：
 *    - 确保 API 服务器正在运行 (pnpm run dev:api)
 *    - 确保你已登录并获取了 token
 *    - 替换下方的 TOKEN 和 accountUuid
 *
 * 2. 打开浏览器 SSE 监听：
 *    打开新的浏览器标签页，访问：
 *    http://localhost:3888/api/schedule/sse?token=YOUR_TOKEN
 *
 *    你应该看到：
 *    - data: {"type":"connected","data":{"message":"SSE 连接已建立","clientId":"..."},"timestamp":"..."}
 *    - 每30秒的心跳消息
 *
 * 3. 创建 Reminder 实例（设置1分钟后触发）：
 *    运行下方的 curl 命令，或使用 Postman/Thunder Client
 *
 * 4. 观察日志输出（在 API 服务器终端）：
 *    ✅ [ReminderApplicationService] 提醒实例已创建
 *    ✅ [EventBus] 发布事件: reminder.instance.created
 *    ✅ [ReminderInstanceCreatedHandler] 收到提醒实例创建事件
 *    ✅ [ScheduleApplicationService] Schedule 任务已创建
 *
 * 5. 等待约1分钟，观察：
 *    ✅ [ScheduleTaskScheduler] 检测到需要执行的任务
 *    ✅ [ScheduleTaskScheduler] 任务触发事件已发布
 *    ✅ [EventBus] 发布事件: schedule.task.triggered
 *    ✅ [TaskTriggeredHandler] 收到任务触发事件
 *    ✅ [TaskTriggeredHandler] 提醒通知已发送
 *
 * 6. 在 SSE 浏览器页面看到：
 *    data: {"type":"reminder","data":{"sourceType":"reminder","sourceId":"...","message":"测试事件驱动架构","..."},"timestamp":"..."}
 *
 * ========================================
 * 📝 测试命令
 * ========================================
 */

// 1️⃣ 替换这些值
const TOKEN = 'YOUR_JWT_TOKEN_HERE';
const accountUuid = 'YOUR_ACCOUNT_UUID_HERE';
const REMINDER_TEMPLATE_UUID = 'YOUR_REMINDER_TEMPLATE_UUID'; // 从数据库或 API 获取

// 2️⃣ 计算1分钟后的时间
const scheduledTime = new Date(Date.now() + 60 * 1000).toISOString();

console.log(`
========================================
🧪 事件驱动架构测试
========================================

📅 计划触发时间: ${scheduledTime}
⏱️  现在时间: ${new Date().toISOString()}

📌 请按以下步骤操作：

1. 打开浏览器，访问 SSE 端点：
   http://localhost:3888/api/schedule/sse?token=${TOKEN}

2. 执行以下 curl 命令创建 Reminder 实例：

curl -X POST http://localhost:3888/api/reminder/instances \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${TOKEN}" \\
  -d '{
    "templateUuid": "${REMINDER_TEMPLATE_UUID}",
    "accountUuid": "${ACCOUNT_UUID}",
    "title": "事件驱动测试",
    "message": "测试 Reminder → Schedule → Notification 事件流",
    "scheduledTime": "${scheduledTime}",
    "priority": "MEDIUM",
    "isActive": true,
    "recurrenceRule": {
      "type": "NONE"
    },
    "alertConfig": {
      "enabled": true,
      "methods": ["popup", "sound", "system"],
      "soundType": "default",
      "vibration": false
    }
  }'

3️⃣ 或者使用 JavaScript fetch：

fetch('http://localhost:3888/api/reminder/instances', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${TOKEN}'
  },
  body: JSON.stringify({
    templateUuid: '${REMINDER_TEMPLATE_UUID}',
    accountUuid: '${ACCOUNT_UUID}',
    title: '事件驱动测试',
    message: '测试 Reminder → Schedule → Notification 事件流',
    scheduledTime: '${scheduledTime}',
    priority: 'MEDIUM',
    isActive: true,
    recurrenceRule: { type: 'NONE' },
    alertConfig: {
      enabled: true,
      methods: ['popup', 'sound', 'system'],
      soundType: 'default',
      vibration: false
    }
  })
})
.then(r => r.json())
.then(data => console.log('✅ Reminder 实例已创建:', data))
.catch(err => console.error('❌ 创建失败:', err));

========================================
🔍 预期事件流
========================================

1. POST /api/reminder/instances
   ↓
2. ReminderApplicationService.createInstance()
   ↓ publish
3. ReminderInstanceCreatedEvent
   ↓ handled by
4. ReminderInstanceCreatedHandler
   ↓ creates
5. ScheduleTask (scheduledTime = ${scheduledTime})
   ↓ after 1 minute
6. ScheduleTaskScheduler.executeTask()
   ↓ publish
7. TaskTriggeredEvent
   ↓ handled by
8. TaskTriggeredHandler
   ↓ sends
9. SSE Notification to Frontend
   ✅ 前端浏览器收到提醒！

========================================
`);

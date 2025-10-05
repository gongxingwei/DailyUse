# 间隔循环提醒功能测试指南

## 📋 功能概述

新增了间隔循环提醒功能，支持从应用启动或 reminder enable 开始计算，每隔固定时间提醒一次。

## ✅ 已完成的工作

### 1. **前端 UI 更新** (`apps/web/src/components/AssetsDemo.vue`)
- ✅ 添加了"创建每1分钟提醒"按钮
- ✅ 实现了 `createRecurringReminder()` 方法
- ✅ 导入了必要的依赖：
  - `reminderApiClient`
  - `ReminderContracts`
  - `generateUUID`

### 2. **数据结构支持** (Contracts)
- ✅ `ReminderTimeConfigType` 已包含 `CUSTOM` 类型
- ✅ `ReminderDurationUnit` 支持 `MINUTES`, `HOURS`, `DAYS`
- ✅ `ReminderTimeConfig` 接口支持 `customPattern`:
  ```typescript
  customPattern?: {
    interval: number;
    unit: ReminderDurationUnit;
  }
  ```

### 3. **API 客户端** (`reminderApiClient.ts`)
- ✅ `createReminderTemplate()` 方法已存在
- ✅ 支持完整的 `CreateReminderTemplateRequest` 参数

### 4. **后端调度集成** (`ReminderScheduleIntegrationService.ts`)
- ✅ `mapTimeConfigToRepeatConfig()` 已处理 `CUSTOM` 类型
- ⚠️ **注意**：目前只传递了 `interval`，未传递 `unit`（可能需要后续优化）

## 🧪 测试步骤

### 步骤 1: 启动应用

如果应用未运行，执行：
```bash
# 启动后端 API
nx serve api

# 启动前端 Web
nx serve web
```

### 步骤 2: 打开 AssetsDemo 页面

1. 在浏览器中打开前端应用（通常是 `http://localhost:4200`）
2. 导航到 AssetsDemo 组件页面

### 步骤 3: 创建测试提醒

1. 找到"调试功能"区域
2. 点击 **"创建每1分钟提醒"** 按钮
3. 查看控制台日志（按 F12 打开浏览器开发者工具）

**预期日志输出**：
```
🔔 创建每1分钟循环提醒...
📤 发送创建请求: {
  uuid: "...",
  name: "测试提醒 - 每1分钟",
  message: "这是一个测试提醒，每分钟触发一次",
  timeConfig: {
    type: "custom",
    customPattern: {
      interval: 1,
      unit: "minutes"
    }
  },
  ...
}
✅ 提醒模板创建成功: {...}
```

4. 如果创建成功，会弹出提示框显示提醒模板 UUID

### 步骤 4: 验证提醒实例

创建成功后，应该：
1. **ReminderTemplate** 被创建并保存到数据库
2. **ReminderInstance** 被自动创建（根据时间配置）
3. **Schedule Task** 被创建用于触发提醒

### 步骤 5: 等待提醒触发

1. 等待 **1 分钟**
2. 观察控制台日志，应该看到：
   ```
   📡 SSE 事件到达: reminder-triggered
   🔔 [ReminderNotificationHandler] 收到提醒事件
   [NotificationService] 显示通知: {...}
   [NotificationService] 启动队列处理器
   [NotificationService] 处理队列中的通知
   🔊 播放通知声音: reminder
   [AudioNotificationService] 播放音效
   ```

3. **应该听到提醒声音** 🔊

### 步骤 6: 验证循环提醒

1. 再等待 **1 分钟**
2. 再次验证是否收到提醒和声音
3. 重复验证以确认循环提醒正常工作

## 🔍 调试检查点

### 前端检查
- [ ] 按钮点击后是否触发 `createRecurringReminder()`？
- [ ] API 请求是否成功发送到后端？
- [ ] 是否收到创建成功的响应？
- [ ] 是否显示成功提示框？

### 后端检查
- [ ] API 控制器是否收到创建请求？
- [ ] `ReminderTemplate` 是否成功保存到数据库？
- [ ] `ReminderInstance` 是否自动创建？
- [ ] `Schedule Task` 是否创建并激活？

### 调度检查
- [ ] Schedule 模块是否正确解析 `CUSTOM` 类型？
- [ ] Cron 表达式是否正确生成（每1分钟：`*/1 * * * *`）？
- [ ] 定时任务是否按时触发？

### SSE 推送检查
- [ ] 后端是否通过 SSE 推送 `reminder-triggered` 事件？
- [ ] 前端是否接收到 SSE 事件？
- [ ] 事件是否传递到 `ReminderNotificationHandler`？

### 通知系统检查
- [ ] `NotificationService.show()` 是否被调用？
- [ ] 通知队列处理器是否启动？
- [ ] 音效是否正确播放？

## 📝 预期结果

### 成功标准
1. ✅ 点击按钮后创建提醒成功
2. ✅ 每隔 1 分钟触发一次提醒
3. ✅ 每次提醒都播放声音
4. ✅ 控制台日志完整且无错误

### 失败场景处理

#### 场景 1: 创建失败
**症状**：点击按钮后弹出错误提示
**可能原因**：
- 后端 API 未启动
- 用户未登录（缺少 userUuid）
- 请求参数格式错误

**解决方案**：
1. 检查后端 API 是否运行
2. 检查用户登录状态
3. 查看控制台错误日志

#### 场景 2: 创建成功但不触发
**症状**：创建成功但1分钟后无提醒
**可能原因**：
- Schedule 模块未正确处理 CUSTOM 类型
- Cron 表达式生成错误
- 定时任务未启动

**解决方案**：
1. 检查数据库中的 Schedule Task
2. 检查 Cron 表达式是否正确
3. 查看 Schedule 模块日志

#### 场景 3: 触发但无声音
**症状**：控制台显示提醒但无声音
**可能原因**：
- 音效文件缺失
- 通知设置中声音被禁用
- AudioService 初始化失败

**解决方案**：
1. 检查 `notificationSettings.sound` 是否为 `true`
2. 检查音效文件是否存在
3. 测试其他音效是否正常（点击"播放成功音效"按钮）

## 🛠️ 进一步优化建议

### 1. 修复 CUSTOM 类型的 unit 传递
**当前状态**：`ReminderScheduleIntegrationService` 未传递 `unit` 参数
**建议修改**：
```typescript
case 'custom':
  if (timeConfig.customPattern) {
    const { interval, unit } = timeConfig.customPattern;
    return {
      type: RecurrenceType.CUSTOM,
      interval,
      unit, // 👈 添加这行
    };
  }
  break;
```

### 2. 添加更多间隔选项
在 `AssetsDemo.vue` 中添加更多测试按钮：
- 每 5 分钟提醒
- 每 15 分钟提醒
- 每 45 分钟提醒
- 每 1 小时提醒

### 3. 添加提醒管理界面
创建一个专门的提醒管理界面，支持：
- 查看所有提醒模板
- 启用/禁用提醒
- 删除提醒
- 编辑提醒配置

## 📚 相关文件

### 前端
- `apps/web/src/components/AssetsDemo.vue` - UI 和测试按钮
- `apps/web/src/modules/reminder/infrastructure/api/reminderApiClient.ts` - API 客户端
- `apps/web/src/modules/notification/application/services/NotificationService.ts` - 通知服务

### Contracts
- `packages/contracts/src/modules/reminder/enums.ts` - 枚举定义
- `packages/contracts/src/modules/reminder/types.ts` - 类型定义
- `packages/contracts/src/modules/reminder/dtos.ts` - DTO 定义

### 后端
- `apps/api/src/modules/reminder/interface/http/controllers/ReminderTemplateController.ts` - API 控制器
- `apps/api/src/modules/reminder/domain/services/ReminderDomainService.ts` - 领域服务
- `packages/domain-core/src/reminder/services/ReminderScheduleIntegrationService.ts` - 调度集成

### 调度
- `apps/api/src/modules/schedule/application/eventHandlers/ReminderInstanceCreatedHandler.ts` - 事件处理器
- `apps/api/src/modules/schedule/application/services/ScheduleApplicationService.ts` - 调度服务

## 🎯 下一步行动

1. **立即测试**：按照上述步骤测试创建每1分钟提醒
2. **验证完整流程**：确认从创建到触发到播放声音的整个链路
3. **优化代码**：根据测试结果修复发现的问题
4. **扩展功能**：添加更多间隔选项和管理界面

---

📅 创建日期：2025-01-XX
👤 负责人：DailyUse Team
🔄 状态：待测试

# Setting 模块快速参考

## 文件结构

```
apps/api/src/modules/setting/
├── domain/
│   ├── aggregates/
│   │   └── UserPreferences.ts          # 用户偏好聚合根
│   ├── events/
│   │   └── SettingDomainEvents.ts      # 领域事件定义
│   ├── services/
│   │   └── SettingDomainService.ts     # 领域服务
│   └── repositories/
│       └── IUserPreferencesRepository.ts # 仓储接口
├── application/
│   ├── services/
│   │   └── UserPreferencesApplicationService.ts # 应用服务
│   └── interfaces/
│       └── IEventPublisher.ts          # 事件发布器接口
├── infrastructure/
│   ├── repositories/
│   │   └── PrismaUserPreferencesRepository.ts # Prisma仓储
│   └── events/
│       └── EventPublisher.ts           # 事件发布器实现
└── interface/
    └── http/
        ├── controllers/
        │   └── UserPreferencesController.ts # HTTP控制器
        └── routes/
            └── userPreferencesRoutes.ts     # 路由定义
```

## API 端点速查

| 方法 | 路径 | 说明 | 触发事件 |
|------|------|------|---------|
| GET | `/api/v1/settings/preferences` | 获取用户偏好 | - |
| PUT | `/api/v1/settings/preferences` | 更新用户偏好 | - |
| POST | `/api/v1/settings/preferences/theme-mode` | 切换主题模式 | THEME_MODE_CHANGED |
| POST | `/api/v1/settings/preferences/language` | 更改语言 | LANGUAGE_CHANGED |
| POST | `/api/v1/settings/preferences/notifications` | 更新通知偏好 | NOTIFICATION_PREFERENCES_CHANGED |
| POST | `/api/v1/settings/preferences/reset` | 重置为默认 | - |

## 事件列表

### THEME_MODE_CHANGED
当用户切换主题模式时触发

```typescript
{
  eventType: 'THEME_MODE_CHANGED',
  accountUuid: string,
  themeMode: 'light' | 'dark' | 'system',
  timestamp: number
}
```

**监听器**: Theme 模块的 `ThemeEventListeners.onThemeModeChanged()`

### LANGUAGE_CHANGED
当用户更改语言时触发

```typescript
{
  eventType: 'LANGUAGE_CHANGED',
  accountUuid: string,
  language: string,
  timestamp: number
}
```

### NOTIFICATION_PREFERENCES_CHANGED
当用户更新通知偏好时触发

```typescript
{
  eventType: 'NOTIFICATION_PREFERENCES_CHANGED',
  accountUuid: string,
  preferences: {
    notificationsEnabled?: boolean,
    emailNotifications?: boolean,
    pushNotifications?: boolean
  },
  timestamp: number
}
```

## 代码示例

### 1. 使用 Application Service

```typescript
import { UserPreferencesApplicationService } from './modules/setting/application/services/UserPreferencesApplicationService';
import { PrismaUserPreferencesRepository } from './modules/setting/infrastructure/repositories/PrismaUserPreferencesRepository';
import { EventPublisher } from './modules/setting/infrastructure/events/EventPublisher';

// 初始化
const repository = new PrismaUserPreferencesRepository(prisma);
const service = new UserPreferencesApplicationService(repository);
const eventPublisher = new EventPublisher();
service.setEventPublisher(eventPublisher);

// 获取用户偏好
const preferences = await service.getUserPreferences(accountUuid);

// 切换主题模式
await service.switchThemeMode(accountUuid, 'dark');

// 更改语言
await service.changeLanguage(accountUuid, 'en-US');

// 更新通知偏好
await service.updateNotificationPreferences(accountUuid, {
  notificationsEnabled: true,
  emailNotifications: true,
  pushNotifications: false
});

// 批量更新
await service.updatePreferences(accountUuid, {
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  autoLaunch: true
});

// 重置为默认
await service.resetToDefault(accountUuid);
```

### 2. 注册事件监听器

```typescript
import { ThemeEventListeners } from './modules/theme/application/events/ThemeEventListeners';
import { ThemeApplicationService } from './modules/theme/application/services/ThemeApplicationService';
import { PrismaUserThemePreferenceRepository } from './modules/theme/infrastructure/repositories/PrismaUserThemePreferenceRepository';

// 初始化 Theme 服务
const themeRepository = new PrismaUserThemePreferenceRepository(prisma);
const themeService = new ThemeApplicationService(themeRepository);

// 注册监听器
const listeners = new ThemeEventListeners(themeService);
listeners.registerListeners();
```

### 3. 直接使用 Domain Model

```typescript
import { UserPreferences } from './modules/setting/domain/aggregates/UserPreferences';

// 创建默认偏好
const preferences = UserPreferences.createDefault(accountUuid, uuid);

// 修改偏好
preferences.switchThemeMode('dark');
preferences.changeLanguage('en-US');
preferences.setNotifications(true);

// 批量更新
preferences.updatePreferences({
  autoLaunch: true,
  defaultModule: 'task',
  analyticsEnabled: false
});

// 转换为纯对象
const data = preferences.toObject();
```

### 4. HTTP 请求示例

```bash
# 获取用户偏好
curl -X GET http://localhost:3000/api/v1/settings/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"

# 切换主题模式
curl -X POST http://localhost:3000/api/v1/settings/preferences/theme-mode \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"themeMode":"dark"}'

# 更改语言
curl -X POST http://localhost:3000/api/v1/settings/preferences/language \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language":"en-US"}'

# 更新通知偏好
curl -X POST http://localhost:3000/api/v1/settings/preferences/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationsEnabled":true,
    "emailNotifications":true,
    "pushNotifications":false
  }'

# 批量更新
curl -X PUT http://localhost:3000/api/v1/settings/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language":"zh-CN",
    "timezone":"Asia/Shanghai",
    "autoLaunch":true,
    "defaultModule":"goal"
  }'

# 重置为默认
curl -X POST http://localhost:3000/api/v1/settings/preferences/reset \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 数据库表

### user_preferences

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| uuid | String | cuid() | 主键 |
| account_uuid | String | - | 账户UUID（唯一） |
| language | String | "zh-CN" | 语言 |
| timezone | String | "Asia/Shanghai" | 时区 |
| locale | String | "zh-CN" | 地区设置 |
| theme_mode | String | "system" | 主题模式 |
| notifications_enabled | Boolean | true | 启用通知 |
| email_notifications | Boolean | true | 邮件通知 |
| push_notifications | Boolean | true | 推送通知 |
| auto_launch | Boolean | false | 开机自启动 |
| default_module | String | "goal" | 默认模块 |
| analytics_enabled | Boolean | true | 分析数据 |
| crash_reports_enabled | Boolean | true | 崩溃报告 |
| created_at | DateTime | now() | 创建时间 |
| updated_at | DateTime | now() | 更新时间 |

### user_theme_preferences

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| uuid | String | cuid() | 主键 |
| account_uuid | String | - | 账户UUID（唯一） |
| current_theme_uuid | String? | null | 当前主题UUID |
| preferred_mode | String | "system" | 偏好模式 |
| auto_switch | Boolean | false | 自动切换 |
| schedule_start | String? | null | 计划开始时间 |
| schedule_end | String? | null | 计划结束时间 |
| created_at | DateTime | now() | 创建时间 |
| updated_at | DateTime | now() | 更新时间 |

## 常见问题

### Q: 如何添加新的偏好设置项？

1. 在 `UserPreferences` 聚合根中添加新属性和方法
2. 更新 Prisma schema
3. 运行数据库迁移
4. 在 Application Service 中添加相应方法
5. 在 Controller 中添加 API 端点

### Q: 如何添加新的事件监听器？

1. 在 `SettingDomainEvents.ts` 中定义新事件类型
2. 在 Domain Service 中生成事件
3. 在目标模块创建监听器类
4. 在 `app.ts` 中注册监听器

### Q: 事件是同步还是异步的？

目前是同步的。EventBus 基于 Node.js EventEmitter，事件处理是同步的。如需异步处理，可以在监听器内部使用 Promise 或消息队列。

### Q: 如何测试事件发布？

```typescript
import { eventBus } from './shared/events/EventBus';

// 监听事件
const handler = jest.fn();
eventBus.on('THEME_MODE_CHANGED', handler);

// 执行操作
await service.switchThemeMode(accountUuid, 'dark');

// 验证
expect(handler).toHaveBeenCalledWith(
  expect.objectContaining({
    eventType: 'THEME_MODE_CHANGED',
    accountUuid,
    themeMode: 'dark'
  })
);
```

## 相关文档

- [完整实现文档](./SETTING_MODULE_REFACTORING_COMPLETE.md)
- [Theme 模块文档](../theme/)
- [API 响应系统](../systems/API_RESPONSE_SYSTEM_GUIDE.md)
- [DDD 架构指南](../architecture/)

# 模块初始化系统重构总结

## 概述

本次重构统一了 API 模块的初始化机制，遵循 DDD 和单例模式，参考 Goal 模块的实现标准。

## 主要改进

### 1. ApplicationService 单例模式

为以下服务添加了 `getInstance()` 和 `createInstance()` 方法：

#### NotificationApplicationService
- **位置**: `apps/api/src/modules/notification/application/services/NotificationApplicationService.ts`
- **改进**: 
  - 添加静态 `instance` 属性
  - 添加 `createInstance()` 工厂方法
  - 添加 `getInstance()` 获取单例
- **用法**:
  ```typescript
  // 初始化（在 initialization 层）
  NotificationApplicationService.createInstance(
    notificationRepository,
    templateRepository,
    preferenceRepository
  );
  
  // 使用（在其他地方）
  const service = NotificationApplicationService.getInstance();
  ```

#### UserPreferencesApplicationService
- **位置**: `apps/api/src/modules/setting/application/services/UserPreferencesApplicationService.ts`
- **改进**: 同上
- **用法**:
  ```typescript
  // 初始化
  const service = UserPreferencesApplicationService.createInstance(repository);
  service.setEventPublisher(eventPublisher);
  
  // 使用
  const service = UserPreferencesApplicationService.getInstance();
  ```

#### ThemeApplicationService
- **位置**: `apps/api/src/modules/theme/application/services/ThemeApplicationService.ts`
- **改进**: 同上
- **用法**:
  ```typescript
  // 初始化
  ThemeApplicationService.createInstance(preferenceRepository);
  
  // 使用
  const service = ThemeApplicationService.getInstance();
  ```

### 2. Initialization 层创建

为每个模块创建了独立的 initialization 层，集中管理模块初始化逻辑：

#### Notification 模块
- **文件**: `apps/api/src/modules/notification/initialization/notificationInitialization.ts`
- **功能**:
  - 注册 `notificationService` 初始化任务
  - 在 APP_STARTUP 阶段执行（优先级 15）
  - 初始化三个仓储（NotificationRepository, NotificationTemplateRepository, NotificationPreferenceRepository）
  - 创建 NotificationApplicationService 单例

#### Setting 模块
- **文件**: `apps/api/src/modules/setting/initialization/settingInitialization.ts`
- **功能**:
  - 注册 `settingService` 初始化任务
  - 在 APP_STARTUP 阶段执行（优先级 12）
  - 初始化 UserPreferencesRepository
  - 创建 UserPreferencesApplicationService 单例
  - 创建并设置 EventPublisher（事件发布器）

#### Theme 模块
- **文件**: `apps/api/src/modules/theme/initialization/themeInitialization.ts`
- **功能**:
  - 注册 `themeService` 初始化任务
  - 在 APP_STARTUP 阶段执行（优先级 13，在 setting 之后）
  - 初始化 PrismaUserThemePreferenceRepository
  - 创建 ThemeApplicationService 单例
  - **注册 ThemeEventListeners**（这个之前在 app.ts 中手动初始化）

### 3. 统一初始化管理

#### 更新 shared/initialization/initializer.ts
- 导入新模块的初始化函数：
  - `registerNotificationInitializationTasks`
  - `registerSettingInitializationTasks`
  - `registerThemeInitializationTasks`
- 在 `registerAllInitializationTasks()` 中注册所有模块

#### 重构 app.ts
**移除的代码**：
```typescript
// ❌ 移除：手动创建服务实例
const notificationService = new NotificationApplicationService(...);
const userPreferencesService = new UserPreferencesApplicationService(...);
const themeService = new ThemeApplicationService(...);

// ❌ 移除：手动创建事件发布器和监听器
const eventPublisher = new EventPublisher();
userPreferencesService.setEventPublisher(eventPublisher);
const themeEventListeners = new ThemeEventListeners(themeService);
themeEventListeners.registerListeners();
```

**保留的代码**：
```typescript
// ✅ 保留：从单例获取服务（向后兼容）
const notificationService = NotificationApplicationService.getInstance();
NotificationTemplateController.initialize(notificationService);
```

### 4. 模块导出更新

为每个模块的 `index.ts` 添加 initialization 层导出：

- `apps/api/src/modules/notification/index.ts`
- `apps/api/src/modules/setting/index.ts`（新建）
- `apps/api/src/modules/theme/index.ts`

## 初始化流程

### 应用启动时（APP_STARTUP 阶段）

1. **优先级 10**: Event System（事件系统）
2. **优先级 12**: Setting Service（设置服务 + 事件发布器）
3. **优先级 13**: Theme Service（主题服务 + 事件监听器）
4. **优先级 15**: Notification Service（通知服务）
5. **优先级 20**: Goal Service（目标服务，已存在）

### 用户登录时（USER_LOGIN 阶段）

各模块根据需要初始化用户特定数据（如 Goal 模块的默认目录）

## 架构优势

### 1. 职责分离
- **ApplicationService**: 纯业务逻辑，不关心初始化
- **Initialization 层**: 专门负责模块启动和依赖注入
- **app.ts**: 只负责路由挂载，不关心服务初始化

### 2. 单例模式
- 全局唯一的服务实例
- 避免重复创建
- 统一的访问入口

### 3. 集中管理
- 所有模块初始化在 `shared/initialization/initializer.ts` 注册
- 清晰的初始化顺序（通过 priority 控制）
- 便于维护和扩展

### 4. 事件驱动
- 事件发布器和监听器在模块内部初始化
- 解耦模块间依赖
- 符合 DDD 的边界上下文原则

## 参考标准

所有改动遵循 Goal 模块的实现标准：
- `apps/api/src/modules/goal/application/services/GoalApplicationService.ts`
- `apps/api/src/modules/goal/initialization/goalInitialization.ts`
- `apps/api/src/modules/goal/infrastructure/di/GoalContainer.ts`

## 测试验证

✅ 所有修改的文件编译通过，无类型错误
✅ 保持向后兼容（app.ts 中保留了 Controller 初始化逻辑）

## 后续建议

1. 考虑为其他模块（Task, Reminder, Schedule 等）应用相同模式
2. 可以进一步抽象 DI Container（参考 GoalContainer）
3. 考虑在 initialization 层添加健康检查和依赖验证

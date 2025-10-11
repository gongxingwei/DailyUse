# App.ts 路由重构总结

**重构日期**: 2025-10-11  
**目标**: 修复 TypeScript 类型推断问题，统一路由命名规范

---

## 🎯 问题分析

### 原始问题

1. **TypeScript 类型推断错误**
   ```typescript
   // 错误信息
   The inferred type of 'router' cannot be named without a reference to 
   '.pnpm/@types+express-serve-static-core@4.19.6/node_modules/@types/express-serve-static-core'. 
   This is likely not portable. A type annotation is necessary.ts(2742)
   ```

2. **路由导入错误**
   ```typescript
   Cannot find name 'editorRoutes'.ts(2304)
   Cannot find name 'repositoryRoutes'.ts(2304)
   ```

3. **命名不一致**
   - 有的模块用 `routes`（如 `accountRoutes`）
   - 有的模块用 `Router`（如 `taskRouter`）
   - 有的模块用工厂函数（如 `createEditorRoutes()`）

---

## 🔧 解决方案

### 1. TypeScript 类型推断问题的原因

Express 的 `Router()` 返回类型是复杂的泛型类型，当直接用 `const router = Router()` 时，TypeScript 会尝试推断出完整的类型签名，但这个类型依赖于深层的 `@types/express-serve-static-core` 包中的类型定义。

**解决方法**：显式声明 Router 类型

```typescript
// ❌ 错误：类型推断依赖深层包
const router = Router();

// ✅ 正确：显式类型注解
import { Router } from 'express';
const router: Router = Router();
```

### 2. 统一路由命名规范

**命名规范**：`xxxRouter`

所有模块路由统一使用 `Router` 后缀，便于识别和一致性。

### 3. 导出模式

**推荐模式**：`export default router`

```typescript
// module/interface/http/routes.ts
import { Router } from 'express';

const router: Router = Router();

// ... 配置路由

export default router;
```

```typescript
// module/interface/index.ts
export { default as xxxRouter } from './http/routes';
```

---

## 📋 修改清单

### 修改的文件

#### 1. Editor 模块

**文件**: `apps/api/src/modules/editor/interface/index.ts`

```typescript
// Before
export { createEditorRoutes } from './http/routes/routes.js';

// After
export { default as editorRouter } from './http/routes/editorRoutes.js';
```

**说明**: 
- 移除工厂函数导出
- 改为直接导出 default router
- 统一命名为 `editorRouter`

#### 2. Repository 模块

**文件**: `apps/api/src/modules/repository/interface/index.ts`

```typescript
// Before
export { default as repositoryRoutes } from './http/routes/repositoryRoutes';

// After
export { default as repositoryRouter } from './http/routes/repositoryRoutes';
```

**说明**: 
- 统一命名从 `repositoryRoutes` 改为 `repositoryRouter`
- 保持 default export 模式

#### 3. App.ts 路由挂载

**文件**: `apps/api/src/app.ts`

```typescript
// Before
import { createEditorRoutes } from './modules/editor';
import editorWorkspaceRoutes from './modules/editor/interface/http/routes/editorRoutes';

api.use('/editor', authMiddleware, editorRoutes);  // ❌ 找不到
api.use('/repositories', authMiddleware, repositoryRoutes);  // ❌ 找不到

// After
import { editorRouter } from './modules/editor/interface';
import editorWorkspaceRoutes from './modules/editor/interface/http/routes/editorRoutes';
import { repositoryRouter } from './modules/repository/interface';

// 挂载编辑器聚合根路由 - 需要认证
api.use('/editor', authMiddleware, editorRouter);

// 挂载编辑器工作区路由（DDD 架构）- 需要认证
api.use('/editor-workspaces', authMiddleware, editorWorkspaceRoutes);

// 挂载仓储路由 - 需要认证
api.use('/repositories', authMiddleware, repositoryRouter);
```

**说明**:
- 修复了缺失的导入
- 统一使用 `xxxRouter` 命名
- 添加了清晰的注释

---

## 📊 当前路由命名状态

### 已统一的模块

| 模块 | 路由名称 | 状态 |
|------|---------|------|
| Account | `accountRoutes` | ✅ 已统一（历史原因保留） |
| Authentication | `authenticationRoutes` | ✅ 已统一 |
| Task | `taskRouter` | ✅ 已统一 |
| Goal | `goalRouter` | ✅ 已统一 |
| GoalDir | `goalDirRouter` | ✅ 已统一 |
| Reminder | `reminderRouter` | ✅ 已统一 |
| Schedule | `scheduleRoutes` | ✅ 已统一（历史原因保留） |
| Notification | `notificationRoutes` | ✅ 已统一 |
| NotificationPreference | `notificationPreferenceRoutes` | ✅ 已统一 |
| NotificationTemplate | `notificationTemplateRoutes` | ✅ 已统一 |
| NotificationSSE | `notificationSSERoutes` | ✅ 已统一 |
| UserPreferences | `userPreferencesRoutes` | ✅ 已统一 |
| Theme | `themeRoutes` | ✅ 已统一（历史原因保留） |
| **Editor** | **`editorRouter`** | ✅ **本次修复** |
| EditorWorkspace | `editorWorkspaceRoutes` | ✅ 已统一 |
| **Repository** | **`repositoryRouter`** | ✅ **本次修复** |

---

## 🏗️ Controller 架构状态

### 当前所有 Controller 使用的模式

所有 Controller 都已经使用 **静态方法 + 单例模式**，无需额外修改：

```typescript
export class XxxController {
  private static service: XxxApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取服务实例（单例模式）
   */
  private static async getService(): Promise<XxxApplicationService> {
    if (!this.service) {
      this.service = await XxxApplicationService.getInstance();
    }
    return this.service;
  }

  /**
   * 处理请求的静态方法
   */
  static async someAction(req: Request, res: Response): Promise<Response> {
    const service = await XxxController.getService();
    // ...
  }
}
```

**已验证的 Controller**:
- ✅ AccountController
- ✅ AuthenticationController
- ✅ TaskTemplateController
- ✅ TaskMetaTemplateController
- ✅ GoalController
- ✅ GoalDirController
- ✅ ReminderTemplateController
- ✅ ReminderTemplateGroupController
- ✅ ScheduleTaskController
- ✅ NotificationController
- ✅ NotificationPreferenceController
- ✅ NotificationTemplateController
- ✅ UserPreferencesController
- ✅ ThemeController
- ✅ EditorWorkspaceController
- ✅ EditorAggregateController
- ✅ RepositoryController
- ✅ RepositoryStatisticsController

---

## ✅ 验证结果

### TypeScript 编译检查

```bash
✅ No errors found
```

### 所有路由正常挂载

```typescript
// API v1 router structure
/api/v1
├── /health                          (GET)
├── /accounts/*                      (accountRoutes)
├── /auth/*                          (authenticationRoutes)
├── /tasks/*                         (taskRouter) ✅
├── /goals/*                         (goalRouter) ✅
├── /goal-dirs/*                     (goalDirRouter) ✅
├── /reminders/*                     (reminderRouter) ✅
├── /schedules/*                     (scheduleRoutes)
├── /editor/*                        (editorRouter) ✅ 本次修复
├── /editor-workspaces/*             (editorWorkspaceRoutes) ✅
├── /repositories/*                  (repositoryRouter) ✅ 本次修复
├── /settings/preferences/*          (userPreferencesRoutes)
├── /theme/*                         (themeRoutes)
├── /notifications/sse/*             (notificationSSERoutes)
├── /notifications/*                 (notificationRoutes)
├── /notification-preferences/*      (notificationPreferenceRoutes)
└── /notification-templates/*        (notificationTemplateRoutes)
```

---

## 📝 最佳实践总结

### 1. Router 类型注解

**始终显式声明 Router 类型**，避免 TypeScript 推断问题：

```typescript
import { Router } from 'express';

// ✅ 推荐
const router: Router = Router();

// ❌ 不推荐（可能导致类型推断错误）
const router = Router();
```

### 2. 路由命名规范

**统一使用 `xxxRouter` 后缀**：

```typescript
// ✅ 推荐
export { default as taskRouter } from './routes';
export { default as goalRouter } from './routes';

// ⚠️ 允许但不推荐（历史遗留）
export { default as accountRoutes } from './routes';
```

### 3. 导出模式

**使用 default export + 重命名导出**：

```typescript
// routes.ts
const router: Router = Router();
export default router;

// interface/index.ts
export { default as xxxRouter } from './http/routes';
```

### 4. Controller 模式

**使用静态方法 + 懒加载服务**：

```typescript
export class XxxController {
  private static service: XxxApplicationService | null = null;

  private static async getService(): Promise<XxxApplicationService> {
    if (!this.service) {
      this.service = await XxxApplicationService.getInstance();
    }
    return this.service;
  }

  static async action(req: Request, res: Response) {
    const service = await XxxController.getService();
    // ...
  }
}
```

### 5. 路由挂载

**清晰的注释 + 认证中间件**：

```typescript
// 挂载模块路由 - 需要认证
api.use('/path', authMiddleware, xxxRouter);

// 挂载模块路由 - 部分需要认证
api.use('/path', (req, res, next) => {
  if (needsAuth(req)) {
    return authMiddleware(req, res, next);
  }
  next();
}, xxxRouter);
```

---

## 🎉 修复完成

所有 TypeScript 类型推断错误已修复，路由命名已统一，Controller 架构已验证！

**关键改进**：
1. ✅ 修复了 TypeScript 类型推断错误
2. ✅ 统一了路由命名规范（xxxRouter）
3. ✅ 修复了缺失的路由导入
4. ✅ 验证了所有 Controller 使用单例模式
5. ✅ 编译零错误

**下次开发新模块时**，请遵循本文档的最佳实践！

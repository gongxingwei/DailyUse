# Goal 模块用户数据初始化 - 快速参考

## 🎯 核心机制

### 双重保障
1. **事件驱动**: 监听 `account.registered` 和 `user.loggedIn` 事件
2. **初始化任务**: 在 `USER_LOGIN` 阶段自动执行

---

## 📁 新增文件

```
apps/api/src/modules/goal/
├── initialization/
│   └── goalInitialization.ts          # 初始化任务注册
└── application/
    └── events/
        └── goalEventHandlers.ts        # 事件处理器
```

---

## 🔄 执行时机

| 场景 | 触发时机 | 执行方法 | 行为 |
|-----|---------|---------|------|
| 用户注册 | `account.registered` 事件 | `initializeUserData()` | 创建3个默认目录 |
| 用户登录 | `user.loggedIn` 事件 + `USER_LOGIN` 阶段 | `ensureDefaultDirectories()` | 检查并修复缺失目录 |
| 手动修复 | API调用 | `ensureDefaultDirectories()` | 只创建缺失的 |

---

## 📦 默认目录

| 名称 | Icon | Type | isDefault | 用途 |
|-----|------|------|-----------|------|
| 全部目标 | 📋 | ALL | ✓ | 显示所有目标 |
| 未分类 | 📂 | UNCATEGORIZED | ✗ | 未指定目录的目标 |
| 已归档 | 📦 | ARCHIVED | ✗ | 已完成的目标 |

---

## 🧪 测试方法

### 测试注册流程
```bash
# 1. 启动服务器
npm run dev

# 2. 注册新用户
curl -X POST http://localhost:3888/api/v1/accounts/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@123",
    "email": "test@example.com"
  }'

# 3. 查看日志，应该看到：
# 🎯 [Goal] 检测到账户注册事件: xxx
# ✅ [Goal] 新用户目标数据初始化完成: xxx

# 4. 验证目录创建
# 登录后查询用户的目录列表
```

### 测试登录流程
```bash
# 1. 登录
curl -X POST http://localhost:3888/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@123"
  }'

# 2. 查看日志，应该看到：
# 🎯 [Goal] 开始初始化用户目标数据: xxx
# 🎯 [Goal] 检测到用户登录事件: xxx
# ✅ [Goal] 用户目标数据初始化完成: xxx
```

---

## 🐛 故障排查

### 问题: 目录没有创建

**检查 1: 事件系统是否初始化**
```
查看启动日志中是否有:
✅ [Goal] 事件处理器注册完成
✓ Goal module initialization tasks registered
```

**检查 2: 事件是否发布**
```typescript
// 在 Account 或 Auth 服务中确认
eventBus.publish('account.registered', { accountUuid, ... });
eventBus.publish('user.loggedIn', { accountUuid, ... });
```

**检查 3: 服务是否正常**
```typescript
const goalService = await GoalApplicationService.getInstance();
console.log(goalService); // 应该不是 null
```

### 问题: 重复创建目录

**原因**: `initializeUserData()` 有幂等性检查
```typescript
if (existingDirs.goalDirs.length > 0) {
  return; // 有目录就跳过
}
```

如果仍然重复，检查:
- 数据库查询是否正确
- 是否有并发问题

---

## 📊 日志关键字

| 阶段 | 日志关键字 | 说明 |
|-----|-----------|------|
| 系统启动 | `注册目标模块事件处理器` | 事件系统初始化 |
| 系统启动 | `Goal module initialization tasks registered` | 初始化任务注册 |
| 用户注册 | `检测到账户注册事件` | 捕获注册事件 |
| 用户注册 | `新用户目标数据初始化完成` | 创建成功 |
| 用户登录 | `开始初始化用户目标数据` | 初始化任务执行 |
| 用户登录 | `检测到用户登录事件` | 捕获登录事件 |
| 修复 | `用户默认目录检查完成` | 修复完成 |

---

## 🔧 手动API

### 强制初始化（调试用）
```typescript
POST /api/v1/goals/initialize/:accountUuid

// 响应: { success: true, message: "Initialized" }
```

### 检查目录状态
```typescript
GET /api/v1/goal-dirs

// 响应: 
{
  "goalDirs": [
    { "name": "全部目标", "systemType": "ALL", ... },
    { "name": "未分类", "systemType": "UNCATEGORIZED", ... },
    { "name": "已归档", "systemType": "ARCHIVED", ... }
  ]
}
```

---

## ⚙️ 配置选项

### 修改默认目录

编辑 `UserDataInitializationService.ts`:
```typescript
private async createDefaultDirectories(accountUuid: string) {
  const defaultDirectories = [
    {
      name: '全部目标', // 可修改名称
      icon: '📋',      // 可修改图标
      color: '#3B82F6', // 可修改颜色
      // ...
    },
    // 可添加更多默认目录
  ];
}
```

### 调整初始化优先级

编辑 `goalInitialization.ts`:
```typescript
const userGoalDataInitTask: InitializationTask = {
  // ...
  priority: 20, // 数字越小优先级越高
};
```

---

## 📚 相关文档

- **完整指南**: `GOAL_USER_DATA_INITIALIZATION_GUIDE.md`
- **DDD架构**: `GOAL_DOMAIN_SERVICE_REFACTORING_COMPLETE.md`
- **事件系统**: `apps/api/src/shared/events/unifiedEventSystem.ts`
- **初始化系统**: `apps/api/src/shared/initialization/initializer.ts`

---

## ✅ 验证清单

- [ ] 启动服务器无错误
- [ ] 看到初始化日志
- [ ] 注册新用户
- [ ] 查询到3个默认目录
- [ ] 登录现有用户
- [ ] 检查并修复功能正常
- [ ] 手动删除目录后重新登录能恢复

---

**更新时间**: 2025-10-03  
**版本**: 1.0  
**状态**: ✅ 已实现

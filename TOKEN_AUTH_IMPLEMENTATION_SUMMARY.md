# Token 认证实现总结

## 已完成的修改

### 1. 修复 authTokenService.ts 中的问题
- **文件**: `electron/modules/Authentication/application/services/authTokenService.ts`
- **修改**: 修复了 `validateToken` 方法中的实例访问问题，确保在静态方法中正确获取实例

### 2. 更新主进程各模块的 IPC 层代码

#### Goal 模块
- **文件**: `electron/modules/goal/ipcs/goalIpcHandlers.ts`
- **修改**:
  - 导入 `withAuth` 函数
  - 为所有 IPC 处理器添加 `withAuth` 包装
  - 添加 token 验证和 account_uuid 检查
  - 将原有的多参数调用改为数组形式以适配 `withAuth` 函数

#### Task 模块
- **文件**: `electron/modules/Task/ipc/taskIpcHandler.ts`
- **修改**:
  - 导入 `withAuth` 函数
  - 为所有 IPC 处理器方法添加 `withAuth` 包装，包括：
    - 元模板相关处理器
    - 任务模板相关处理器
    - 任务实例相关处理器
    - 统计分析相关处理器
    - 提醒系统相关处理器
  - 添加 token 验证和 account_uuid 检查

#### Reminder 模块
- **文件**: `electron/modules/Reminder/infrastructure/ipcs/reminderIpcHandlers.ts`
- **修改**:
  - 导入 `withAuth` 函数
  - 为所有提醒模板和提醒组相关的 IPC 处理器添加 `withAuth` 包装
  - 添加 token 验证和 account_uuid 检查

#### Repository 模块
- **文件**: `electron/modules/Repository/infrastructure/ipc/repositoryIpcHandler.ts`
- **修改**:
  - 导入 `withAuth` 函数
  - 为所有仓库操作的 IPC 处理器添加 `withAuth` 包装
  - 添加 token 验证和 account_uuid 检查

#### Account 模块
- **文件**: `electron/modules/Account/infrastructure/ipc/accountIpcHandler.ts`
- **修改**:
  - 导入 `withAuth` 函数
  - 有选择地为需要认证的处理器添加 `withAuth` 包装：
    - `account:get-by-id` - 需要认证
    - `account:request-deactivation` - 需要认证
    - `account:register` - 不需要认证（保持原样）

### 3. IPC 调用参数格式统一
所有使用 `withAuth` 包装的 IPC 处理器现在都采用以下格式：
```typescript
withAuth(async (_event, [param1, param2, ...], auth) => {
  if (!auth.accountUuid) {
    return { success: false, message: '未登录或登录已过期，请重新登录' };
  }
  // 业务逻辑...
})
```

## 仍需完成的工作

### 1. 更新应用服务层
当前应用服务层方法的签名不一致，需要统一添加 `accountUuid` 参数：

#### Goal 应用服务需要更新的方法：
- `setUsername(username, accountUuid)`
- `getAllGoals(accountUuid)`
- `getGoalById(uuid, accountUuid)`
- `updateGoal(goalData, accountUuid)`
- `deleteGoal(uuid, accountUuid)`
- `deleteAllGoals(accountUuid)`
- 以及所有其他目标、关键结果、记录、复盘相关方法

#### Task 应用服务需要更新的方法：
- 需要为所有任务相关方法添加 `accountUuid` 参数

#### Reminder 应用服务需要更新的方法：
- 需要为所有提醒相关方法添加 `accountUuid` 参数

#### Repository 应用服务需要更新的方法：
- 需要为所有仓库操作方法添加 `accountUuid` 参数

### 2. 更新仓储层代码
需要修改所有仓储层的实现，使其：
- 接收 `accountUuid` 参数而非 `username`
- 使用 `accountUuid` 作为数据隔离的标识
- 移除所有与 `username` 相关的代码

### 3. 数据库迁移
如果数据库中使用了 `username` 作为外键或索引，需要：
- 迁移现有数据，将 `username` 替换为 `accountUuid`
- 更新数据库结构

## 注意事项

1. **向后兼容性**: 当前的修改没有考虑向后兼容性，所有代码都是直接修改的
2. **错误处理**: 所有 IPC 处理器现在都有统一的认证失败错误处理
3. **测试**: 完成修改后需要全面测试各模块的功能
4. **类型安全**: 确保所有 TypeScript 类型定义与新的参数结构匹配

## 下一步行动计划

1. 逐个更新各模块的应用服务层，添加 `accountUuid` 参数
2. 更新对应的仓储层实现
3. 运行测试确保功能正常
4. 如有需要，进行数据库迁移

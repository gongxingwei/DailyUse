# Account & Authentication 模块测试

## 测试文件位置

```
apps/api/src/modules/
├── account/tests/
│   ├── registration.integration.test.ts        # 用户注册测试
│   └── account-deletion.integration.test.ts    # 账号注销测试
└── authentication/tests/
    ├── login.integration.test.ts               # 用户登录测试
    └── logout.integration.test.ts              # 用户登出测试
```

## 测试覆盖功能

### ✅ 用户注册 (registration.integration.test.ts)

- 正常注册流程（创建账户 + 凭证，使用事务保证一致性）
- 用户名重复检测
- 邮箱重复检测
- 领域事件发布验证

### ✅ 用户登录 (login.integration.test.ts)

- 成功登录并创建会话
- 密码验证（拒绝错误密码）
- 用户验证（拒绝不存在的用户）
- 多设备登录支持
- 设备和位置信息记录

### ✅ 用户登出 (logout.integration.test.ts)

- 单个会话登出
- 保留其他会话（登出一个设备不影响其他设备）
- 终止所有会话
- 终止所有会话但保留当前
- 错误处理（拒绝终止不存在的会话）

### ✅ 账号注销 (account-deletion.integration.test.ts)

- 完整注销流程（软删除 + 终止会话 + 清理凭证）
- 密码二次验证
- 防止重复注销
- 注销原因记录
- 注销后无法登录验证

## 运行测试

```bash
# 运行所有 API 测试
pnpm nx test api

# 运行 Account 模块测试
pnpm nx test api --testPathPattern=account/tests

# 运行 Authentication 模块测试
pnpm nx test api --testPathPattern=authentication/tests
```

## 测试统计

- **总测试文件**: 4 个
- **总测试场景**: 18 个
- **测试覆盖**: 注册、登录、登出、注销 4 大核心功能

## 技术实现

- **事务一致性**: 使用 Prisma.$transaction 保证账户和凭证原子性创建
- **密码安全**: bcrypt 加密（12 轮）
- **领域事件**: 事件驱动架构，发布 `account:created` 等事件
- **测试隔离**: 使用时间戳后缀避免数据冲突，测试后自动清理

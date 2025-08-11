# Postman 快速开始指南

## 1. 导入 Collection 和 Environment

### 导入 Collection

1. 打开 Postman
2. 点击左上角 "Import" 按钮
3. 选择 `docs/postman/DailyUse-API-Collection.json` 文件
4. 点击 "Import" 确认

### 导入 Environment

1. 在 Postman 中点击右上角的环境下拉菜单
2. 点击 "Manage Environments"
3. 点击 "Import"
4. 选择 `docs/postman/DailyUse-Dev-Environment.json` 文件
5. 选择 "DailyUse Development" 环境

## 2. 启动 API 服务器

确保你的 API 服务器正在运行：

```bash
# 在项目根目录
cd apps/api
pnpm run dev
```

服务器应该在 `http://localhost:3000` 启动。

## 3. 测试流程

### 方法一：手动测试

1. **健康检查**: 首先运行 "API健康检查" 确保服务器正常
2. **创建账户**: 运行 "1. 创建账户"
3. **登录**: 运行 "1. 用户登录" (需要先设置密码)
4. **获取账户信息**: 运行 "2. 根据ID获取账户"

### 方法二：批量测试

1. 选择整个 Collection
2. 点击右上角的 "Runner" 按钮
3. 选择要运行的请求
4. 点击 "Run DailyUse API"

## 4. 常见问题解决

### 问题 1: 连接被拒绝

- 确保 API 服务器正在运行
- 检查端口是否为 3000
- 确认 `base_url` 环境变量正确

### 问题 2: 认证失败

- 先运行登录请求获取 token
- 确认 `auth_token` 变量已自动设置
- 检查 token 是否过期

### 问题 3: 数据验证错误

- 检查请求体格式是否正确
- 确认必需字段都已提供
- 查看控制台错误信息

## 5. 自定义测试

### 修改测试数据

在环境变量中可以修改以下测试数据：

- `test_username`: 测试用户名
- `test_email`: 测试邮箱
- `test_password`: 测试密码

### 添加新的测试

1. 在 Collection 中右键 → "Add Request"
2. 设置请求方法、URL、Headers
3. 在 "Tests" 标签页添加断言
4. 保存并运行

## 6. 测试结果分析

### 查看测试报告

运行 Collection Runner 后，可以查看：

- 通过/失败的测试数量
- 响应时间统计
- 详细的错误信息

### 导出测试结果

1. 在 Runner 结果页面点击 "Export Results"
2. 选择导出格式 (JSON/CSV)
3. 保存测试报告

---

**提示**:

- 使用环境变量可以在不同环境间快速切换
- 善用 Pre-request Scripts 进行数据准备
- 利用 Tests 进行自动化验证
- 定期更新和维护测试用例

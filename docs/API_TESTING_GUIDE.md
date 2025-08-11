# DailyUse API - Postman 测试文档

本文档提供了使用 Postman 测试 DailyUse API 的账户（Account）和认证（Authentication）模块的详细指南。

## 目录

- [环境设置](#环境设置)
- [账户模块 API 测试](#账户模块-api-测试)
- [认证模块 API 测试](#认证模块-api-测试)
- [测试流程建议](#测试流程建议)
- [常见问题](#常见问题)

## 环境设置

### 基础配置

- **Base URL**: `http://localhost:3000/api/v1`
- **Content-Type**: `application/json`

### 环境变量设置

在 Postman 中创建一个环境，添加以下变量：

| 变量名          | 初始值                         | 描述         |
| --------------- | ------------------------------ | ------------ |
| `base_url`      | `http://localhost:3000/api/v1` | API 基础 URL |
| `auth_token`    |                                | 认证令牌     |
| `account_id`    |                                | 账户 ID      |
| `session_id`    |                                | 会话 ID      |
| `refresh_token` |                                | 刷新令牌     |

## 账户模块 API 测试

### 1. 创建账户 (注册)

**请求方式**: `POST`  
**URL**: `{{base_url}}/accounts`

**Headers**:

```
Content-Type: application/json
```

**Request Body** (JSON):

```json
{
  "username": "testuser001",
  "email": "testuser001@example.com",
  "phoneNumber": "+86 13800138000",
  "accountType": "LOCAL",
  "firstName": "张",
  "lastName": "三",
  "displayName": "张三",
  "bio": "这是一个测试账户"
}
```

**期望响应** (201 Created):

```json
{
  "success": true,
  "message": "账户创建成功",
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser001",
    "email": "testuser001@example.com",
    "accountType": "LOCAL",
    "status": "PENDING_VERIFICATION",
    "createdAt": "2025-08-11T10:00:00.000Z"
  }
}
```

**Test Script** (在 Postman Tests 标签中添加):

```javascript
pm.test('Status code is 201', function () {
  pm.response.to.have.status(201);
});

pm.test('Response has success field', function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.success).to.be.true;
});

pm.test('Account ID is present', function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.data.uuid).to.exist;
  pm.environment.set('account_id', jsonData.data.uuid);
});
```

### 2. 根据 ID 获取账户信息

**请求方式**: `GET`  
**URL**: `{{base_url}}/accounts/{{account_id}}`

**Headers**:

```
Authorization: Bearer {{auth_token}}
```

**期望响应** (200 OK):

```json
{
  "success": true,
  "message": "获取账户信息成功",
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser001",
    "email": "testuser001@example.com",
    "accountType": "LOCAL",
    "status": "ACTIVE",
    "user": {
      "firstName": "张",
      "lastName": "三",
      "displayName": "张三",
      "bio": "这是一个测试账户"
    }
  }
}
```

### 3. 根据用户名获取账户

**请求方式**: `GET`  
**URL**: `{{base_url}}/accounts/username/testuser001`

**Headers**:

```
Authorization: Bearer {{auth_token}}
```

### 4. 更新账户信息

**请求方式**: `PUT`  
**URL**: `{{base_url}}/accounts/{{account_id}}`

**Headers**:

```
Content-Type: application/json
Authorization: Bearer {{auth_token}}
```

**Request Body**:

```json
{
  "firstName": "李",
  "lastName": "四",
  "displayName": "李四",
  "bio": "更新后的个人简介",
  "email": "newemail@example.com"
}
```

### 5. 激活账户

**请求方式**: `POST`  
**URL**: `{{base_url}}/accounts/{{account_id}}/activate`

**Headers**:

```
Authorization: Bearer {{auth_token}}
```

### 6. 验证邮箱

**请求方式**: `POST`  
**URL**: `{{base_url}}/accounts/{{account_id}}/verify-email`

**Request Body**:

```json
{
  "token": "email_verification_token_here"
}
```

### 7. 验证手机号

**请求方式**: `POST`  
**URL**: `{{base_url}}/accounts/{{account_id}}/verify-phone`

**Request Body**:

```json
{
  "code": "123456"
}
```

### 8. 获取所有账户 (管理员功能)

**请求方式**: `GET`  
**URL**: `{{base_url}}/accounts?page=1&limit=10`

**Headers**:

```
Authorization: Bearer {{auth_token}}
```

### 9. 搜索账户

**请求方式**: `GET`  
**URL**: `{{base_url}}/accounts/search?query=testuser`

**Headers**:

```
Authorization: Bearer {{auth_token}}
```

## 认证模块 API 测试

### 1. 用户登录

**请求方式**: `POST`  
**URL**: `{{base_url}}/auth/login`

**Headers**:

```
Content-Type: application/json
```

**Request Body**:

```json
{
  "username": "testuser001",
  "password": "SecurePassword123!",
  "deviceInfo": "Postman Test Client",
  "ipAddress": "192.168.1.100"
}
```

**期望响应** (200 OK):

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "sessionId": "session_uuid_here",
    "account": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "username": "testuser001"
    }
  }
}
```

**Test Script**:

```javascript
pm.test('Login successful', function () {
  pm.response.to.have.status(200);
  var jsonData = pm.response.json();
  pm.expect(jsonData.success).to.be.true;

  // 保存令牌和会话ID
  pm.environment.set('auth_token', jsonData.data.accessToken);
  pm.environment.set('refresh_token', jsonData.data.refreshToken);
  pm.environment.set('session_id', jsonData.data.sessionId);
});
```

### 2. MFA 验证 (如果启用)

**请求方式**: `POST`  
**URL**: `{{base_url}}/auth/mfa/verify`

**Headers**:

```
Content-Type: application/json
Authorization: Bearer {{auth_token}}
```

**Request Body**:

```json
{
  "deviceUuid": "mfa_device_uuid",
  "code": "123456"
}
```

### 3. 刷新令牌

**请求方式**: `POST`  
**URL**: `{{base_url}}/auth/refresh`

**Headers**:

```
Content-Type: application/json
```

**Request Body**:

```json
{
  "refreshToken": "{{refresh_token}}"
}
```

**期望响应**:

```json
{
  "success": true,
  "message": "令牌刷新成功",
  "data": {
    "accessToken": "new_access_token",
    "expiresIn": 3600
  }
}
```

### 4. 登出

**请求方式**: `POST`  
**URL**: `{{base_url}}/auth/logout`

**Headers**:

```
Authorization: Bearer {{auth_token}}
```

### 5. 创建 MFA 设备

**请求方式**: `POST`  
**URL**: `{{base_url}}/auth/mfa/devices`

**Headers**:

```
Content-Type: application/json
Authorization: Bearer {{auth_token}}
```

**Request Body**:

```json
{
  "accountUuid": "{{account_id}}",
  "type": "TOTP",
  "name": "My Authenticator App"
}
```

### 6. 获取 MFA 设备列表

**请求方式**: `GET`  
**URL**: `{{base_url}}/auth/mfa/devices/{{account_id}}`

**Headers**:

```
Authorization: Bearer {{auth_token}}
```

### 7. 获取会话列表

**请求方式**: `GET`  
**URL**: `{{base_url}}/auth/sessions/{{account_id}}`

**Headers**:

```
Authorization: Bearer {{auth_token}}
```

### 8. 终止会话

**请求方式**: `DELETE`  
**URL**: `{{base_url}}/auth/sessions/{{session_id}}`

**Headers**:

```
Authorization: Bearer {{auth_token}}
```

## 测试流程建议

### 完整测试流程

1. **创建账户** → 保存 `account_id`
2. **登录** → 保存 `auth_token` 和 `session_id`
3. **获取账户信息** (验证登录状态)
4. **更新账户信息**
5. **验证邮箱/手机号** (如需要)
6. **创建 MFA 设备** (可选)
7. **刷新令牌** (测试令牌机制)
8. **登出**

### Collection 运行器设置

在 Postman 中创建 Collection Runner，按以下顺序运行：

```
1. Create Account
2. Login
3. Get Account by ID
4. Update Account
5. Activate Account
6. Refresh Token
7. Logout
```

## 常见问题

### Q1: 401 Unauthorized 错误

**原因**: 缺少或无效的认证令牌  
**解决方法**:

1. 确保在需要认证的请求中包含 `Authorization: Bearer {{auth_token}}`
2. 检查令牌是否过期，如是则刷新令牌

### Q2: 400 Bad Request 错误

**原因**: 请求数据格式不正确  
**解决方法**:

1. 检查 JSON 格式是否正确
2. 确保必需字段都已提供
3. 验证数据类型和格式

### Q3: 404 Not Found 错误

**原因**: API 路由不存在  
**解决方法**:

1. 检查 URL 路径是否正确
2. 确保服务器正在运行

### Q4: 500 Internal Server Error

**原因**: 服务器内部错误  
**解决方法**:

1. 检查服务器日志
2. 确保数据库连接正常
3. 验证所有依赖服务是否启动

## 环境脚本示例

### Pre-request Script (全局)

```javascript
// 设置通用请求头
pm.request.headers.add({
  key: 'Content-Type',
  value: 'application/json',
});

// 如果有认证令牌，自动添加
const token = pm.environment.get('auth_token');
if (token) {
  pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + token,
  });
}
```

### Test Script (全局)

```javascript
// 通用响应时间检查
pm.test('Response time is less than 2000ms', function () {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});

// 检查响应格式
pm.test('Response is JSON', function () {
  pm.response.to.be.json;
});

// 错误处理
if (pm.response.code >= 400) {
  console.log('Error Response:', pm.response.text());
}
```

## 数据驱动测试

对于批量测试，可以创建 CSV 文件：

**test-accounts.csv**:

```csv
username,email,firstName,lastName,displayName
user001,user001@test.com,张,三,张三
user002,user002@test.com,李,四,李四
user003,user003@test.com,王,五,王五
```

在 Collection Runner 中导入此 CSV 文件进行批量账户创建测试。

---

**注意事项**:

1. 确保 API 服务器在测试前已启动
2. 数据库应处于可接受测试数据的状态
3. 某些操作可能需要管理员权限
4. 测试完成后清理测试数据

此文档应根据实际 API 实现进行调整和更新。

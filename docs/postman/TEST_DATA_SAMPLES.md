# 测试数据样例

## 账户创建测试数据

### 基本账户数据

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

### 管理员账户数据

```json
{
  "username": "admin001",
  "email": "admin@example.com",
  "phoneNumber": "+86 13900139000",
  "accountType": "ADMIN",
  "firstName": "管理员",
  "lastName": "一号",
  "displayName": "Admin",
  "bio": "系统管理员账户"
}
```

### 访客账户数据

```json
{
  "username": "guest001",
  "email": "guest@example.com",
  "accountType": "GUEST",
  "firstName": "访客",
  "lastName": "用户",
  "displayName": "Guest User"
}
```

## 认证测试数据

### 登录数据

```json
{
  "username": "testuser001",
  "password": "SecurePassword123!",
  "deviceInfo": "Postman Test Client",
  "ipAddress": "192.168.1.100"
}
```

### MFA 设备数据

```json
{
  "accountUuid": "{{account_id}}",
  "type": "TOTP",
  "name": "My Authenticator App"
}
```

```json
{
  "accountUuid": "{{account_id}}",
  "type": "SMS",
  "name": "My Phone"
}
```

### 验证码数据

```json
{
  "deviceUuid": "mfa_device_uuid",
  "code": "123456"
}
```

## 更新数据样例

### 账户信息更新

```json
{
  "firstName": "李",
  "lastName": "四",
  "displayName": "李四",
  "bio": "更新后的个人简介",
  "email": "newemail@example.com"
}
```

### 用户资料更新

```json
{
  "firstName": "王",
  "lastName": "五",
  "displayName": "小王",
  "bio": "我是王五，喜欢编程和阅读",
  "avatar": "https://example.com/avatar/wangwu.jpg"
}
```

## 验证数据样例

### 邮箱验证

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
}
```

### 手机验证

```json
{
  "code": "123456"
}
```

## 搜索和筛选数据

### 搜索参数

- `query=testuser` - 搜索用户名包含 "testuser" 的账户
- `query=张` - 搜索姓名包含 "张" 的账户
- `query=example.com` - 搜索邮箱包含 "example.com" 的账户

### 分页参数

- `page=1&limit=10` - 第1页，每页10条
- `page=2&limit=5` - 第2页，每页5条

## 错误场景测试数据

### 无效的账户数据

```json
{
  "username": "",
  "email": "invalid-email",
  "phoneNumber": "invalid-phone",
  "accountType": "INVALID_TYPE"
}
```

### 重复的账户数据

```json
{
  "username": "testuser001",
  "email": "testuser001@example.com"
}
```

### 无效的登录数据

```json
{
  "username": "nonexistent",
  "password": "wrongpassword"
}
```

## 批量测试数据 (CSV格式)

### 账户创建批量数据

```csv
username,email,firstName,lastName,displayName,accountType
user001,user001@test.com,张,三,张三,LOCAL
user002,user002@test.com,李,四,李四,LOCAL
user003,user003@test.com,王,五,王五,LOCAL
admin001,admin001@test.com,管理员,一,Admin,ADMIN
guest001,guest001@test.com,访客,一,Guest,GUEST
```

### 登录批量数据

```csv
username,password,deviceInfo
user001,Password123!,Test Device 1
user002,Password123!,Test Device 2
user003,Password123!,Test Device 3
admin001,AdminPass123!,Admin Device
guest001,GuestPass123!,Guest Device
```

## 环境变量示例

### 开发环境

```json
{
  "base_url": "http://localhost:3000/api/v1",
  "test_username": "testuser001",
  "test_email": "testuser001@example.com",
  "test_password": "SecurePassword123!"
}
```

### 测试环境

```json
{
  "base_url": "https://api-test.dailyuse.com/api/v1",
  "test_username": "testuser001",
  "test_email": "testuser001@test-example.com",
  "test_password": "TestPassword123!"
}
```

### 生产环境

```json
{
  "base_url": "https://api.dailyuse.com/api/v1",
  "test_username": "produser001",
  "test_email": "produser001@prod-example.com",
  "test_password": "ProdPassword123!"
}
```

---

**注意事项**:

1. 密码必须包含大小写字母、数字和特殊字符
2. 邮箱地址必须是有效格式
3. 手机号码需要包含国家代码
4. 用户名必须唯一
5. 某些操作需要管理员权限
6. 测试数据应定期清理

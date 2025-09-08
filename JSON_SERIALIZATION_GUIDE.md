# 前后端数据传输中的JSON序列化

## 📋 概述

在前端和后端之间的HTTP通信中，数据确实会被JSON序列化处理。这个过程涉及多个环节，每个环节都有特定的处理方式。

## 🔄 完整的数据传输流程

### 1. 前端发送请求

```typescript
// 前端代码示例
const accountData = {
  accountUuid: 'd290f332-9977-4769-b609-086d654086c3',
  username: 'Test456',
  loginTime: new Date(), // Date对象
  metadata: { source: 'web' }
};

// 通过API客户端发送
const response = await api.get(`/accounts/${accountData.accountUuid}`);
```

**序列化过程**：
```javascript
// Axios自动处理JSON序列化
JSON.stringify(accountData)
// 结果: '{"accountUuid":"d290f332-9977-4769-b609-086d654086c3","username":"Test456","loginTime":"2025-09-08T02:00:56.865Z","metadata":{"source":"web"}}'
```

### 2. 网络传输

- HTTP请求体包含JSON字符串
- Content-Type: `application/json`
- 数据以UTF-8编码传输

### 3. 后端接收请求

```typescript
// Express中间件自动解析JSON
app.use(express.json()); // 自动将JSON字符串解析为JavaScript对象

// 控制器接收到的数据
static async getAccountById(req: Request, res: Response): Promise<void> {
  const { id } = req.params; // 'd290f332-9977-4769-b609-086d654086c3'
  // req.body 如果有的话，也是已解析的JavaScript对象
}
```

### 4. 后端处理数据

```typescript
// 业务逻辑处理JavaScript对象
async getAccountById(id: string): Promise<Account | null> {
  const accountDTO = await this.accountRepository.findById(id);
  return accountDTO ? Account.fromPersistenceDTO(accountDTO) : null;
}
```

### 5. 后端返回响应

```typescript
// 控制器返回数据
const result = await accountService.getAccountById(id);
ok(res, result, '获取账户成功'); // 使用响应助手
```

**序列化过程**：
```javascript
// 响应助手自动处理JSON序列化
const responseData = {
  success: true,
  message: '获取账户成功',
  data: {
    uuid: 'd290f332-9977-4769-b609-086d654086c3',
    username: 'Test456',
    email: 'test@example.com',
    createdAt: '2025-09-08T02:00:00.000Z', // ISO字符串
    // ...其他字段
  }
};

JSON.stringify(responseData)
// 发送给前端的JSON字符串
```

### 6. 前端接收响应

```typescript
// Axios自动解析JSON字符串为JavaScript对象
const response = await api.get('/accounts/123');
const accountInfo = response.data; // 已经是JavaScript对象

console.log(typeof accountInfo); // 'object'
console.log(accountInfo.username); // 'Test456'
```

## ⚠️ JSON序列化的影响

### 1. 数据类型转换

| 原类型 | JSON序列化后 | 说明 |
|--------|-------------|------|
| `Date` | `string` (ISO格式) | `new Date()` → `"2025-09-08T02:00:56.865Z"` |
| `undefined` | 被忽略 | 对象中的undefined字段不会出现在JSON中 |
| `Function` | 被忽略 | 函数无法被JSON序列化 |
| `Symbol` | 被忽略 | Symbol无法被JSON序列化 |
| `BigInt` | 抛出错误 | BigInt无法被JSON序列化 |
| `NaN/Infinity` | `null` | 特殊数值被转换为null |

### 2. 常见问题

#### 问题1: Date对象序列化
```typescript
// 前端发送
const payload = { loginTime: new Date() };
JSON.stringify(payload) // {"loginTime":"2025-09-08T02:00:56.865Z"}

// 后端接收
console.log(typeof req.body.loginTime) // "string"

// 需要手动转换
const loginTime = new Date(req.body.loginTime);
```

#### 问题2: undefined字段丢失
```typescript
// 前端发送
const user = { name: 'John', age: undefined, email: 'john@example.com' };
JSON.stringify(user) // {"name":"John","email":"john@example.com"}

// 后端接收
console.log(req.body.age) // undefined (字段不存在)
```

#### 问题3: 循环引用
```typescript
// 这会导致JSON序列化错误
const obj = { name: 'test' };
obj.self = obj;
JSON.stringify(obj) // TypeError: Converting circular structure to JSON
```

## 🛠️ 解决方案

### 1. Date对象处理

```typescript
// 前端：发送时转换为ISO字符串
const payload = {
  loginTime: new Date().toISOString(),
  // 或使用时间戳
  timestamp: Date.now()
};

// 后端：接收时转换回Date对象
const loginTime = new Date(req.body.loginTime);
```

### 2. 可选字段处理

```typescript
// 前端：只发送有值的字段
const payload = {};
if (user.age !== undefined) {
  payload.age = user.age;
}

// 或使用null代替undefined
const payload = {
  age: user.age ?? null
};
```

### 3. 复杂对象序列化

```typescript
// 自定义序列化函数
function serialize(obj: any): string {
  return JSON.stringify(obj, (key, value) => {
    // 处理特殊类型
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value === 'function') {
      return undefined; // 忽略函数
    }
    return value;
  });
}
```

## 📊 在你的项目中的体现

### 前端API客户端

```typescript
// apps/web/src/shared/api/core/client.ts
private extractData<T>(responseData: any): T {
  // 处理标准API响应格式
  if (responseData && typeof responseData === 'object' && 'success' in responseData) {
    const apiResponse = responseData as SuccessResponse<T> | ErrorResponse;
    if (apiResponse.success === true) {
      return (apiResponse as SuccessResponse<T>).data;
    } else {
      throw new Error(apiResponse.message || '请求失败');
    }
  }
  // 直接返回数据
  return responseData as T;
}
```

### 后端响应处理

```typescript
// apps/api/src/shared/utils/apiResponse.ts
export const ok = <T>(res: Response, data?: T, message = 'ok') => {
  const helper = createApiResponseHelper(res);
  return helper.success(data, message); // 内部会JSON.stringify
};
```

## 🎯 总结

是的，前后端数据传输中确实会进行JSON序列化：

1. **前端发送**：JavaScript对象 → JSON字符串
2. **网络传输**：JSON字符串通过HTTP传输
3. **后端接收**：JSON字符串 → JavaScript对象
4. **后端响应**：JavaScript对象 → JSON字符串
5. **前端接收**：JSON字符串 → JavaScript对象

这种序列化过程是HTTP API通信的标准方式，但需要注意数据类型转换的影响，特别是Date对象、undefined值和循环引用等问题。

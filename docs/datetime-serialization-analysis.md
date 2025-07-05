# DateTime 对象序列化测试

基于您的问题，我们需要理解几个关键点：

## 1. IPC 序列化机制

Electron 的 IPC 使用**结构化克隆算法**（Structured Clone Algorithm），它有以下特性：
- ✅ 可以传输：基本类型、普通对象、数组、Date 对象
- ❌ 不能传输：函数、Symbol、包含循环引用的对象、自定义类实例

## 2. DateTime 对象的实际结构

根据类型定义，DateTime 是一个对象：
```typescript
export type DateTime = {
  date: DateInfo;
  time?: TimePoint;
  timestamp: number;
  isoString: string;  // 这个是我们需要的
};
```

## 3. DTO 接口的期望

我们的 DTO 接口明确要求日期字段是字符串：
```typescript
export interface TaskTimeConfigDto {
  startTime?: string; // ISO string
  endTime?: string;   // ISO string
}
```

## 4. 实际测试结果预期

如果我们直接返回 `toJSON()` 的结果：

### 情况A：如果 DateTime 对象被原样传输
```javascript
// 发送的数据
{
  startTime: {
    date: { year: 2025, month: 7, day: 4 },
    timestamp: 1720051200000,
    isoString: "2025-07-04T00:00:00.000Z"
  }
}

// 渲染进程接收到的数据仍然是对象
{
  startTime: {
    date: { year: 2025, month: 7, day: 4 },
    timestamp: 1720051200000,
    isoString: "2025-07-04T00:00:00.000Z"
  }
}
```

这种情况下：
- ❌ 类型不匹配：DTO 期望 string，实际是 object
- ❌ 渲染进程需要额外处理才能使用

### 情况B：如果我们使用 serializeDateTimeObjects
```javascript
// 发送的数据
{
  startTime: "2025-07-04T00:00:00.000Z"
}

// 渲染进程接收到的数据
{
  startTime: "2025-07-04T00:00:00.000Z"
}
```

这种情况下：
- ✅ 类型匹配：DTO 期望 string，实际是 string
- ✅ 渲染进程可以直接使用或转换为 Date 对象

## 结论

**我们确实需要 `serializeDateTimeObjects` 函数**，原因：

1. **类型安全**：确保发送的数据符合 DTO 接口定义
2. **简化渲染进程处理**：渲染进程直接收到字符串，无需深度遍历对象提取 isoString
3. **明确的契约**：DTO 就是为了定义进程间通信的数据格式

## 但是可以优化实现

我们可以简化 `serializeDateTimeObjects` 的实现，专门针对 DateTime 对象：

```typescript
private serializeDateTimeObjects(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // 专门处理 DateTime 对象
  if (obj && typeof obj === 'object' && 'isoString' in obj && 'timestamp' in obj) {
    return obj.isoString;
  }

  // 递归处理数组和对象
  if (Array.isArray(obj)) {
    return obj.map(item => this.serializeDateTimeObjects(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.serializeDateTimeObjects(value);
    }
    return result;
  }

  return obj;
}
```

这样更精确地识别 DateTime 对象，避免误判其他包含 `isoString` 的对象。

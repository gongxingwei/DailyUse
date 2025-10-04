# Contracts 类型修复清单

## 📋 当前问题总结

### 1. Reminder 模块问题

#### ❌ 缺失的类型定义
- [x] `ReminderListResponse` - 已添加为 `ReminderInstanceListResponse` 的别名

#### ❌ Response 类型不一致
- [x] `EnableStatusChangeResponse` - 已移除 `data` 包装，直接返回字段

#### ⚠️  API Client 返回类型不匹配

**问题描述：**
`apiClient.get()` 使用 `extractData()` 自动提取 `data` 字段，所以 API Client 方法应该返回 `Response['data']` 类型，而不是完整的 `Response` 类型。

**需要修复的方法：**

```typescript
// ❌ 错误 - 返回类型应该是 Response['data']
async getReminderInstances(): Promise<ReminderInstanceListResponse> {
  const data = await apiClient.get(...);  // apiClient 已经提取了 data
  return data;  // 这里 data 实际上是 Response['data']
}

// ✅ 正确
async getReminderInstances(): Promise<ReminderInstanceListResponse['data']> {
  const data = await apiClient.get(...);
  return data;
}
```

**需要修复的文件：**
- `apps/web/src/modules/reminder/infrastructure/api/reminderApiClient.ts`
- `apps/web/src/modules/reminder/application/services/ReminderWebApplicationService.ts`

### 2. Schedule 模块问题

#### ✅ 已修复
- Schedule API 已正确处理后端响应格式转换

### 3. Task 模块问题

#### ✅ 状态良好
Task 模块的 contracts 定义规范，无需修改。

## 🔧 详细修复方案

### 方案 A: 统一使用 Response['data'] 返回类型（推荐）

**优点：**
- 符合实际运行逻辑
- 减少类型断言
- 更清晰的类型推导

**修改范围：**

#### 1. 更新 API Client 返回类型

```typescript
// apps/web/src/modules/reminder/infrastructure/api/reminderApiClient.ts

class ReminderApiClient {
  // 单个资源
  async getReminderTemplate(uuid: string): Promise<ReminderTemplateResponse['data']> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return data;
  }

  // 列表资源
  async getReminderTemplates(): Promise<ReminderTemplateListResponse['data']> {
    const data = await apiClient.get(this.baseUrl);
    return data;
  }

  async getReminderInstances(
    templateUuid: string,
    params?: {...}
  ): Promise<ReminderInstanceListResponse['data']> {
    const data = await apiClient.get(`${this.baseUrl}/${templateUuid}/instances`, { params });
    return data;
  }

  async getActiveReminders(params?: {...}): Promise<ReminderInstanceListResponse['data']> {
    const data = await apiClient.get(`${this.baseUrl}/active`, { params });
    return data;
  }

  // 分组
  async createReminderTemplateGroup(
    request: CreateReminderTemplateGroupRequest
  ): Promise<ReminderTemplateGroupResponse['data']> {
    const data = await apiClient.post('/reminders/groups', request);
    return data;
  }

  async getReminderTemplateGroups(): Promise<ReminderTemplateGroupListResponse['data']> {
    const data = await apiClient.get('/reminders/groups');
    return data;
  }

  // 特殊响应
  async getUpcomingReminders(
    params: GetUpcomingRemindersRequest
  ): Promise<UpcomingRemindersResponse['data']> {
    const data = await apiClient.get('/reminders/upcoming', { params });
    return data;
  }

  async getGlobalStats(): Promise<ReminderStatsResponse['data']> {
    const data = await apiClient.get(`${this.baseUrl}/stats`);
    return data;
  }
}
```

#### 2. 更新 Service 层返回类型

```typescript
// apps/web/src/modules/reminder/application/services/ReminderWebApplicationService.ts

class ReminderWebApplicationService {
  async getReminderTemplates(params?: {
    forceRefresh?: boolean;
  }): Promise<ReminderTemplateListResponse['data']> {
    const response = await reminderApiClient.getReminderTemplates();
    
    // response 已经是 data 字段的内容
    const templates = response.reminders.map(...);
    
    return {
      reminders: templates,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasMore: response.hasMore,
    };
  }

  async getReminderTemplateGroups(params?: {
    forceRefresh?: boolean;
  }): Promise<ReminderTemplateGroup[]> {
    const response = await reminderApiClient.getReminderTemplateGroups();
    
    // 从分页响应中提取分组数组
    const groupsArray = response.groups || [];
    
    const groups = groupsArray.map((data: any) => 
      ReminderTemplateGroup.fromResponse(data)
    );
    
    return groups;
  }
}
```

### 方案 B: 修改 API Client 不使用 extractData（不推荐）

这需要修改整个项目的 `apiClient` 实现，影响范围太大。

## 📝 具体修复步骤

### Step 1: 修复 reminderApiClient.ts

替换所有返回类型：

```bash
# 查找需要替换的模式
ReminderTemplateResponse -> ReminderTemplateResponse['data']
ReminderTemplateListResponse -> ReminderTemplateListResponse['data']
ReminderTemplateGroupResponse -> ReminderTemplateGroupResponse['data']
ReminderTemplateGroupListResponse -> ReminderTemplateGroupListResponse['data']
ReminderInstanceResponse -> ReminderInstanceResponse['data']
ReminderInstanceListResponse -> ReminderInstanceListResponse['data']
ReminderListResponse -> ReminderInstanceListResponse['data']
UpcomingRemindersResponse -> UpcomingRemindersResponse['data']
ReminderStatsResponse -> ReminderStatsResponse['data']
```

### Step 2: 修复 ReminderWebApplicationService.ts

更新所有使用这些 API 的方法：

```typescript
// 示例：修复 getReminderInstances
async getReminderInstances(
  templateUuid: string,
  params?: {...}
): Promise<ReminderInstanceListResponse['data']> {
  const instancesData = await reminderApiClient.getReminderInstances(templateUuid, params);
  
  // instancesData 现在是 { reminders, total, page, limit, hasMore }
  const instances = instancesData.reminders.map((data: any) => 
    ReminderInstance.fromResponse(data)
  );
  
  return {
    reminders: instances,
    total: instancesData.total,
    page: instancesData.page,
    limit: instancesData.limit,
    hasMore: instancesData.hasMore,
  };
}
```

### Step 3: 修复类型参数问题

```typescript
// 修复 getUpcomingReminders 的 priorities 类型
async getUpcomingReminders(params?: {
  limit?: number;
  days?: number;
  priorities?: ReminderPriority[];  // ✅ 明确类型
  categories?: string[];
  tags?: string[];
}): Promise<UpcomingRemindersResponse['data']> {
  const response = await reminderApiClient.getUpcomingReminders(params as GetUpcomingRemindersRequest);
  
  const reminders = response.reminders.map((data: any) =>
    ReminderInstance.fromResponse(data)
  );
  
  return {
    reminders,
    total: response.total,
    timeRange: response.timeRange,
  };
}
```

## ✅ 验证清单

修复完成后，检查：

- [ ] 所有 TypeScript 编译错误消失
- [ ] API Client 所有方法返回类型为 `Response['data']`
- [ ] Service 层正确处理返回的数据
- [ ] 前端页面正常显示数据
- [ ] 控制台无类型警告

## 📚 参考

### Response 类型结构

```typescript
// ✅ 正确的 Response 结构（在 contracts 中定义）
export interface ReminderTemplateListResponse {
  data: {
    reminders: ReminderTemplateClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// ✅ API Client 返回 data 字段的内容
async getReminderTemplates(): Promise<ReminderTemplateListResponse['data']> {
  const data = await apiClient.get(...);  // apiClient 自动提取 data
  return data;  // 类型：{ reminders, total, page, limit, hasMore }
}

// ✅ Service 层使用
async loadTemplates() {
  const response = await reminderApiClient.getReminderTemplates();
  // response.reminders ✅ 可以直接访问
  // response.total     ✅ 可以直接访问
}
```

### apiClient.get() 的行为

```typescript
// shared/api/client.ts
async get<T>(url: string): Promise<T> {
  const response = await axios.get(url);
  // response.data = { code: 200, success: true, data: {...} }
  
  return extractData(response);  // 返回 response.data.data
}

function extractData(response) {
  return response.data.data;  // 提取嵌套的 data 字段
}
```

这就是为什么 API Client 应该返回 `Response['data']` 而不是完整的 `Response`。

## 🎯 下一步

1. 执行 Step 1-3 的修复
2. 运行 TypeScript 编译检查
3. 测试 Reminder 模块所有功能
4. 更新文档

---

**创建时间**: 2025-10-04  
**状态**: 待执行  
**优先级**: 高

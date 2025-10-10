---
title: Repository 模块 - 实现总结与易错点
created: 2025-10-10
updated: 2025-10-10
tags:
  - repository
  - summary
  - best-practices
category: 实现指南
---

# Repository 模块 - 实现总结与易错点

> **目标**：总结整个 Repository 模块的实现规范，为 Editor 模块提供参考

---

## 📚 完整实现流程

```
1. Contracts (类型定义)
   ↓
2. Domain-Server (后端领域层)
   ↓
3. Domain-Client (前端领域层)
   ↓
4. API (后端接口层)
   ↓
5. Web (前端表示层)
```

---

## 🎯 各层职责总结

### 1️⃣ Contracts 层

**职责**：定义类型，前后端共享

**包含**：
- ✅ 枚举（RepositoryType、RepositoryStatus）
- ✅ Server DTO（RepositoryServerDTO）
- ✅ Client DTO（RepositoryDTO - 简化命名）
- ✅ API Request DTO（CreateRepositoryRequestDTO）
- ✅ API Response DTO（RepositoryListResponseDTO）
- ✅ 值对象（RepositoryConfig、GitInfo）

**易错点**：
- ❌ Server DTO 和 Client DTO 命名混淆
- ❌ 忘记导出类型
- ❌ API DTO 包含过多内部细节

---

### 2️⃣ Domain-Server 层

**职责**：后端业务逻辑

**包含**：
- ✅ 聚合根（Repository 类）
- ✅ 实体（Resource 类）
- ✅ 仓储接口（IRepositoryRepository）

**规范**：
- ✅ 继承 AggregateRoot/Entity
- ✅ private 构造函数 + 静态工厂方法
- ✅ 所有属性 private + getter
- ✅ 业务方法调用 markAsModified()
- ✅ 状态变更发布领域事件
- ✅ 提供 create()、fromDTO()、toDTO()

**易错点**：
- ❌ 使用 public 构造函数
- ❌ 直接暴露可变属性
- ❌ 忘记发布领域事件
- ❌ 实体缺少聚合根外键

---

### 3️⃣ Domain-Client 层

**职责**：前端业务逻辑（简化）

**包含**：
- ✅ 客户端聚合根（RepositoryClient 类）
- ✅ 客户端实体（ResourceClient 类）
- ✅ DTO 转换工具

**规范**：
- ✅ 继承 AggregateRoot/Entity
- ✅ 可以使用 public 属性（简化）
- ✅ 提供 fromServerDTO()、toClientDTO()
- ✅ 日期类型显式转换 `new Date(...)`
- ✅ 数组/对象创建副本
- ✅ 提供前端常用方法（isXxx、getXxx）

**易错点**：
- ❌ 忘记处理日期类型转换
- ❌ 直接引用数组/对象（共享引用）
- ❌ 缺少 UI 辅助方法

---

### 4️⃣ API 层

**职责**：后端接口

**包含**：
- ✅ TypeORM Entity（数据库实体）
- ✅ Repository Implementation（仓储实现）
- ✅ Application Service（应用服务）
- ✅ Controller（控制器）
- ✅ Module（模块注册）

**规范**：
- ✅ TypeORM Entity 提供 fromDomain()、toDomain()
- ✅ Repository 实现接口，返回领域实体
- ✅ Application Service 负责业务流程编排
- ✅ Controller 薄控制器，使用统一响应格式
- ✅ 从认证信息获取 accountUuid

**易错点**：
- ❌ Controller 包含业务逻辑
- ❌ 忘记使用统一响应格式
- ❌ 直接使用请求中的 accountUuid（不安全）
- ❌ Repository 返回 DTO 而不是领域实体

---

### 5️⃣ Web 层

**职责**：前端界面

**包含**：
- ✅ Store（Pinia 状态管理）
- ✅ Application Service（前端应用服务）
- ✅ API Client（HTTP 请求）
- ✅ Composables（可组合函数）
- ✅ Components（Vue 组件）
- ✅ Views（页面视图）

**规范**：
- ✅ Store 使用 Map 存储领域模型
- ✅ Application Service 进行 DTO → Domain 转换
- ✅ API Client 只返回 DTO
- ✅ Composable 集成工具（useMessage、useLoading、防抖）
- ✅ 组件接收领域模型作为 props
- ✅ 使用组合式 API（setup script）

**易错点**：
- ❌ Store 存储 DTO
- ❌ 使用数组存储（查询 O(n)）
- ❌ API Client 返回领域模型
- ❌ 组件直接调用 API

---

## 🚨 十大易错点

### 1. DTO 命名不一致

❌ **错误**：
```typescript
// Server
export interface RepositoryDTO { ... }  // ❌ 不清楚是 Server 还是 Client

// Client
export interface RepositoryClientDTO { ... }  // ❌ 命名不对称
```

✅ **正确**：
```typescript
// Server
export interface RepositoryServerDTO { ... }  // ✅ 明确 Server

// Client
export interface RepositoryDTO { ... }  // ✅ 简化命名
```

---

### 2. 日期类型转换

❌ **错误**：
```typescript
static fromServerDTO(dto: RepositoryServerDTO): RepositoryClient {
  return new RepositoryClient(
    // ...
    dto.createdAt,   // ❌ 可能是字符串
  );
}
```

✅ **正确**：
```typescript
static fromServerDTO(dto: RepositoryServerDTO): RepositoryClient {
  return new RepositoryClient(
    // ...
    new Date(dto.createdAt),   // ✅ 显式转换
  );
}
```

---

### 3. 数组/对象共享引用

❌ **错误**：
```typescript
static fromServerDTO(dto: RepositoryServerDTO): RepositoryClient {
  return new RepositoryClient(
    // ...
    dto.tags,           // ❌ 共享引用
    dto.relatedGoals,   // ❌ 共享引用
  );
}
```

✅ **正确**：
```typescript
static fromServerDTO(dto: RepositoryServerDTO): RepositoryClient {
  return new RepositoryClient(
    // ...
    [...dto.tags],           // ✅ 创建副本
    [...dto.relatedGoals],   // ✅ 创建副本
  );
}
```

---

### 4. 忘记发布领域事件

❌ **错误**：
```typescript
activate(): void {
  this._status = RepositoryStatus.ACTIVE;
  this.markAsModified();
  // ❌ 忘记发布事件
}
```

✅ **正确**：
```typescript
activate(): void {
  this._status = RepositoryStatus.ACTIVE;
  this.markAsModified();
  
  // ✅ 发布领域事件
  this.addDomainEvent({
    eventType: 'RepositoryStatusChanged',
    aggregateId: this.uuid,
    ...
  });
}
```

---

### 5. Store 存储 DTO

❌ **错误**：
```typescript
const repositories = ref<RepositoryDTO[]>([]);  // ❌ 存储 DTO
```

✅ **正确**：
```typescript
const repositories = ref<Map<string, RepositoryClient>>(new Map());  // ✅ 领域模型 + Map
```

---

### 6. Controller 包含业务逻辑

❌ **错误**：
```typescript
@Post()
async create(@Body() request: CreateRepositoryRequestDTO) {
  // ❌ 业务逻辑在 Controller
  const existingRepo = await this.repository.findByPath(...);
  if (existingRepo) {
    throw new BadRequestException('...');
  }
  const repository = Repository.create(...);
  await this.repository.save(repository);
  return repository.toDTO();
}
```

✅ **正确**：
```typescript
@Post()
async create(@Body() request: CreateRepositoryRequestDTO) {
  // ✅ 调用 Application Service
  const repository = await this.service.createRepository(request);
  return {
    success: true,
    data: repository,
    message: 'Repository created successfully',
    timestamp: new Date().toISOString(),
  };
}
```

---

### 7. 忘记统一响应格式

❌ **错误**：
```typescript
@Get(':uuid')
async getOne(@Param('uuid') uuid: string) {
  return await this.service.getRepositoryByUuid(uuid);  // ❌ 直接返回
}
```

✅ **正确**：
```typescript
@Get(':uuid')
async getOne(@Param('uuid') uuid: string) {
  const repository = await this.service.getRepositoryByUuid(uuid);
  // ✅ 统一响应格式
  return {
    success: true,
    data: repository,
    message: 'Repository retrieved successfully',
    timestamp: new Date().toISOString(),
  };
}
```

---

### 8. 不安全的 accountUuid 获取

❌ **错误**：
```typescript
@Post()
async create(@Body() request: CreateRepositoryRequestDTO) {
  // ❌ 直接使用请求中的 accountUuid（不安全）
  return await this.service.createRepository(request);
}
```

✅ **正确**：
```typescript
@Post()
async create(@Body() request: CreateRepositoryRequestDTO, @Request() req: any) {
  const accountUuid = req.user.accountUuid;  // ✅ 从认证信息获取
  return await this.service.createRepository({
    ...request,
    accountUuid,
  });
}
```

---

### 9. API Client 返回领域模型

❌ **错误**：
```typescript
async createRepository(request: CreateRepositoryRequestDTO): Promise<RepositoryClient> {
  const response = await apiClient.post(...);
  return RepositoryClient.fromServerDTO(response.data);  // ❌ 返回领域模型
}
```

✅ **正确**：
```typescript
async createRepository(request: CreateRepositoryRequestDTO): Promise<RepositoryServerDTO> {
  const response = await apiClient.post(...);
  return response.data;  // ✅ 返回 DTO
}
```

---

### 10. 组件直接调用 API

❌ **错误**：
```vue
<script setup>
import { repositoryApiClient } from '@/api/repositoryApiClient';

async function createRepository() {
  // ❌ 组件直接调用 API
  const dto = await repositoryApiClient.createRepository(...);
  const repo = RepositoryClient.fromServerDTO(dto);
  repositoryStore.upsertRepository(repo);
}
</script>
```

✅ **正确**：
```vue
<script setup>
import { useRepository } from '@/composables/useRepository';

const { createRepository } = useRepository();

async function handleCreate() {
  // ✅ 使用 Composable
  await createRepository(...);
}
</script>
```

---

## 📝 命名规范总结

| 类型 | Server 端 | Client 端 |
|------|----------|-----------|
| **DTO** | `XxxServerDTO` | `XxxDTO` |
| **聚合根** | `Xxx` (class) | `XxxClient` (class) |
| **实体** | `Xxx` (class) | `XxxClient` (class) |
| **API Request** | `CreateXxxRequestDTO` | - |
| **API Response** | `XxxListResponseDTO` | - |
| **仓储接口** | `IXxxRepository` | - |
| **仓储实现** | `XxxRepositoryImpl` | - |

---

## 🛠️ 工具集成

### 前端工具集成清单

- ✅ `@dailyuse/utils` - 防抖节流、加载状态管理
- ✅ `@dailyuse/ui` - useMessage、useLoading
- ✅ `date-fns` - 日期格式化
- ✅ Vuetify 3 - UI 组件库

### 使用示例

```typescript
import { useMessage, useLoading } from '@dailyuse/ui';
import { createDebounce } from '@dailyuse/utils';

const message = useMessage();
const { withLoading } = useLoading();

// 防抖搜索
const { debouncedFn: debouncedSearch } = createDebounce((query) => {
  // 搜索逻辑
}, 300);

// Loading + Message
async function handleCreate() {
  try {
    await withLoading(async () => {
      await service.create(...);
    }, '创建中...');
    
    message.success('创建成功');
  } catch (error) {
    message.error('创建失败');
  }
}
```

---

## ✅ 完整检查清单

### Contracts 层
- [ ] 枚举定义完整
- [ ] Server DTO 和 Client DTO 命名正确
- [ ] API Request/Response DTO 定义
- [ ] 值对象定义
- [ ] 所有类型已导出

### Domain-Server 层
- [ ] 聚合根继承 AggregateRoot
- [ ] 使用 private 构造函数
- [ ] 提供 create()、fromDTO()、toDTO()
- [ ] 所有属性 private + getter
- [ ] 业务方法调用 markAsModified()
- [ ] 状态变更发布领域事件
- [ ] 实体包含聚合根外键

### Domain-Client 层
- [ ] 继承 AggregateRoot/Entity
- [ ] 提供 fromServerDTO()、toClientDTO()
- [ ] 日期类型显式转换
- [ ] 数组/对象创建副本
- [ ] 提供 UI 辅助方法

### API 层
- [ ] TypeORM Entity 使用装饰器
- [ ] 提供 fromDomain()、toDomain()
- [ ] Repository 实现接口
- [ ] Application Service 编排业务流程
- [ ] Controller 薄控制器
- [ ] 使用统一响应格式
- [ ] 从认证信息获取 accountUuid
- [ ] Module 正确注册依赖

### Web 层
- [ ] Store 使用 Map 存储领域模型
- [ ] Application Service 进行 DTO → Domain 转换
- [ ] API Client 只返回 DTO
- [ ] Composable 集成工具
- [ ] 组件接收领域模型
- [ ] 使用组合式 API
- [ ] 错误处理统一

---

## 🎓 总结

通过 Repository 模块的完整实现，我们建立了以下规范：

1. **分层清晰**：Contracts → Domain → API → Web
2. **职责明确**：每层只负责自己的职责
3. **命名统一**：Server DTO vs Client DTO
4. **转换规范**：显式处理日期、数组、对象
5. **工具集成**：防抖、Loading、Message
6. **错误处理**：统一的错误提示
7. **性能优化**：Map 存储、防抖搜索

**这些规范将直接应用于 Editor 模块的实现！**

---

📖 **相关文档**:
- [[01-CONTRACTS_IMPLEMENTATION|Contracts 实现]]
- [[02-DOMAIN_SERVER_IMPLEMENTATION|Domain Server 实现]]
- [[03-DOMAIN_CLIENT_IMPLEMENTATION|Domain Client 实现]]
- [[04-API_IMPLEMENTATION|API 实现]]
- [[05-WEB_IMPLEMENTATION|Web 实现]]

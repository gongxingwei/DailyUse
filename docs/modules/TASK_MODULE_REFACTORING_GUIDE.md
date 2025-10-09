# Task 模块重构实施指南

**基于**: [[TASK_MODULE_REFACTORING_PLAN|Task 模块重构计划]]  
**参考**: [[Goal模块完整流程|Goal 模块完整流程]]

---

## 🎯 重构目标

将 Task 模块重构为符合以下标准的代码：
- ✅ Contract First 架构
- ✅ DDD 分层设计
- ✅ 使用项目统一工具（日志、响应、事件、校验）
- ✅ 代码规范一致
- ✅ 完整的类型定义

---

## 📋 当前进度

- [x] ✅ 调研现状
- [x] ✅ 创建重构计划
- [x] ✅ 创建 `enums.ts`
- [ ] 🔄 完善 `dtos.ts`
- [ ] 🔄 创建 `persistence-dtos.ts`
- [ ] ⏳ Domain-Server 层
- [ ] ⏳ API 层
- [ ] ⏳ Web 层
- [ ] ⏳ 文档

---

## 🚀 Step-by-Step 实施步骤

### ⭐ 阶段 1: Contracts 层（约 2-3 小时）

#### Step 1.1: 完善 dtos.ts

**目标**: 创建清晰的 DTO 类型定义

**参考文件**: `packages/contracts/src/modules/goal/dtos.ts`

**需要创建的类型**:

```typescript
// 1. 服务端 DTO (用于后端内部传输)
export interface TaskTemplateDTO {
  uuid: string;
  accountUuid: string;
  // ... 完整字段
}

export interface TaskInstanceDTO {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  // ... 完整字段
}

export interface TaskMetaTemplateDTO {
  uuid: string;
  accountUuid: string;
  // ... 完整字段
}

// 2. 请求 DTO (前端发送给后端)
export interface CreateTaskTemplateRequest {
  // 基于 TaskTemplateDTO 的部分字段
  name: string;
  title: string;
  timeConfig: TaskTimeConfig;
  // ...
}

export interface UpdateTaskTemplateRequest {
  name?: string;
  title?: string;
  // ...
}

export interface CreateTaskInstanceRequest {
  templateUuid: string;
  scheduledDate: number;
  // ...
}

// 3. 响应 DTO (后端返回给前端)
export interface TaskTemplateResponse extends TaskTemplateDTO {
  // 可以添加计算字段
}

export interface TaskInstanceResponse extends TaskInstanceDTO {
  // 可以添加计算字段
}

// 4. 列表响应
export interface TaskTemplateListResponse {
  data: TaskTemplateResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TaskInstanceListResponse {
  data: TaskInstanceResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 5. 客户端 DTO (前端使用，包含计算属性)
export interface TaskTemplateClientDTO extends TaskTemplateDTO {
  // 计算属性
  activeInstancesCount: number;
  completionRate: number;
  nextScheduledDate?: number;
}

export interface TaskInstanceClientDTO extends TaskInstanceDTO {
  // 计算属性
  isOverdue: boolean;
  remainingTime?: number;
  formattedScheduledTime: string;
}
```

**检查清单**:
- [ ] 所有 DTO 都有明确的用途注释
- [ ] Request DTO 只包含必要字段
- [ ] Response DTO 继承自 DTO
- [ ] ClientDTO 包含前端需要的计算属性
- [ ] 使用 `Pick`、`Omit` 等工具类型避免重复

#### Step 1.2: 创建 persistence-dtos.ts

**目标**: 定义数据库持久化格式

**参考文件**: `packages/contracts/src/modules/goal/persistence-dtos.ts`

**关键点**:
```typescript
export interface TaskTemplatePersistenceDTO {
  uuid: string;
  accountUuid: string;
  
  // 基本信息
  name: string;
  title: string;
  description?: string;
  
  // 时间配置 - 扁平化或 JSON
  timeConfig: string; // JSON string
  // 或者扁平化：
  // timeType: TaskTimeType;
  // scheduleMode: TaskScheduleMode;
  // startDate: Date;
  // endDate?: Date;
  
  // 提醒配置 - JSON
  reminderConfig: string; // JSON string
  
  // 属性 - 扁平化
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  tags: string; // JSON string
  location?: string;
  
  // 生命周期
  status: TaskTemplateStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // 统计信息
  totalInstances: number;
  completedInstances: number;
  lastInstanceDate?: Date;
}
```

**注意事项**:
- 所有日期使用 `Date` 类型（Prisma 会转换）
- 复杂对象用 JSON string 存储
- 添加索引字段（status, accountUuid, scheduledDate）

#### Step 1.3: 更新 index.ts

```typescript
export * from './types';
export * from './enums';
export * from './dtos';
export * from './persistence-dtos';
export * from './events';

// Namespace 导出
export namespace TaskContracts {
  // 导出所有类型
}
```

---

### ⭐ 阶段 2: Domain-Server 层（约 4-6 小时）

#### Step 2.1: 创建实体类

**文件**: `packages/domain-server/src/task/entities/`

**TaskTemplate.ts 示例**:
```typescript
import type { TaskTemplateDTO } from '@dailyuse/contracts';

export class TaskTemplate {
  private constructor(private props: TaskTemplateDTO) {}

  // Getters
  get uuid(): string { return this.props.uuid; }
  get name(): string { return this.props.name; }
  get status(): TaskTemplateStatus { return this.props.status; }
  // ... 其他 getters

  // 业务方法
  activate(): void {
    if (this.props.status !== 'draft') {
      throw new Error('Only draft templates can be activated');
    }
    this.props.status = 'active';
    this.props.updatedAt = Date.now();
  }

  pause(): void {
    if (this.props.status !== 'active') {
      throw new Error('Only active templates can be paused');
    }
    this.props.status = 'paused';
    this.props.updatedAt = Date.now();
  }

  // 创建实例
  createInstance(scheduledDate: number): TaskInstanceDTO {
    if (this.props.status !== 'active') {
      throw new Error('Template must be active to create instances');
    }
    
    return {
      uuid: generateUUID(),
      templateUuid: this.uuid,
      accountUuid: this.props.accountUuid,
      title: this.props.title,
      scheduledDate,
      status: 'pending',
      // ...
    };
  }

  // 工厂方法
  static create(data: CreateTaskTemplateRequest, accountUuid: string): TaskTemplate {
    return new TaskTemplate({
      uuid: generateUUID(),
      accountUuid,
      ...data,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalInstances: 0,
      completedInstances: 0,
    });
  }

  static fromDTO(dto: TaskTemplateDTO): TaskTemplate {
    return new TaskTemplate(dto);
  }

  toDTO(): TaskTemplateDTO {
    return { ...this.props };
  }

  toClient(): TaskTemplateClientDTO {
    return {
      ...this.toDTO(),
      completionRate: this.calculateCompletionRate(),
      nextScheduledDate: this.calculateNextScheduledDate(),
    };
  }

  private calculateCompletionRate(): number {
    if (this.props.totalInstances === 0) return 0;
    return (this.props.completedInstances / this.props.totalInstances) * 100;
  }

  private calculateNextScheduledDate(): number | undefined {
    // 根据调度配置计算下次执行时间
    // ...
  }
}
```

#### Step 2.2: 创建领域服务

**文件**: `packages/domain-server/src/task/services/TaskDomainService.ts`

```typescript
import { TaskTemplate, TaskInstance } from '../entities';
import type { CreateTaskTemplateRequest } from '@dailyuse/contracts';

export class TaskDomainService {
  createTemplate(accountUuid: string, request: CreateTaskTemplateRequest): TaskTemplate {
    // 验证业务规则
    this.validateTimeConfig(request.timeConfig);
    this.validateReminderConfig(request.reminderConfig);
    
    // 创建实体
    return TaskTemplate.create(request, accountUuid);
  }

  activateTemplate(template: TaskTemplate): TaskTemplate {
    template.activate();
    return template;
  }

  generateInstances(template: TaskTemplate, fromDate: Date, toDate: Date): TaskInstance[] {
    // 根据调度规则生成实例
    const instances: TaskInstance[] = [];
    // ... 生成逻辑
    return instances;
  }

  completeInstance(instance: TaskInstance): TaskInstance {
    instance.complete();
    return instance;
  }

  private validateTimeConfig(config: TaskTimeConfig): void {
    // 验证时间配置
    if (config.date.endDate && config.date.endDate < config.date.startDate) {
      throw new Error('End date must be after start date');
    }
  }

  private validateReminderConfig(config: TaskReminderConfig): void {
    // 验证提醒配置
  }
}
```

#### Step 2.3: 创建仓储接口

**文件**: `packages/domain-server/src/task/repositories/ITaskRepository.ts`

```typescript
import type { TaskTemplate, TaskInstance, TaskMetaTemplate } from '../entities';

export interface ITaskRepository {
  // TaskTemplate
  saveTemplate(template: TaskTemplate): Promise<TaskTemplate>;
  getTemplateByUuid(uuid: string): Promise<TaskTemplate | null>;
  getAllTemplates(accountUuid: string, options?: QueryOptions): Promise<{
    templates: TaskTemplate[];
    total: number;
  }>;
  deleteTemplate(uuid: string): Promise<boolean>;

  // TaskInstance
  saveInstance(instance: TaskInstance): Promise<TaskInstance>;
  getInstanceByUuid(uuid: string): Promise<TaskInstance | null>;
  getInstancesByTemplate(templateUuid: string, options?: QueryOptions): Promise<{
    instances: TaskInstance[];
    total: number;
  }>;
  getInstancesByDateRange(accountUuid: string, startDate: Date, endDate: Date): Promise<TaskInstance[]>;
  deleteInstance(uuid: string): Promise<boolean>;

  // TaskMetaTemplate
  saveMetaTemplate(meta: TaskMetaTemplate): Promise<TaskMetaTemplate>;
  getMetaTemplateByUuid(uuid: string): Promise<TaskMetaTemplate | null>;
  getAllMetaTemplates(accountUuid: string): Promise<TaskMetaTemplate[]>;
  deleteMetaTemplate(uuid: string): Promise<boolean>;

  // Statistics
  getTemplateStats(accountUuid: string): Promise<TaskStats>;
}
```

---

### ⭐ 阶段 3: API 层（约 6-8 小时）

#### Step 3.1: 创建 Application Service

**文件**: `apps/api/src/modules/task/application/services/TaskApplicationService.ts`

**参考**: `Goal模块/GoalApplicationService.ts`

```typescript
import { TaskDomainService } from '../../domain/services/TaskDomainService';
import type { ITaskRepository } from '@dailyuse/domain-server';
import { createLogger } from '@dailyuse/utils';

export class TaskApplicationService {
  private readonly logger = createLogger('TaskApplicationService');

  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly domainService = new TaskDomainService()
  ) {}

  async createTemplate(accountUuid: string, request: CreateTaskTemplateRequest): Promise<TaskTemplateClientDTO> {
    this.logger.info('Creating task template', { accountUuid, name: request.name });

    // 调用领域服务
    const template = this.domainService.createTemplate(accountUuid, request);

    // 保存到数据库
    const saved = await this.taskRepository.saveTemplate(template);

    this.logger.info('Template created', { uuid: saved.uuid });

    return saved.toClient();
  }

  // ... 其他方法
}
```

#### Step 3.2: 创建 Controller

**文件**: `apps/api/src/modules/task/interface/controllers/TaskController.ts`

**参考**: `Goal模块/GoalController.ts`

```typescript
import type { Request, Response } from 'express';
import { TaskApplicationService } from '../../../application/services/TaskApplicationService';
import { createLogger } from '@dailyuse/utils';
import { ResponseCode, getHttpStatusCode } from '@dailyuse/contracts';

const logger = createLogger('TaskController');

export class TaskController {
  private static taskService: TaskApplicationService;

  static async createTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskController.extractAccountUuid(req);
      const request = req.body;

      logger.info('Creating task template', { accountUuid });

      const template = await TaskController.taskService.createTemplate(accountUuid, request);

      return TaskController.sendSuccess(res, template, 'Template created successfully', 201);
    } catch (error) {
      return TaskController.handleError(res, error);
    }
  }

  private static sendSuccess<T>(res: Response, data: T, message: string, statusCode = 200): Response {
    return res.status(statusCode).json({
      code: ResponseCode.SUCCESS,
      success: true,
      message,
      data,
      timestamp: Date.now(),
    });
  }

  private static handleError(res: Response, error: any): Response {
    logger.error('Error in TaskController', error);
    
    const message = error instanceof Error ? error.message : 'Internal server error';
    const code = TaskController.determineErrorCode(error);
    const status = getHttpStatusCode(code);

    return res.status(status).json({
      code,
      success: false,
      message,
      timestamp: Date.now(),
    });
  }

  private static extractAccountUuid(req: Request): string {
    const accountUuid = req.user?.accountUuid;
    if (!accountUuid) {
      throw new Error('Account UUID not found in request');
    }
    return accountUuid;
  }

  private static determineErrorCode(error: any): ResponseCode {
    if (error.message.includes('not found')) return ResponseCode.RESOURCE_NOT_FOUND;
    if (error.message.includes('Invalid')) return ResponseCode.VALIDATION_ERROR;
    return ResponseCode.INTERNAL_SERVER_ERROR;
  }
}
```

#### Step 3.3: 创建 Prisma Repository

**文件**: `apps/api/src/modules/task/infrastructure/repositories/PrismaTaskRepository.ts`

**关键代码**:
```typescript
import type { PrismaClient } from '@prisma/client';
import type { ITaskRepository } from '@dailyuse/domain-server';
import { TaskTemplate } from '@dailyuse/domain-server';

export class PrismaTaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveTemplate(template: TaskTemplate): Promise<TaskTemplate> {
    const dto = template.toDTO();
    const persistenceDTO = this.toPersistence(dto);

    const data = await this.prisma.taskTemplate.upsert({
      where: { uuid: template.uuid },
      create: persistenceDTO,
      update: persistenceDTO,
    });

    return TaskTemplate.fromDTO(this.toDomain(data));
  }

  async getTemplateByUuid(uuid: string): Promise<TaskTemplate | null> {
    const data = await this.prisma.taskTemplate.findUnique({
      where: { uuid },
    });

    return data ? TaskTemplate.fromDTO(this.toDomain(data)) : null;
  }

  private toPersistence(dto: TaskTemplateDTO): TaskTemplatePersistenceDTO {
    return {
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      title: dto.title,
      description: dto.description,
      timeConfig: JSON.stringify(dto.timeConfig),
      reminderConfig: JSON.stringify(dto.reminderConfig),
      importance: dto.properties.importance,
      urgency: dto.properties.urgency,
      tags: JSON.stringify(dto.properties.tags),
      location: dto.properties.location,
      status: dto.status,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      totalInstances: dto.stats.totalInstances,
      completedInstances: dto.stats.completedInstances,
      lastInstanceDate: dto.stats.lastInstanceDate ? new Date(dto.stats.lastInstanceDate) : null,
    };
  }

  private toDomain(data: any): TaskTemplateDTO {
    return {
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      name: data.name,
      title: data.title,
      description: data.description,
      timeConfig: JSON.parse(data.timeConfig),
      reminderConfig: JSON.parse(data.reminderConfig),
      properties: {
        importance: data.importance,
        urgency: data.urgency,
        tags: JSON.parse(data.tags),
        location: data.location,
      },
      status: data.status,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
      stats: {
        totalInstances: data.totalInstances,
        completedInstances: data.completedInstances,
        completionRate: data.totalInstances > 0 ? (data.completedInstances / data.totalInstances) * 100 : 0,
        lastInstanceDate: data.lastInstanceDate?.getTime(),
      },
    };
  }
}
```

---

### ⭐ 阶段 4: Web 层（约 6-8 小时）

#### Step 4.1: 创建 API Client

**文件**: `apps/web/src/modules/task/infrastructure/api/taskApiClient.ts`

**参考**: `Goal模块/goalApiClient.ts`

```typescript
import { apiClient } from '@/shared/api';
import type {
  TaskTemplateClientDTO,
  CreateTaskTemplateRequest,
  TaskTemplateListResponse,
} from '@dailyuse/contracts';

export class TaskApiClient {
  private readonly baseUrl = '/tasks';

  async createTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplateClientDTO> {
    return await apiClient.post<TaskTemplateClientDTO>(`${this.baseUrl}/templates`, request);
  }

  async getTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<TaskTemplateListResponse> {
    return await apiClient.get<TaskTemplateListResponse>(`${this.baseUrl}/templates`, { params });
  }

  async getTemplateById(uuid: string): Promise<TaskTemplateClientDTO> {
    return await apiClient.get<TaskTemplateClientDTO>(`${this.baseUrl}/templates/${uuid}`);
  }

  async updateTemplate(uuid: string, request: UpdateTaskTemplateRequest): Promise<TaskTemplateClientDTO> {
    return await apiClient.patch<TaskTemplateClientDTO>(`${this.baseUrl}/templates/${uuid}`, request);
  }

  async deleteTemplate(uuid: string): Promise<void> {
    return await apiClient.delete(`${this.baseUrl}/templates/${uuid}`);
  }

  // TaskInstance 方法...
}

export const taskApiClient = new TaskApiClient();
```

#### Step 4.2: 创建 Pinia Store

**文件**: `apps/web/src/modules/task/presentation/stores/taskStore.ts`

**参考**: `Goal模块/goalStore.ts`

```typescript
import { defineStore } from 'pinia';
import { getTaskWebService } from '@/modules/task';
import type { TaskTemplateClientDTO, CreateTaskTemplateRequest } from '@dailyuse/contracts';

export const useTaskStore = defineStore('task', {
  state: () => ({
    templates: [] as TaskTemplateClientDTO[],
    instances: [] as TaskInstanceClientDTO[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    activeTemplates: (state) => state.templates.filter(t => t.status === 'active'),
    templateById: (state) => (uuid: string) => state.templates.find(t => t.uuid === uuid),
  },

  actions: {
    async createTemplate(request: CreateTaskTemplateRequest) {
      const service = getTaskWebService();
      this.loading = true;
      this.error = null;

      // 乐观更新
      const tempTemplate: TaskTemplateClientDTO = {
        uuid: `temp-${Date.now()}`,
        ...request,
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // ... 其他字段
      };
      this.templates.push(tempTemplate);

      try {
        const created = await service.createTemplate(request);
        
        // 替换临时数据
        const index = this.templates.findIndex(t => t.uuid === tempTemplate.uuid);
        if (index !== -1) {
          this.templates[index] = created;
        }

        return created;
      } catch (error) {
        // 回滚
        this.templates = this.templates.filter(t => t.uuid !== tempTemplate.uuid);
        this.error = error instanceof Error ? error.message : 'Failed to create template';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchTemplates() {
      const service = getTaskWebService();
      this.loading = true;

      try {
        const response = await service.getTemplates();
        this.templates = response.data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch templates';
      } finally {
        this.loading = false;
      }
    },

    // ... 其他 actions
  },
});
```

#### Step 4.3: 创建 Composable

**文件**: `apps/web/src/modules/task/presentation/composables/useTask.ts`

```typescript
import { ref, computed } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import type { CreateTaskTemplateRequest } from '@dailyuse/contracts';

export function useTask() {
  const taskStore = useTaskStore();
  const loading = ref(false);

  const templates = computed(() => taskStore.templates);
  const activeTemplates = computed(() => taskStore.activeTemplates);

  const createTemplate = async (request: CreateTaskTemplateRequest) => {
    loading.value = true;
    try {
      await taskStore.createTemplate(request);
    } finally {
      loading.value = false;
    }
  };

  const fetchTemplates = async () => {
    loading.value = true;
    try {
      await taskStore.fetchTemplates();
    } finally {
      loading.value = false;
    }
  };

  return {
    templates,
    activeTemplates,
    loading,
    createTemplate,
    fetchTemplates,
  };
}
```

---

## ✅ 验证清单

### Contracts 层
- [ ] 所有枚举提取到 `enums.ts`
- [ ] DTO 清晰分类（DTO, Request, Response, ClientDTO, PersistenceDTO）
- [ ] 类型定义完整，无 `any`
- [ ] 导出统一且清晰

### Domain-Server 层
- [ ] 实体包含业务逻辑方法
- [ ] 领域服务处理跨实体业务
- [ ] 仓储接口定义完整
- [ ] 无基础设施依赖

### API 层
- [ ] 使用日志系统记录操作
- [ ] 使用响应系统统一返回格式
- [ ] 错误分类处理
- [ ] JWT 提取 accountUuid
- [ ] Prisma Repository 正确转换 DTO

### Web 层
- [ ] 支持乐观更新和回滚
- [ ] 错误提示友好
- [ ] 使用事件总线监听登录
- [ ] API Client baseUrl 正确（不包含 `/api/v1`）

---

## 📖 相关文档

- [[Goal模块完整流程|Goal模块完整流程]] - 最佳实践参考
- [[TASK_MODULE_REFACTORING_PLAN|Task 模块重构计划]] - 总体规划
- [[日志系统|日志系统]] - 日志使用指南
- [[API响应系统|API响应系统]] - 响应格式规范
- [[contracts-in-goal|Contracts 设计]] - 类型设计原则

---

## 💡 Tips

1. **一次完成一层** - 不要跨层跳跃
2. **频繁参考 Goal 模块** - 代码结构应该高度相似
3. **使用 TypeScript 类型检查** - 确保没有编译错误
4. **编写测试** - 至少编写关键业务逻辑的单元测试
5. **及时提交** - 每完成一个阶段就提交代码

---

**预计完成时间**: 24-34 小时（分多次完成）

**下一步**: 开始完善 `dtos.ts`

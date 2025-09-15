---
mode: agent
---

# DailyUse - 开发规范

## 开发规范

### 命名约定

- **文件命名**: 小驼峰命名法 `accountUtils.ts`
- **类/常量/枚举**: 大驼峰命名法 `AccountConstants.ts`
- **组件**: 大驼峰命名法 `ProfileDialog.vue`
- **函数/变量**: 小驼峰命名法

### 代码质量

- **类型安全**: 严格的TypeScript配置
- **代码注释**: 详细的JSDoc注释
- **单元测试**: 核心业务逻辑测试覆盖
- **代码格式**: ESLint + Prettier统一格式化

### 包管理

- **优先使用**: `pnpm` 命令而非 `npm`
- **依赖管理**: 通过workspace统一管理
- **版本控制**: 语义化版本控制

### Git工作流

- **分支策略**: GitFlow或GitHub Flow
- **提交规范**: Conventional Commits
- **代码审查**: Pull Request必须经过审查

### DDD聚合根控制开发规范

#### 聚合根设计原则

1. **聚合边界明确** - 每个聚合根控制特定的业务边界
2. **业务规则集中** - 所有业务规则在聚合根内部实现
3. **数据一致性** - 聚合根保证内部数据的强一致性
4. **领域事件** - 重要业务变更必须发布领域事件

#### API路由设计规范

```typescript
// ✅ 推荐：通过聚合根操作子实体
POST   /api/v1/goals/:goalId/key-results
PUT    /api/v1/goals/:goalId/key-results/:keyResultId
DELETE /api/v1/goals/:goalId/key-results/:keyResultId
GET    /api/v1/goals/:goalId/aggregate

// ❌ 避免：直接操作子实体
POST   /api/v1/key-results
PUT    /api/v1/key-results/:id
DELETE /api/v1/key-results/:id
```

#### 聚合根实现规范

```typescript
// ✅ 正确的聚合根方法命名和实现
export class Goal extends GoalCore {
  // 创建子实体：create + 子实体名称
  createKeyResult(data: KeyResultData): string {
    /* ... */
  }

  // 更新子实体：update + 子实体名称
  updateKeyResult(uuid: string, updates: Partial<KeyResultData>): void {
    /* ... */
  }

  // 删除子实体：remove + 子实体名称
  removeKeyResult(uuid: string): void {
    /* ... */
  }

  // 业务规则验证
  private validateKeyResultWeight(weight: number): void {
    /* ... */
  }

  // 领域事件发布
  private publishDomainEvent(eventType: string, data: any): void {
    /* ... */
  }
}
```

#### 应用服务协调规范

```typescript
// ✅ 正确的应用服务实现
export class GoalAggregateService {
  async createKeyResultForGoal(
    accountUuid: string,
    goalUuid: string,
    request: CreateKeyResultRequest,
  ): Promise<KeyResultResponse> {
    // 1. 获取聚合根
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);

    // 2. 转换为领域实体
    const goal = Goal.fromDTO(goalDTO);

    // 3. 通过聚合根执行业务操作
    const keyResultUuid = goal.createKeyResult(request);

    // 4. 持久化更改
    await this.persistAggregateChanges(goal);

    return /* 响应 */;
  }
}
```

#### 仓储层扩展规范

```typescript
// ✅ 聚合根仓储扩展方法
export interface IGoalRepository {
  // 加载完整聚合
  loadGoalAggregate(accountUuid: string, goalUuid: string): Promise<GoalAggregateData>;

  // 原子性更新聚合
  updateGoalAggregate(accountUuid: string, changes: AggregateChanges): Promise<void>;

  // 业务规则验证
  validateGoalAggregateRules(
    accountUuid: string,
    goalUuid: string,
    changes: any,
  ): Promise<ValidationResult>;
}
```

#### 错误处理规范

```typescript
// ✅ 业务规则错误处理
export class Goal extends GoalCore {
  createKeyResult(data: KeyResultData): string {
    // 业务规则验证
    if (!data.name.trim()) {
      throw new DomainError('关键结果名称不能为空', 'INVALID_KEY_RESULT_NAME');
    }

    const totalWeight = this.calculateTotalWeight();
    if (totalWeight + data.weight > 100) {
      throw new DomainError(
        `关键结果权重总和不能超过100%，当前总和: ${totalWeight}%`,
        'WEIGHT_LIMIT_EXCEEDED',
      );
    }

    // 业务逻辑...
  }
}
```

#### 测试规范

```typescript
// ✅ 聚合根单元测试
describe('Goal Aggregate Root', () => {
  it('should enforce weight limit when creating key result', () => {
    const goal = new Goal(/* ... */);
    goal.addKeyResult({ weight: 60 });
    goal.addKeyResult({ weight: 30 });

    expect(() => {
      goal.createKeyResult({ weight: 20 }); // 总和110%
    }).toThrow('关键结果权重总和不能超过100%');
  });

  it('should cascade delete records when removing key result', () => {
    const goal = new Goal(/* ... */);
    const keyResultUuid = goal.createKeyResult(/* ... */);
    goal.createRecord({ keyResultUuid, value: 50 });

    goal.removeKeyResult(keyResultUuid);

    expect(goal.getRecordsForKeyResult(keyResultUuid)).toHaveLength(0);
  });
});
```

## 数据获取流程架构设计

### 推荐架构：Composable + ApplicationService + Store 分层

**设计原则**：

- **Domain层**: 纯业务逻辑，不涉及技术实现
- **Application层**: 业务用例协调，API调用，缓存策略
- **Presentation层**: UI状态管理，用户交互

**数据流向**：

```
Vue组件 → Composable → ApplicationService → API Client
                  ↓                      ↓
                Store (缓存)              Backend API
```

### 架构层次职责

#### 1. Presentation Layer (表示层)

**Pinia Store**: 纯缓存存储

```typescript
// store/goalStore.ts
export const useGoalStore = defineStore('goal', {
  state: () => ({
    // 缓存数据
    goals: [] as Goal[],
    goalDirs: [] as GoalDir[],

    // UI状态
    isLoading: false,
    error: null,
    pagination: {...},
    filters: {...},
    selectedGoalUuid: null,
  }),

  getters: {
    // 纯数据查询，无业务逻辑
    getGoalByUuid: (state) => (uuid: string) =>
      state.goals.find(g => g.uuid === uuid),

    getActiveGoals: (state) =>
      state.goals.filter(g => g.status === 'active'),
  },

  actions: {
    // 纯数据操作，不调用外部服务
    setGoals(goals: Goal[]) { this.goals = goals; },
    addGoal(goal: Goal) { this.goals.push(goal); },
    updateGoal(goal: Goal) { /* 更新逻辑 */ },
    removeGoal(uuid: string) { /* 删除逻辑 */ },

    // UI状态管理
    setLoading(loading: boolean) { this.goals = goals; },
    setError(error: string | null) { this.error = error; },
  },
});
```

**Composable**: 业务逻辑封装

```typescript
// composables/useGoal.ts
export function useGoal() {
  const goalStore = useGoalStore();
  const goalService = new GoalWebApplicationService();

  // 获取所有目标 - 优先从缓存读取
  const fetchGoals = async (forceRefresh = false) => {
    // 如果有缓存且不强制刷新，直接返回
    if (!forceRefresh && goalStore.goals.length > 0) {
      return goalStore.goals;
    }

    // 调用应用服务获取数据
    await goalService.fetchAndCacheGoals();
    return goalStore.goals;
  };

  // 创建目标
  const createGoal = async (request: CreateGoalRequest) => {
    return await goalService.createGoal(request);
  };

  return {
    // 响应式数据（从store获取）
    goals: computed(() => goalStore.goals),
    isLoading: computed(() => goalStore.isLoading),

    // 业务方法
    fetchGoals,
    createGoal,
    // ...其他方法
  };
}
```

#### 2. Application Layer (应用层)

**ApplicationService**: 业务用例协调

```typescript
// application/services/GoalWebApplicationService.ts
export class GoalWebApplicationService {
  constructor(
    private goalApiClient = goalApiClient,
    private goalStore = useGoalStore(),
  ) {}

  /**
   * 获取并缓存目标数据
   * 职责：API调用 + 缓存管理 + 错误处理
   */
  async fetchAndCacheGoals(params?: GetGoalsParams): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      // 调用API
      const response = await this.goalApiClient.getGoals(params);

      // 转换为领域实体
      const goals = response.goals.map((dto) => Goal.fromDTO(dto));

      // 缓存到store
      this.goalStore.setGoals(goals);
    } catch (error) {
      this.goalStore.setError(error.message);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 创建目标
   */
  async createGoal(request: CreateGoalRequest): Promise<Goal> {
    try {
      this.goalStore.setLoading(true);

      // API调用
      const response = await this.goalApiClient.createGoal(request);

      // 转换为领域实体
      const goal = Goal.fromResponse(response);

      // 更新缓存
      this.goalStore.addGoal(goal);

      return goal;
    } catch (error) {
      this.goalStore.setError(error.message);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 初始化模块数据
   * 登录时调用，同步所有数据
   */
  async initializeModuleData(): Promise<void> {
    await Promise.all([
      this.fetchAndCacheGoals({ limit: 1000 }),
      this.fetchAndCacheGoalDirs({ limit: 1000 }),
    ]);
  }
}
```

#### 3. Infrastructure Layer (基础设施层)

**API Client**: 纯API调用

```typescript
// infrastructure/api/goalApiClient.ts
export const goalApiClient = {
  async getGoals(params?: GetGoalsParams): Promise<GoalListResponse> {
    const response = await httpClient.get('/api/goals', { params });
    return response.data;
  },

  async createGoal(request: CreateGoalRequest): Promise<GoalResponse> {
    const response = await httpClient.post('/api/goals', request);
    return response.data;
  },

  // ...其他API方法
};
```

### 登录时数据初始化策略

**全局初始化服务**：

```typescript
// shared/services/InitializationService.ts
export class InitializationService {
  async initializeUserData(accountUuid: string): Promise<void> {
    // 并行初始化所有模块数据
    await Promise.all([
      this.initializeGoalModule(),
      this.initializeTaskModule(),
      this.initializeReminderModule(),
      // ...其他模块
    ]);
  }

  private async initializeGoalModule(): Promise<void> {
    const goalService = new GoalWebApplicationService();
    await goalService.initializeModuleData();
  }
}
```

**登录后调用**：

```typescript
// authentication/stores/authStore.ts
const login = async (credentials) => {
  const response = await authApi.login(credentials);

  // 设置用户信息
  setUser(response.user);
  setToken(response.token);

  // 初始化所有模块数据
  await initializationService.initializeUserData(response.user.uuid);
};
```

### 架构优势

1. **职责明确**：Store纯缓存，Service纯业务协调，API纯数据获取
2. **性能优化**：登录时一次性同步，后续直接从缓存读取
3. **错误隔离**：每层独立的错误处理机制
4. **可测试性**：每层可独立单元测试
5. **可维护性**：清晰的依赖关系和数据流

### 实际使用示例

```vue
<!-- views/GoalList.vue -->
<script setup>
import { useGoal } from '../composables/useGoal';

const { goals, isLoading, fetchGoals, createGoal } = useGoal();

// 组件挂载时，优先从缓存获取数据
onMounted(async () => {
  await fetchGoals(); // 如果有缓存直接返回，无缓存则API获取
});

// 手动刷新
const refresh = () => fetchGoals(true); // 强制从API刷新
</script>
```

这种架构既保证了性能（缓存优先），又保证了数据的准确性（支持强制刷新），同时符合DDD的分层原则。

#### 仓储接口设计规范

**核心原则**: 仓储接口必须返回DTO对象，而不是领域实体

1. **接口定义** (`packages/domain-server/src/{module}/repositories/`)

   ```typescript
   // ❌ 错误 - 返回领域实体
   findByUuid(uuid: string): Promise<Repository | null>;

   // ✅ 正确 - 返回DTO对象
   findByUuid(uuid: string): Promise<RepositoryDTO | null>;
   ```

2. **DTO转换原则**
   - 仓储层负责数据库实体 ↔ DTO 的转换
   - 应用层负责 DTO ↔ 领域实体 的转换
   - 领域实体提供 `toDTO()` 和 `fromDTO()` 方法

3. **数据流向**

   ```
   数据库实体 → [仓储层] → DTO → [应用层] → 领域实体 → [业务逻辑]
   ```

4. **实现示例**
   ```typescript
   // 仓储实现中的转换
   async findByUuid(uuid: string): Promise<RepositoryDTO | null> {
     const dbEntity = await this.prisma.repository.findUnique({ where: { uuid } });
     return dbEntity ? this.mapToDTO(dbEntity) : null;
   }
   ```

#### 架构分层原则

1. **依赖方向** - 内层不依赖外层
2. **关注点分离** - 每层职责明确
3. **接口隔离** - 通过接口而非具体实现通信
4. **可测试性** - 支持单元测试和模拟

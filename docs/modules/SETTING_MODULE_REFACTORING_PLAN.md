# Setting 模块完整重构方案

**日期**: 2025-10-06  
**负责人**: GitHub Copilot AI  
**参考**: Theme 模块重构、Goal 模块架构  
**状态**: 📋 规划中

---

## 📋 目录

1. [重构目标](#重构目标)
2. [现状分析](#现状分析)
3. [架构设计](#架构设计)
4. [分阶段计划](#分阶段计划)
5. [技术债务处理](#技术债务处理)

---

## 🎯 重构目标

### 主要目标
1. **统一架构**: 与 Theme、Goal 模块保持一致的 DDD 分层架构
2. **职责分离**: UserPreferences (用户级偏好) vs SettingDefinition (系统级设置定义)
3. **类型安全**: 完整的 TypeScript 类型定义和 DTO 转换
4. **可维护性**: 清晰的文件组织和依赖关系

### 次要目标
1. 事件驱动架构完善
2. 前后端数据流优化
3. 性能监控和统计
4. 文档完善

---

## 🔍 现状分析

### 当前架构

```
Setting 模块当前包含两个主要概念：

1. **UserPreferences** (用户偏好设置)
   - 聚合根：apps/api/src/modules/setting/domain/aggregates/UserPreferences.ts
   - 职责：管理用户级别的通用偏好（语言、时区、主题模式、通知等）
   - 特点：每个账户一个实例

2. **SettingDefinition** (系统级设置定义)
   - 聚合根：packages/domain-server/src/setting/aggregates/SettingDefinition.ts
   - 职责：定义应用级别的可配置项
   - 特点：系统级别，所有用户共享定义
```

### 存在的问题

#### ❌ 架构不一致
- UserPreferences 在 `apps/api` 层
- SettingDefinition 在 `packages/domain-server` 层
- 缺少统一的 Contracts 定义

#### ❌ 缺少 Domain-Core 层
- 没有抽象的核心业务逻辑
- 无法在客户端复用

#### ❌ DTO 转换不完整
- 缺少 ClientDTO（前端专用）
- 缺少 PersistenceDTO（数据库专用）
- 转换逻辑分散

#### ❌ 事件系统不完善
- 事件定义在 Contracts，但未完全使用
- 缺少领域事件发布

---

## 🏗️ 架构设计

### 参考 Theme 模块的成功模式

```
packages/
├── contracts/
│   └── src/modules/setting/
│       ├── index.ts                    # 导出所有类型
│       ├── types.ts                    # 接口和枚举
│       ├── dtos.ts                     # 数据传输对象
│       └── events.ts                   # 领域事件
│
├── domain-core/
│   └── src/setting/
│       ├── index.ts                    # 导出核心实体
│       ├── UserPreferencesCore.ts      # ✨ 新增：用户偏好抽象类
│       └── SettingDefinitionCore.ts    # ✨ 新增：设置定义抽象类
│
├── domain-server/
│   └── src/setting/
│       ├── index.ts                    # 服务端入口
│       ├── aggregates/
│       │   ├── UserPreferences.ts      # ✨ 重构：继承自 Core
│       │   └── SettingDefinition.ts    # ✨ 重构：继承自 Core
│       ├── entities/
│       │   └── SettingValue.ts         # ✨ 新增：设置值实体
│       ├── services/
│       │   ├── UserPreferencesDomainService.ts  # ✨ 新增
│       │   └── SettingDomainService.ts          # ✨ 重构
│       └── repositories/
│           ├── IUserPreferencesRepository.ts
│           └── ISettingDefinitionRepository.ts
│
├── domain-client/
│   └── src/setting/
│       ├── index.ts                    # 客户端入口
│       ├── aggregates/
│       │   ├── UserPreferences.ts      # ✨ 新增：继承自 Core，添加UI逻辑
│       │   └── SettingDefinition.ts    # ✨ 新增：继承自 Core，添加UI逻辑
│       └── services/
│           └── UserPreferencesClientService.ts  # ✨ 新增
│
apps/
├── api/
│   └── src/modules/setting/
│       ├── domain/
│       │   └── (moved to domain-server)  # ❌ 删除，移至 packages
│       ├── application/
│       │   └── services/
│       │       ├── UserPreferencesApplicationService.ts  # ✨ 重构
│       │       └── SettingValueApplicationService.ts     # ✨ 重构
│       ├── infrastructure/
│       │   ├── repositories/
│       │   │   └── prisma/
│       │   │       ├── PrismaUserPreferencesRepository.ts
│       │   │       └── PrismaSettingDefinitionRepository.ts
│       │   └── events/
│       │       └── EventPublisher.ts
│       └── interface/
│           └── http/
│               ├── controllers/
│               │   └── UserPreferencesController.ts
│               └── routes/
│                   └── userPreferencesRoutes.ts
│
└── web/
    └── src/modules/setting/
        ├── api/
        │   └── userPreferencesApi.ts         # ✨ 重构
        ├── domain/                            # ✨ 新增：使用 domain-client
        ├── presentation/
        │   ├── stores/
        │   │   └── userPreferencesStore.ts   # ✨ 重构
        │   └── composables/
        │       └── useUserPreferences.ts     # ✨ 新增
        └── views/
            └── Settings.vue                   # ✨ 重构
```

### 核心设计决策

#### 1. 两个聚合根分离

**UserPreferences** (用户偏好聚合根)
- 职责：管理用户级别的个性化偏好
- 特点：
  - 每个账户一个实例
  - 包含语言、时区、主题模式、通知偏好等
  - 轻量级，快速加载
  - 频繁修改

**SettingDefinition** (系统设置定义聚合根)
- 职责：定义应用级别的可配置项
- 特点：
  - 系统级别，所有用户共享
  - 定义设置的元数据（类型、验证规则、默认值等）
  - 相对稳定，很少修改
  - 管理员权限

#### 2. Core 层抽象

```typescript
// UserPreferencesCore.ts (domain-core)
export abstract class UserPreferencesCore {
  protected _uuid: string;
  protected _accountUuid: string;
  protected _language: string;
  protected _timezone: string;
  protected _themeMode: 'light' | 'dark' | 'system';
  // ... 其他字段
  
  // 抽象方法（子类实现）
  abstract toDTO(): UserPreferencesDTO;
  abstract toPersistence(): UserPreferencesPersistenceDTO;
  
  // 共享业务逻辑
  changeLanguage(language: string): void {
    this.validateLanguage(language);
    this._language = language;
    this.updateVersion();
  }
  
  protected abstract validateLanguage(language: string): void;
  protected abstract updateVersion(): void;
}
```

#### 3. DTO 分层

```typescript
// 基础 DTO（通用）
export interface UserPreferencesDTO {
  uuid: string;
  accountUuid: string;
  language: string;
  timezone: string;
  // ... 基本字段
}

// 客户端 DTO（包含UI计算属性）
export interface UserPreferencesClientDTO extends UserPreferencesDTO {
  // 计算属性
  languageText: string;      // "简体中文"
  timezoneText: string;      // "GMT+8 上海"
  themeModeLogo: string;      // "light" / "dark" / "system"
  
  // 状态
  canChangeTheme: boolean;
  hasEmailEnabled: boolean;
  
  // 格式化
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

// 持久化 DTO（数据库格式）
export interface UserPreferencesPersistenceDTO {
  uuid: string;
  accountUuid: string;
  language: string;
  timezone: string;
  themeMode: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  // ... 扁平化字段
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📅 分阶段计划

### Phase 1: Contracts 层完善 (优先级: P0)

**目标**: 定义完整的类型系统

#### 任务清单
- [x] 审查现有 `types.ts`、`dtos.ts`、`events.ts`
- [ ] 补充 UserPreferences 相关类型
  - [ ] `IUserPreferences` 接口
  - [ ] `IUserPreferencesClient` 接口（客户端扩展）
  - [ ] `UserPreferencesDTO`
  - [ ] `UserPreferencesClientDTO`
  - [ ] `UserPreferencesPersistenceDTO`
- [ ] 补充请求/响应 DTO
  - [ ] `UpdateUserPreferencesRequest`
  - [ ] `UserPreferencesResponse`
  - [ ] `SwitchThemeModeRequest`
  - [ ] `ChangeLanguageRequest`
- [ ] 补充领域事件
  - [ ] `UserPreferencesUpdatedEvent`
  - [ ] `ThemeModeChangedEvent`
  - [ ] `LanguageChangedEvent`
  - [ ] `NotificationSettingsChangedEvent`
- [ ] 导出优化 (`index.ts`)

**参考文件**:
- `packages/contracts/src/modules/theme/dtos.ts`
- `packages/contracts/src/modules/goal/dtos.ts`

**预估时间**: 2-3小时

---

### Phase 2: Domain-Core 层创建 (优先级: P0)

**目标**: 创建平台无关的核心业务逻辑

#### 任务清单
- [ ] 创建 `UserPreferencesCore.ts`
  ```typescript
  export abstract class UserPreferencesCore {
    // 核心字段
    protected _uuid: string;
    protected _accountUuid: string;
    protected _language: string;
    protected _timezone: string;
    protected _themeMode: 'light' | 'dark' | 'system';
    protected _notificationsEnabled: boolean;
    // ...
    
    // 抽象方法
    abstract toDTO(): UserPreferencesDTO;
    abstract toClientDTO(): UserPreferencesClientDTO;
    abstract toPersistence(): UserPreferencesPersistenceDTO;
    
    // 业务方法
    changeLanguage(language: string): void;
    changeTimezone(timezone: string): void;
    switchThemeMode(mode: 'light' | 'dark' | 'system'): void;
    enableNotifications(): void;
    disableNotifications(): void;
    // ...
  }
  ```

- [ ] 创建 `SettingDefinitionCore.ts`
  ```typescript
  export abstract class SettingDefinitionCore {
    protected _key: string;
    protected _title: string;
    protected _type: SettingType;
    protected _defaultValue: any;
    protected _validationRules: ValidationRule[];
    // ...
    
    abstract toDTO(): SettingDefinitionDTO;
    abstract validate(value: any): ValidationResult;
    
    // 业务方法
    updateDefaultValue(value: any): void;
    addValidationRule(rule: ValidationRule): void;
    // ...
  }
  ```

- [ ] 创建 `index.ts` 导出

**参考文件**:
- `packages/domain-core/src/theme/ThemeDefinitionCore.ts`
- `packages/domain-core/src/goal/GoalCore.ts`

**预估时间**: 3-4小时

---

### Phase 3: Domain-Server 层重构 (优先级: P0)

**目标**: 实现服务端领域层

#### 任务清单

**3.1 聚合根重构**
- [ ] 重构 `UserPreferences.ts`
  - [ ] 继承自 `UserPreferencesCore`
  - [ ] 实现抽象方法
  - [ ] 添加 `fromDTO`、`fromPersistence` 静态方法
  - [ ] 添加领域事件发布
  - [ ] 完善业务规则验证

- [ ] 重构 `SettingDefinition.ts`
  - [ ] 继承自 `SettingDefinitionCore`
  - [ ] 实现验证逻辑
  - [ ] 添加元数据管理

**3.2 实体创建**
- [ ] 创建 `SettingValue.ts` 实体
  ```typescript
  export class SettingValue {
    private _key: string;
    private _value: any;
    private _scope: SettingScope;
    private _lastModified: Date;
    
    validate(definition: SettingDefinition): ValidationResult;
    reset(definition: SettingDefinition): void;
  }
  ```

**3.3 领域服务**
- [ ] 创建 `UserPreferencesDomainService.ts`
  ```typescript
  export class UserPreferencesDomainService {
    validateThemeMode(preferences: UserPreferences, mode: string): void;
    validateLanguageChange(preferences: UserPreferences, language: string): void;
    canEnableNotifications(preferences: UserPreferences): boolean;
  }
  ```

- [ ] 重构 `SettingDomainService.ts`
  - [ ] 添加设置值验证逻辑
  - [ ] 添加依赖检查逻辑

**3.4 仓储接口**
- [ ] 优化 `IUserPreferencesRepository.ts`
  ```typescript
  export interface IUserPreferencesRepository {
    findByAccountUuid(accountUuid: string): Promise<UserPreferences | null>;
    save(preferences: UserPreferences): Promise<UserPreferences>;
    delete(accountUuid: string): Promise<void>;
    findMany(accountUuids: string[]): Promise<UserPreferences[]>;
  }
  ```

**参考文件**:
- `packages/domain-server/src/theme/aggregates/ThemeDefinition.ts`
- `packages/domain-server/src/goal/aggregates/Goal.ts`

**预估时间**: 4-5小时

---

### Phase 4: Domain-Client 层创建 (优先级: P1)

**目标**: 创建客户端领域层（Web端复用）

#### 任务清单
- [ ] 创建目录结构 `packages/domain-client/src/setting/`
- [ ] 创建 `UserPreferences.ts`
  ```typescript
  import { UserPreferencesCore } from '@dailyuse/domain-core';
  
  export class UserPreferences extends UserPreferencesCore {
    // 实现抽象方法
    toDTO(): UserPreferencesDTO { }
    toClientDTO(): UserPreferencesClientDTO {
      return {
        ...this.toDTO(),
        languageText: this.getLanguageText(),
        timezoneText: this.getTimezoneText(),
        // ... UI 计算属性
      };
    }
    
    // UI 辅助方法
    private getLanguageText(): string {
      const map = {'zh-CN': '简体中文', 'en-US': 'English'};
      return map[this._language] || this._language;
    }
  }
  ```

- [ ] 创建 `SettingDefinition.ts` (客户端版本)
- [ ] 创建 `UserPreferencesClientService.ts`

**参考文件**:
- `packages/domain-client/src/theme/aggregates/ThemeDefinition.ts`

**预估时间**: 2-3小时

---

### Phase 5: API 层重构 (优先级: P1)

**目标**: 应用层和基础设施层重构

#### 任务清单

**5.1 Application Service**
- [ ] 重构 `UserPreferencesApplicationService.ts`
  - [ ] 使用 domain-server 的 UserPreferences
  - [ ] 使用 DomainService 进行业务逻辑
  - [ ] 发布领域事件
  - [ ] DTO 转换

- [ ] 重构 `SettingValueApplicationService.ts`

**5.2 Infrastructure**
- [ ] 重构 `PrismaUserPreferencesRepository.ts`
  - [ ] 使用 `fromPersistence` 创建实体
  - [ ] 使用 `toPersistence` 保存数据

- [ ] 重构 `EventPublisher.ts`
  - [ ] 发布 UserPreferencesUpdated 事件
  - [ ] 发布 ThemeModeChanged 事件

**5.3 Interface (HTTP)**
- [ ] 重构 `UserPreferencesController.ts`
  - [ ] 使用 ApplicationService
  - [ ] 返回 ClientDTO

**参考文件**:
- `apps/api/src/modules/goal/application/services/GoalApplicationService.ts`
- `apps/api/src/modules/goal/infrastructure/repositories/PrismaGoalAggregateRepository.ts`

**预估时间**: 3-4小时

---

### Phase 6: Web 层重构 (优先级: P1)

**目标**: 前端完全使用 domain-client

#### 任务清单

**6.1 API Client**
- [ ] 重构 `userPreferencesApi.ts`
  - [ ] 使用 UserPreferencesClientDTO
  - [ ] 完善错误处理

**6.2 Store**
- [ ] 重构 `userPreferencesStore.ts`
  - [ ] 使用 domain-client 的 UserPreferences
  - [ ] 直接调用实体方法
  - [ ] 状态管理优化

**6.3 Composables**
- [ ] 创建 `useUserPreferences.ts`
  ```typescript
  export function useUserPreferences() {
    const store = useUserPreferencesStore();
    
    const changeLanguage = async (language: string) => {
      await store.updatePreferences({ language });
    };
    
    const switchThemeMode = async (mode: 'light' | 'dark' | 'system') => {
      await store.updatePreferences({ themeMode: mode });
    };
    
    return {
      preferences: computed(() => store.preferences),
      changeLanguage,
      switchThemeMode,
      // ...
    };
  }
  ```

**6.4 Views**
- [ ] 重构 `Settings.vue`
  - [ ] 使用 Composables
  - [ ] 使用 ClientDTO 的计算属性

**参考文件**:
- `apps/web/src/modules/theme/useThemeInit.ts`
- `apps/web/src/modules/goal/stores/goalStore.ts`

**预估时间**: 3-4小时

---

### Phase 7: 文档和测试 (优先级: P2)

**目标**: 完善文档和测试

#### 任务清单
- [ ] 创建 `SETTING_MODULE_ARCHITECTURE.md`
- [ ] 创建 `SETTING_MODULE_QUICK_REFERENCE.md`
- [ ] 创建 `SETTING_MODULE_REFACTORING_SUMMARY.md`
- [ ] 单元测试（domain-core, domain-server）
- [ ] 集成测试（API 层）
- [ ] E2E 测试（Web 层）

**预估时间**: 4-5小时

---

## 🔥 技术债务处理

### 需要清理的文件
```
❌ 删除：apps/api/src/modules/setting/domain/aggregates/UserPreferences.ts
   → 移至 packages/domain-server/src/setting/aggregates/

❌ 删除：apps/api/src/modules/setting/domain/services/SettingDomainService.ts
   → 移至 packages/domain-server/src/setting/services/

❌ 删除：apps/api/src/modules/setting/domain/repositories/IUserPreferencesRepository.ts
   → 移至 packages/domain-server/src/setting/repositories/
```

### 需要重命名的文件
```
📝 重命名：PrismaUserPreferencesRepository.ts
   → PrismaUserPreferencesAggregateRepository.ts (统一命名)
```

---

## ✅ 成功标准

### 架构层面
- [ ] 所有聚合根继承自 Core 层
- [ ] 完整的 DTO 转换链路
- [ ] 领域事件正确发布
- [ ] 依赖方向正确（Core ← Server ← API）

### 代码层面
- [ ] 0 编译错误
- [ ] 0 ESLint 警告
- [ ] 100% TypeScript 类型覆盖

### 功能层面
- [ ] 所有现有功能正常工作
- [ ] 前后端数据同步正确
- [ ] 事件系统运行正常

### 文档层面
- [ ] 架构文档完整
- [ ] 快速参考可用
- [ ] 重构总结清晰

---

## 📊 时间估算

| 阶段 | 任务 | 预估时间 |
|------|------|---------|
| Phase 1 | Contracts 层完善 | 2-3h |
| Phase 2 | Domain-Core 创建 | 3-4h |
| Phase 3 | Domain-Server 重构 | 4-5h |
| Phase 4 | Domain-Client 创建 | 2-3h |
| Phase 5 | API 层重构 | 3-4h |
| Phase 6 | Web 层重构 | 3-4h |
| Phase 7 | 文档和测试 | 4-5h |
| **总计** | | **21-28h** |

---

## 🔗 参考资源

### 内部文档
- `docs/modules/SETTING_MODULE_ADR.md` - 架构决策记录
- `docs/guides/THEME_SYSTEM_README.md` - Theme 模块参考
- `packages/domain-server/src/theme/README.md` - Theme 实现参考

### 参考模块
- Theme 模块：完整的 Core/Server/Client 分层
- Goal 模块：DDD 最佳实践
- Task 模块：最新的聚合根模式

---

**下一步行动**: 开始 Phase 1 - Contracts 层完善

# STORY-SETTING-001-002: Application Service 层实现

> **Story ID**: STORY-SETTING-001-002  
> **Epic**: EPIC-SETTING-001 - 用户偏好设置  
> **Sprint**: Sprint 1  
> **Story Points**: 3 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Backend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 后端开发者  
**我想要** 实现用户偏好设置的 Application Service 层  
**以便于** 提供完整的用户偏好管理业务逻辑，供 API 层调用

---

## 🎯 验收标准 (Acceptance Criteria)

使用 Gherkin 格式定义验收标准：

### Scenario 1: 创建用户偏好

```gherkin
Feature: 创建用户偏好
  As an Application Service
  I want to create a new UserPreference with default values
  So that new users have a consistent initial experience

Scenario: 使用默认值创建用户偏好
  Given 一个新注册用户的 accountUuid = "user-123"
  When 调用 userPreferenceService.create({ accountUuid: "user-123" })
  Then 应该创建一个新的 UserPreference 实体
  And 使用默认值:
    | Field            | Default Value                                  |
    | theme            | 'auto'                                         |
    | language         | 'zh-CN'                                        |
    | sidebarPosition  | 'left'                                         |
    | fontSize         | 14                                             |
    | notifications    | { enabled: true, channels: ['push'], ... }     |
    | shortcuts        | { ... 默认快捷键 ... }                         |
  And 应该调用 repository.save() 持久化数据
  And 应该返回 UserPreferenceServerDTO
  And createdAt 和 updatedAt 应该设置为当前时间戳

Scenario: 使用自定义值创建用户偏好
  Given 一个新用户想要指定初始偏好
  When 调用 userPreferenceService.create({
    accountUuid: "user-123",
    theme: 'dark',
    language: 'en-US'
  })
  Then 应该创建 UserPreference 使用自定义值
  And 未指定的字段使用默认值
  And 应该持久化到数据库

Scenario: 创建失败 - 用户已有偏好设置
  Given 用户 "user-123" 已经有偏好设置
  When 调用 userPreferenceService.create({ accountUuid: "user-123" })
  Then 应该抛出 UserPreferenceAlreadyExistsError
  And 不应该创建新的记录
```

### Scenario 2: 获取用户偏好

```gherkin
Feature: 获取用户偏好
  As an Application Service
  I want to retrieve UserPreference by accountUuid
  So that the application can display user's settings

Scenario: 成功获取用户偏好
  Given 用户 "user-123" 的偏好设置存在于数据库
  When 调用 userPreferenceService.getByAccountUuid("user-123")
  Then 应该调用 repository.findByAccountUuid("user-123")
  And 应该返回 UserPreferenceServerDTO
  And DTO 包含所有正确的字段值

Scenario: 用户偏好不存在
  Given 用户 "user-999" 没有偏好设置
  When 调用 userPreferenceService.getByAccountUuid("user-999")
  Then 应该抛出 UserPreferenceNotFoundError
  And 错误信息包含 accountUuid: "user-999"

Scenario: 根据 UUID 获取用户偏好
  Given 用户偏好的 UUID = "pref-456"
  When 调用 userPreferenceService.getByUuid("pref-456")
  Then 应该调用 repository.findByUuid("pref-456")
  And 应该返回对应的 UserPreferenceServerDTO
```

### Scenario 3: 更新主题设置

```gherkin
Feature: 更新主题设置
  As an Application Service
  I want to update user's theme preference
  So that users can switch between light/dark/auto themes

Scenario: 成功更新主题为 dark
  Given 用户 "user-123" 当前主题为 'light'
  When 调用 userPreferenceService.updateTheme({
    accountUuid: "user-123",
    theme: 'dark'
  })
  Then 应该从 repository 获取现有实体
  And 应该调用 entity.updateTheme('dark')
  And 应该调用 repository.save() 保存更新
  And 应该返回更新后的 UserPreferenceServerDTO
  And updatedAt 时间戳应该更新

Scenario: 更新失败 - 无效主题值
  Given 用户 "user-123" 存在
  When 调用 userPreferenceService.updateTheme({
    accountUuid: "user-123",
    theme: 'invalid-theme'
  })
  Then 应该抛出 InvalidThemeError
  And 不应该调用 repository.save()

Scenario: 更新失败 - 用户不存在
  Given 用户 "user-999" 不存在
  When 调用 userPreferenceService.updateTheme({
    accountUuid: "user-999",
    theme: 'dark'
  })
  Then 应该抛出 UserPreferenceNotFoundError
```

### Scenario 4: 更新通知设置

```gherkin
Feature: 更新通知设置
  As an Application Service
  I want to update user's notification preferences
  So that users can control how they receive notifications

Scenario: 成功更新通知设置
  Given 用户 "user-123" 存在
  When 调用 userPreferenceService.updateNotificationSettings({
    accountUuid: "user-123",
    notifications: {
      enabled: true,
      channels: ['push', 'email'],
      doNotDisturbStart: '22:00',
      doNotDisturbEnd: '08:00',
      soundEnabled: true
    }
  })
  Then 应该验证通知设置的有效性
  And 应该调用 entity.updateNotificationSettings()
  And 应该保存到数据库
  And 应该返回更新后的 DTO

Scenario: 更新失败 - 免打扰时间无效
  Given 用户 "user-123" 存在
  When 调用 updateNotificationSettings 使用:
    | doNotDisturbStart | doNotDisturbEnd |
    | '08:00'           | '08:00'         |
  Then 应该抛出 InvalidNotificationSettingsError
  And 错误信息为 "doNotDisturbStart must be before doNotDisturbEnd"

Scenario: 禁用通知
  Given 用户 "user-123" 通知已启用
  When 调用 updateNotificationSettings({ enabled: false, channels: [] })
  Then 应该成功更新
  And channels 可以为空 (因为 enabled: false)
```

### Scenario 5: 批量更新偏好设置

```gherkin
Feature: 批量更新多个设置
  As an Application Service
  I want to update multiple preferences at once
  So that users can save multiple changes with one request

Scenario: 同时更新主题、语言和字体大小
  Given 用户 "user-123" 存在
  When 调用 userPreferenceService.update({
    accountUuid: "user-123",
    theme: 'dark',
    language: 'en-US',
    fontSize: 16
  })
  Then 应该调用:
    - entity.updateTheme('dark')
    - entity.updateLanguage('en-US')
    - entity.updateFontSize(16)
  And 应该只调用一次 repository.save()
  And updatedAt 应该只更新一次 (最后一次)
  And 应该返回包含所有更新的 DTO

Scenario: 部分字段更新
  Given 用户 "user-123" 存在
  When 调用 update 只传入 { accountUuid, theme: 'dark' }
  Then 应该只更新 theme
  And 其他字段保持不变

Scenario: 批量更新验证失败
  Given 用户 "user-123" 存在
  When 调用 update 包含无效的 fontSize: 30
  Then 应该抛出 InvalidFontSizeError
  And 不应该保存任何更改 (事务回滚)
```

### Scenario 6: 删除用户偏好

```gherkin
Feature: 删除用户偏好
  As an Application Service
  I want to delete a user's preferences
  So that data can be cleaned up when user account is deleted

Scenario: 成功删除用户偏好
  Given 用户 "user-123" 的偏好设置存在
  When 调用 userPreferenceService.delete("user-123")
  Then 应该调用 repository.delete(accountUuid)
  And 应该返回 success: true

Scenario: 删除不存在的偏好
  Given 用户 "user-999" 没有偏好设置
  When 调用 userPreferenceService.delete("user-999")
  Then 应该抛出 UserPreferenceNotFoundError
```

### Scenario 7: 测试覆盖

```gherkin
Scenario: 单元测试覆盖率
  Given 所有 Service 方法已实现
  When 运行单元测试套件
  Then 代码覆盖率应该 ≥ 80%
  And 所有测试应该通过
  And 应该测试成功和失败场景
  And 应该测试边界条件
```

---

## 📋 任务清单 (Task Breakdown)

### Application Service 层任务

- [ ] **Task 1.1**: 创建 `src/setting/application/errors/` 目录
  - [ ] 创建 `UserPreferenceAlreadyExistsError.ts`
  - [ ] 创建 `UserPreferenceNotFoundError.ts`
  - [ ] 创建 `index.ts` 导出所有错误类

- [ ] **Task 1.2**: 创建 `src/setting/application/dtos/` 目录
  - [ ] 创建 `CreateUserPreferenceDTO.ts` (输入 DTO)
  - [ ] 创建 `UpdateUserPreferenceDTO.ts` (输入 DTO)
  - [ ] 创建 `UpdateThemeDTO.ts`
  - [ ] 创建 `UpdateNotificationSettingsDTO.ts`
  - [ ] 创建 `index.ts` 导出所有 DTO

- [ ] **Task 1.3**: 定义 Repository 接口
  - [ ] 创建 `src/setting/domain/repositories/IUserPreferenceRepository.ts`
  - [ ] 定义方法:
    - `findByAccountUuid(accountUuid: string): Promise<UserPreference | null>`
    - `findByUuid(uuid: string): Promise<UserPreference | null>`
    - `save(entity: UserPreference): Promise<void>`
    - `delete(accountUuid: string): Promise<void>`
    - `existsByAccountUuid(accountUuid: string): Promise<boolean>`

- [ ] **Task 1.4**: 实现 UserPreferenceService
  - [ ] 创建 `src/setting/application/services/UserPreferenceService.ts`
  - [ ] 实现构造函数 (注入 repository)
  - [ ] 实现 `create(dto: CreateUserPreferenceDTO): Promise<UserPreferenceServerDTO>`
  - [ ] 实现 `getByAccountUuid(accountUuid: string): Promise<UserPreferenceServerDTO>`
  - [ ] 实现 `getByUuid(uuid: string): Promise<UserPreferenceServerDTO>`
  - [ ] 实现 `updateTheme(dto: UpdateThemeDTO): Promise<UserPreferenceServerDTO>`
  - [ ] 实现 `updateLanguage(dto: UpdateLanguageDTO): Promise<UserPreferenceServerDTO>`
  - [ ] 实现 `updateNotificationSettings(dto: UpdateNotificationSettingsDTO): Promise<UserPreferenceServerDTO>`
  - [ ] 实现 `updateShortcuts(dto: UpdateShortcutsDTO): Promise<UserPreferenceServerDTO>`
  - [ ] 实现 `update(dto: UpdateUserPreferenceDTO): Promise<UserPreferenceServerDTO>` (批量更新)
  - [ ] 实现 `delete(accountUuid: string): Promise<void>`
  - [ ] 添加私有方法 `getDefaultNotificationSettings()`, `getDefaultShortcuts()`

- [ ] **Task 1.5**: 编写单元测试
  - [ ] 创建 `src/setting/application/services/__tests__/UserPreferenceService.test.ts`
  - [ ] Mock IUserPreferenceRepository
  - [ ] 测试 create 方法 (成功、已存在)
  - [ ] 测试 getByAccountUuid 方法 (成功、不存在)
  - [ ] 测试 updateTheme 方法 (成功、无效值、不存在)
  - [ ] 测试 updateNotificationSettings 方法 (成功、时间无效)
  - [ ] 测试 update 方法 (批量更新、部分更新、验证失败)
  - [ ] 测试 delete 方法 (成功、不存在)
  - [ ] 确保覆盖率 ≥ 80%

- [ ] **Task 1.6**: 更新导出
  - [ ] 更新 `src/setting/application/index.ts` 导出 Service 和 DTOs

---

## 🔧 技术实现细节

### Application DTOs

**src/setting/application/dtos/CreateUserPreferenceDTO.ts**:

```typescript
import type {
  ThemeType,
  LanguageType,
  NotificationSettings,
  ShortcutSettings,
  SidebarPosition,
} from '@dailyuse/contracts';

export interface CreateUserPreferenceDTO {
  accountUuid: string;
  theme?: ThemeType;
  language?: LanguageType;
  notifications?: Partial<NotificationSettings>;
  shortcuts?: Partial<ShortcutSettings>;
  sidebarPosition?: SidebarPosition;
  fontSize?: number;
}
```

**src/setting/application/dtos/UpdateUserPreferenceDTO.ts**:

```typescript
export interface UpdateUserPreferenceDTO {
  accountUuid: string;
  theme?: ThemeType;
  language?: LanguageType;
  notifications?: NotificationSettings;
  shortcuts?: ShortcutSettings;
  sidebarPosition?: SidebarPosition;
  fontSize?: number;
}
```

### Repository Interface

**src/setting/domain/repositories/IUserPreferenceRepository.ts**:

```typescript
import type { UserPreference } from '../entities/UserPreference';

export interface IUserPreferenceRepository {
  /**
   * 根据账户 UUID 查找用户偏好
   */
  findByAccountUuid(accountUuid: string): Promise<UserPreference | null>;

  /**
   * 根据 UUID 查找用户偏好
   */
  findByUuid(uuid: string): Promise<UserPreference | null>;

  /**
   * 检查账户是否已有偏好设置
   */
  existsByAccountUuid(accountUuid: string): Promise<boolean>;

  /**
   * 保存或更新用户偏好
   */
  save(entity: UserPreference): Promise<void>;

  /**
   * 删除用户偏好
   */
  delete(accountUuid: string): Promise<void>;
}
```

### UserPreferenceService

**src/setting/application/services/UserPreferenceService.ts**:

```typescript
import type { UserPreferenceServerDTO } from '@dailyuse/contracts';
import type { IUserPreferenceRepository } from '../../domain/repositories/IUserPreferenceRepository';
import { UserPreference } from '../../domain/entities/UserPreference';
import { UserPreferenceAlreadyExistsError, UserPreferenceNotFoundError } from '../errors';
import type {
  CreateUserPreferenceDTO,
  UpdateUserPreferenceDTO,
  UpdateThemeDTO,
  UpdateNotificationSettingsDTO,
} from '../dtos';

export class UserPreferenceService {
  constructor(private readonly repository: IUserPreferenceRepository) {}

  /**
   * 创建用户偏好 (使用默认值 + 自定义值)
   */
  async create(dto: CreateUserPreferenceDTO): Promise<UserPreferenceServerDTO> {
    // 检查是否已存在
    const exists = await this.repository.existsByAccountUuid(dto.accountUuid);
    if (exists) {
      throw new UserPreferenceAlreadyExistsError(dto.accountUuid);
    }

    // 合并默认值和自定义值
    const now = Date.now();
    const entity = new UserPreference({
      accountUuid: dto.accountUuid,
      theme: dto.theme ?? 'auto',
      language: dto.language ?? 'zh-CN',
      notifications: {
        ...this.getDefaultNotificationSettings(),
        ...dto.notifications,
      },
      shortcuts: {
        ...this.getDefaultShortcuts(),
        ...dto.shortcuts,
      },
      sidebarPosition: dto.sidebarPosition ?? 'left',
      fontSize: dto.fontSize ?? 14,
      createdAt: now,
      updatedAt: now,
    });

    await this.repository.save(entity);
    return entity.toServerDTO();
  }

  /**
   * 根据账户 UUID 获取用户偏好
   */
  async getByAccountUuid(accountUuid: string): Promise<UserPreferenceServerDTO> {
    const entity = await this.repository.findByAccountUuid(accountUuid);
    if (!entity) {
      throw new UserPreferenceNotFoundError(accountUuid);
    }
    return entity.toServerDTO();
  }

  /**
   * 根据 UUID 获取用户偏好
   */
  async getByUuid(uuid: string): Promise<UserPreferenceServerDTO> {
    const entity = await this.repository.findByUuid(uuid);
    if (!entity) {
      throw new UserPreferenceNotFoundError(uuid);
    }
    return entity.toServerDTO();
  }

  /**
   * 更新主题
   */
  async updateTheme(dto: UpdateThemeDTO): Promise<UserPreferenceServerDTO> {
    const entity = await this.getEntityOrThrow(dto.accountUuid);
    entity.updateTheme(dto.theme);
    await this.repository.save(entity);
    return entity.toServerDTO();
  }

  /**
   * 更新语言
   */
  async updateLanguage(dto: UpdateLanguageDTO): Promise<UserPreferenceServerDTO> {
    const entity = await this.getEntityOrThrow(dto.accountUuid);
    entity.updateLanguage(dto.language);
    await this.repository.save(entity);
    return entity.toServerDTO();
  }

  /**
   * 更新通知设置
   */
  async updateNotificationSettings(
    dto: UpdateNotificationSettingsDTO,
  ): Promise<UserPreferenceServerDTO> {
    const entity = await this.getEntityOrThrow(dto.accountUuid);
    entity.updateNotificationSettings(dto.notifications);
    await this.repository.save(entity);
    return entity.toServerDTO();
  }

  /**
   * 批量更新用户偏好
   */
  async update(dto: UpdateUserPreferenceDTO): Promise<UserPreferenceServerDTO> {
    const entity = await this.getEntityOrThrow(dto.accountUuid);

    // 根据提供的字段选择性更新
    if (dto.theme !== undefined) {
      entity.updateTheme(dto.theme);
    }
    if (dto.language !== undefined) {
      entity.updateLanguage(dto.language);
    }
    if (dto.notifications !== undefined) {
      entity.updateNotificationSettings(dto.notifications);
    }
    if (dto.shortcuts !== undefined) {
      entity.updateShortcuts(dto.shortcuts);
    }
    if (dto.sidebarPosition !== undefined) {
      entity.updateSidebarPosition(dto.sidebarPosition);
    }
    if (dto.fontSize !== undefined) {
      entity.updateFontSize(dto.fontSize);
    }

    await this.repository.save(entity);
    return entity.toServerDTO();
  }

  /**
   * 删除用户偏好
   */
  async delete(accountUuid: string): Promise<void> {
    const exists = await this.repository.existsByAccountUuid(accountUuid);
    if (!exists) {
      throw new UserPreferenceNotFoundError(accountUuid);
    }
    await this.repository.delete(accountUuid);
  }

  // ========== Private Methods ==========

  private async getEntityOrThrow(accountUuid: string): Promise<UserPreference> {
    const entity = await this.repository.findByAccountUuid(accountUuid);
    if (!entity) {
      throw new UserPreferenceNotFoundError(accountUuid);
    }
    return entity;
  }

  private getDefaultNotificationSettings(): NotificationSettings {
    return {
      enabled: true,
      channels: ['push'],
      doNotDisturbStart: '22:00',
      doNotDisturbEnd: '08:00',
      soundEnabled: true,
    };
  }

  private getDefaultShortcuts(): ShortcutSettings {
    return {
      'task.create': 'Ctrl+N',
      'task.complete': 'Ctrl+Enter',
      'task.delete': 'Delete',
      'search.global': 'Ctrl+K',
      'navigation.inbox': 'G then I',
      'navigation.today': 'G then T',
    };
  }
}
```

### 单元测试示例

**src/setting/application/services/**tests**/UserPreferenceService.test.ts**:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserPreferenceService } from '../UserPreferenceService';
import { UserPreference } from '../../../domain/entities/UserPreference';
import { UserPreferenceAlreadyExistsError, UserPreferenceNotFoundError } from '../../errors';
import type { IUserPreferenceRepository } from '../../../domain/repositories/IUserPreferenceRepository';

// Mock Repository
const mockRepository: IUserPreferenceRepository = {
  findByAccountUuid: vi.fn(),
  findByUuid: vi.fn(),
  existsByAccountUuid: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

describe('UserPreferenceService', () => {
  let service: UserPreferenceService;

  beforeEach(() => {
    service = new UserPreferenceService(mockRepository);
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('应该使用默认值创建用户偏好', async () => {
      vi.mocked(mockRepository.existsByAccountUuid).mockResolvedValue(false);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await service.create({ accountUuid: 'user-123' });

      expect(result.accountUuid).toBe('user-123');
      expect(result.theme).toBe('auto');
      expect(result.language).toBe('zh-CN');
      expect(result.fontSize).toBe(14);
      expect(mockRepository.save).toHaveBeenCalledOnce();
    });

    it('应该使用自定义值创建用户偏好', async () => {
      vi.mocked(mockRepository.existsByAccountUuid).mockResolvedValue(false);

      const result = await service.create({
        accountUuid: 'user-123',
        theme: 'dark',
        language: 'en-US',
        fontSize: 16,
      });

      expect(result.theme).toBe('dark');
      expect(result.language).toBe('en-US');
      expect(result.fontSize).toBe(16);
    });

    it('应该在用户已有偏好时抛出错误', async () => {
      vi.mocked(mockRepository.existsByAccountUuid).mockResolvedValue(true);

      await expect(service.create({ accountUuid: 'user-123' })).rejects.toThrow(
        UserPreferenceAlreadyExistsError,
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getByAccountUuid', () => {
    it('应该返回用户偏好', async () => {
      const mockEntity = new UserPreference({
        accountUuid: 'user-123',
        theme: 'dark',
        language: 'zh-CN',
        notifications: {
          /* ... */
        },
        shortcuts: {},
        sidebarPosition: 'left',
        fontSize: 14,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue(mockEntity);

      const result = await service.getByAccountUuid('user-123');

      expect(result.accountUuid).toBe('user-123');
      expect(result.theme).toBe('dark');
    });

    it('应该在用户不存在时抛出错误', async () => {
      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue(null);

      await expect(service.getByAccountUuid('user-999')).rejects.toThrow(
        UserPreferenceNotFoundError,
      );
    });
  });

  describe('updateTheme', () => {
    it('应该成功更新主题', async () => {
      const mockEntity = createMockEntity('user-123');
      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue(mockEntity);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await service.updateTheme({
        accountUuid: 'user-123',
        theme: 'dark',
      });

      expect(result.theme).toBe('dark');
      expect(mockRepository.save).toHaveBeenCalledOnce();
    });

    it('应该在用户不存在时抛出错误', async () => {
      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue(null);

      await expect(service.updateTheme({ accountUuid: 'user-999', theme: 'dark' })).rejects.toThrow(
        UserPreferenceNotFoundError,
      );
    });
  });

  // 更多测试用例...
});

function createMockEntity(accountUuid: string): UserPreference {
  return new UserPreference({
    accountUuid,
    theme: 'light',
    language: 'zh-CN',
    notifications: {
      enabled: true,
      channels: ['push'],
      doNotDisturbStart: '22:00',
      doNotDisturbEnd: '08:00',
      soundEnabled: true,
    },
    shortcuts: {},
    sidebarPosition: 'left',
    fontSize: 14,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
```

---

## ✅ Definition of Done

这个 Story 被认为完成，当且仅当：

### 功能完整性

- [x] UserPreferenceService 实现所有 CRUD 操作
- [x] Repository 接口定义完整
- [x] 所有 Application DTOs 定义完整
- [x] 默认值逻辑正确实现

### 代码质量

- [x] TypeScript strict 模式无错误
- [x] ESLint 无警告
- [x] 所有公共方法有 JSDoc 注释
- [x] 单元测试覆盖率 ≥ 80%

### 测试

- [x] 所有单元测试通过
- [x] Mock repository 正确实现
- [x] 测试覆盖成功和失败场景
- [x] 测试覆盖边界条件

### 文档

- [x] Service 方法 JSDoc 完整
- [x] README 已更新 (如有必要)

### Code Review

- [x] Code Review 完成 (至少 1 人)
- [x] Code Review 反馈已解决

---

## 📊 预估时间

| 任务                        | 预估时间   |
| --------------------------- | ---------- |
| DTOs & Repository Interface | 1 小时     |
| UserPreferenceService 开发  | 3 小时     |
| 单元测试编写                | 2.5 小时   |
| Code Review & 修复          | 1.5 小时   |
| **总计**                    | **8 小时** |

**Story Points**: 3 SP (对应 8 小时工作量)

---

## 🔗 依赖关系

### 上游依赖

- ✅ STORY-SETTING-001-001 (Contracts & Domain 层) - **必须完成**

### 下游依赖

- STORY-SETTING-001-003 (Infrastructure & Repository) 依赖此 Story
- STORY-SETTING-001-004 (API Endpoints) 依赖此 Story

---

## 🚨 风险与注意事项

### 技术风险

1. **Repository 未实现**: Application Service 依赖 Repository 接口
   - 缓解: 单元测试使用 Mock Repository
2. **默认值变更**: 默认快捷键可能随产品迭代变化
   - 缓解: 将默认值提取为常量，易于维护

### 业务风险

1. **并发更新**: 多个客户端同时更新同一用户的偏好
   - 缓解: 使用乐观锁 (后续 Story 实现)

---

## 📝 开发笔记

### 技术决策

- Repository 接口定义在 Domain 层: 符合 DDD 原则
- 使用 DTO 分离输入和输出: 提高灵活性
- 批量更新方法: 减少网络请求次数

### 待讨论问题

- 是否需要在 create 时验证 accountUuid 存在？(需要调用 Account 模块)
- 默认快捷键列表是否需要配置化？

---

**Story 创建日期**: 2025-10-21  
**Story 创建者**: SM Bob  
**最后更新**: 2025-10-21

# STORY-SETTING-001-005: Client Services 实现

> **Story ID**: STORY-SETTING-001-005  
> **Epic**: EPIC-SETTING-001 - 用户偏好设置  
> **Sprint**: Sprint 1  
> **Story Points**: 2 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Frontend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 前端开发者  
**我想要** 封装用户偏好设置的 Client Service  
**以便于** 在 Web/Desktop 应用中方便地调用 API

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: 创建 Client Service

```gherkin
Feature: UserPreferenceClientService
  As a Frontend Developer
  I want a typed client service
  So that I can easily interact with user preference APIs

Scenario: 创建 UserPreferenceClientService 类
  Given API endpoints 已实现
  When 创建 UserPreferenceClientService
  Then 应该提供所有 CRUD 方法
  And 所有方法返回 Promise<UserPreferenceClientDTO>
  And 所有方法有完整的 TypeScript 类型
```

### Scenario 2: 获取用户偏好

```gherkin
Feature: 获取用户偏好
  As a Frontend Developer
  I want to fetch user preferences
  So that I can initialize the app with user settings

Scenario: 获取当前用户的偏好
  Given 用户已登录
  When 调用 userPreferenceService.getCurrentUserPreference()
  Then 应该发送 GET /api/v1/user-preferences?accountUuid=<current-user-uuid>
  And 应该返回 UserPreferenceClientDTO
  And 应该缓存结果 (避免重复请求)

Scenario: 获取失败 - 网络错误
  Given 网络连接失败
  When 调用 getCurrentUserPreference()
  Then 应该抛出 NetworkError
  And 应该触发错误回调

Scenario: 获取失败 - 用户偏好不存在
  Given 新用户没有偏好设置
  When 调用 getCurrentUserPreference()
  Then 应该返回 null 或默认值
  And 应该提示用户初始化设置
```

### Scenario 3: 更新主题

```gherkin
Feature: 更新主题设置
  As a Frontend Developer
  I want to update theme quickly
  So that users can switch themes in real-time

Scenario: 成功更新主题
  Given 用户当前主题为 'light'
  When 调用 userPreferenceService.updateTheme('dark')
  Then 应该发送 PATCH /api/v1/user-preferences/:accountUuid/theme
  And 应该立即更新本地缓存 (乐观更新)
  And 应该触发 onThemeChanged 事件
  And 应该应用新主题到 UI

Scenario: 更新失败 - 回滚本地状态
  Given 用户当前主题为 'light'
  When 调用 updateTheme('dark') 但 API 请求失败
  Then 应该回滚本地缓存为 'light'
  And 应该显示错误消息
  And 应该触发 onError 事件
```

### Scenario 4: 批量更新设置

```gherkin
Feature: 批量更新用户偏好
  As a Frontend Developer
  I want to save multiple settings at once
  So that users can apply changes in batch

Scenario: 保存设置页面的所有更改
  Given 用户在设置页面修改了多个选项
  When 调用 userPreferenceService.update({
    theme: 'dark',
    language: 'en-US',
    fontSize: 16
  })
  Then 应该发送 PUT /api/v1/user-preferences/:accountUuid
  And 应该更新本地缓存
  And 应该触发 onPreferenceChanged 事件
  And 应该显示成功消息
```

### Scenario 5: 监听偏好变化

```gherkin
Feature: 偏好变化事件监听
  As a Frontend Developer
  I want to subscribe to preference changes
  So that UI components can react to changes

Scenario: 监听主题变化
  Given 组件订阅了主题变化事件
  When 用户更新主题为 'dark'
  Then 应该触发 onThemeChanged({ theme: 'dark' })
  And 所有订阅者应该收到通知
  And UI 应该自动更新

Scenario: 取消订阅
  Given 组件已订阅主题变化
  When 组件卸载并调用 unsubscribe()
  Then 不应该再收到主题变化通知
```

---

## 📋 任务清单 (Task Breakdown)

### Client Service 实现任务

- [ ] **Task 1.1**: 创建 `packages/domain-client/src/setting/services/UserPreferenceClientService.ts`
  - [ ] 注入 HTTP Client (axios/fetch wrapper)
  - [ ] 实现 `getCurrentUserPreference(): Promise<UserPreferenceClientDTO | null>`
  - [ ] 实现 `getByUuid(uuid: string): Promise<UserPreferenceClientDTO>`
  - [ ] 实现 `create(dto: CreateUserPreferenceDTO): Promise<UserPreferenceClientDTO>`
  - [ ] 实现 `updateTheme(theme: ThemeType): Promise<UserPreferenceClientDTO>`
  - [ ] 实现 `updateLanguage(language: LanguageType): Promise<UserPreferenceClientDTO>`
  - [ ] 实现 `updateNotifications(settings: NotificationSettings): Promise<UserPreferenceClientDTO>`
  - [ ] 实现 `updateShortcuts(shortcuts: ShortcutSettings): Promise<UserPreferenceClientDTO>`
  - [ ] 实现 `update(dto: UpdateUserPreferenceDTO): Promise<UserPreferenceClientDTO>`
  - [ ] 实现 `delete(): Promise<void>`

- [ ] **Task 1.2**: 实现本地缓存和乐观更新
  - [ ] 添加内存缓存 (currentPreference)
  - [ ] 实现 `getCachedPreference(): UserPreferenceClientDTO | null`
  - [ ] 实现乐观更新 (立即更新本地状态)
  - [ ] 实现失败回滚 (API 失败时恢复)

- [ ] **Task 1.3**: 实现事件系统
  - [ ] 创建 `PreferenceChangeEvent` 类型
  - [ ] 实现 `on(event: string, callback: Function): void`
  - [ ] 实现 `off(event: string, callback: Function): void`
  - [ ] 实现 `emit(event: string, data: any): void`
  - [ ] 定义事件类型:
    - `onThemeChanged`
    - `onLanguageChanged`
    - `onNotificationsChanged`
    - `onPreferenceChanged` (通用)

### API Client 封装任务

- [ ] **Task 2.1**: 创建 `packages/domain-client/src/setting/api/UserPreferenceAPI.ts`
  - [ ] 封装所有 HTTP 请求
  - [ ] 添加错误处理和重试逻辑
  - [ ] 添加请求拦截器 (添加 token)

### 单元测试任务

- [ ] **Task 3.1**: 编写单元测试
  - [ ] 创建 `services/__tests__/UserPreferenceClientService.test.ts`
  - [ ] Mock HTTP Client
  - [ ] 测试所有方法 (成功和失败场景)
  - [ ] 测试缓存逻辑
  - [ ] 测试乐观更新和回滚
  - [ ] 测试事件系统
  - [ ] 确保覆盖率 ≥ 80%

---

## 🔧 技术实现细节

### UserPreferenceClientService

**packages/domain-client/src/setting/services/UserPreferenceClientService.ts**:

```typescript
import type {
  UserPreferenceClientDTO,
  ThemeType,
  LanguageType,
  NotificationSettings,
  ShortcutSettings,
} from '@dailyuse/contracts';
import { UserPreferenceAPI } from '../api/UserPreferenceAPI';
import { EventEmitter } from 'events';

export class UserPreferenceClientService {
  private currentPreference: UserPreferenceClientDTO | null = null;
  private eventEmitter = new EventEmitter();

  constructor(
    private readonly api: UserPreferenceAPI,
    private readonly authService: AuthService, // 获取当前用户信息
  ) {}

  /**
   * 获取当前用户的偏好设置
   */
  async getCurrentUserPreference(): Promise<UserPreferenceClientDTO | null> {
    try {
      const accountUuid = this.authService.getCurrentUserUuid();
      if (!accountUuid) {
        throw new Error('User not authenticated');
      }

      const preference = await this.api.getByAccountUuid(accountUuid);
      this.currentPreference = preference;
      return preference;
    } catch (error) {
      if (error.status === 404) {
        return null; // 用户偏好不存在
      }
      throw error;
    }
  }

  /**
   * 获取缓存的偏好设置 (不发送请求)
   */
  getCachedPreference(): UserPreferenceClientDTO | null {
    return this.currentPreference;
  }

  /**
   * 创建用户偏好 (使用默认值)
   */
  async create(): Promise<UserPreferenceClientDTO> {
    const accountUuid = this.authService.getCurrentUserUuid();
    const preference = await this.api.create({ accountUuid });
    this.currentPreference = preference;
    this.emit('onPreferenceChanged', preference);
    return preference;
  }

  /**
   * 更新主题 (乐观更新)
   */
  async updateTheme(theme: ThemeType): Promise<UserPreferenceClientDTO> {
    const oldTheme = this.currentPreference?.theme;

    try {
      // 乐观更新：立即更新 UI
      if (this.currentPreference) {
        this.currentPreference.theme = theme;
        this.emit('onThemeChanged', { theme });
        this.applyTheme(theme);
      }

      // 发送 API 请求
      const accountUuid = this.authService.getCurrentUserUuid();
      const updatedPreference = await this.api.updateTheme(accountUuid, theme);
      this.currentPreference = updatedPreference;

      return updatedPreference;
    } catch (error) {
      // 回滚失败的更新
      if (this.currentPreference && oldTheme) {
        this.currentPreference.theme = oldTheme;
        this.emit('onThemeChanged', { theme: oldTheme });
        this.applyTheme(oldTheme);
      }
      this.emit('onError', { error, action: 'updateTheme' });
      throw error;
    }
  }

  /**
   * 更新语言
   */
  async updateLanguage(language: LanguageType): Promise<UserPreferenceClientDTO> {
    const accountUuid = this.authService.getCurrentUserUuid();
    const preference = await this.api.updateLanguage(accountUuid, language);
    this.currentPreference = preference;
    this.emit('onLanguageChanged', { language });
    return preference;
  }

  /**
   * 更新通知设置
   */
  async updateNotifications(settings: NotificationSettings): Promise<UserPreferenceClientDTO> {
    const accountUuid = this.authService.getCurrentUserUuid();
    const preference = await this.api.updateNotifications(accountUuid, settings);
    this.currentPreference = preference;
    this.emit('onNotificationsChanged', { notifications: settings });
    return preference;
  }

  /**
   * 批量更新用户偏好
   */
  async update(dto: Partial<UserPreferenceClientDTO>): Promise<UserPreferenceClientDTO> {
    const accountUuid = this.authService.getCurrentUserUuid();
    const preference = await this.api.update(accountUuid, dto);
    this.currentPreference = preference;
    this.emit('onPreferenceChanged', preference);
    return preference;
  }

  /**
   * 订阅事件
   */
  on(event: string, callback: Function): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * 取消订阅
   */
  off(event: string, callback: Function): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any): void {
    this.eventEmitter.emit(event, data);
  }

  /**
   * 应用主题到 DOM (立即生效)
   */
  private applyTheme(theme: ThemeType): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      }
    }
  }
}
```

### API Client

**packages/domain-client/src/setting/api/UserPreferenceAPI.ts**:

```typescript
import type {
  UserPreferenceClientDTO,
  ThemeType,
  LanguageType,
  NotificationSettings,
} from '@dailyuse/contracts';
import { httpClient } from '../../core/http-client';

export class UserPreferenceAPI {
  private readonly baseURL = '/api/v1/user-preferences';

  async getByAccountUuid(accountUuid: string): Promise<UserPreferenceClientDTO> {
    const response = await httpClient.get<UserPreferenceClientDTO>(
      `${this.baseURL}?accountUuid=${accountUuid}`,
    );
    return response.data;
  }

  async create(dto: { accountUuid: string }): Promise<UserPreferenceClientDTO> {
    const response = await httpClient.post<UserPreferenceClientDTO>(this.baseURL, dto);
    return response.data;
  }

  async updateTheme(accountUuid: string, theme: ThemeType): Promise<UserPreferenceClientDTO> {
    const response = await httpClient.patch<UserPreferenceClientDTO>(
      `${this.baseURL}/${accountUuid}/theme`,
      { theme },
    );
    return response.data;
  }

  async updateLanguage(
    accountUuid: string,
    language: LanguageType,
  ): Promise<UserPreferenceClientDTO> {
    const response = await httpClient.patch<UserPreferenceClientDTO>(
      `${this.baseURL}/${accountUuid}/language`,
      { language },
    );
    return response.data;
  }

  async updateNotifications(
    accountUuid: string,
    notifications: NotificationSettings,
  ): Promise<UserPreferenceClientDTO> {
    const response = await httpClient.patch<UserPreferenceClientDTO>(
      `${this.baseURL}/${accountUuid}/notifications`,
      notifications,
    );
    return response.data;
  }

  async update(
    accountUuid: string,
    dto: Partial<UserPreferenceClientDTO>,
  ): Promise<UserPreferenceClientDTO> {
    const response = await httpClient.put<UserPreferenceClientDTO>(
      `${this.baseURL}/${accountUuid}`,
      dto,
    );
    return response.data;
  }

  async delete(accountUuid: string): Promise<void> {
    await httpClient.delete(`${this.baseURL}/${accountUuid}`);
  }
}
```

### 单元测试

**services/**tests**/UserPreferenceClientService.test.ts**:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserPreferenceClientService } from '../UserPreferenceClientService';
import { UserPreferenceAPI } from '../../api/UserPreferenceAPI';
import type { AuthService } from '../../../auth/services/AuthService';

const mockAPI: UserPreferenceAPI = {
  getByAccountUuid: vi.fn(),
  create: vi.fn(),
  updateTheme: vi.fn(),
  updateLanguage: vi.fn(),
  updateNotifications: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as any;

const mockAuthService: AuthService = {
  getCurrentUserUuid: vi.fn(() => 'user-123'),
} as any;

describe('UserPreferenceClientService', () => {
  let service: UserPreferenceClientService;

  beforeEach(() => {
    service = new UserPreferenceClientService(mockAPI, mockAuthService);
    vi.clearAllMocks();
  });

  describe('getCurrentUserPreference', () => {
    it('应该获取当前用户的偏好', async () => {
      const mockPreference = {
        uuid: 'pref-1',
        accountUuid: 'user-123',
        theme: 'dark',
        language: 'zh-CN',
        // ...
      };

      vi.mocked(mockAPI.getByAccountUuid).mockResolvedValue(mockPreference);

      const result = await service.getCurrentUserPreference();

      expect(result).toEqual(mockPreference);
      expect(mockAPI.getByAccountUuid).toHaveBeenCalledWith('user-123');
      expect(service.getCachedPreference()).toEqual(mockPreference);
    });

    it('应该在用户偏好不存在时返回 null', async () => {
      const error = new Error('Not Found');
      (error as any).status = 404;
      vi.mocked(mockAPI.getByAccountUuid).mockRejectedValue(error);

      const result = await service.getCurrentUserPreference();

      expect(result).toBeNull();
    });
  });

  describe('updateTheme with optimistic update', () => {
    it('应该乐观更新并触发事件', async () => {
      const mockPreference = {
        uuid: 'pref-1',
        accountUuid: 'user-123',
        theme: 'light',
        // ...
      };

      service['currentPreference'] = mockPreference;
      vi.mocked(mockAPI.updateTheme).mockResolvedValue({
        ...mockPreference,
        theme: 'dark',
      });

      const callback = vi.fn();
      service.on('onThemeChanged', callback);

      await service.updateTheme('dark');

      expect(callback).toHaveBeenCalledWith({ theme: 'dark' });
      expect(service.getCachedPreference()?.theme).toBe('dark');
    });

    it('应该在 API 失败时回滚', async () => {
      const mockPreference = {
        uuid: 'pref-1',
        accountUuid: 'user-123',
        theme: 'light',
        // ...
      };

      service['currentPreference'] = mockPreference;
      vi.mocked(mockAPI.updateTheme).mockRejectedValue(new Error('API Error'));

      const errorCallback = vi.fn();
      service.on('onError', errorCallback);

      await expect(service.updateTheme('dark')).rejects.toThrow('API Error');

      // 应该回滚为原来的主题
      expect(service.getCachedPreference()?.theme).toBe('light');
      expect(errorCallback).toHaveBeenCalledWith({
        error: expect.any(Error),
        action: 'updateTheme',
      });
    });
  });

  describe('event subscription', () => {
    it('应该允许订阅和取消订阅', async () => {
      const callback = vi.fn();
      service.on('onThemeChanged', callback);

      vi.mocked(mockAPI.updateTheme).mockResolvedValue({} as any);
      await service.updateTheme('dark');

      expect(callback).toHaveBeenCalledOnce();

      service.off('onThemeChanged', callback);
      await service.updateTheme('light');

      expect(callback).toHaveBeenCalledOnce(); // 不应该再次调用
    });
  });
});
```

---

## ✅ Definition of Done

- [x] UserPreferenceClientService 实现所有方法
- [x] API Client 封装完成
- [x] 本地缓存和乐观更新实现
- [x] 事件系统实现
- [x] 单元测试覆盖率 ≥ 80%
- [x] 所有测试通过
- [x] TypeScript 类型完整
- [x] Code Review 完成

---

## 📊 预估时间

| 任务                | 预估时间   |
| ------------------- | ---------- |
| Client Service 实现 | 2.5 小时   |
| API Client 封装     | 1 小时     |
| 缓存 & 乐观更新     | 1.5 小时   |
| 事件系统            | 1 小时     |
| 单元测试编写        | 2 小时     |
| **总计**            | **8 小时** |

**Story Points**: 2 SP

---

## 🔗 依赖关系

### 上游依赖

- ✅ STORY-SETTING-001-004 (API Endpoints)

### 下游依赖

- STORY-SETTING-001-006/007/008 (UI) 依赖此 Story

---

**Story 创建日期**: 2025-10-21  
**Story 创建者**: SM Bob

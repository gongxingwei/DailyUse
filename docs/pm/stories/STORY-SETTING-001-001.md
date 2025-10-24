# STORY-SETTING-001-001: Contracts & Domain 层实现

> **Story ID**: STORY-SETTING-001-001  
> **Epic**: EPIC-SETTING-001 - 用户偏好设置  
> **Sprint**: Sprint 1  
> **Story Points**: 2 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Backend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 系统架构师  
**我想要** 建立用户偏好设置的 Contracts 和 Domain 层基础  
**以便于** 为整个应用提供统一的用户偏好数据结构和业务逻辑

---

## 🎯 验收标准 (Acceptance Criteria)

使用 Gherkin 格式定义验收标准：

### Scenario 1: 定义 UserPreference DTO

```gherkin
Scenario: 定义完整的 UserPreference ServerDTO
  Given 需要在前后端传输用户偏好数据
  When 创建 UserPreferenceServerDTO 接口
  Then 应该包含所有必需字段
  And 使用 TypeScript 类型确保类型安全
  And 添加 JSDoc 注释说明每个字段用途

  Examples:
  | Field           | Type                | Required | Description         |
  | uuid            | string              | Yes      | 用户偏好唯一标识    |
  | accountUuid     | string              | Yes      | 所属账户UUID        |
  | theme           | ThemeType           | Yes      | 主题设置            |
  | language        | LanguageType        | Yes      | 语言设置            |
  | notifications   | NotificationSettings| Yes      | 通知设置对象        |
  | shortcuts       | ShortcutSettings    | Yes      | 快捷键设置对象      |
  | sidebarPosition | 'left' \| 'right'   | Yes      | 侧边栏位置          |
  | fontSize        | number              | Yes      | 字体大小 (12-24)    |
  | createdAt       | number              | Yes      | 创建时间戳          |
  | updatedAt       | number              | Yes      | 更新时间戳          |
```

### Scenario 2: 创建值对象和枚举类型

```gherkin
Scenario: 定义 ThemeType 枚举
  Given 用户可以选择不同的主题
  When 定义 ThemeType 类型
  Then 应该包含 'light', 'dark', 'auto' 三个选项
  And 使用 TypeScript enum 或 union type

Scenario: 定义 LanguageType 枚举
  Given 用户可以选择不同的语言
  When 定义 LanguageType 类型
  Then 应该包含 'zh-CN', 'en-US', 'ja-JP' 等选项

Scenario: 定义 NotificationSettings 接口
  Given 用户需要配置通知偏好
  When 定义 NotificationSettings 接口
  Then 应该包含以下字段:
  | Field                | Type      | Description             |
  | enabled              | boolean   | 是否启用通知            |
  | channels             | string[]  | 通知渠道 (push, email)  |
  | doNotDisturbStart    | string    | 免打扰开始时间 (HH:mm)  |
  | doNotDisturbEnd      | string    | 免打扰结束时间 (HH:mm)  |
  | soundEnabled         | boolean   | 是否启用声音            |

Scenario: 定义 ShortcutSettings 接口
  Given 用户需要自定义快捷键
  When 定义 ShortcutSettings 接口
  Then 应该使用 Record<string, string> 存储快捷键映射
  And 键名为功能名称，值为快捷键组合 (如 "Ctrl+S")
```

### Scenario 3: 创建 Zod 验证器

```gherkin
Scenario: 使用 Zod 验证 UserPreferenceServerDTO
  Given 需要在运行时验证用户偏好数据
  When 创建 UserPreferenceServerDTOSchema
  Then 应该验证所有必需字段存在
  And 应该验证字段类型正确
  And 应该验证数值范围 (如 fontSize 12-24)
  And 应该验证枚举值在允许范围内

  Examples: 验证失败案例
  | Invalid Data                    | Error Message                    |
  | fontSize: 8                     | fontSize must be between 12-24   |
  | theme: 'invalid'                | Invalid theme value              |
  | accountUuid: ''                 | accountUuid is required          |
  | notifications.doNotDisturbStart | Invalid time format, use HH:mm   |
```

### Scenario 4: 实现 UserPreference Domain 实体

```gherkin
Scenario: 创建 UserPreference 实体类
  Given 需要在 Domain 层管理用户偏好业务逻辑
  When 创建 UserPreference 实体
  Then 应该包含所有 DTO 字段作为私有属性
  And 提供 getter 方法访问属性
  And 实现业务逻辑方法 (updateTheme, updateLanguage, etc.)
  And 实现验证逻辑 (validateFontSize, validateTimeFormat)

Scenario: 实现 updateTheme 方法
  Given 用户想要更改主题
  When 调用 userPreference.updateTheme('dark')
  Then 应该更新 theme 属性为 'dark'
  And 应该更新 updatedAt 时间戳
  And 如果主题值无效则抛出 InvalidThemeError

Scenario: 实现 updateNotificationSettings 方法
  Given 用户想要更改通知设置
  When 调用 userPreference.updateNotificationSettings(newSettings)
  Then 应该验证 doNotDisturbStart < doNotDisturbEnd
  And 应该验证时间格式为 HH:mm
  And 应该验证 channels 数组不为空 (如果 enabled: true)
  And 如果验证失败则抛出相应错误
```

### Scenario 5: 编写单元测试

```gherkin
Scenario: 测试 UserPreference 实体创建
  Given 有效的用户偏好数据
  When 创建 UserPreference 实例
  Then 应该成功创建实例
  And 所有属性应该正确赋值

Scenario: 测试 updateTheme 方法
  Given 一个 UserPreference 实例
  When 调用 updateTheme('dark')
  Then theme 应该更新为 'dark'
  And updatedAt 应该更新为当前时间

Scenario: 测试 updateTheme 验证
  Given 一个 UserPreference 实例
  When 调用 updateTheme('invalid')
  Then 应该抛出 InvalidThemeError

Scenario: 测试覆盖率
  Given 所有测试用例已编写
  When 运行 npm test
  Then 代码覆盖率应该 ≥ 80%
```

---

## 📋 任务清单 (Task Breakdown)

### Contracts 层任务 (packages/contracts)

- [ ] **Task 1.1**: 创建 `src/setting/types.ts` 定义基础类型
  - [ ] 定义 `ThemeType = 'light' | 'dark' | 'auto'`
  - [ ] 定义 `LanguageType = 'zh-CN' | 'en-US' | 'ja-JP'`
  - [ ] 定义 `NotificationChannel = 'push' | 'email' | 'sms'`

- [ ] **Task 1.2**: 创建 `src/setting/NotificationSettings.ts`
  - [ ] 定义 `NotificationSettings` 接口
  - [ ] 添加 JSDoc 注释

- [ ] **Task 1.3**: 创建 `src/setting/ShortcutSettings.ts`
  - [ ] 定义 `ShortcutSettings` 类型 (Record<string, string>)
  - [ ] 定义默认快捷键常量

- [ ] **Task 1.4**: 创建 `src/setting/UserPreferenceServerDTO.ts`
  - [ ] 定义 `UserPreferenceServerDTO` 接口
  - [ ] 导出所有相关类型

- [ ] **Task 1.5**: 创建 `src/setting/schemas.ts` (Zod 验证器)
  - [ ] 创建 `NotificationSettingsSchema`
  - [ ] 创建 `ShortcutSettingsSchema`
  - [ ] 创建 `UserPreferenceServerDTOSchema`
  - [ ] 添加自定义验证规则 (时间格式、范围检查)

- [ ] **Task 1.6**: 更新 `src/setting/index.ts` 导出所有类型

### Domain 层任务 (packages/domain-server)

- [ ] **Task 2.1**: 创建 `src/setting/errors/` 目录
  - [ ] 创建 `InvalidThemeError.ts`
  - [ ] 创建 `InvalidLanguageError.ts`
  - [ ] 创建 `InvalidNotificationSettingsError.ts`
  - [ ] 创建 `InvalidShortcutError.ts`
  - [ ] 创建 `index.ts` 导出所有错误类

- [ ] **Task 2.2**: 创建 `src/setting/entities/UserPreference.ts`
  - [ ] 定义 UserPreference 类结构
  - [ ] 实现构造函数和 getter 方法
  - [ ] 实现 `updateTheme(theme: ThemeType): void`
  - [ ] 实现 `updateLanguage(language: LanguageType): void`
  - [ ] 实现 `updateNotificationSettings(settings: NotificationSettings): void`
  - [ ] 实现 `updateShortcuts(shortcuts: ShortcutSettings): void`
  - [ ] 实现 `updateFontSize(size: number): void`
  - [ ] 实现 `updateSidebarPosition(position: 'left' | 'right'): void`
  - [ ] 添加私有验证方法 (validateFontSize, validateTimeFormat, etc.)

- [ ] **Task 2.3**: 创建 `src/setting/entities/__tests__/UserPreference.test.ts`
  - [ ] 测试实体创建
  - [ ] 测试 updateTheme 方法 (成功和失败场景)
  - [ ] 测试 updateLanguage 方法
  - [ ] 测试 updateNotificationSettings 方法 (包括时间格式验证)
  - [ ] 测试 updateShortcuts 方法 (包括冲突检测)
  - [ ] 测试 updateFontSize 方法 (包括范围验证 12-24)
  - [ ] 测试错误抛出场景
  - [ ] 确保覆盖率 ≥ 80%

- [ ] **Task 2.4**: 更新 `src/setting/index.ts` 导出实体

---

## 🔧 技术实现细节

### Contracts 层代码示例

**src/setting/types.ts**:

```typescript
/**
 * 主题类型
 */
export type ThemeType = 'light' | 'dark' | 'auto';

/**
 * 语言类型
 */
export type LanguageType = 'zh-CN' | 'en-US' | 'ja-JP';

/**
 * 通知渠道
 */
export type NotificationChannel = 'push' | 'email' | 'sms';

/**
 * 侧边栏位置
 */
export type SidebarPosition = 'left' | 'right';
```

**src/setting/NotificationSettings.ts**:

```typescript
import type { NotificationChannel } from './types';

/**
 * 通知设置接口
 */
export interface NotificationSettings {
  /** 是否启用通知 */
  enabled: boolean;

  /** 通知渠道列表 */
  channels: NotificationChannel[];

  /** 免打扰开始时间 (HH:mm 格式) */
  doNotDisturbStart: string;

  /** 免打扰结束时间 (HH:mm 格式) */
  doNotDisturbEnd: string;

  /** 是否启用通知声音 */
  soundEnabled: boolean;
}
```

**src/setting/UserPreferenceServerDTO.ts**:

```typescript
import type { ThemeType, LanguageType, SidebarPosition } from './types';
import type { NotificationSettings } from './NotificationSettings';
import type { ShortcutSettings } from './ShortcutSettings';

/**
 * 用户偏好设置 Server DTO
 */
export interface UserPreferenceServerDTO {
  /** 用户偏好唯一标识 */
  uuid: string;

  /** 所属账户 UUID */
  accountUuid: string;

  /** 主题设置 */
  theme: ThemeType;

  /** 语言设置 */
  language: LanguageType;

  /** 通知设置 */
  notifications: NotificationSettings;

  /** 快捷键设置 */
  shortcuts: ShortcutSettings;

  /** 侧边栏位置 */
  sidebarPosition: SidebarPosition;

  /** 字体大小 (12-24) */
  fontSize: number;

  /** 创建时间戳 */
  createdAt: number;

  /** 更新时间戳 */
  updatedAt: number;
}
```

**src/setting/schemas.ts** (Zod 验证器):

```typescript
import { z } from 'zod';

// 时间格式验证 (HH:mm)
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const NotificationSettingsSchema = z
  .object({
    enabled: z.boolean(),
    channels: z.array(z.enum(['push', 'email', 'sms'])),
    doNotDisturbStart: z.string().regex(timeFormatRegex, 'Time must be in HH:mm format'),
    doNotDisturbEnd: z.string().regex(timeFormatRegex, 'Time must be in HH:mm format'),
    soundEnabled: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.enabled) return true;
      return data.channels.length > 0;
    },
    { message: 'At least one channel must be selected when notifications are enabled' },
  )
  .refine(
    (data) => {
      const start = data.doNotDisturbStart.split(':').map(Number);
      const end = data.doNotDisturbEnd.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      return startMinutes < endMinutes;
    },
    { message: 'doNotDisturbStart must be before doNotDisturbEnd' },
  );

export const ShortcutSettingsSchema = z.record(z.string(), z.string());

export const UserPreferenceServerDTOSchema = z.object({
  uuid: z.string().uuid(),
  accountUuid: z.string().uuid(),
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.enum(['zh-CN', 'en-US', 'ja-JP']),
  notifications: NotificationSettingsSchema,
  shortcuts: ShortcutSettingsSchema,
  sidebarPosition: z.enum(['left', 'right']),
  fontSize: z.number().int().min(12).max(24),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});
```

### Domain 层代码示例

**src/setting/errors/InvalidThemeError.ts**:

```typescript
import { DomainError } from '@dailyuse/utils';

export class InvalidThemeError extends DomainError {
  constructor(theme: string) {
    super(
      'INVALID_THEME',
      `Invalid theme: ${theme}. Allowed values: light, dark, auto`,
      { theme },
      400,
    );
  }
}
```

**src/setting/entities/UserPreference.ts** (核心实体):

```typescript
import type {
  UserPreferenceServerDTO,
  ThemeType,
  LanguageType,
  NotificationSettings,
  ShortcutSettings,
  SidebarPosition,
} from '@dailyuse/contracts';
import {
  InvalidThemeError,
  InvalidLanguageError,
  InvalidNotificationSettingsError,
  InvalidFontSizeError,
} from '../errors';

export class UserPreference {
  private _uuid: string;
  private _accountUuid: string;
  private _theme: ThemeType;
  private _language: LanguageType;
  private _notifications: NotificationSettings;
  private _shortcuts: ShortcutSettings;
  private _sidebarPosition: SidebarPosition;
  private _fontSize: number;
  private _createdAt: number;
  private _updatedAt: number;

  constructor(props: Omit<UserPreferenceServerDTO, 'uuid'>, uuid?: string) {
    this._uuid = uuid ?? crypto.randomUUID();
    this._accountUuid = props.accountUuid;
    this._theme = props.theme;
    this._language = props.language;
    this._notifications = props.notifications;
    this._shortcuts = props.shortcuts;
    this._sidebarPosition = props.sidebarPosition;
    this._fontSize = props.fontSize;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;

    this.validateFontSize(this._fontSize);
  }

  // Getters
  get uuid(): string {
    return this._uuid;
  }
  get accountUuid(): string {
    return this._accountUuid;
  }
  get theme(): ThemeType {
    return this._theme;
  }
  get language(): LanguageType {
    return this._language;
  }
  get notifications(): NotificationSettings {
    return this._notifications;
  }
  get shortcuts(): ShortcutSettings {
    return this._shortcuts;
  }
  get sidebarPosition(): SidebarPosition {
    return this._sidebarPosition;
  }
  get fontSize(): number {
    return this._fontSize;
  }
  get createdAt(): number {
    return this._createdAt;
  }
  get updatedAt(): number {
    return this._updatedAt;
  }

  /**
   * 更新主题
   */
  public updateTheme(theme: ThemeType): void {
    if (!['light', 'dark', 'auto'].includes(theme)) {
      throw new InvalidThemeError(theme);
    }
    this._theme = theme;
    this._updatedAt = Date.now();
  }

  /**
   * 更新语言
   */
  public updateLanguage(language: LanguageType): void {
    if (!['zh-CN', 'en-US', 'ja-JP'].includes(language)) {
      throw new InvalidLanguageError(language);
    }
    this._language = language;
    this._updatedAt = Date.now();
  }

  /**
   * 更新通知设置
   */
  public updateNotificationSettings(settings: NotificationSettings): void {
    this.validateNotificationSettings(settings);
    this._notifications = settings;
    this._updatedAt = Date.now();
  }

  /**
   * 更新快捷键设置
   */
  public updateShortcuts(shortcuts: ShortcutSettings): void {
    // TODO: 添加快捷键冲突检测
    this._shortcuts = shortcuts;
    this._updatedAt = Date.now();
  }

  /**
   * 更新字体大小
   */
  public updateFontSize(size: number): void {
    this.validateFontSize(size);
    this._fontSize = size;
    this._updatedAt = Date.now();
  }

  /**
   * 更新侧边栏位置
   */
  public updateSidebarPosition(position: SidebarPosition): void {
    if (!['left', 'right'].includes(position)) {
      throw new Error('Invalid sidebar position');
    }
    this._sidebarPosition = position;
    this._updatedAt = Date.now();
  }

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): UserPreferenceServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      theme: this._theme,
      language: this._language,
      notifications: this._notifications,
      shortcuts: this._shortcuts,
      sidebarPosition: this._sidebarPosition,
      fontSize: this._fontSize,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // Private validation methods
  private validateFontSize(size: number): void {
    if (size < 12 || size > 24) {
      throw new InvalidFontSizeError(size);
    }
  }

  private validateNotificationSettings(settings: NotificationSettings): void {
    // 验证时间格式
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(settings.doNotDisturbStart)) {
      throw new InvalidNotificationSettingsError('Invalid doNotDisturbStart format');
    }
    if (!timeRegex.test(settings.doNotDisturbEnd)) {
      throw new InvalidNotificationSettingsError('Invalid doNotDisturbEnd format');
    }

    // 验证时间顺序
    const [startH, startM] = settings.doNotDisturbStart.split(':').map(Number);
    const [endH, endM] = settings.doNotDisturbEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    if (startMinutes >= endMinutes) {
      throw new InvalidNotificationSettingsError(
        'doNotDisturbStart must be before doNotDisturbEnd',
      );
    }

    // 验证启用通知时必须选择至少一个渠道
    if (settings.enabled && settings.channels.length === 0) {
      throw new InvalidNotificationSettingsError(
        'At least one channel must be selected when notifications are enabled',
      );
    }
  }
}
```

---

## ✅ Definition of Done

这个 Story 被认为完成，当且仅当：

### 功能完整性

- [x] 所有 Contracts 类型定义完成并导出
- [x] Zod 验证器覆盖所有 DTO 字段
- [x] UserPreference 实体实现所有业务方法
- [x] 所有验证逻辑正确实现

### 代码质量

- [x] TypeScript strict 模式无错误
- [x] ESLint 无警告
- [x] 所有公共方法有 JSDoc 注释
- [x] 单元测试覆盖率 ≥ 80%

### 测试

- [x] 所有单元测试通过 (npm test)
- [x] 测试覆盖成功场景和失败场景
- [x] 错误抛出测试通过

### 文档

- [x] README 已更新 (如有新依赖)
- [x] 接口文档完整 (JSDoc)

### Code Review

- [x] Code Review 完成 (至少 1 人)
- [x] Code Review 反馈已解决

---

## 📊 预估时间

| 任务               | 预估时间   |
| ------------------ | ---------- |
| Contracts 层开发   | 1.5 小时   |
| Domain 层开发      | 2 小时     |
| 单元测试编写       | 1.5 小时   |
| Code Review & 修复 | 1 小时     |
| **总计**           | **6 小时** |

**Story Points**: 2 SP (对应 6 小时工作量)

---

## 🔗 依赖关系

### 上游依赖

- 无 (这是 Sprint 1 的第一个 Story)

### 下游依赖

- STORY-SETTING-001-002 (Application Service) 依赖此 Story
- STORY-SETTING-001-003 (Infrastructure) 依赖此 Story

---

## 🚨 风险与注意事项

### 技术风险

1. **Zod 验证性能**: 复杂嵌套验证可能影响性能
   - 缓解: 考虑使用 lazy validation
2. **JSON 类型复杂度**: shortcuts 是动态键名
   - 缓解: 使用 Record<string, string> 类型

### 业务风险

1. **快捷键冲突检测**: 完整的冲突检测逻辑复杂
   - 缓解: 本 Story 只做基础实现，STORY-008 中完善

---

## 📝 开发笔记

### 技术决策

- 使用 Zod 而非 class-validator: 更轻量，更好的 TypeScript 集成
- 使用 DomainError 基类: 统一错误处理
- 使用 crypto.randomUUID(): 原生 UUID 生成，无需额外依赖

### 待讨论问题

- 是否需要支持更多语言？(当前只有 3 种)
- 快捷键设置是否需要版本控制？

---

**Story 创建日期**: 2025-10-21  
**Story 创建者**: SM Bob  
**最后更新**: 2025-10-21

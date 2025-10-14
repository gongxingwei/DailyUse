# Setting 模块接口设计

## 模块概述

Setting 模块负责管理系统设置，包括应用设置、用户设置、系统配置等。支持设置的层级管理和配置同步。

## 设计决策

### 时间戳统一使用 `number` (epoch milliseconds)
- ✅ **所有层次统一**: Persistence / Server / Client / Entity 都使用 `number`
- ✅ **性能优势**: 传输、存储、序列化性能提升 70%+
- ✅ **date-fns 兼容**: 完全支持 `number | Date` 参数
- ✅ **零转换成本**: 跨层传递无需 `toISOString()` / `new Date()`

### 完整的双向转换方法
- ✅ **To Methods**: `toServerDTO()`, `toClientDTO()`, `toPersistenceDTO()`
- ✅ **From Methods**: `fromServerDTO()`, `fromClientDTO()`, `fromPersistenceDTO()`

## 领域模型层次

```
Setting (聚合根)
├── SettingGroup (实体 - 设置分组)
├── SettingItem (实体 - 设置项)
└── SettingHistory (实体 - 设置历史)

AppConfig (聚合根 - 应用配置)
└── (系统级配置)

UserSetting (聚合根 - 用户设置)
└── (用户级设置)
```

---

## 1. Setting (聚合根)

### 业务描述
设置是系统配置的统一管理，支持层级结构和类型校验。

### Server 接口

```typescript
export interface SettingServer {
  // ===== 基础属性 =====
  uuid: string;
  key: string; // 唯一标识，如 'app.theme.mode'
  name: string;
  description?: string | null;
  
  // ===== 值类型 =====
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY' | 'OBJECT';
  value: any; // 根据 valueType 类型不同
  defaultValue: any;
  
  // ===== 作用域 =====
  scope: 'SYSTEM' | 'USER' | 'DEVICE';
  accountUuid?: string | null; // scope=USER 时必填
  deviceId?: string | null; // scope=DEVICE 时必填
  
  // ===== 分组 =====
  groupUuid?: string | null;
  
  // ===== 验证规则 =====
  validation?: {
    required: boolean;
    min?: number | null; // 数字最小值或字符串最小长度
    max?: number | null; // 数字最大值或字符串最大长度
    pattern?: string | null; // 正则表达式
    enum?: any[] | null; // 枚举值
    custom?: string | null; // 自定义验证函数名
  } | null;
  
  // ===== UI 配置 =====
  ui?: {
    inputType: 'TEXT' | 'NUMBER' | 'SWITCH' | 'SELECT' | 'RADIO' | 'CHECKBOX' | 'SLIDER' | 'COLOR' | 'FILE';
    label?: string | null;
    placeholder?: string | null;
    helpText?: string | null;
    icon?: string | null;
    order: number; // 排序
    visible: boolean;
    disabled: boolean;
  } | null;
  
  // ===== 状态 =====
  isEncrypted: boolean; // 是否加密存储
  isReadOnly: boolean; // 是否只读
  isSystemSetting: boolean; // 是否为系统设置
  
  // ===== 同步配置 =====
  syncConfig?: {
    enabled: boolean;
    syncToCloud: boolean;
    syncToDevices: boolean;
  } | null;
  
  // ===== 历史记录 (子实体) =====
  history: SettingHistoryServer[];
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  
  // ===== 业务方法 =====
  
  // 值管理
  setValue(newValue: any): void;
  resetToDefault(): void;
  getValue(): any;
  getTypedValue<T>(): T;
  
  // 验证
  validate(value: any): { isValid: boolean; errors: string[] };
  
  // 加密
  encrypt(): void;
  decrypt(): any;
  
  // 同步
  sync(): Promise<void>;
  
  // 历史记录
  addHistory(oldValue: any, newValue: any, operator?: string): void;
  getHistory(limit?: number): SettingHistoryServer[];
  
  // 查询
  isDefault(): boolean;
  hasChanged(): boolean;
  
  // DTO 转换方法
  toServerDTO(): SettingServerDTO;
  toClientDTO(): SettingClientDTO;
  toPersistenceDTO(): SettingPersistenceDTO;
  
  // 静态工厂方法
  fromServerDTO(dto: SettingServerDTO): SettingServer;
  fromClientDTO(dto: SettingClientDTO): SettingServer;
  fromPersistenceDTO(dto: SettingPersistenceDTO): SettingServer;
}
```

### Client 接口

```typescript
export interface SettingClient {
  // ===== 基础属性 =====
  uuid: string;
  key: string;
  name: string;
  description?: string | null;
  valueType: string;
  value: any;
  defaultValue: any;
  scope: string;
  accountUuid?: string | null;
  deviceId?: string | null;
  groupUuid?: string | null;
  
  // ===== 验证规则 =====
  validation?: {
    required: boolean;
    min?: number | null;
    max?: number | null;
    pattern?: string | null;
    enum?: any[] | null;
  } | null;
  
  // ===== UI 配置 =====
  ui?: {
    inputType: string;
    label?: string | null;
    placeholder?: string | null;
    helpText?: string | null;
    icon?: string | null;
    order: number;
    visible: boolean;
    disabled: boolean;
  } | null;
  
  // ===== 状态 =====
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  
  // ===== 同步配置 =====
  syncConfig?: {
    enabled: boolean;
    syncToCloud: boolean;
    syncToDevices: boolean;
  } | null;
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  
  // ===== UI 计算属性 =====
  isDeleted: boolean;
  isDefault: boolean;
  hasChanged: boolean;
  displayName: string;
  displayValue: string;
  canEdit: boolean;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getDisplayName(): string;
  getDisplayValue(): string;
  getInputComponent(): string;
  getValidationText(): string;
  
  // 验证
  validate(value: any): { isValid: boolean; errors: string[] };
  
  // 操作判断
  canEdit(): boolean;
  canReset(): boolean;
  canSync(): boolean;
  
  // 操作
  setValue(value: any): void;
  reset(): void;
  
  // DTO 转换
  toServerDTO(): SettingServerDTO;
}
```

---

## 2. SettingGroup (实体)

### 业务描述
设置分组用于组织和分类设置项。

### Server 接口

```typescript
export interface SettingGroupServer {
  // ===== 基础属性 =====
  uuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  
  // ===== 层级结构 =====
  parentGroupUuid?: string | null;
  path: string; // 路径，如 'app/appearance/theme'
  level: number; // 层级深度
  
  // ===== 排序 =====
  sortOrder: number;
  
  // ===== 设置项 (子实体) =====
  settings: SettingItemServer[];
  
  // ===== 状态 =====
  isSystemGroup: boolean;
  isCollapsed: boolean; // UI 展开/折叠状态
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  
  // ===== 业务方法 =====
  
  // 分组管理
  addSetting(setting: SettingItemServer): void;
  removeSetting(settingUuid: string): void;
  reorderSettings(settingUuids: string[]): void;
  
  // 查询
  getSettings(): SettingItemServer[];
  getSettingByKey(key: string): SettingItemServer | null;
  
  // 状态管理
  collapse(): void;
  expand(): void;
  softDelete(): void;
  restore(): void;
  
  // DTO 转换方法
  toServerDTO(): SettingGroupServerDTO;
  toClientDTO(): SettingGroupClientDTO;
  toPersistenceDTO(): SettingGroupPersistenceDTO;
  
  // 静态工厂方法
  fromServerDTO(dto: SettingGroupServerDTO): SettingGroupServer;
  fromClientDTO(dto: SettingGroupClientDTO): SettingGroupServer;
  fromPersistenceDTO(dto: SettingGroupPersistenceDTO): SettingGroupServer;
}
```

### Client 接口

```typescript
export interface SettingGroupClient {
  // ===== 基础属性 =====
  uuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  parentGroupUuid?: string | null;
  path: string;
  level: number;
  sortOrder: number;
  
  // ===== 设置项 =====
  settings: SettingItemClient[];
  
  // ===== 状态 =====
  isSystemGroup: boolean;
  isCollapsed: boolean;
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  
  // ===== UI 计算属性 =====
  isDeleted: boolean;
  settingCount: number;
  displayName: string;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getDisplayName(): string;
  getIcon(): string;
  getBreadcrumbs(): string[];
  
  // 操作判断
  canEdit(): boolean;
  canDelete(): boolean;
  
  // 操作
  toggle(): void;
  
  // DTO 转换
  toServerDTO(): SettingGroupServerDTO;
}
```

---

## 3. SettingItem (实体)

### 业务描述
设置项表示单个设置配置。

### Server 接口

```typescript
export interface SettingItemServer {
  // ===== 基础属性 =====
  uuid: string;
  groupUuid: string;
  key: string;
  name: string;
  description?: string | null;
  
  // ===== 值 =====
  value: any;
  defaultValue: any;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY' | 'OBJECT';
  
  // ===== UI 配置 =====
  ui: {
    inputType: 'TEXT' | 'NUMBER' | 'SWITCH' | 'SELECT' | 'RADIO' | 'CHECKBOX' | 'SLIDER' | 'COLOR' | 'FILE';
    label?: string | null;
    placeholder?: string | null;
    helpText?: string | null;
    options?: Array<{ label: string; value: any }> | null; // for SELECT, RADIO
    min?: number | null; // for NUMBER, SLIDER
    max?: number | null; // for NUMBER, SLIDER
    step?: number | null; // for NUMBER, SLIDER
  };
  
  // ===== 排序 =====
  sortOrder: number;
  
  // ===== 状态 =====
  isReadOnly: boolean;
  isVisible: boolean;
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  
  // ===== 业务方法 =====
  
  // 值管理
  setValue(newValue: any): void;
  resetToDefault(): void;
  
  // 查询
  getGroup(): Promise<SettingGroupServer>;
  isDefault(): boolean;
  
  // DTO 转换方法
  toServerDTO(): SettingItemServerDTO;
  toClientDTO(): SettingItemClientDTO;
  toPersistenceDTO(): SettingItemPersistenceDTO;
  
  // 静态工厂方法
  fromServerDTO(dto: SettingItemServerDTO): SettingItemServer;
  fromClientDTO(dto: SettingItemClientDTO): SettingItemServer;
  fromPersistenceDTO(dto: SettingItemPersistenceDTO): SettingItemServer;
}
```

### Client 接口

```typescript
export interface SettingItemClient {
  // ===== 基础属性 =====
  uuid: string;
  groupUuid: string;
  key: string;
  name: string;
  description?: string | null;
  value: any;
  defaultValue: any;
  valueType: string;
  
  // ===== UI 配置 =====
  ui: {
    inputType: string;
    label?: string | null;
    placeholder?: string | null;
    helpText?: string | null;
    options?: Array<{ label: string; value: any }> | null;
    min?: number | null;
    max?: number | null;
    step?: number | null;
  };
  
  // ===== 排序 =====
  sortOrder: number;
  
  // ===== 状态 =====
  isReadOnly: boolean;
  isVisible: boolean;
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  
  // ===== UI 计算属性 =====
  isDefault: boolean;
  displayValue: string;
  canEdit: boolean;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getDisplayValue(): string;
  getInputComponent(): string;
  
  // 操作判断
  canEdit(): boolean;
  canReset(): boolean;
  
  // DTO 转换
  toServerDTO(): SettingItemServerDTO;
}
```

---

## 4. SettingHistory (实体)

### 业务描述
设置历史记录用于追踪设置的变更。

### Server 接口

```typescript
export interface SettingHistoryServer {
  // ===== 基础属性 =====
  uuid: string;
  settingUuid: string;
  settingKey: string;
  
  // ===== 变更信息 =====
  oldValue: any;
  newValue: any;
  
  // ===== 操作者 =====
  operatorUuid?: string | null;
  operatorType: 'USER' | 'SYSTEM' | 'API';
  
  // ===== 时间戳 =====
  createdAt: number;
  
  // ===== 业务方法 =====
  
  // 查询
  getSetting(): Promise<SettingServer>;
  
  // DTO 转换方法
  toServerDTO(): SettingHistoryServerDTO;
  toClientDTO(): SettingHistoryClientDTO;
  toPersistenceDTO(): SettingHistoryPersistenceDTO;
  
  // 静态工厂方法
  fromServerDTO(dto: SettingHistoryServerDTO): SettingHistoryServer;
  fromClientDTO(dto: SettingHistoryClientDTO): SettingHistoryServer;
  fromPersistenceDTO(dto: SettingHistoryPersistenceDTO): SettingHistoryServer;
}
```

### Client 接口

```typescript
export interface SettingHistoryClient {
  // ===== 基础属性 =====
  uuid: string;
  settingUuid: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  operatorUuid?: string | null;
  operatorType: string;
  createdAt: number;
  
  // ===== UI 扩展 =====
  operatorName?: string | null;
  timeAgo: string;
  changeText: string; // "从 'dark' 改为 'light'"
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getChangeText(): string;
  getOperatorText(): string;
  getIcon(): string;
  
  // DTO 转换
  toServerDTO(): SettingHistoryServerDTO;
}
```

---

## 5. AppConfig (聚合根)

### 业务描述
应用配置是系统级别的配置，对所有用户生效。

### Server 接口

```typescript
export interface AppConfigServer {
  // ===== 基础属性 =====
  uuid: string;
  version: string; // 配置版本
  
  // ===== 应用信息 =====
  app: {
    name: string;
    version: string;
    buildNumber: string;
    environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  };
  
  // ===== 功能开关 =====
  features: {
    goals: boolean;
    tasks: boolean;
    schedules: boolean;
    reminders: boolean;
    repositories: boolean;
    aiAssistant: boolean;
    collaboration: boolean;
    analytics: boolean;
  };
  
  // ===== 系统限制 =====
  limits: {
    maxAccountsPerDevice: number;
    maxGoalsPerAccount: number;
    maxTasksPerAccount: number;
    maxSchedulesPerAccount: number;
    maxRemindersPerAccount: number;
    maxRepositoriesPerAccount: number;
    maxFileSize: number; // bytes
    maxStorageSize: number; // bytes
  };
  
  // ===== API 配置 =====
  api: {
    baseUrl: string;
    timeout: number; // ms
    retryCount: number;
    retryDelay: number; // ms
  };
  
  // ===== 安全配置 =====
  security: {
    sessionTimeout: number; // minutes
    maxLoginAttempts: number;
    lockoutDuration: number; // minutes
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecialChars: boolean;
    twoFactorEnabled: boolean;
  };
  
  // ===== 通知配置 =====
  notifications: {
    enabled: boolean;
    channels: {
      inApp: boolean;
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    rateLimit: {
      maxPerHour: number;
      maxPerDay: number;
    };
  };
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  
  // ===== 业务方法 =====
  
  // 功能管理
  enableFeature(feature: string): void;
  disableFeature(feature: string): void;
  isFeatureEnabled(feature: string): boolean;
  
  // 限制检查
  checkLimit(limitType: string, currentValue: number): boolean;
  
  // 配置更新
  updateAppInfo(info: Partial<AppConfigServer['app']>): void;
  updateLimits(limits: Partial<AppConfigServer['limits']>): void;
  updateApiConfig(config: Partial<AppConfigServer['api']>): void;
  updateSecurityConfig(config: Partial<AppConfigServer['security']>): void;
  
  // DTO 转换方法
  toServerDTO(): AppConfigServerDTO;
  toClientDTO(): AppConfigClientDTO;
  toPersistenceDTO(): AppConfigPersistenceDTO;
  
  // 静态工厂方法
  fromServerDTO(dto: AppConfigServerDTO): AppConfigServer;
  fromClientDTO(dto: AppConfigClientDTO): AppConfigServer;
  fromPersistenceDTO(dto: AppConfigPersistenceDTO): AppConfigServer;
}
```

### Client 接口

```typescript
export interface AppConfigClient {
  // ===== 基础属性 =====
  uuid: string;
  version: string;
  
  // ===== 应用信息 =====
  app: {
    name: string;
    version: string;
    buildNumber: string;
    environment: string;
  };
  
  // ===== 功能开关 =====
  features: {
    goals: boolean;
    tasks: boolean;
    schedules: boolean;
    reminders: boolean;
    repositories: boolean;
    aiAssistant: boolean;
    collaboration: boolean;
    analytics: boolean;
  };
  
  // ===== 系统限制 =====
  limits: {
    maxAccountsPerDevice: number;
    maxGoalsPerAccount: number;
    maxTasksPerAccount: number;
    maxSchedulesPerAccount: number;
    maxRemindersPerAccount: number;
    maxRepositoriesPerAccount: number;
    maxFileSize: number;
    maxStorageSize: number;
  };
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  
  // ===== UI 计算属性 =====
  appVersionText: string; // "v1.0.0 (1234)"
  environmentText: string;
  enabledFeaturesCount: number;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getAppVersionText(): string;
  getEnvironmentBadge(): { text: string; color: string };
  getEnabledFeatures(): string[];
  
  // 功能检查
  isFeatureEnabled(feature: string): boolean;
  canCreateGoal(currentCount: number): boolean;
  canCreateTask(currentCount: number): boolean;
  canUploadFile(fileSize: number): boolean;
  
  // DTO 转换
  toServerDTO(): AppConfigServerDTO;
}
```

---

## 6. UserSetting (聚合根)

### 业务描述
用户设置是用户级别的配置，只对当前用户生效。

### Server 接口

```typescript
export interface UserSettingServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  
  // ===== 外观设置 =====
  appearance: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    accentColor: string;
    fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    fontFamily?: string | null;
    compactMode: boolean;
  };
  
  // ===== 语言和区域 =====
  locale: {
    language: string; // 'zh-CN', 'en-US', etc.
    timezone: string;
    dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
    timeFormat: '12H' | '24H';
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    currency: string; // 'CNY', 'USD', etc.
  };
  
  // ===== 工作流设置 =====
  workflow: {
    defaultTaskView: 'LIST' | 'KANBAN' | 'CALENDAR';
    defaultGoalView: 'LIST' | 'TREE' | 'TIMELINE';
    defaultScheduleView: 'DAY' | 'WEEK' | 'MONTH';
    autoSave: boolean;
    autoSaveInterval: number; // seconds
    confirmBeforeDelete: boolean;
  };
  
  // ===== 快捷键 =====
  shortcuts: {
    enabled: boolean;
    custom: Record<string, string>; // { 'createTask': 'Ctrl+N', ... }
  };
  
  // ===== 隐私设置 =====
  privacy: {
    profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
    showOnlineStatus: boolean;
    allowSearchByEmail: boolean;
    allowSearchByPhone: boolean;
    shareUsageData: boolean;
  };
  
  // ===== 实验性功能 =====
  experimental: {
    enabled: boolean;
    features: string[]; // ['feature-a', 'feature-b', ...]
  };
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  
  // ===== 业务方法 =====
  
  // 外观管理
  updateAppearance(appearance: Partial<UserSettingServer['appearance']>): void;
  updateTheme(theme: 'LIGHT' | 'DARK' | 'AUTO'): void;
  
  // 语言和区域
  updateLocale(locale: Partial<UserSettingServer['locale']>): void;
  updateLanguage(language: string): void;
  updateTimezone(timezone: string): void;
  
  // 工作流
  updateWorkflow(workflow: Partial<UserSettingServer['workflow']>): void;
  
  // 快捷键
  updateShortcut(action: string, shortcut: string): void;
  removeShortcut(action: string): void;
  
  // 隐私
  updatePrivacy(privacy: Partial<UserSettingServer['privacy']>): void;
  
  // 实验性功能
  enableExperimentalFeature(feature: string): void;
  disableExperimentalFeature(feature: string): void;
  
  // DTO 转换方法
  toServerDTO(): UserSettingServerDTO;
  toClientDTO(): UserSettingClientDTO;
  toPersistenceDTO(): UserSettingPersistenceDTO;
  
  // 静态工厂方法
  fromServerDTO(dto: UserSettingServerDTO): UserSettingServer;
  fromClientDTO(dto: UserSettingClientDTO): UserSettingServer;
  fromPersistenceDTO(dto: UserSettingPersistenceDTO): UserSettingServer;
}
```

### Client 接口

```typescript
export interface UserSettingClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  
  // ===== 外观设置 =====
  appearance: {
    theme: string;
    accentColor: string;
    fontSize: string;
    fontFamily?: string | null;
    compactMode: boolean;
  };
  
  // ===== 语言和区域 =====
  locale: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    weekStartsOn: number;
    currency: string;
  };
  
  // ===== 工作流设置 =====
  workflow: {
    defaultTaskView: string;
    defaultGoalView: string;
    defaultScheduleView: string;
    autoSave: boolean;
    autoSaveInterval: number;
    confirmBeforeDelete: boolean;
  };
  
  // ===== 快捷键 =====
  shortcuts: {
    enabled: boolean;
    custom: Record<string, string>;
  };
  
  // ===== 隐私设置 =====
  privacy: {
    profileVisibility: string;
    showOnlineStatus: boolean;
    allowSearchByEmail: boolean;
    allowSearchByPhone: boolean;
    shareUsageData: boolean;
  };
  
  // ===== 实验性功能 =====
  experimental: {
    enabled: boolean;
    features: string[];
  };
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  
  // ===== UI 计算属性 =====
  themeText: string;
  languageText: string;
  experimentalFeatureCount: number;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getThemeText(): string;
  getLanguageText(): string;
  getShortcutText(action: string): string;
  
  // 快捷键查询
  getShortcut(action: string): string | null;
  hasShortcut(action: string): boolean;
  
  // 实验性功能
  hasExperimentalFeature(feature: string): boolean;
  
  // DTO 转换
  toServerDTO(): UserSettingServerDTO;
}
```

---

## 值对象 (Value Objects)

### ValidationRule
```typescript
export interface ValidationRule {
  required: boolean;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  enum?: any[] | null;
  custom?: string | null;
}
```

### UIConfig
```typescript
export interface UIConfig {
  inputType: 'TEXT' | 'NUMBER' | 'SWITCH' | 'SELECT' | 'RADIO' | 'CHECKBOX' | 'SLIDER' | 'COLOR' | 'FILE';
  label?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  icon?: string | null;
  order: number;
  visible: boolean;
  disabled: boolean;
}
```

### SyncConfig
```typescript
export interface SyncConfig {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;
}
```

---

## 仓储接口

### ISettingRepository
```typescript
export interface ISettingRepository {
  save(setting: SettingServer): Promise<void>;
  findByUuid(uuid: string): Promise<SettingServer | null>;
  findByKey(key: string, scope: string, accountUuid?: string): Promise<SettingServer | null>;
  findByScope(scope: string, accountUuid?: string): Promise<SettingServer[]>;
  findByGroup(groupUuid: string): Promise<SettingServer[]>;
  
  // 批量操作
  saveMultiple(settings: SettingServer[]): Promise<void>;
  resetToDefaults(accountUuid: string): Promise<void>;
}
```

### IAppConfigRepository
```typescript
export interface IAppConfigRepository {
  get(): Promise<AppConfigServer>;
  save(config: AppConfigServer): Promise<void>;
}
```

### IUserSettingRepository
```typescript
export interface IUserSettingRepository {
  findByAccountUuid(accountUuid: string): Promise<UserSettingServer | null>;
  save(setting: UserSettingServer): Promise<void>;
  delete(accountUuid: string): Promise<void>;
}
```

---

## 领域服务

### SettingValidationService
```typescript
export interface SettingValidationService {
  validate(setting: SettingServer, value: any): { isValid: boolean; errors: string[] };
  validateRule(rule: ValidationRule, value: any, valueType: string): { isValid: boolean; error?: string };
}
```

### SettingSyncService
```typescript
export interface SettingSyncService {
  syncToCloud(accountUuid: string, settings: SettingServer[]): Promise<void>;
  syncFromCloud(accountUuid: string): Promise<SettingServer[]>;
  syncToDevices(accountUuid: string, settings: SettingServer[]): Promise<void>;
  resolveConflicts(local: SettingServer[], remote: SettingServer[]): SettingServer[];
}
```

---

## 应用层服务

### SettingService
```typescript
export interface SettingService {
  // CRUD 操作
  getSetting(key: string, scope: string, accountUuid?: string): Promise<SettingServer | null>;
  getSettings(scope: string, accountUuid?: string): Promise<SettingServer[]>;
  updateSetting(key: string, value: any, scope: string, accountUuid?: string): Promise<SettingServer>;
  resetSetting(key: string, scope: string, accountUuid?: string): Promise<void>;
  
  // 批量操作
  updateMultiple(updates: Array<{ key: string; value: any }>, scope: string, accountUuid?: string): Promise<void>;
  resetAll(accountUuid: string): Promise<void>;
  
  // 分组管理
  getSettingGroups(): Promise<SettingGroupServer[]>;
  getSettingsByGroup(groupUuid: string): Promise<SettingServer[]>;
  
  // 应用配置
  getAppConfig(): Promise<AppConfigServer>;
  updateAppConfig(config: Partial<AppConfigServer>): Promise<AppConfigServer>;
  
  // 用户设置
  getUserSetting(accountUuid: string): Promise<UserSettingServer>;
  updateUserSetting(accountUuid: string, setting: Partial<UserSettingServer>): Promise<UserSettingServer>;
  
  // 同步
  syncSettings(accountUuid: string): Promise<void>;
  
  // 导入导出
  exportSettings(accountUuid: string): Promise<any>;
  importSettings(accountUuid: string, data: any): Promise<void>;
}
```

---

## 总结

### 聚合根
- **Setting**: 1 个聚合根（包含 SettingGroup、SettingItem、SettingHistory）
- **AppConfig**: 1 个聚合根（应用配置）
- **UserSetting**: 1 个聚合根（用户设置）

### 实体
- **SettingGroup**: 设置分组（Setting 的子实体）
- **SettingItem**: 设置项（SettingGroup 的子实体）
- **SettingHistory**: 设置历史（Setting 的子实体）

### 值对象
- ValidationRule
- UIConfig
- SyncConfig

### 领域服务
- SettingValidationService（设置验证）
- SettingSyncService（设置同步）

### 关键设计原则
1. **Server 侧重业务逻辑**: 完整的业务方法、领域规则
2. **Client 侧重 UI 展示**: 格式化方法、UI 状态、快捷操作
3. **时间戳统一**: 全部使用 epoch ms (number)
4. **层级管理**: 支持设置分组和层级结构
5. **类型安全**: 强类型值和验证规则
6. **UI 配置**: 每个设置项都有 UI 配置
7. **多作用域**: 系统、用户、设备级别的设置
8. **同步支持**: 设置可以同步到云端和多设备
9. **历史追踪**: 记录设置的变更历史
10. **加密支持**: 敏感设置可以加密存储

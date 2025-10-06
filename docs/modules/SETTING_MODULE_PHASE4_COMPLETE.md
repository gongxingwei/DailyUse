# Setting Module Refactoring - Phase 4 Complete ✅

## Phase 4: Domain-Client 创建

**Status**: ✅ Completed  
**Duration**: ~25 minutes  
**Date**: 2024-10-06

---

## 完成内容

### 1. UserPreferences 客户端实现

创建了 `packages/domain-client/src/setting/aggregates/UserPreferences.ts` (~550 lines)

#### 核心特性
- **继承**: `extends UserPreferencesCore` (来自 @dailyuse/domain-core)
- **实现接口**: `implements IUserPreferencesClient`
- **实现抽象方法**: toDTO(), toClientDTO(), toPersistence()
- **客户端特定逻辑**: UI 计算属性、浏览器检测、本地化、通知管理

---

## UI 计算属性实现

### 1. 语言和时区

```typescript
get languageText(): string {
  const languageMap = {
    'zh-CN': '简体中文',
    'en-US': 'English',
    'ja-JP': '日本語',
    'ko-KR': '한국어',
  };
  return languageMap[this._language] || this._language;
}

get timezoneText(): string {
  const timezoneMap = {
    'Asia/Shanghai': 'GMT+8 上海',
    'Asia/Tokyo': 'GMT+9 东京',
    'America/New_York': 'GMT-5 纽约',
    // ... 7 个常用时区
  };
  return timezoneMap[this._timezone] || this._timezone;
}
```

**优势**:
- 用户友好的显示文本
- 支持降级（未知值显示原始值）
- 本地化支持

### 2. 主题相关

```typescript
get themeModeIcon(): string {
  const iconMap = {
    light: 'mdi-white-balance-sunny',   // 太阳图标
    dark: 'mdi-weather-night',          // 月亮图标
    system: 'mdi-theme-light-dark',     // 系统图标
  };
  return iconMap[this._themeMode];
}

get themeModeText(): string {
  const modeMap = {
    light: '浅色',
    dark: '深色',
    system: '跟随系统',
  };
  return modeMap[this._themeMode];
}

get canChangeTheme(): boolean {
  return true; // 客户端始终允许
}
```

**Material Design Icons 集成**:
- 统一的图标风格
- 直接用于 UI 渲染
- 语义化图标选择

### 3. 通知状态

```typescript
get hasEmailEnabled(): boolean {
  return this._emailNotifications;
}

get hasPushEnabled(): boolean {
  return this._pushNotifications;
}
```

**简化的访问器**:
- 减少 UI 层的属性访问复杂度
- 提供一致的命名约定

### 4. 时间格式化

```typescript
get formattedCreatedAt(): string {
  return this.formatDateTime(this._createdAt);
}

get formattedUpdatedAt(): string {
  return this.formatDateTime(this._updatedAt);
}

private formatDateTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return new Intl.DateTimeFormat(this._locale, options).format(date);
}
```

**本地化时间**:
- 使用 Intl API
- 根据用户 locale 格式化
- 降级处理（失败时返回 ISO 字符串）

---

## 浏览器检测功能

### 1. 自动检测语言

```typescript
private static detectBrowserLanguage(): string {
  if (typeof navigator !== 'undefined' && navigator.language) {
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) return 'zh-CN';
    if (browserLang.startsWith('en')) return 'en-US';
    if (browserLang.startsWith('ja')) return 'ja-JP';
    if (browserLang.startsWith('ko')) return 'ko-KR';
  }
  return 'zh-CN'; // 默认简体中文
}
```

### 2. 自动检测时区

```typescript
private static detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
  } catch (error) {
    return 'Asia/Shanghai';
  }
}
```

### 3. 自动检测系统主题

```typescript
private static detectSystemTheme(): 'light' | 'dark' | 'system' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  }
  return 'system';
}
```

### 4. 检查推送支持

```typescript
private static checkPushSupport(): boolean {
  if (typeof window !== 'undefined') {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
  return false;
}
```

**智能默认值**:
- 首次使用时自动配置最佳设置
- 提升用户体验
- 减少手动配置

---

## 高级客户端功能

### 1. 系统主题监听

```typescript
public watchSystemThemeChange(
  callback: (theme: 'light' | 'dark') => void
): () => void {
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    if (this._themeMode === 'system') {
      callback(e.matches ? 'dark' : 'light');
    }
  };

  darkModeQuery.addEventListener('change', handleChange);
  return () => darkModeQuery.removeEventListener('change', handleChange);
}
```

**使用示例**:
```typescript
const preferences = UserPreferences.fromDTO(data);
const cleanup = preferences.watchSystemThemeChange((theme) => {
  console.log('System theme changed to:', theme);
  applyTheme(theme);
});

// 清理监听器
cleanup();
```

**特性**:
- 实时响应系统主题变化
- 仅在 `themeMode === 'system'` 时触发
- 返回清理函数防止内存泄漏

### 2. 获取实际主题

```typescript
public getEffectiveTheme(): 'light' | 'dark' {
  if (this._themeMode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
    }
    return 'light';
  }
  return this._themeMode as 'light' | 'dark';
}
```

**用途**:
- 解析 `system` 模式为实际主题
- 用于应用主题 CSS

### 3. 通知权限管理

```typescript
public async checkNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

public async requestNotificationPermission(): Promise<NotificationPermission> {
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      this.setNotifications(true); // 自动启用通知
    }
    return permission;
  }
  return Notification.permission;
}
```

**完整流程**:
```typescript
const preferences = UserPreferences.fromDTO(data);

// 1. 检查当前权限
const currentPermission = await preferences.checkNotificationPermission();

// 2. 请求权限（如果需要）
if (currentPermission === 'default') {
  const permission = await preferences.requestNotificationPermission();
  console.log('Permission:', permission); // 'granted' | 'denied' | 'default'
}
```

### 4. 本地存储集成

```typescript
public toLocalStorage(): string {
  return JSON.stringify(this.toDTO());
}

static fromLocalStorage(json: string): UserPreferences | null {
  try {
    const data = JSON.parse(json) as UserPreferencesDTO;
    return UserPreferences.fromDTO(data);
  } catch (error) {
    console.error('Failed to parse UserPreferences:', error);
    return null;
  }
}
```

**使用示例**:
```typescript
// 保存到 localStorage
localStorage.setItem('userPreferences', preferences.toLocalStorage());

// 从 localStorage 恢复
const stored = localStorage.getItem('userPreferences');
if (stored) {
  const preferences = UserPreferences.fromLocalStorage(stored);
}
```

---

## 辅助 UI 方法

### 1. 默认模块显示

```typescript
public getDefaultModuleText(): string {
  const moduleMap = {
    goal: '目标管理',
    task: '任务管理',
    editor: '编辑器',
    schedule: '日程安排',
  };
  return moduleMap[this._defaultModule] || this._defaultModule;
}

public getDefaultModuleIcon(): string {
  const iconMap = {
    goal: 'mdi-target',
    task: 'mdi-check-circle',
    editor: 'mdi-file-document-edit',
    schedule: 'mdi-calendar',
  };
  return iconMap[this._defaultModule] || 'mdi-apps';
}
```

### 2. 主题预览

```typescript
public previewThemeMode(mode: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (mode === 'system') {
    return this.getEffectiveTheme();
  }
  return mode;
}
```

**用途**:
- UI 设置页面的实时预览
- 不保存到实际偏好

---

## 工厂方法

### 1. 从 DTO 创建

```typescript
static fromDTO(data: UserPreferencesDTO): UserPreferences {
  return new UserPreferences({ ...data });
}
```

### 2. 从 ClientDTO 创建

```typescript
static fromClientDTO(data: UserPreferencesClientDTO): UserPreferences {
  // 忽略 UI 计算属性，只使用基础数据
  return UserPreferences.fromDTO({
    uuid: data.uuid,
    accountUuid: data.accountUuid,
    // ... 所有基础字段
  });
}
```

### 3. 创建智能默认值

```typescript
static createDefault(accountUuid: string, uuid?: string): UserPreferences {
  return new UserPreferences({
    uuid: uuid || UserPreferences.generateUUID(),
    accountUuid,
    language: this.detectBrowserLanguage(),      // 自动检测
    timezone: this.detectBrowserTimezone(),       // 自动检测
    themeMode: this.detectSystemTheme(),          // 自动检测
    pushNotifications: this.checkPushSupport(),   // 检查支持
    // ... 其他默认值
  });
}
```

**智能初始化**:
- 自动检测浏览器语言、时区、主题
- 检测推送支持情况
- 提供最佳默认体验

---

## toClientDTO 实现

```typescript
public toClientDTO(): UserPreferencesClientDTO {
  return {
    ...this.toDTO(),
    // UI 计算属性
    languageText: this.languageText,
    timezoneText: this.timezoneText,
    themeModeIcon: this.themeModeIcon,
    themeModeText: this.themeModeText,
    canChangeTheme: this.canChangeTheme,
    hasEmailEnabled: this.hasEmailEnabled,
    hasPushEnabled: this.hasPushEnabled,
    formattedCreatedAt: this.formattedCreatedAt,
    formattedUpdatedAt: this.formattedUpdatedAt,
  };
}
```

**完整的 UI 数据**:
- 基础数据（从 toDTO()）
- UI 计算属性（getter 访问）
- 一次调用获取所有前端需要的数据

---

## 与 Domain-Server 对比

| 特性 | Domain-Server | Domain-Client |
|------|---------------|---------------|
| toClientDTO | 简化版（占位符） | 完整实现（真实 UI 属性） |
| 工厂方法 | fromPersistence, fromDTO, createDefault | fromDTO, fromClientDTO, createDefault |
| 默认值创建 | 固定值 | 智能检测（browser language/timezone/theme） |
| 特定方法 | resetToDefaults, exportBackup, clone | watchSystemThemeChange, checkNotificationPermission |
| UUID 生成 | crypto.randomUUID() | crypto.randomUUID() + 降级方案 |
| 环境检测 | 无 | detectBrowserLanguage, detectSystemTheme, checkPushSupport |
| 本地存储 | 无 | toLocalStorage, fromLocalStorage |

---

## 代码统计

- **总行数**: ~550 行
- **UI 计算属性**: 9 个 (languageText, themeModeIcon, themeModeText, etc.)
- **浏览器检测方法**: 4 个 (language, timezone, theme, push)
- **工厂方法**: 3 个 (fromDTO, fromClientDTO, createDefault)
- **高级功能**: 5 个 (watchSystemThemeChange, checkNotificationPermission, etc.)
- **辅助 UI 方法**: 3 个 (getDefaultModuleText, getDefaultModuleIcon, previewThemeMode)

---

## 构建验证

```bash
pnpm --filter @dailyuse/domain-client build
# ✅ Success
# ✅ Zero compile errors
```

### 文件验证
```
packages/domain-client/dist/setting/
├── aggregates/
│   ├── UserPreferences.js         ✅
│   ├── UserPreferences.d.ts       ✅
│   └── index.js                   ✅
└── index.js                        ✅
```

---

## 目录结构

```
packages/domain-client/src/setting/
├── aggregates/
│   ├── UserPreferences.ts         # ✨ 新增 (~550 lines)
│   └── index.ts                   # ✨ 新增
└── index.ts                        # ✨ 新增
```

---

## 使用示例

### 1. 基础使用

```typescript
import { UserPreferences } from '@dailyuse/domain-client';

// 从 API 响应创建
const preferences = UserPreferences.fromDTO(apiResponse.preferences);

// 获取 UI 数据
const clientData = preferences.toClientDTO();
console.log(clientData.languageText);      // '简体中文'
console.log(clientData.themeModeIcon);     // 'mdi-white-balance-sunny'
console.log(clientData.formattedCreatedAt); // '2024/10/06 16:45:30'
```

### 2. 主题切换

```typescript
// 切换主题
preferences.switchThemeMode('dark');

// 获取实际应用的主题
const effectiveTheme = preferences.getEffectiveTheme();
applyTheme(effectiveTheme);

// 监听系统主题变化
const cleanup = preferences.watchSystemThemeChange((theme) => {
  applyTheme(theme);
});
```

### 3. 通知管理

```typescript
// 请求通知权限
const permission = await preferences.requestNotificationPermission();
if (permission === 'granted') {
  console.log('Notifications enabled!');
}

// 启用推送通知
preferences.setPushNotifications(true);
```

### 4. 本地存储

```typescript
// 保存到 localStorage
localStorage.setItem('prefs', preferences.toLocalStorage());

// 恢复
const stored = UserPreferences.fromLocalStorage(
  localStorage.getItem('prefs')!
);
```

---

## 后续阶段预览

### Phase 5: API 层重构（下一步）

需要更新的文件：

1. **UserPreferencesRepositoryPrisma.ts**
   ```typescript
   import { UserPreferences, IUserPreferencesRepository } from '@dailyuse/domain-server';
   
   export class UserPreferencesRepositoryPrisma implements IUserPreferencesRepository {
     async findByAccountUuid(accountUuid: string): Promise<UserPreferences | null> {
       const data = await this.prisma.userPreferences.findUnique({ 
         where: { accountUuid } 
       });
       if (!data) return null;
       return UserPreferences.fromPersistence(data);
     }
     
     async save(preferences: UserPreferences): Promise<UserPreferences> {
       const data = await this.prisma.userPreferences.upsert({
         where: { uuid: preferences.uuid },
         update: preferences.toPersistence(),
         create: preferences.toPersistence(),
       });
       return UserPreferences.fromPersistence(data);
     }
   }
   ```

2. **UserPreferencesService.ts**
   ```typescript
   import { UserPreferences, IUserPreferencesRepository } from '@dailyuse/domain-server';
   
   export class UserPreferencesService {
     async getByAccountUuid(accountUuid: string): Promise<UserPreferencesDTO> {
       let preferences = await this.repository.findByAccountUuid(accountUuid);
       if (!preferences) {
         preferences = UserPreferences.createDefault(accountUuid);
         await this.repository.save(preferences);
       }
       return preferences.toDTO();
     }
   }
   ```

3. **UserPreferencesController.ts**
   - 更新导入
   - 使用新的 DTO 类型
   - 保持 API 接口不变

---

## 总结

**Phase 4** 成功创建了功能完整的客户端实现，提供了丰富的 UI 功能。

**关键成果**:
1. ✅ 完整的 UserPreferences 客户端实现 (~550 行)
2. ✅ 9 个 UI 计算属性（语言、主题、时区、格式化时间）
3. ✅ 4 个浏览器智能检测方法
4. ✅ 系统主题监听和实时响应
5. ✅ 通知权限管理（Notification API）
6. ✅ 本地存储集成
7. ✅ 构建验证通过（零编译错误）

**架构价值**:
- UI 层数据准备完整（toClientDTO 一次获取所有 UI 数据）
- 智能默认值（自动检测浏览器环境）
- 实时响应系统变化（主题监听）
- 完整的权限管理（通知 API）
- 本地化支持（Intl API 时间格式化）

**用户体验提升**:
- 首次使用自动配置最佳设置
- 实时响应系统主题变化
- 友好的显示文本和图标
- 本地化的时间格式
- 流畅的通知权限请求

**下一步**: Phase 5 - API 层重构，更新 Repository、Service、Controller 使用新包

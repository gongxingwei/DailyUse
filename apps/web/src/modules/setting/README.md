# User Setting Module - Web Frontend

## 📋 概述

本模块实现了用户设置管理功能，遵循严格的 DDD（领域驱动设计）架构标准。

## 🏗️ 架构分层

```
apps/web/src/modules/setting/
├── presentation/           # 表现层
│   ├── views/             # 页面视图
│   │   └── UserSettingsView.vue
│   ├── components/        # UI 组件
│   │   ├── AppearanceSettings.vue
│   │   ├── LocaleSettings.vue
│   │   ├── WorkflowSettings.vue
│   │   ├── ShortcutSettings.vue
│   │   ├── PrivacySettings.vue
│   │   └── ExperimentalSettings.vue
│   ├── composables/       # 组合式 API
│   │   └── useUserSetting.ts
│   └── stores/            # 状态管理
│       └── userSettingStore.ts
├── application/           # 应用层
│   └── services/
│       └── UserSettingWebApplicationService.ts
├── infrastructure/        # 基础设施层
│   └── api/
│       └── userSettingApiClient.ts
└── index.ts              # 模块导出
```

## 🔗 依赖关系

```
packages/domain-client/    # 领域层（实体）
└── src/setting/
    ├── aggregates/
    │   └── UserSetting.ts        # ⭐ 核心实体
    └── interfaces/
        └── UserSettingClient.ts  # 接口定义

packages/contracts/        # 契约层（DTO）
└── src/modules/setting/
    ├── api-requests.ts           # 请求类型
    ├── api-responses.ts          # 响应类型
    └── aggregates/
        ├── UserSettingClient.ts  # 客户端 DTO
        └── UserSettingServer.ts  # 服务端 DTO
```

## 📊 数据流转

### 1. 查询流程（API → Store）
```
API 返回 ClientDTO
  ↓
UserSetting.fromClientDTO(dto)  // DTO → Entity
  ↓
Store 存储 Entity
  ↓
Composable 读取 Entity
  ↓
Component 使用 Entity
```

### 2. 命令流程（Component → API）
```
Component 触发操作
  ↓
Composable 调用 Application Service
  ↓
Application Service 调用 API Client
  ↓
API Client 发送请求
  ↓
API 返回 ClientDTO
  ↓
UserSetting.fromClientDTO(dto)  // DTO → Entity
  ↓
Store 更新 Entity
```

### 3. 持久化流程（LocalStorage）
```
Store Entity
  ↓
entity.toClientDTO()  // Entity → DTO
  ↓
JSON.stringify()
  ↓
localStorage.setItem()

=== 恢复 ===

localStorage.getItem()
  ↓
JSON.parse()
  ↓
UserSetting.fromClientDTO(dto)  // DTO → Entity
  ↓
Store Entity
```

## 🎯 关键架构决策

### ✅ Store 存储实体，不是 DTO
```typescript
// ✅ 正确
const userSetting = ref<UserSetting | null>(null);

// ❌ 错误
const userSetting = ref<UserSettingClientDTO | null>(null);
```

**原因**：
- 实体包含业务逻辑（getThemeText(), hasShortcut() 等）
- 实体提供类型安全和方法约束
- 遵循 DDD 原则：UI 层使用领域实体

### ✅ DTO ↔ Entity 转换在边界发生
```typescript
// API → Store：DTO to Entity
const dto = await apiClient.getUserSetting(uuid);
const entity = UserSetting.fromClientDTO(dto);
store.setUserSetting(entity);

// Store → LocalStorage：Entity to DTO
const entity = store.getUserSetting;
const dto = entity.toClientDTO();
localStorage.setItem('userSetting', JSON.stringify(dto));
```

### ✅ Singleton 模式
```typescript
// Application Service - Singleton
export class UserSettingWebApplicationService {
  private static instance: UserSettingWebApplicationService | null = null;
  
  public static async getInstance() { /* ... */ }
}

// API Client - Singleton
export class UserSettingApiClient { /* ... */ }
export const userSettingApiClient = new UserSettingApiClient();
```

## 📦 组件功能

### 1. AppearanceSettings.vue
- 主题模式（浅色/深色/自动）
- 强调色
- 字体大小
- 字体家族
- 紧凑模式

### 2. LocaleSettings.vue
- 显示语言（中文、英文、日文等）
- 时区
- 日期格式
- 时间格式（12H/24H）
- 每周开始日
- 货币单位

### 3. WorkflowSettings.vue
- 默认任务视图（列表/看板/日历）
- 默认目标视图（列表/树形/时间线）
- 默认日程视图（日/周/月）
- 自动保存开关
- 自动保存间隔
- 删除前确认

### 4. ShortcutSettings.vue
- 启用快捷键开关
- 自定义快捷键映射
- 10+ 预定义快捷键
- 实时按键捕获
- 恢复默认功能

### 5. PrivacySettings.vue
- 个人资料可见性（公开/仅好友/私密）
- 显示在线状态
- 允许通过邮箱搜索
- 允许通过手机搜索
- 共享使用数据

### 6. ExperimentalSettings.vue
- 实验性功能总开关
- 可用功能列表
- 功能启用/禁用
- 警告提示

## 🚀 使用方法

### 在路由中注册
```typescript
// router/index.ts
import { UserSettingsView } from '@/modules/setting';

const routes = [
  {
    path: '/settings',
    name: 'UserSettings',
    component: UserSettingsView,
    meta: { requiresAuth: true }
  }
];
```

### 在组件中使用
```vue
<script setup lang="ts">
import { useUserSetting } from '@/modules/setting';

const {
  userSetting,        // 当前设置实体
  loading,            // 加载状态
  currentTheme,       // 当前主题
  currentLanguage,    // 当前语言
  switchTheme,        // 切换主题
  switchLanguage,     // 切换语言
  updateAppearance,   // 更新外观
  updateWorkflow,     // 更新工作流
} = useUserSetting();

// 切换主题
await switchTheme('DARK');

// 切换语言
await switchLanguage('en-US');

// 批量更新外观设置
await updateAppearance({
  theme: 'DARK',
  accentColor: '#1976d2',
  fontSize: 'LARGE',
});
</script>
```

### 使用轻量级 Composable（只读）
```vue
<script setup lang="ts">
import { useUserSettingData } from '@/modules/setting';

// 只读访问，不触发网络请求
const {
  userSetting,
  currentTheme,
  currentLanguage,
  themeText,
  languageText,
  autoSaveEnabled,
  shortcutsEnabled,
} = useUserSettingData();
</script>
```

## 🔧 开发指南

### 添加新的设置项

1. **更新 Contracts**（如果需要新类型）
```typescript
// packages/contracts/src/modules/setting/api-requests.ts
export interface UpdateNewFeatureRequest {
  newProperty?: string;
}
```

2. **更新 Domain Client**（如果需要新属性）
```typescript
// packages/domain-client/src/setting/aggregates/UserSetting.ts
export class UserSetting extends AggregateRoot {
  private _newFeature: { newProperty: string };
  
  get newFeature() { return this._newFeature; }
  
  // 添加业务方法
  getNewFeatureText(): string { /* ... */ }
}
```

3. **更新 API Client**（如果需要新接口）
```typescript
// infrastructure/api/userSettingApiClient.ts
async updateNewFeature(uuid: string, newFeature: UpdateNewFeatureRequest) {
  // ...
}
```

4. **更新 Application Service**
```typescript
// application/services/UserSettingWebApplicationService.ts
async updateNewFeature(uuid: string, newFeature: UpdateNewFeatureRequest) {
  const dto = await userSettingApiClient.updateNewFeature(uuid, newFeature);
  const entity = UserSetting.fromClientDTO(dto);
  this.userSettingStore.updateUserSettingData(entity);
  return entity;
}
```

5. **更新 Composable**
```typescript
// presentation/composables/useUserSetting.ts
const updateNewFeature = async (newFeature: UpdateNewFeatureRequest) => {
  // ...
};
```

6. **创建 UI 组件**
```vue
<!-- presentation/components/NewFeatureSettings.vue -->
<template>
  <!-- UI -->
</template>
```

## ✅ 完成的功能

- [x] Domain Client 实体层
- [x] Contracts 类型定义
- [x] Infrastructure API Client
- [x] Application Service 应用服务
- [x] Presentation Store 状态管理
- [x] Presentation Composable 组合式 API
- [x] AppearanceSettings 组件
- [x] LocaleSettings 组件
- [x] WorkflowSettings 组件
- [x] ShortcutSettings 组件
- [x] PrivacySettings 组件
- [x] ExperimentalSettings 组件
- [x] UserSettingsView 主视图
- [x] 模块统一导出

## 🔄 待完成的功能

- [ ] Router 集成
- [ ] 单元测试（Vitest）
- [ ] E2E 测试（Playwright）
- [ ] 国际化（i18n）集成
- [ ] 主题应用（CSS 变量动态更新）
- [ ] 快捷键全局监听
- [ ] 与后端 API 真实对接测试

## 📝 注意事项

1. **类型安全**：所有类型都来自 `@dailyuse/contracts`
2. **实体存储**：Store 永远存储实体，不是 DTO
3. **DTO 转换**：边界处进行 DTO ↔ Entity 转换
4. **自动保存**：组件支持 `autoSave` prop，可选择立即保存或批量保存
5. **错误处理**：所有异步操作都有 try-catch 和 Snackbar 提示
6. **加载状态**：统一的 loading 状态管理

## 🎓 学习资源

- [DDD 领域驱动设计](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia 状态管理](https://pinia.vuejs.org/)
- [TypeScript 最佳实践](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

## 📞 联系方式

如有问题，请联系 DailyUse 开发团队。

# DailyUse 主题系统

## 概述

DailyUse 应用集成了完整的主题系统，支持浅色模式、深色模式以及自定义主题。本系统基于领域驱动设计（DDD）架构实现，提供了丰富的主题配置和切换功能。

## 功能特性

### 🎨 主题类型
- **浅色主题（Light）**: 适合日间使用的明亮主题
- **深色主题（Dark）**: 适合夜间使用的深色主题
- **自动主题（Auto）**: 根据系统设置自动切换
- **自定义主题（Custom）**: 用户自定义的个性化主题

### ⚙️ 配置选项
- **跟随系统主题**: 自动根据操作系统的主题设置进行切换
- **启用动画过渡**: 主题切换时的平滑动画效果
- **定时切换**: 根据时间自动在浅色和深色主题间切换
- **自定义色彩**: 支持自定义主色调、背景色等

### 🔧 技术架构

系统采用完整的 DDD 架构：

```
packages/
├── contracts/          # 契约层 - 类型定义和接口
│   └── src/modules/theme/
├── domain-core/        # 核心领域层 - 抽象类和接口
│   └── src/theme/
├── domain-server/      # 服务端领域层 - 业务逻辑实现
│   └── src/theme/
├── domain-client/      # 客户端领域层 - 状态管理和服务
│   └── src/theme/
└── apps/web/          # 表现层 - UI 组件和视图
    └── src/modules/theme/
```

## 使用方法

### 1. 基础主题切换

在应用设置页面（`/settings`）中：
- 选择想要的主题类型
- 配置主题选项
- 实时预览效果

### 2. 主题演示页面

访问 `/settings/themes` 查看：
- 所有可用主题列表
- 当前主题详细信息
- 主题配置状态
- 实时切换演示

### 3. 编程接口

在 Vue 组件中使用主题系统：

```vue
<script setup lang="ts">
import { useThemeStore } from '@/modules/theme'

const themeStore = useThemeStore()

// 切换到指定主题
await themeStore.applyTheme('theme-id')

// 获取当前主题信息
const currentTheme = themeStore.currentTheme

// 监听主题变化
watch(() => themeStore.activeTheme, (newTheme) => {
  console.log('主题已切换:', newTheme?.name)
})
</script>
```

### 4. 主题配置

通过 Pinia store 管理主题配置：

```typescript
// 更新主题配置
await themeStore.updateConfig({
  followSystemTheme: true,
  enableTransitions: true,
  autoSwitchTheme: false
})

// 获取配置状态
const config = themeStore.config
```

## 文件结构

### 契约层（Contracts）
- `IThemeDefinition`: 主题定义接口
- `IThemeConfig`: 主题配置接口
- `ThemeType`: 主题类型枚举
- `CreateThemeDto`: 创建主题数据传输对象

### 领域核心层（Domain Core）
- `ThemeDefinitionCore`: 主题定义抽象类
- `ThemeConfigCore`: 主题配置抽象类

### 服务端领域层（Domain Server）
- `ThemeDefinition`: 主题定义实体类
- `ThemeConfig`: 主题配置实体类
- `ThemeService`: 主题业务服务类

### 客户端领域层（Domain Client）
- `useThemeStore`: Pinia 状态管理 store
- `ThemeClientService`: HTTP 客户端服务
- `ThemeApplier`: DOM 主题应用工具

### 表现层（Web）
- `SettingView`: 设置页面（包含主题设置）
- `ThemeDemo`: 主题演示页面
- `ThemeSwitcher`: 主题切换组件
- `useThemeInit`: 主题初始化 composable

## 开发指南

### 添加新主题

1. 在服务端创建新主题：
```typescript
const newTheme = new ThemeDefinition({
  name: '新主题',
  type: 'custom',
  colors: {
    primary: '#1976d2',
    secondary: '#424242'
    // ... 其他颜色定义
  }
})
```

2. 在客户端使用：
```typescript
await themeStore.createTheme(newThemeData)
```

### 自定义主题样式

主题系统会自动生成 CSS 变量：
```css
:root {
  --theme-primary: #1976d2;
  --theme-secondary: #424242;
  /* ... 其他 CSS 变量 */
}
```

### 扩展主题配置

在 `IThemeConfig` 接口中添加新配置项：
```typescript
interface IThemeConfig {
  // 现有配置...
  newOption: boolean; // 新增配置
}
```

## 故障排除

### 常见问题

1. **主题切换不生效**
   - 检查 ThemeApplier 是否正确应用了 CSS 变量
   - 确认组件使用了正确的 CSS 变量名

2. **样式冲突**
   - 确保 Vuetify 主题配置与自定义主题同步
   - 检查是否有硬编码的颜色值覆盖了主题变量

3. **性能问题**
   - 主题切换时启用动画过渡可能影响性能
   - 可以在设置中关闭动画效果

### 调试方法

1. 在浏览器开发者工具中检查 CSS 变量
2. 查看 Pinia DevTools 中的主题 store 状态
3. 在控制台中调用 `themeStore.debug()` 查看详细信息

## 贡献指南

欢迎为主题系统贡献代码：

1. 遵循 DDD 架构模式
2. 在每一层都添加相应的测试
3. 更新相关文档
4. 确保类型安全

## 许可证

本项目遵循 MIT 许可证。
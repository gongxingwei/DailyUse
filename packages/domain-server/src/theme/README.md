# 主题模块实现

主题模块（Theme Module）是 DailyUse 应用的核心功能之一，负责管理应用的主题定义、配置和切换功能。

## 模块架构

基于领域驱动设计（DDD）架构，主题模块分为以下几层：

### 1. 合约层 (packages/contracts/src/modules/theme)
- `types.ts` - 核心类型定义（ThemeType枚举、IThemeDefinition接口等）
- `dtos.ts` - 数据传输对象定义
- `events.ts` - 领域事件定义
- `index.ts` - 统一导出

### 2. 域核心层 (packages/domain-core/src/theme)
- `ThemeCore.ts` - 抽象基类（ThemeDefinitionCore、ThemeConfigCore）
- `index.ts` - 统一导出

### 3. 域服务层 (packages/domain-server/src/theme)
- `aggregates/ThemeServer.ts` - 具体实现类（ThemeDefinition、ThemeConfig）
- `services/ThemeService.ts` - 业务服务类
- `demo.ts` - 使用示例
- `index.ts` - 统一导出

## 核心功能

### 主题定义管理
- 创建自定义主题
- 主题验证（名称、版本格式等）
- CSS变量生成
- 主题配置导入导出

### 主题配置管理
- 当前活跃主题设置
- 系统主题跟随
- 定时主题切换
- 过渡动画配置

### 主题应用
- 实时主题切换
- CSS变量注入
- 主题预览
- 回滚功能

## 主题类型

```typescript
export enum ThemeType {
  LIGHT = 'light',    // 浅色主题
  DARK = 'dark',      // 深色主题  
  AUTO = 'auto',      // 自动主题
  CUSTOM = 'custom'   // 自定义主题
}
```

## 主题结构

每个主题包含以下配置：

```typescript
interface IThemeDefinition {
  id: string;                    // 主题唯一ID
  name: string;                  // 主题名称
  description?: string;          // 主题描述
  type: ThemeType;              // 主题类型
  author?: string;              // 作者
  version: string;              // 版本号
  isBuiltIn: boolean;           // 是否内置主题
  
  // 视觉配置
  colors: ColorPalette;         // 颜色配置
  fonts: FontConfig;            // 字体配置
  spacing: SpacingConfig;       // 间距配置
  borderRadius: BorderRadiusConfig; // 圆角配置
  shadows: ShadowConfig;        // 阴影配置
  animations: AnimationConfig;  // 动画配置
  
  // 元数据
  preview?: string;             // 预览图
  customVariables?: Record<string, string>; // 自定义CSS变量
  createdAt: Date;             // 创建时间
  updatedAt: Date;             // 更新时间
}
```

## 使用示例

### 基本使用

```typescript
import { ThemeService, ThemeDefinition } from '@dailyuse/domain-server';
import { ThemeType } from '@dailyuse/contracts';

// 创建主题服务
const themeService = new ThemeService();

// 创建主题
const result = await themeService.createTheme({
  name: 'My Theme',
  type: ThemeType.LIGHT,
  description: '我的自定义主题'
});

// 应用主题
if (result.success) {
  await themeService.applyTheme({
    themeId: result.theme!.id
  });
}
```

### 直接使用主题类

```typescript
// 创建主题定义
const theme = ThemeDefinition.create({
  name: 'Dark Blue',
  type: ThemeType.DARK,
  author: 'Developer'
});

// 验证主题
const validation = theme.validate();
console.log('验证结果:', validation);

// 生成CSS
const css = theme.generateCSS();
console.log('CSS变量:', css);
```

### 主题配置管理

```typescript
// 获取当前配置
const config = await themeService.getThemeConfig();

// 更新配置
await themeService.updateThemeConfig({
  activeThemeId: 'dark',
  followSystemTheme: true,
  autoSwitchTheme: true,
  lightThemeId: 'light',
  darkThemeId: 'dark',
  switchTimes: {
    dayStart: '06:00',
    nightStart: '18:00'
  }
});

// 自动切换到系统主题
await themeService.switchToSystemTheme();
```

## API 接口

### ThemeService

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|-------|
| `createTheme` | 创建主题 | `CreateThemeRequest` | `ThemeResponse` |
| `getTheme` | 获取主题 | `themeId: string` | `ThemeResponse` |
| `getAllThemes` | 获取所有主题 | - | `{ themes: Array }` |
| `applyTheme` | 应用主题 | `ApplyThemeRequest` | `ThemeApplicationResult` |
| `deleteTheme` | 删除主题 | `themeId: string` | `{ success: boolean }` |
| `getThemeConfig` | 获取配置 | `configId?: string` | `ThemeConfigResponse` |
| `updateThemeConfig` | 更新配置 | `UpdateThemeConfigRequest` | `ThemeConfigResponse` |
| `switchToSystemTheme` | 切换到系统主题 | `configId?: string` | `ThemeApplicationResult` |
| `autoSwitchBasedOnTime` | 基于时间自动切换 | `configId?: string` | `ThemeApplicationResult` |

### ThemeDefinition

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|-------|
| `validate` | 验证主题 | - | `ValidationResult` |
| `generateCSS` | 生成CSS | - | `string` |
| `generateCSSVariables` | 生成CSS变量 | - | `Record<string, string>` |
| `create` | 静态创建方法 | `CreateParams` | `ThemeDefinition` |
| `fromDTO` | 从DTO创建 | `IThemeDefinition` | `ThemeDefinition` |
| `toDTO` | 转换为DTO | - | `IThemeDefinition` |

## 特性

### ✅ 已实现功能
- 完整的DDD架构设计
- 主题定义类型系统
- 主题创建和验证
- CSS变量生成
- 主题配置管理
- 服务层封装
- 默认主题支持

### 🚧 待扩展功能
- 主题导入导出
- 主题商店集成
- 可视化主题编辑器
- 主题继承机制
- 动态主题加载
- 主题性能优化

## 演示

运行演示代码查看完整功能：

```bash
cd packages/domain-server/src/theme
ts-node demo.ts
```

## 注意事项

1. 主题ID必须唯一，建议使用时间戳+随机字符串
2. 内置主题不能删除或修改
3. 主题版本必须遵循语义化版本规范（x.y.z）
4. 自定义CSS变量名建议使用 `--theme-` 前缀
5. 主题切换时会触发相应的领域事件

## 依赖关系

- `@dailyuse/contracts` - 类型定义和合约
- `@dailyuse/domain-core` - 核心抽象类（可选，当前实现为独立版本）
- `@dailyuse/utils` - 工具类库（聚合根基类等）

## 测试

```bash
# 运行单元测试
npm test theme

# 运行集成测试
npm test theme:integration

# 运行演示
npm run theme:demo
```
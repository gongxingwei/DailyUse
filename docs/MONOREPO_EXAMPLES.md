# 大厂开源 Nx MonoRepo 项目案例

## 1. Nx 官方项目

### Nx 本身
- **仓库**: https://github.com/nrwl/nx
- **特点**: 
  - 超大型 MonoRepo (200+ 包)
  - 使用自己的工具管理自己
  - 复杂的依赖关系管理
  - 多种技术栈混合

**学习要点**:
```
nx/
├── packages/           # 核心包
│   ├── nx/            # 核心引擎
│   ├── workspace/     # workspace 管理
│   ├── devkit/        # 开发工具包
│   └── [100+ 插件]    # 各种插件
├── e2e/               # 端到端测试
├── docs/              # 文档站点
└── graph/             # 依赖图可视化
```

## 2. Angular 项目

### Angular
- **仓库**: https://github.com/angular/angular
- **特点**:
  - Google 维护的大型前端框架
  - 使用 Bazel 和 Nx 混合
  - 严格的代码规范和测试

**架构亮点**:
```
angular/
├── packages/          # 核心包
│   ├── core/         # Angular 核心
│   ├── common/       # 通用模块
│   ├── forms/        # 表单模块
│   ├── router/       # 路由模块
│   └── platform-*/   # 平台特定代码
├── aio/              # Angular.io 文档站
├── dev-infra/        # 开发基础设施
└── tools/            # 构建工具
```

## 3. React 生态项目

### Storybook
- **仓库**: https://github.com/storybookjs/storybook
- **特点**:
  - 组件开发工具
  - 支持多种前端框架
  - 插件生态系统

**组织方式**:
```
storybook/
├── code/
│   ├── addons/           # 插件
│   ├── frameworks/       # 框架支持
│   ├── lib/             # 核心库
│   ├── presets/         # 预设配置
│   └── renderers/       # 渲染器
├── docs/                # 文档
└── examples/            # 示例项目
```

### Emotion
- **仓库**: https://github.com/emotion-js/emotion
- **特点**:
  - CSS-in-JS 库
  - 高性能样式解决方案
  - 多包管理

## 4. 企业级项目

### Microsoft FluentUI
- **仓库**: https://github.com/microsoft/fluentui
- **特点**:
  - 微软的设计系统
  - React/Web Components 支持
  - 大规模团队协作

**结构特点**:
```
fluentui/
├── apps/              # 应用
│   ├── public-docsite/   # 文档站点
│   ├── test-bundles/     # 测试包
│   └── vr-tests/         # 视觉回归测试
├── packages/          # 包
│   ├── react/            # React 组件
│   ├── web-components/   # Web 组件
│   ├── utilities/        # 工具库
│   └── tokens/           # 设计令牌
└── tools/             # 工具
```

### Novu (通知基础设施)
- **仓库**: https://github.com/novuhq/novu
- **特点**:
  - 通知服务平台
  - 全栈 TypeScript
  - 微服务架构

**架构设计**:
```
novu/
├── apps/                 # 应用
│   ├── web/             # React 前端
│   ├── api/             # Node.js API
│   ├── worker/          # 后台任务
│   └── ws/              # WebSocket 服务
├── libs/                # 共享库
│   ├── dal/             # 数据访问层
│   ├── shared/          # 共享代码
│   ├── testing/         # 测试工具
│   └── design-system/   # 设计系统
└── packages/            # NPM 包
    ├── node/            # Node.js SDK
    ├── react/           # React 组件
    └── notification-center/ # 通知中心
```

## 5. 中国公司案例

### Ant Design
- **仓库**: https://github.com/ant-design/ant-design
- **特点**:
  - 阿里巴巴设计语言
  - 多框架支持
  - 国际化

### ByteDance - Semi Design
- **仓库**: https://github.com/DouyinFE/semi-design
- **特点**:
  - 字节跳动设计系统
  - 现代化构建工具
  - 高质量组件库

## 学习要点总结

### 1. 目录组织模式
- **apps/** - 可运行的应用程序
- **libs/** - 共享库和模块
- **tools/** - 开发工具和脚本
- **docs/** - 文档和说明

### 2. 命名约定
- 使用 `@scope/package-name` 格式
- 清晰的范围划分 (web, api, shared)
- 功能导向的命名

### 3. 依赖管理
- 明确的依赖层次
- 避免循环依赖
- 使用 tags 控制依赖方向

### 4. 工具配置
- 统一的代码规范
- 自动化测试和构建
- 版本管理和发布流程

### 5. 文档和示例
- 清晰的 README
- API 文档
- 使用示例和最佳实践

## 推荐学习顺序

1. **Nx 官方仓库** - 了解 Nx 本身的组织方式
2. **Novu** - 学习全栈 TypeScript 项目结构
3. **Storybook** - 学习组件库的组织方式
4. **FluentUI** - 学习大型设计系统的管理
5. **你的项目特定需求** - 结合实际情况调整

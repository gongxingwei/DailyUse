# MonoRepo 迁移清单

## 第一阶段：目录结构重组 ✅

### 1. 基础目录迁移
- [ ] 创建标准 Nx MonoRepo 目录结构
  - [ ] `libs/` 目录用于共享库
  - [ ] `apps/` 目录用于应用程序
  - [ ] `tools/` 目录用于构建工具

### 2. 现有目录迁移
- [ ] `packages/` → `libs/`
  - [ ] `packages/contracts/` → `libs/contracts/`
  - [ ] `packages/domain-client/` → `libs/domain/client/`
  - [ ] `packages/domain-core/` → `libs/domain/core/`
  - [ ] `packages/domain-server/` → `libs/domain/server/`
  - [ ] `packages/ui/` → `libs/shared/ui/`
  - [ ] `packages/utils/` → `libs/shared/utils/`

### 3. 应用程序目录整理
- [ ] 确认 `apps/web/` 和 `apps/api/` 已存在
- [ ] 迁移 `electron/` → `apps/desktop/`
- [ ] 清理根目录的 `src/` (与 `apps/web/src/` 重复)

### 4. 共享模块重组
- [ ] `common/` → `libs/shared/`
  - [ ] `common/modules/` → `libs/domain/` (按功能拆分)
  - [ ] `common/shared/` → `libs/shared/`

## 第二阶段：配置文件更新

### 1. TypeScript 配置
- [ ] 更新 `tsconfig.base.json` 路径映射
- [ ] 为每个库和应用创建独立的 `tsconfig.json`
- [ ] 验证路径解析正确性

### 2. Package.json 更新
- [ ] 更新根目录 `package.json` 脚本
- [ ] 为每个库创建 `package.json`
- [ ] 更新工作区依赖引用

### 3. Nx 配置优化
- [ ] 应用推荐的 `nx.json` 配置
- [ ] 为每个项目创建优化的 `project.json`
- [ ] 配置依赖规则和标签策略

## 第三阶段：代码重构

### 1. 导入路径更新
- [ ] 批量更新所有文件的导入路径
- [ ] 使用新的路径映射 (`@dailyuse/*`)
- [ ] 验证所有导入正确解析

### 2. 功能模块拆分
- [ ] 将大型模块拆分为独立的库
- [ ] 确保每个库有明确的职责
- [ ] 建立合理的依赖关系

### 3. 共享代码提取
- [ ] 识别重复代码并提取到共享库
- [ ] 创建通用的工具和类型库
- [ ] 建立一致的编码规范

## 第四阶段：构建和部署优化

### 1. 构建配置
- [ ] 配置增量构建
- [ ] 设置构建缓存
- [ ] 优化依赖图

### 2. CI/CD 更新
- [ ] 更新 GitHub Actions 工作流
- [ ] 配置受影响项目的构建
- [ ] 设置并行构建策略

### 3. 开发工具配置
- [ ] 更新 VSCode 配置
- [ ] 配置调试设置
- [ ] 设置开发服务器

## 验证清单

### 构建验证
```bash
# 验证所有项目可以构建
nx run-many --target=build --all

# 验证依赖图
nx graph

# 验证受影响的项目
nx affected --target=build --dry-run
```

### 测试验证
```bash
# 运行所有测试
nx run-many --target=test --all

# 运行受影响的测试
nx affected --target=test
```

### 代码质量验证
```bash
# 运行所有 lint 检查
nx run-many --target=lint --all

# 检查类型
nx run-many --target=type-check --all
```

### 功能验证
- [ ] Web 应用正常启动和运行
- [ ] API 服务正常启动和响应
- [ ] Desktop 应用正常打包和运行
- [ ] 所有模块间通信正常
- [ ] 数据库连接和操作正常

## 性能基准

### 构建时间对比
```bash
# 记录迁移前构建时间
time npm run build

# 记录迁移后构建时间
time nx run-many --target=build --all

# 记录增量构建时间
time nx affected --target=build
```

### 开发体验对比
- [ ] 热重载速度
- [ ] 类型检查速度
- [ ] 测试运行速度
- [ ] Lint 检查速度

## 回滚计划

### 备份策略
- [ ] 创建完整的 Git 分支备份
- [ ] 导出当前的 package.json 配置
- [ ] 记录当前的目录结构

### 回滚步骤
1. 重置到迁移前的 Git 提交
2. 恢复原始的 package.json 配置
3. 删除 Nx 相关配置文件
4. 验证原始功能正常

## 迁移后优化

### 持续改进
- [ ] 监控构建性能
- [ ] 优化依赖关系
- [ ] 改进代码组织
- [ ] 更新文档和指南

### 团队培训
- [ ] Nx 命令使用培训
- [ ] MonoRepo 最佳实践分享
- [ ] 新的开发工作流程
- [ ] 故障排除指南

## 里程碑检查点

### 检查点 1：目录结构 (第1天)
验证新的目录结构已正确创建

### 检查点 2：配置更新 (第2天)
验证所有配置文件已更新且功能正常

### 检查点 3：代码重构 (第3-4天)
验证所有代码已重构且测试通过

### 检查点 4：最终验证 (第5天)
完整的端到端测试和性能验证

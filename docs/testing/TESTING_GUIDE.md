# DailyUse 项目测试指南

## 概述

本项目采用统一的 **Vitest** 测试框架，覆盖所有层级的代码测试需求，包括领域层、API 层和前端应用。

## 🧪 测试架构设计

### 测试金字塔

```
           /\
          /  \     E2E 测试 (少量)
         /____\    
        /      \   集成测试 (适量)  
       /________\
      /          \ 单元测试 (大量)
     /____________\
```

### 测试层级划分

| 层级 | 框架 | 测试类型 | 主要目标 |
|------|------|----------|----------|
| **Domain-Server** | Vitest | 单元测试 | 业务逻辑、实体行为 |
| **Domain-Client** | Vitest + Happy-DOM | 单元测试 | 状态管理、客户端服务 |
| **API** | Vitest + Supertest | 集成测试 | HTTP 端点、数据库交互 |
| **Web** | Vitest + Vue Test Utils | 单元+集成 | 组件行为、用户交互 |

## 📁 文件结构

```
packages/domain-server/
├── vitest.config.ts          # Vitest 配置
├── src/
│   ├── test/
│   │   └── setup.ts          # 测试环境设置
│   └── **/*.test.ts          # 测试文件

packages/domain-client/
├── vitest.config.ts          # Vitest 配置  
├── src/
│   ├── test/
│   │   └── setup.ts          # 客户端测试设置
│   └── **/*.test.ts          # 测试文件

apps/api/
├── vitest.config.ts          # API 测试配置
├── src/
│   ├── test/
│   │   ├── setup.ts          # API 测试环境
│   │   ├── globalSetup.ts    # 全局设置
│   │   └── integration/      # 集成测试
│   └── **/*.test.ts          # 单元测试

apps/web/
├── vite.config.ts            # 包含测试配置
└── src/**/__tests__/         # 前端测试文件
```

## 🛠 测试工具配置

### Domain-Server 测试

**主要用途**: 测试业务逻辑、实体行为、领域服务

```typescript
// packages/domain-server/vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

**测试示例**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { Goal } from '../entities/Goal'

describe('Goal 实体', () => {
  it('应该正确计算目标进度', () => {
    const goal = new Goal({...})
    expect(goal.calculateProgress()).toBe(50)
  })
})
```

### Domain-Client 测试

**主要用途**: 测试状态管理、HTTP 服务、客户端工具

```typescript
// packages/domain-client/vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom', // 支持 DOM 操作
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

**测试示例**:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { useThemeStore } from '../stores/ThemeStore'

describe('ThemeStore', () => {
  it('应该切换主题', async () => {
    const store = useThemeStore()
    await store.applyTheme('dark')
    expect(store.currentTheme?.type).toBe('dark')
  })
})
```

### API 集成测试

**主要用途**: 测试 HTTP 端点、数据库交互、业务流程

```typescript
// apps/api/vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    globalSetup: './src/test/globalSetup.ts',
    testTimeout: 30000, // API 测试需要更长超时
  },
})
```

**测试示例**:
```typescript
import request from 'supertest'
import { describe, it, expect } from 'vitest'

describe('主题 API', () => {
  it('GET /api/themes 应该返回主题列表', async () => {
    const response = await request(app)
      .get('/api/themes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      
    expect(response.body.data).toBeInstanceOf(Array)
  })
})
```

### Web 前端测试

**主要用途**: 测试组件行为、用户交互、视图逻辑

```typescript
// apps/web/vite.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

## 📋 测试最佳实践

### 1. 命名规范

```typescript
// ✅ 好的测试名称
describe('用户登录功能', () => {
  it('应该在凭据正确时返回访问令牌', () => {})
  it('应该在密码错误时抛出 401 错误', () => {})
  it('应该在用户不存在时抛出 404 错误', () => {})
})

// ❌ 不好的测试名称  
describe('login', () => {
  it('works', () => {})
  it('fails', () => {})
})
```

### 2. 测试结构 (AAA 模式)

```typescript
it('应该创建新的目标', async () => {
  // Arrange - 准备数据
  const goalData = {
    name: '学习 TypeScript',
    description: '掌握 TS 高级特性'
  }
  
  // Act - 执行操作
  const goal = new Goal(goalData)
  
  // Assert - 验证结果
  expect(goal.name).toBe('学习 TypeScript')
  expect(goal.isActive).toBe(true)
})
```

### 3. 模拟 (Mocking) 策略

```typescript
// 模拟外部依赖
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  }
}))

// 模拟时间
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2025-09-29'))
})

// 模拟 localStorage
vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
})
```

### 4. 测试数据管理

```typescript
// 使用工厂函数创建测试数据
export const TestDataFactory = {
  createUser: (overrides = {}) => ({
    uuid: 'user-123',
    email: 'test@example.com',
    name: '测试用户',
    ...overrides
  }),
  
  createGoal: (overrides = {}) => ({
    uuid: 'goal-123',
    name: '测试目标',
    startTime: new Date(),
    endTime: new Date(),
    ...overrides
  })
}
```

### 5. 错误测试

```typescript
// 测试边界情况和错误处理
it('应该在输入无效时抛出错误', () => {
  expect(() => {
    new Goal({ name: '' }) // 空名称
  }).toThrow('目标名称不能为空')
})

// 测试异步错误
it('应该处理网络错误', async () => {
  apiClient.get.mockRejectedValue(new Error('网络错误'))
  
  const result = await goalService.getGoals()
  expect(result.success).toBe(false)
})
```

## 🚀 运行测试

### 单独运行测试

```bash
# Domain Server 测试
cd packages/domain-server && pnpm test

# Domain Client 测试
cd packages/domain-client && pnpm test

# API 测试
cd apps/api && pnpm test

# Web 测试
cd apps/web && pnpm test
```

### 使用 Nx 运行测试

```bash
# 运行所有测试
pnpm nx run-many --target=test --all

# 运行特定项目测试
pnpm nx test domain-server
pnpm nx test api
pnpm nx test web

# 运行受影响的项目测试
pnpm nx affected --target=test
```

### 测试覆盖率

```bash
# 生成覆盖率报告
pnpm nx run-many --target=test --all -- --coverage

# 查看覆盖率报告
open coverage/index.html
```

## 📊 CI/CD 集成

### GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: 测试

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: 安装依赖
        run: pnpm install
        
      - name: 运行测试
        run: pnpm nx affected --target=test --parallel=3
        
      - name: 上传覆盖率
        uses: codecov/codecov-action@v3
```

## 🔧 调试测试

### VSCode 配置

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "调试 Vitest",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--reporter=verbose"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 测试调试技巧

```typescript
// 使用 .only 单独运行测试
it.only('应该只运行这个测试', () => {
  // 测试代码
})

// 跳过测试
it.skip('暂时跳过这个测试', () => {
  // 测试代码
})

// 使用 console.log 调试
it('调试测试', () => {
  const result = calculateSomething()
  console.log('计算结果:', result) // 在测试输出中查看
  expect(result).toBe(expected)
})
```

## 📈 测试指标和目标

### 覆盖率目标

| 层级 | 行覆盖率 | 分支覆盖率 | 函数覆盖率 |
|------|----------|------------|------------|
| Domain-Server | ≥ 90% | ≥ 85% | ≥ 95% |
| Domain-Client | ≥ 85% | ≥ 80% | ≥ 90% |
| API | ≥ 80% | ≥ 75% | ≥ 85% |
| Web | ≥ 75% | ≥ 70% | ≥ 80% |

### 性能目标

- 单元测试: < 1s
- 集成测试: < 10s  
- E2E 测试: < 30s
- 总测试时间: < 5min

## 🔍 测试反模式

### 避免的做法

❌ **测试实现细节而非行为**
```typescript
// 不好
it('应该调用 setLoading(true)', () => {
  const spy = vi.spyOn(component, 'setLoading')
  component.fetchData()
  expect(spy).toHaveBeenCalledWith(true)
})

// 好  
it('应该在获取数据时显示加载状态', async () => {
  component.fetchData()
  expect(component.isLoading).toBe(true)
})
```

❌ **测试过于复杂**
```typescript
// 不好 - 一个测试做太多事情
it('应该处理用户完整流程', async () => {
  // 50 行测试代码...
})

// 好 - 拆分为多个独立测试
it('应该验证用户登录', () => {})
it('应该加载用户数据', () => {})  
it('应该更新用户资料', () => {})
```

❌ **共享可变状态**
```typescript
// 不好
let sharedUser = { id: 1, name: 'test' }

it('test 1', () => {
  sharedUser.name = 'modified'
  // 测试代码
})

// 好
beforeEach(() => {
  user = { id: 1, name: 'test' }
})
```

## 📚 学习资源

- [Vitest 官方文档](https://vitest.dev/)
- [Vue Test Utils 文档](https://vue-test-utils.vuejs.org/)
- [Testing Library 最佳实践](https://testing-library.com/docs/guiding-principles/)
- [Jest to Vitest 迁移指南](https://vitest.dev/guide/migration.html)

---

通过遵循这些指南，确保 DailyUse 项目具有高质量、可维护的测试套件，提供可靠的代码质量保障。
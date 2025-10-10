# 接口静态方法修复指南

## 问题描述

TypeScript 接口中不能正确定义静态方法。如果在接口中定义了静态方法，实现该接口的类会遇到类型错误。

### 错误示例

```typescript
// ❌ 错误：接口中包含静态方法
export interface ResourceClient {
  // 实例属性和方法
  uuid: string;
  name: string;
  
  // ❌ 错误：这些应该是静态方法，但在实例接口中
  create(params: {...}): ResourceClient;
  fromServerDTO(dto: ResourceServerDTO): ResourceClient;
  fromClientDTO(dto: ResourceClientDTO): ResourceClient;
}

// 类无法正确实现这个接口
export class Resource implements ResourceClient {
  // 静态方法
  static create(params: {...}): Resource { ... }
  static fromServerDTO(dto: ResourceServerDTO): Resource { ... }
  
  // ❌ 类型错误：静态方法不满足接口要求
}
```

## 解决方案

### 方案 1：拆分接口（推荐）

将实例接口和静态接口分开定义：

```typescript
// ✅ 实例接口（只包含实例成员）
export interface ResourceClient {
  // 实例属性
  uuid: string;
  name: string;
  
  // 实例方法
  toServerDTO(): ResourceServerDTO;
  toClientDTO(): ResourceClientDTO;
  addReference(ref: ResourceReferenceClient): void;
}

// ✅ 静态接口（用于文档和类型约束）
export interface ResourceClientStatic {
  // 静态方法
  create(params: {...}): ResourceClient;
  forCreate(repositoryUuid: string): ResourceClient;
  fromServerDTO(dto: ResourceServerDTO): ResourceClient;
  fromClientDTO(dto: ResourceClientDTO): ResourceClient;
}

// ✅ 类实现实例接口
export class Resource implements ResourceClient {
  // 实例成员
  uuid: string;
  name: string;
  
  toServerDTO(): ResourceServerDTO { ... }
  toClientDTO(): ResourceClientDTO { ... }
  addReference(ref: ResourceReferenceClient): void { ... }
  
  // 静态方法（不需要实现静态接口）
  static create(params: {...}): Resource { ... }
  static forCreate(repositoryUuid: string): Resource { ... }
  static fromServerDTO(dto: ResourceServerDTO): Resource { ... }
  static fromClientDTO(dto: ResourceClientDTO): Resource { ... }
}

// ✅ 使用类型约束（可选）
const ResourceClass: ResourceClientStatic = Resource;
```

### 方案 2：结构化类型（当前使用）

不实现接口，依赖 TypeScript 的结构化类型系统：

```typescript
// 接口定义（保持现状，包含所有成员）
export interface ResourceClient {
  uuid: string;
  name: string;
  create(params: {...}): ResourceClient;  // 实际是静态方法
  toServerDTO(): ResourceServerDTO;
}

// ✅ 类不实现接口，但保持结构兼容
export class Resource {  // 不写 implements ResourceClient
  uuid: string;
  name: string;
  
  // 静态方法
  static create(params: {...}): Resource { ... }
  
  // 实例方法
  toServerDTO(): ResourceServerDTO { ... }
}

// ✅ 类型兼容性由结构化类型保证
const resource: ResourceClient = Resource.create({ ... });  // ✅ 编译通过
```

## 需要修复的文件

### Contracts 包（接口定义）

需要拆分以下接口：

1. **Aggregates**:
   - ✅ `RepositoryServer` → 已拆分为 `RepositoryServer` + `RepositoryServerStatic`
   - ✅ `RepositoryClient` → 已拆分为 `RepositoryClient` + `RepositoryClientStatic`

2. **Entities**:
   - ⏳ `ResourceServer` → 需拆分为 `ResourceServer` + `ResourceServerStatic`
   - ⏳ `ResourceClient` → 需拆分为 `ResourceClient` + `ResourceClientStatic`
   - ⏳ `LinkedContentServer` → 需拆分
   - ⏳ `LinkedContentClient` → 需拆分
   - ⏳ `ResourceReferenceServer` → 需拆分
   - ⏳ `ResourceReferenceClient` → 需拆分
   - ⏳ `RepositoryExplorerServer` → 需拆分
   - ⏳ `RepositoryExplorerClient` → 需拆分

### Domain-Server 包（实现）

✅ `Repository` 类已移除假的实例方法（之前用于绕过接口检查）

### Domain-Client 包（实现）

✅ 所有类都不实现接口，依赖结构化类型

## 实施计划

### 阶段 1：修复 Contracts（当前完成部分）

- [x] 修复 `RepositoryServer` 接口
- [x] 修复 `RepositoryClient` 接口
- [ ] 修复所有实体接口

### 阶段 2：验证实现

- [x] 移除 domain-server 的假实例方法
- [x] 确认 domain-client 不实现接口
- [ ] 运行类型检查确认无错误

### 阶段 3：文档更新

- [x] 创建本文档
- [ ] 更新代码注释说明接口使用方式
- [ ] 更新团队开发规范

## 最佳实践

### DO ✅

1. **将静态方法移到单独的接口中**
2. **使用 `Static` 后缀命名静态接口**（如 `ResourceClientStatic`）
3. **类实现实例接口**（`implements ResourceClient`）
4. **在类上声明静态方法**，不需要实现静态接口
5. **依赖 TypeScript 的结构化类型系统**

### DON'T ❌

1. ❌ **不要在实例接口中定义静态方法**
2. ❌ **不要创建假的实例方法来"实现"静态接口要求**
3. ❌ **不要依赖接口的名义实现**（TypeScript 是结构化类型）

## TypeScript 静态方法接口的限制

TypeScript 不支持在接口中定义静态方法的原因：

1. **接口描述实例形状**：接口用于描述实例对象的形状，不是类本身
2. **静态成员属于类**：静态成员是类对象的属性，不是实例的属性
3. **结构化类型系统**：TypeScript 使用结构化类型，接口匹配基于形状而非名称

### 正确理解

```typescript
// 接口描述实例
interface Cat {
  meow(): void;
}

// 类实现接口
class MyCat implements Cat {
  meow(): void { console.log('meow'); }
  static create(): MyCat { return new MyCat(); }  // 静态方法不是接口的一部分
}

// 实例匹配接口
const cat: Cat = new MyCat();  // ✅
const cat2: Cat = MyCat.create();  // ✅ 结构化类型

// 类本身不匹配实例接口
const CatClass: Cat = MyCat;  // ❌ 类型错误
```

## 参考资料

- [TypeScript Handbook - Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [TypeScript Handbook - Classes](https://www.typescriptlang.org/docs/handbook/classes.html)
- [Why TypeScript Interfaces Don't Support Static Methods](https://github.com/microsoft/TypeScript/issues/14600)


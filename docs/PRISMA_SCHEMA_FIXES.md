# Prisma Schema Repository Fix Guide

## 问题概述

由于数据库模式与Repository代码不匹配，导致TypeScript编译错误。本文档提供系统性修复方案。

## 已修复模块

### ✅ EditorSession Repository
- **文件**: `apps/api/src/modules/editor/infrastructure/repositories/prisma/PrismaEditorSessionRepository.ts`
- **问题**: 使用了不存在的字段 `lastAccessedAt`, `isActive`, `sessionName`, `windowState`
- **解决方案**: 更新为使用正确的数据库字段 `lastSavedAt`, `activeGroupId`, `name`, 以及布局配置字段

## 待修复模块

### 🔧 SettingDefinition Repository
**文件**: `apps/api/src/modules/setting/infrastructure/repositories/prisma/PrismaSettingDefinitionRepository.ts`

**Prisma模式字段** vs **代码中使用的字段**:
```typescript
// 数据库实际字段 -> 代码中错误使用的字段
title               -> name
type                -> dataType  
sortOrder           -> metadataOrder, metadataPriority
tags                -> metadataTags
validationRules     -> validation.min/max/pattern/options
readonly            -> isReadonly
(无对应字段)         -> isRequired, isSystem, groupUuid
```

**修复步骤**:
1. 更新接口定义以匹配Prisma模式
2. 修改所有查询条件使用正确字段名
3. 更新排序和过滤逻辑
4. 移除不存在的字段引用

### 🔧 SettingValue Repository  
**文件**: `apps/api/src/modules/setting/infrastructure/repositories/prisma/PrismaSettingValueRepository.ts`

**问题**: 缺少必需字段 `definitionUuid`, `lastModified`

### 🔧 Task Application Service
**文件**: `apps/api/src/modules/task/application/services/TaskApplicationService.ts`

**问题**: 
- 构造函数参数不匹配
- 使用了不存在的方法 `getDomainEvents()`
- `accountUuid` 字段不存在于某些请求类型中

## 修复策略

### 1. 字段映射策略
对于字段名不匹配的情况，创建映射函数：

```typescript
// 示例：Setting Definition 字段映射
private mapPrismaFieldsToDTO(prismaEntity: any) {
  return {
    name: prismaEntity.title,          // title -> name
    dataType: prismaEntity.type,       // type -> dataType
    metadataOrder: prismaEntity.sortOrder,
    // ... 其他映射
  };
}
```

### 2. 接口更新策略
更新TypeScript接口以匹配Prisma模式：

```typescript
// 更新前
interface ISettingDefinition {
  name: string;
  dataType: string;
  isRequired: boolean;
  // ...
}

// 更新后
interface ISettingDefinition {
  title: string;
  type: string;
  readonly: boolean;
  // ...
}
```

### 3. 查询重写策略
重写Prisma查询以使用正确字段：

```typescript
// 更新前
orderBy: { metadataPriority: 'desc' }

// 更新后  
orderBy: { sortOrder: 'asc' }
```

## 推荐修复顺序

1. **高优先级**: EditorSession ✅ (已完成)
2. **中优先级**: SettingDefinition, SettingValue  
3. **低优先级**: Task相关模块

## 验证步骤

修复每个模块后：

1. 运行类型检查: `npx tsc --noEmit --skipLibCheck [文件路径]`
2. 检查编译错误: 使用VS Code错误面板
3. 确保所有Prisma查询使用有效字段名

## 注意事项

- 在修改接口时，确保其他模块的兼容性
- 某些字段可能需要在应用层进行转换
- 考虑创建适配器模式来处理字段差异
- 保持DTO接口的稳定性，在Repository层处理字段映射

## 最佳实践

1. **一致性**: 确保Repository接口与实际数据库模式一致
2. **映射层**: 在Repository内部处理字段名差异
3. **类型安全**: 始终使用TypeScript类型检查验证修改
4. **文档更新**: 修复后更新相关文档和注释

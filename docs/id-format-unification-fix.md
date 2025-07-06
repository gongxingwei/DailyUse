# ID 格式统一修复总结

## 问题描述

发现了 ID 生成和验证的不一致问题：
- `BasicInfoValidator.ts` 中的 `validateId` 方法验证的是 UUID 格式
- 但是各种 `generateId` 方法生成的是自定义格式的 ID
- 在渲染进程中使用 Node.js 的 `crypto` 模块导致 "Dynamic require of 'crypto' is not supported" 错误

## 解决方案

1. **统一使用标准 UUID 格式**作为实体 ID
2. **创建跨环境的 UUID 工具**，解决浏览器和 Node.js 环境的兼容性问题
3. **修改所有 ID 生成方法**使用统一的工具

### 新增文件

**`src/shared/utils/uuid.ts`** - 跨环境 UUID 工具
```typescript
export function generateUUID(): string {
  // Node.js 环境
  if (typeof window === 'undefined' && typeof require !== 'undefined') {
    try {
      const { randomUUID } = require('crypto');
      return randomUUID();
    } catch (error) {
      // 备用方案
    }
  }
  
  // 浏览器环境 - Web Crypto API
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // 备用 UUID v4 生成方案
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

### 修改的文件

1. **`electron/modules/Task/application/mainTaskApplicationService.ts`** (主进程)
   ```typescript
   import { randomUUID } from "crypto";
   
   private generateId(): string {
     return randomUUID();
   }
   ```

2. **`electron/modules/Task/domain/entities/taskMetaTemplate.ts`** (主进程)
   ```typescript
   import { randomUUID } from "crypto";
   
   private generateId(): string {
     return randomUUID();
   }
   ```

3. **`src/shared/domain/entity.ts`** (渲染进程)
   ```typescript
   import { generateUUID } from "../utils/uuid";
   
   protected static generateId(): string {
     return generateUUID();
   }
   ```

4. **`src/modules/notification/services/notificationService.ts`** (渲染进程)
   ```typescript
   import { generateUUID } from "@/shared/utils/uuid";
   
   private generateId(): string {
     return generateUUID();
   }
   ```

5. **`electron/modules/Task/validation/BasicInfoValidator.ts`** (主进程)
   ```typescript
   import { isValidUUID } from '../../../../src/shared/utils/uuid';
   
   private validateId(id: string): ValidationResult {
     if (!isValidUUID(id)) {
       return ValidationUtils.failure(['任务模板ID格式不正确']);
     }
     return ValidationUtils.success();
   }
   ```

## 环境兼容性

### Node.js 环境（主进程）
- 优先使用 `crypto.randomUUID()`
- 直接导入 `{ randomUUID } from "crypto"`

### 浏览器环境（渲染进程）
- 优先使用 Web Crypto API (`crypto.randomUUID()`)
- 备用方案：手动实现的 UUID v4 生成器
- 通过统一工具 `generateUUID()` 调用

## 解决的问题

1. ✅ **ID 格式不一致**：统一使用 UUID 格式
2. ✅ **环境兼容性**：解决了 "Dynamic require of 'crypto' is not supported" 错误
3. ✅ **验证一致性**：生成的 ID 可以通过验证器
4. ✅ **代码重用**：统一的 UUID 工具可在整个项目中使用

## 测试建议

1. **主进程测试**：
   - 创建新的任务模板，验证 ID 格式正确
   - 验证 ID 通过验证器检查

2. **渲染进程测试**：
   - 确认不再出现 crypto 相关错误
   - 测试 Entity 类的 ID 生成
   - 测试通知服务的 ID 生成

3. **跨环境测试**：
   - 验证生成的 UUID 在不同环境中都是有效的
   - 确认现有数据仍然可以正常访问

## 优势

1. **标准化**：遵循 RFC 4122 UUID v4 标准
2. **兼容性**：支持多种运行环境
3. **一致性**：统一的 ID 格式和验证规则
4. **可维护性**：集中的 UUID 工具，便于维护和升级

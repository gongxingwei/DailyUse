# Prisma 客户端生成指南

## 问题描述

出现错误：

```
Module '"@prisma/client"' has no exported member 'PrismaClient'.ts(2305)
```

这说明 Prisma Client 还没有生成或需要重新生成。

## 解决方案

### 方法 1: 使用 pnpm exec（推荐）

```bash
# 在项目根目录运行
pnpm exec prisma generate --schema=apps/api/prisma/schema.prisma
```

### 方法 2: 使用 Nx 命令

```bash
# 检查是否有 Nx 任务
pnpm nx run api:prisma:generate
```

### 方法 3: 直接使用 prisma 命令

```bash
# 如果全局安装了 prisma
prisma generate --schema=apps/api/prisma/schema.prisma
```

### 方法 4: 使用 pnpm script

可以在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "prisma:generate": "prisma generate --schema=apps/api/prisma/schema.prisma",
    "prisma:migrate": "prisma migrate dev --schema=apps/api/prisma/schema.prisma"
  }
}
```

然后运行：

```bash
pnpm prisma:generate
```

## 生成结果验证

成功的生成输出应该是这样：

```
Prisma schema loaded from apps\api\prisma\schema.prisma

✔ Generated Prisma Client (v6.17.1) to .\node_modules\@prisma\client in 352ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
```

## 常见问题

### Q1: 仍然看到 TypeScript 错误

**A:** 解决方案：

1. 清除 VS Code 缓存

   ```bash
   # 重新启动 TypeScript 服务
   # 在 VS Code 中按 Cmd+Shift+P (macOS) 或 Ctrl+Shift+P (Windows)
   # 输入: TypeScript: Restart TS Server
   ```

2. 重新打开 IDE

3. 验证 `node_modules/@prisma/client` 文件夹存在

### Q2: 命令失败

**A:** 确保：

1. ✅ 在项目根目录运行（包含 `pnpm-workspace.yaml`）
2. ✅ `.env` 文件存在且设置了 `DATABASE_URL`
3. ✅ Prisma schema 文件有效（没有语法错误）

可以验证：

```bash
# 检查 schema 是否有效
pnpm exec prisma validate
```

### Q3: 需要自动生成

**A:** 在 `package.json` 中配置 postinstall 脚本：

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

这样每次 `pnpm install` 后都会自动生成 Prisma Client。

## 相关文件

- **Prisma Schema**: `apps/api/prisma/schema.prisma`
- **生成位置**: `node_modules/@prisma/client`
- **配置**: `apps/api/prisma/schema.prisma` 中的 `generator client` 块

## 正确的导入方式

生成后，可以这样导入：

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

或使用单例模式（推荐）：

```typescript
// shared/db/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
```

## 开发工作流

通常的开发流程是：

1. **修改 schema**：编辑 `prisma/schema.prisma`
2. **生成新的 Client**：运行 `pnpm exec prisma generate`
3. **创建迁移**：运行 `pnpm exec prisma migrate dev --name <migration-name>`
4. **使用新类型**：TypeScript 会自动识别新的数据库模型和类型

## 命令速查

| 命令                           | 说明                      |
| ------------------------------ | ------------------------- |
| `pnpm exec prisma generate`    | 生成 Prisma Client        |
| `pnpm exec prisma validate`    | 验证 schema 有效性        |
| `pnpm exec prisma format`      | 格式化 schema 文件        |
| `pnpm exec prisma migrate dev` | 创建并应用迁移            |
| `pnpm exec prisma db push`     | 同步 schema 到数据库      |
| `pnpm exec prisma studio`      | 打开 Prisma Studio Web UI |

## 完成状态

✅ **已成功执行命令：**

```
pnpm exec prisma generate --schema=apps/api/prisma/schema.prisma
```

✅ **生成结果：**

- Prisma Client v6.17.1 已生成
- 位置：`node_modules/@prisma/client`
- 耗时：352ms

✅ **所有 TypeScript 错误已解决**

- `RegistrationApplicationService.ts` - No errors
- `AccountDeletionApplicationService.ts` - No errors
- `prisma.ts` - No errors

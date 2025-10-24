# 目标文件夹管理流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-18
- **架构模式**: DDD (Goal 模块)
- **相关模块**: Goal
- **业务场景**: 管理目标文件夹（创建、移动、重命名、删除）

---

## 1. 业务概述

### 1.1 业务目标

GoalFolder 用于对目标进行分类和组织。用户需要能够：

- **创建文件夹**: 创建自定义文件夹
- **移动目标**: 将目标移动到不同文件夹
- **重命名文件夹**: 修改文件夹名称
- **删除文件夹**: 删除文件夹（目标移至"全部目标"）
- **文件夹排序**: 调整文件夹显示顺序

### 1.2 系统文件夹（不可删除）

- 📂 **全部目标** (ALL) - 默认文件夹
- ✅ **进行中** (ACTIVE) - 自动筛选激活状态的目标
- 🎯 **已完成** (COMPLETED) - 自动筛选已完成的目标
- 📦 **已归档** (ARCHIVED) - 自动筛选已归档的目标

### 1.3 用户文件夹

- 支持多层级嵌套（建议不超过 3 层）
- 每个文件夹有唯一的 UUID
- 支持自定义颜色和图标
- 删除时不会删除其中的目标

---

## 2. 创建文件夹

### 2.1 API

```http
POST /api/goal-folders
```

### 2.2 请求体

```typescript
interface CreateGoalFolderRequest {
  accountUuid: string;
  name: string; // 必填，1-100 字符
  description?: string | null; // 可选描述
  color?: string | null; // 主题色（hex 格式）
  icon?: string | null; // 图标名称
  parentFolderUuid?: string | null; // 父文件夹 UUID（支持嵌套）
  sortOrder?: number; // 排序
}
```

### 2.3 响应

```typescript
interface CreateGoalFolderResponse {
  folder: GoalFolderClientDTO;
  message: string;
}

interface GoalFolderClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description: string | null;
  type: FolderType; // CUSTOM | SYSTEM
  color: string | null;
  icon: string | null;
  parentFolderUuid: string | null;
  sortOrder: number;
  goalCount: number; // 包含的目标数量
  createdAt: number;
  updatedAt: number;
}
```

### 2.4 领域逻辑

```typescript
// GoalFolder.ts
export class GoalFolder extends AggregateRoot {
  private _accountUuid: string;
  private _name: string;
  private _description: string | null;
  private _type: FolderType;
  private _color: string | null;
  private _icon: string | null;
  private _parentFolderUuid: string | null;
  private _sortOrder: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  public static create(params: {
    accountUuid: string;
    name: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
    parentFolderUuid?: string | null;
    sortOrder?: number;
  }): GoalFolder {
    // 验证
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('文件夹名称不能为空');
    }
    if (params.name.length > 100) {
      throw new Error('文件夹名称不能超过 100 字符');
    }

    const folder = new GoalFolder();
    folder._uuid = folder.generateUUID();
    folder._accountUuid = params.accountUuid;
    folder._name = params.name.trim();
    folder._description = params.description || null;
    folder._type = FolderType.CUSTOM;
    folder._color = params.color || null;
    folder._icon = params.icon || null;
    folder._parentFolderUuid = params.parentFolderUuid || null;
    folder._sortOrder = params.sortOrder || 0;
    folder._createdAt = new Date();
    folder._updatedAt = new Date();

    folder.addDomainEvent({
      eventType: 'GoalFolderCreatedEvent',
      aggregateId: folder._uuid,
      occurredOn: new Date(),
      payload: {
        folderUuid: folder._uuid,
        accountUuid: folder._accountUuid,
        name: folder._name,
      },
    });

    return folder;
  }

  public rename(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('文件夹名称不能为空');
    }

    const oldName = this._name;
    this._name = newName.trim();
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'GoalFolderRenamedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        folderUuid: this._uuid,
        oldName,
        newName: this._name,
      },
    });
  }

  public updateColor(color: string | null): void {
    this._color = color;
    this._updatedAt = new Date();
  }

  public updateIcon(icon: string | null): void {
    this._icon = icon;
    this._updatedAt = new Date();
  }

  public softDelete(): void {
    if (this._type === FolderType.SYSTEM) {
      throw new Error('系统文件夹不能删除');
    }

    this.addDomainEvent({
      eventType: 'GoalFolderDeletedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        folderUuid: this._uuid,
        accountUuid: this._accountUuid,
      },
    });
  }
}
```

### 2.5 应用服务

```typescript
// GoalFolderApplicationService.ts
export class GoalFolderApplicationService {
  async createFolder(request: CreateGoalFolderRequest): Promise<CreateGoalFolderResponse> {
    // 1. 检查同名文件夹
    const exists = await this.folderRepository.existsByName(request.accountUuid, request.name);
    if (exists) {
      throw new Error(`文件夹"${request.name}"已存在`);
    }

    // 2. 验证父文件夹（如果指定）
    if (request.parentFolderUuid) {
      const parentFolder = await this.folderRepository.findByUuid(request.parentFolderUuid);
      if (!parentFolder) {
        throw new Error('父文件夹不存在');
      }
      if (parentFolder.accountUuid !== request.accountUuid) {
        throw new Error('无权访问此父文件夹');
      }
    }

    // 3. 创建文件夹
    const folder = GoalFolder.create(request);

    // 4. 持久化
    await this.folderRepository.save(folder);

    // 5. 发布事件
    this.publishDomainEvents(folder);

    // 6. 返回响应
    return {
      folder: folder.toClientDTO(),
      message: '文件夹创建成功',
    };
  }
}
```

---

## 3. 移动目标到文件夹

### 3.1 API

```http
PATCH /api/goals/:goalUuid/move
```

### 3.2 请求体

```typescript
interface MoveGoalToFolderRequest {
  folderUuid: string | null; // null 表示移到"全部目标"
}
```

### 3.3 领域逻辑

```typescript
// Goal.ts
public moveToFolder(folderUuid: string | null): void {
  const oldFolderUuid = this._folderUuid;
  this._folderUuid = folderUuid;
  this._updatedAt = new Date();

  this.addDomainEvent({
    eventType: 'GoalMovedToFolderEvent',
    aggregateId: this._uuid,
    occurredOn: new Date(),
    payload: {
      goalUuid: this._uuid,
      oldFolderUuid,
      newFolderUuid: folderUuid,
    },
  });
}
```

### 3.4 应用服务

```typescript
async moveGoalToFolder(
  goalUuid: string,
  accountUuid: string,
  request: MoveGoalToFolderRequest
): Promise<GoalClientDTO> {
  // 1. 加载目标
  const goal = await this.goalRepository.findByUuid(goalUuid);
  if (!goal) {
    throw new Error('目标不存在');
  }

  // 2. 权限检查
  if (goal.accountUuid !== accountUuid) {
    throw new Error('无权操作此目标');
  }

  // 3. 验证目标文件夹（如果不为 null）
  if (request.folderUuid) {
    const folder = await this.folderRepository.findByUuid(request.folderUuid);
    if (!folder) {
      throw new Error('目标文件夹不存在');
    }
    if (folder.accountUuid !== accountUuid) {
      throw new Error('无权访问此文件夹');
    }
  }

  // 4. 移动目标
  goal.moveToFolder(request.folderUuid);

  // 5. 持久化
  await this.goalRepository.save(goal);

  // 6. 发布事件
  this.publishDomainEvents(goal);

  // 7. 返回更新后的目标
  return goal.toClientDTO(true);
}
```

---

## 4. 删除文件夹

### 4.1 API

```http
DELETE /api/goal-folders/:folderUuid
```

### 4.2 业务规则

- 系统文件夹不能删除
- 删除文件夹不会删除其中的目标
- 文件夹中的目标会自动移至"全部目标"
- 子文件夹会一并删除（级联）

### 4.3 应用服务

```typescript
async deleteFolder(
  folderUuid: string,
  accountUuid: string
): Promise<void> {
  // 1. 加载文件夹
  const folder = await this.folderRepository.findByUuid(folderUuid);
  if (!folder) {
    throw new Error('文件夹不存在');
  }

  // 2. 权限检查
  if (folder.accountUuid !== accountUuid) {
    throw new Error('无权操作此文件夹');
  }

  // 3. 检查是否为系统文件夹
  if (folder.type === FolderType.SYSTEM) {
    throw new Error('系统文件夹不能删除');
  }

  // 4. 将文件夹中的目标移至"全部目标"
  const goals = await this.goalRepository.findByFolder(folderUuid);
  for (const goal of goals) {
    goal.moveToFolder(null);
    await this.goalRepository.save(goal);
  }

  // 5. 删除子文件夹（递归）
  const subFolders = await this.folderRepository.findByParent(folderUuid);
  for (const subFolder of subFolders) {
    await this.deleteFolder(subFolder.uuid, accountUuid);
  }

  // 6. 删除文件夹
  folder.softDelete();
  await this.folderRepository.delete(folderUuid);

  // 7. 发布事件
  this.publishDomainEvents(folder);
}
```

---

## 5. 前端实现

### 5.1 文件夹列表组件

```vue
<!-- GoalFolderList.vue -->
<template>
  <div class="folder-list">
    <!-- 系统文件夹 -->
    <div class="system-folders">
      <FolderItem
        v-for="folder in systemFolders"
        :key="folder.uuid"
        :folder="folder"
        :active="currentFolderUuid === folder.uuid"
        @click="handleSelectFolder(folder.uuid)"
      />
    </div>

    <el-divider />

    <!-- 自定义文件夹 -->
    <div class="custom-folders">
      <div class="header">
        <span>我的文件夹</span>
        <el-button type="text" icon="Plus" @click="showCreateDialog = true"> 新建 </el-button>
      </div>

      <el-tree
        :data="folderTree"
        node-key="uuid"
        :highlight-current="true"
        @node-click="handleSelectFolder"
      >
        <template #default="{ node, data }">
          <span class="folder-node">
            <el-icon :color="data.color || undefined">
              <component :is="data.icon || 'Folder'" />
            </el-icon>
            <span>{{ data.name }}</span>
            <span class="count">({{ data.goalCount }})</span>

            <el-dropdown trigger="click" @command="handleFolderAction(data, $event)">
              <el-icon class="more-icon">
                <MoreFilled />
              </el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rename">重命名</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </span>
        </template>
      </el-tree>
    </div>

    <!-- 创建文件夹对话框 -->
    <CreateFolderDialog v-model="showCreateDialog" @success="handleFolderCreated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useGoalFolderStore } from '../stores/goalFolderStore';

const folderStore = useGoalFolderStore();
const showCreateDialog = ref(false);
const currentFolderUuid = ref<string | null>(null);

const systemFolders = computed(() => {
  return folderStore.folders.filter((f) => f.type === 'SYSTEM');
});

const folderTree = computed(() => {
  return folderStore.buildFolderTree();
});

function handleSelectFolder(folderUuid: string) {
  currentFolderUuid.value = folderUuid;
  // 触发目标列表刷新
}

async function handleFolderAction(folder: any, command: string) {
  if (command === 'rename') {
    await handleRenameFolder(folder);
  } else if (command === 'delete') {
    await handleDeleteFolder(folder);
  }
}

async function handleRenameFolder(folder: any) {
  try {
    const { value: newName } = await ElMessageBox.prompt('请输入新的文件夹名称', '重命名', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: folder.name,
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return '名称不能为空';
        }
        if (value.length > 100) {
          return '名称不能超过 100 字符';
        }
        return true;
      },
    });

    await folderStore.renameFolder(folder.uuid, newName);
    ElMessage.success('重命名成功');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '重命名失败');
    }
  }
}

async function handleDeleteFolder(folder: any) {
  try {
    await ElMessageBox.confirm(
      `确认要删除文件夹"${folder.name}"吗？其中的目标将移至"全部目标"。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );

    await folderStore.deleteFolder(folder.uuid);
    ElMessage.success('删除成功');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
}

function handleFolderCreated() {
  ElMessage.success('文件夹创建成功');
}
</script>
```

---

## 6. 数据库模型

### 6.1 Prisma Schema

```prisma
model GoalFolder {
  uuid              String       @id @default(uuid())
  accountUuid       String
  name              String       @db.VarChar(100)
  description       String?      @db.Text
  type              String       @default("CUSTOM")  // SYSTEM | CUSTOM
  color             String?      @db.VarChar(7)
  icon              String?      @db.VarChar(50)
  parentFolderUuid  String?
  sortOrder         Int          @default(0)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  // 关系
  account           Account      @relation(fields: [accountUuid], references: [uuid])
  parentFolder      GoalFolder?  @relation("FolderHierarchy", fields: [parentFolderUuid], references: [uuid])
  childFolders      GoalFolder[] @relation("FolderHierarchy")
  goals             Goal[]

  @@index([accountUuid])
  @@index([parentFolderUuid])
  @@index([type])
  @@map("goal_folders")
}
```

---

## 7. 错误处理

| 错误场景       | HTTP 状态码 | 错误信息                       | 处理方式            |
| -------------- | ----------- | ------------------------------ | ------------------- |
| 名称为空       | 400         | 文件夹名称不能为空             | 前端校验 + 后端验证 |
| 名称重复       | 409         | 文件夹已存在                   | 后端检查唯一性      |
| 父文件夹不存在 | 404         | 父文件夹不存在                 | 后端验证            |
| 删除系统文件夹 | 400         | 系统文件夹不能删除             | 前端禁用 + 后端验证 |
| 循环引用       | 400         | 不能将文件夹移动到其子文件夹中 | 后端验证            |

---

## 8. 测试用例

```typescript
describe('GoalFolder.create()', () => {
  it('should create folder with valid data', () => {
    const folder = GoalFolder.create({
      accountUuid: 'acc-123',
      name: 'Work',
      color: '#FF5733',
      icon: 'Briefcase',
    });

    expect(folder.name).toBe('Work');
    expect(folder.type).toBe(FolderType.CUSTOM);
  });

  it('should throw error when name is empty', () => {
    expect(() => {
      GoalFolder.create({
        accountUuid: 'acc-123',
        name: '',
      });
    }).toThrow('文件夹名称不能为空');
  });
});

describe('GoalFolderApplicationService.deleteFolder()', () => {
  it('should move goals to root when deleting folder', async () => {
    // 创建文件夹和目标
    const folder = await service.createFolder({ name: 'Test' });
    const goal = await goalService.createGoal({
      title: 'Test Goal',
      folderUuid: folder.uuid,
    });

    // 删除文件夹
    await service.deleteFolder(folder.uuid);

    // 验证目标已移至根目录
    const updatedGoal = await goalRepository.findByUuid(goal.uuid);
    expect(updatedGoal.folderUuid).toBeNull();
  });
});
```

---

## 9. 参考文档

- [创建目标流程](./CREATE_GOAL_FLOW.md)
- [Goal 模块设计规划](../GOAL_MODULE_PLAN.md)

---
title: Repository 模块 - Web 实现指南
created: 2025-10-10
updated: 2025-10-10
tags:
  - repository
  - web
  - vue
  - vuetify
  - frontend
category: 实现指南
---

# Repository 模块 - Web 实现指南

> **Web 层原则**：组合式 API + Store + Application Service + UI 工具集成

---

## 📋 实现顺序

```
1. Store (Pinia 状态管理)
   ↓
2. Application Service (前端应用服务)
   ↓
3. API Client (HTTP 请求)
   ↓
4. Composables (可组合函数)
   ↓
5. Components (Vue 组件)
   ↓
6. Views (页面视图)
```

---

## 1️⃣ Store 实现

**位置**: `apps/web/src/modules/repository/stores/repositoryStore.ts`

### 📐 规范

- ✅ 使用 Pinia 定义 Store
- ✅ 存储领域模型（Client 实体）
- ✅ 提供 getter 和 action
- ✅ 使用 Map 优化查询性能

### 📝 示例代码

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { RepositoryClient, ResourceClient } from '@dailyuse/domain-client';
import type { RepositoryContracts } from '@dailyuse/contracts';

/**
 * Repository Store
 *
 * ⚠️ 存储领域模型，不是 DTO
 */
export const useRepositoryStore = defineStore('repository', () => {
  // ============ State ============

  // ✅ 使用 Map 优化查询
  const repositories = ref<Map<string, RepositoryClient>>(new Map());
  const resources = ref<Map<string, ResourceClient>>(new Map());

  // 当前选中的仓库
  const selectedRepositoryUuid = ref<string | null>(null);

  // 加载状态
  const isLoading = ref(false);
  const isInitialized = ref(false);

  // ============ Getters ============

  /**
   * 获取所有仓库（数组）
   */
  const getAllRepositories = computed(() => {
    return Array.from(repositories.value.values());
  });

  /**
   * 获取活跃仓库
   */
  const getActiveRepositories = computed(() => {
    return getAllRepositories.value.filter((repo) => repo.isActive());
  });

  /**
   * 获取当前选中的仓库
   */
  const getSelectedRepository = computed(() => {
    if (!selectedRepositoryUuid.value) {
      return null;
    }
    return repositories.value.get(selectedRepositoryUuid.value) || null;
  });

  /**
   * 根据 UUID 获取仓库
   */
  const getRepositoryByUuid = computed(() => {
    return (uuid: string) => repositories.value.get(uuid) || null;
  });

  /**
   * 获取所有资源（数组）
   */
  const getAllResources = computed(() => {
    return Array.from(resources.value.values());
  });

  /**
   * 根据仓库 UUID 获取资源
   */
  const getResourcesByRepositoryUuid = computed(() => {
    return (repositoryUuid: string) => {
      return getAllResources.value.filter((res) => res.repositoryUuid === repositoryUuid);
    };
  });

  /**
   * 根据 UUID 获取资源
   */
  const getResourceByUuid = computed(() => {
    return (uuid: string) => resources.value.get(uuid) || null;
  });

  /**
   * 统计信息
   */
  const stats = computed(() => {
    return {
      totalRepositories: repositories.value.size,
      activeRepositories: getActiveRepositories.value.length,
      totalResources: resources.value.size,
      selectedRepositoryResourceCount: selectedRepositoryUuid.value
        ? getResourcesByRepositoryUuid.value(selectedRepositoryUuid.value).length
        : 0,
    };
  });

  // ============ Actions ============

  /**
   * 设置仓库列表
   * ⚠️ 接收领域模型，不是 DTO
   */
  function setRepositories(repos: RepositoryClient[]): void {
    repositories.value.clear();
    repos.forEach((repo) => {
      repositories.value.set(repo.uuid, repo);
    });
  }

  /**
   * 添加或更新单个仓库
   */
  function upsertRepository(repo: RepositoryClient): void {
    repositories.value.set(repo.uuid, repo);
  }

  /**
   * 删除仓库
   */
  function removeRepository(uuid: string): void {
    repositories.value.delete(uuid);

    // 如果删除的是当前选中的仓库，清除选择
    if (selectedRepositoryUuid.value === uuid) {
      selectedRepositoryUuid.value = null;
    }

    // 删除相关资源
    const relatedResources = getResourcesByRepositoryUuid.value(uuid);
    relatedResources.forEach((res) => resources.value.delete(res.uuid));
  }

  /**
   * 选择仓库
   */
  function selectRepository(uuid: string | null): void {
    selectedRepositoryUuid.value = uuid;
  }

  /**
   * 设置资源列表
   */
  function setResources(res: ResourceClient[]): void {
    resources.value.clear();
    res.forEach((resource) => {
      resources.value.set(resource.uuid, resource);
    });
  }

  /**
   * 添加或更新单个资源
   */
  function upsertResource(resource: ResourceClient): void {
    resources.value.set(resource.uuid, resource);
  }

  /**
   * 删除资源
   */
  function removeResource(uuid: string): void {
    resources.value.delete(uuid);
  }

  /**
   * 标记初始化完成
   */
  function markInitialized(): void {
    isInitialized.value = true;
  }

  /**
   * 重置 Store
   */
  function $reset(): void {
    repositories.value.clear();
    resources.value.clear();
    selectedRepositoryUuid.value = null;
    isLoading.value = false;
    isInitialized.value = false;
  }

  return {
    // State
    repositories,
    resources,
    selectedRepositoryUuid,
    isLoading,
    isInitialized,

    // Getters
    getAllRepositories,
    getActiveRepositories,
    getSelectedRepository,
    getRepositoryByUuid,
    getAllResources,
    getResourcesByRepositoryUuid,
    getResourceByUuid,
    stats,

    // Actions
    setRepositories,
    upsertRepository,
    removeRepository,
    selectRepository,
    setResources,
    upsertResource,
    removeResource,
    markInitialized,
    $reset,
  };
});
```

### ⚠️ 易错点

❌ **错误**：Store 存储 DTO

```typescript
// 错误示例
const repositories = ref<RepositoryDTO[]>([]); // ❌ 存储 DTO
```

✅ **正确**：Store 存储领域模型

```typescript
const repositories = ref<Map<string, RepositoryClient>>(new Map()); // ✅ 领域模型
```

❌ **错误**：使用数组存储

```typescript
// 错误示例
const repositories = ref<RepositoryClient[]>([]); // ❌ 查询 O(n)
```

✅ **正确**：使用 Map 优化查询

```typescript
const repositories = ref<Map<string, RepositoryClient>>(new Map()); // ✅ 查询 O(1)
```

---

## 2️⃣ Application Service 实现

**位置**: `apps/web/src/modules/repository/application/services/repositoryApplicationService.ts`

### 📐 规范

- ✅ 负责业务流程编排
- ✅ 调用 API Client
- ✅ 进行 DTO → Domain 转换
- ✅ 更新 Store
- ✅ 单例模式

### 📝 示例代码

```typescript
import { useRepositoryStore } from '../../stores/repositoryStore';
import { repositoryApiClient } from '../../infrastructure/api/repositoryApiClient';
import { RepositoryClient, ResourceClient } from '@dailyuse/domain-client';
import {
  convertRepositoryListFromServer,
  convertResourceListFromServer,
} from '@dailyuse/domain-client';
import type { RepositoryContracts } from '@dailyuse/contracts';

/**
 * Repository Application Service
 *
 * 前端应用服务，负责：
 * 1. 调用 API Client
 * 2. DTO → Domain 转换
 * 3. 更新 Store
 * 4. 业务流程编排
 */
class RepositoryApplicationService {
  private repositoryStore = useRepositoryStore();

  /**
   * 初始化 - 加载所有仓库
   */
  async initialize(): Promise<void> {
    if (this.repositoryStore.isInitialized) {
      return;
    }

    this.repositoryStore.isLoading = true;

    try {
      // 1. 调用 API
      const response = await repositoryApiClient.getAllRepositories();

      // 2. DTO → Domain 转换
      const repositories = convertRepositoryListFromServer(response.items);

      // 3. 更新 Store
      this.repositoryStore.setRepositories(repositories);
      this.repositoryStore.markInitialized();
    } finally {
      this.repositoryStore.isLoading = false;
    }
  }

  /**
   * 创建仓库
   */
  async createRepository(
    request: RepositoryContracts.CreateRepositoryRequestDTO,
  ): Promise<RepositoryClient> {
    // 1. 调用 API
    const dto = await repositoryApiClient.createRepository(request);

    // 2. DTO → Domain 转换
    const repository = RepositoryClient.fromServerDTO(dto);

    // 3. 更新 Store
    this.repositoryStore.upsertRepository(repository);

    return repository;
  }

  /**
   * 更新仓库
   */
  async updateRepository(
    request: RepositoryContracts.UpdateRepositoryRequestDTO,
  ): Promise<RepositoryClient> {
    // 1. 调用 API
    const dto = await repositoryApiClient.updateRepository(request);

    // 2. DTO → Domain 转换
    const repository = RepositoryClient.fromServerDTO(dto);

    // 3. 更新 Store
    this.repositoryStore.upsertRepository(repository);

    return repository;
  }

  /**
   * 删除仓库
   */
  async deleteRepository(uuid: string): Promise<void> {
    // 1. 调用 API
    await repositoryApiClient.deleteRepository(uuid);

    // 2. 更新 Store
    this.repositoryStore.removeRepository(uuid);
  }

  /**
   * 获取仓库详情
   */
  async getRepositoryDetail(uuid: string): Promise<RepositoryClient> {
    // 1. 先从 Store 获取
    const cached = this.repositoryStore.getRepositoryByUuid.value(uuid);
    if (cached) {
      return cached;
    }

    // 2. 调用 API
    const dto = await repositoryApiClient.getRepositoryByUuid(uuid);

    // 3. DTO → Domain 转换
    const repository = RepositoryClient.fromServerDTO(dto);

    // 4. 更新 Store
    this.repositoryStore.upsertRepository(repository);

    return repository;
  }

  /**
   * 刷新仓库列表
   */
  async refreshRepositories(): Promise<void> {
    this.repositoryStore.isLoading = true;

    try {
      const response = await repositoryApiClient.getAllRepositories();
      const repositories = convertRepositoryListFromServer(response.items);
      this.repositoryStore.setRepositories(repositories);
    } finally {
      this.repositoryStore.isLoading = false;
    }
  }

  /**
   * 激活仓库
   */
  async activateRepository(uuid: string): Promise<RepositoryClient> {
    const dto = await repositoryApiClient.activateRepository(uuid);
    const repository = RepositoryClient.fromServerDTO(dto);
    this.repositoryStore.upsertRepository(repository);
    return repository;
  }

  /**
   * 归档仓库
   */
  async archiveRepository(uuid: string): Promise<RepositoryClient> {
    const dto = await repositoryApiClient.archiveRepository(uuid);
    const repository = RepositoryClient.fromServerDTO(dto);
    this.repositoryStore.upsertRepository(repository);
    return repository;
  }

  /**
   * 加载仓库的资源
   */
  async loadRepositoryResources(repositoryUuid: string): Promise<void> {
    this.repositoryStore.isLoading = true;

    try {
      // 假设有这个 API
      const response = await repositoryApiClient.getResourcesByRepository(repositoryUuid);
      const resources = convertResourceListFromServer(response.items);
      this.repositoryStore.setResources(resources);
    } finally {
      this.repositoryStore.isLoading = false;
    }
  }
}

// ✅ 单例导出
export const repositoryApplicationService = new RepositoryApplicationService();
```

---

## 3️⃣ API Client 实现

**位置**: `apps/web/src/modules/repository/infrastructure/api/repositoryApiClient.ts`

### 📐 规范

- ✅ 封装 HTTP 请求
- ✅ 返回 DTO（不是领域模型）
- ✅ 处理统一响应格式
- ✅ 错误处理

### 📝 示例代码

```typescript
import { apiClient } from '@/common/infrastructure/api/apiClient';
import type { RepositoryContracts } from '@dailyuse/contracts';
import type { DailyUseApiResponse } from '@/common/types/api-response';

/**
 * Repository API Client
 *
 * ⚠️ 只负责 HTTP 请求，返回 DTO
 */
class RepositoryApiClient {
  private readonly baseUrl = '/repositories';

  /**
   * 创建仓库
   */
  async createRepository(
    request: RepositoryContracts.CreateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryServerDTO> {
    const response = await apiClient.post<
      DailyUseApiResponse<RepositoryContracts.RepositoryServerDTO>
    >(this.baseUrl, request);

    return response.data;
  }

  /**
   * 更新仓库
   */
  async updateRepository(
    request: RepositoryContracts.UpdateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryServerDTO> {
    const response = await apiClient.put<
      DailyUseApiResponse<RepositoryContracts.RepositoryServerDTO>
    >(`${this.baseUrl}/${request.uuid}`, request);

    return response.data;
  }

  /**
   * 删除仓库
   */
  async deleteRepository(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  /**
   * 获取仓库详情
   */
  async getRepositoryByUuid(uuid: string): Promise<RepositoryContracts.RepositoryServerDTO> {
    const response = await apiClient.get<
      DailyUseApiResponse<RepositoryContracts.RepositoryServerDTO>
    >(`${this.baseUrl}/${uuid}`);

    return response.data;
  }

  /**
   * 获取所有仓库
   */
  async getAllRepositories(): Promise<RepositoryContracts.RepositoryListResponseDTO> {
    const response = await apiClient.get<
      DailyUseApiResponse<RepositoryContracts.RepositoryListResponseDTO>
    >(this.baseUrl);

    return response.data;
  }

  /**
   * 激活仓库
   */
  async activateRepository(uuid: string): Promise<RepositoryContracts.RepositoryServerDTO> {
    const response = await apiClient.post<
      DailyUseApiResponse<RepositoryContracts.RepositoryServerDTO>
    >(`${this.baseUrl}/${uuid}/activate`);

    return response.data;
  }

  /**
   * 归档仓库
   */
  async archiveRepository(uuid: string): Promise<RepositoryContracts.RepositoryServerDTO> {
    const response = await apiClient.post<
      DailyUseApiResponse<RepositoryContracts.RepositoryServerDTO>
    >(`${this.baseUrl}/${uuid}/archive`);

    return response.data;
  }

  /**
   * 获取仓库资源
   */
  async getResourcesByRepository(
    repositoryUuid: string,
  ): Promise<RepositoryContracts.ResourceListResponseDTO> {
    const response = await apiClient.get<
      DailyUseApiResponse<RepositoryContracts.ResourceListResponseDTO>
    >(`${this.baseUrl}/${repositoryUuid}/resources`);

    return response.data;
  }
}

// ✅ 单例导出
export const repositoryApiClient = new RepositoryApiClient();
```

---

## 4️⃣ Composables 实现

**位置**: `apps/web/src/modules/repository/presentation/composables/useRepository.ts`

### 📐 规范

- ✅ 封装通用业务逻辑
- ✅ 集成 Loading、Message、防抖等工具
- ✅ 提供便捷的操作方法

### 📝 示例代码

```typescript
import { ref, computed } from 'vue';
import { useRepositoryStore } from '../../stores/repositoryStore';
import { repositoryApplicationService } from '../../application/services/repositoryApplicationService';
import { useMessage, useLoading } from '@dailyuse/ui';
import { createDebounce } from '@dailyuse/utils';
import type { RepositoryContracts } from '@dailyuse/contracts';

/**
 * Repository Composable
 *
 * 封装通用的仓库操作逻辑
 */
export function useRepository() {
  const repositoryStore = useRepositoryStore();
  const message = useMessage();
  const { withLoading } = useLoading();

  // 搜索关键词
  const searchQuery = ref('');

  // 过滤后的仓库列表
  const filteredRepositories = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) {
      return repositoryStore.getAllRepositories;
    }

    return repositoryStore.getAllRepositories.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.path.toLowerCase().includes(query) ||
        repo.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  });

  // 防抖搜索
  const { debouncedFn: debouncedSearch } = createDebounce((query: string) => {
    searchQuery.value = query;
  }, 300);

  /**
   * 创建仓库
   */
  async function createRepository(
    request: RepositoryContracts.CreateRepositoryRequestDTO,
  ): Promise<boolean> {
    try {
      await withLoading(async () => {
        await repositoryApplicationService.createRepository(request);
      }, '创建中...');

      message.success('仓库创建成功');
      return true;
    } catch (error: any) {
      message.error(error.message || '创建失败');
      return false;
    }
  }

  /**
   * 更新仓库
   */
  async function updateRepository(
    request: RepositoryContracts.UpdateRepositoryRequestDTO,
  ): Promise<boolean> {
    try {
      await withLoading(async () => {
        await repositoryApplicationService.updateRepository(request);
      }, '更新中...');

      message.success('更新成功');
      return true;
    } catch (error: any) {
      message.error(error.message || '更新失败');
      return false;
    }
  }

  /**
   * 删除仓库（带确认）
   */
  async function deleteRepository(uuid: string): Promise<boolean> {
    try {
      await message.delConfirm('确定删除此仓库吗？');

      await withLoading(async () => {
        await repositoryApplicationService.deleteRepository(uuid);
      }, '删除中...');

      message.success('删除成功');
      return true;
    } catch (error: any) {
      if (error === 'cancel') {
        return false; // 用户取消
      }
      message.error(error.message || '删除失败');
      return false;
    }
  }

  /**
   * 刷新仓库列表
   */
  async function refreshRepositories(): Promise<void> {
    try {
      await withLoading(async () => {
        await repositoryApplicationService.refreshRepositories();
      }, '加载中...');
    } catch (error: any) {
      message.error(error.message || '加载失败');
    }
  }

  /**
   * 激活仓库
   */
  async function activateRepository(uuid: string): Promise<boolean> {
    try {
      await repositoryApplicationService.activateRepository(uuid);
      message.success('仓库已激活');
      return true;
    } catch (error: any) {
      message.error(error.message || '激活失败');
      return false;
    }
  }

  /**
   * 归档仓库
   */
  async function archiveRepository(uuid: string): Promise<boolean> {
    try {
      await message.delConfirm('确定归档此仓库吗？');
      await repositoryApplicationService.archiveRepository(uuid);
      message.success('仓库已归档');
      return true;
    } catch (error: any) {
      if (error === 'cancel') {
        return false;
      }
      message.error(error.message || '归档失败');
      return false;
    }
  }

  return {
    // State
    searchQuery,

    // Computed
    repositories: computed(() => repositoryStore.getAllRepositories),
    filteredRepositories,
    selectedRepository: computed(() => repositoryStore.getSelectedRepository),
    isLoading: computed(() => repositoryStore.isLoading),
    stats: computed(() => repositoryStore.stats),

    // Methods
    debouncedSearch,
    createRepository,
    updateRepository,
    deleteRepository,
    refreshRepositories,
    activateRepository,
    archiveRepository,
  };
}
```

---

## 5️⃣ Components 实现（示例）

**位置**: `apps/web/src/modules/repository/presentation/components/RepositoryCard.vue`

### 📝 示例代码

```vue
<template>
  <v-card :class="['repository-card', { selected: isSelected }]" @click="handleClick">
    <v-card-title class="d-flex align-center">
      <v-icon :icon="repository.getIconName()" class="mr-2" />
      {{ repository.name }}
      <v-spacer />
      <v-chip :color="repository.getStatusColor()" size="small">
        {{ repository.status }}
      </v-chip>
    </v-card-title>

    <v-card-subtitle>
      {{ repository.path }}
    </v-card-subtitle>

    <v-card-text>
      <div v-if="repository.description" class="mb-2">
        {{ repository.description }}
      </div>

      <div class="d-flex align-center text-caption text-grey">
        <v-icon icon="mdi-file-multiple" size="small" class="mr-1" />
        {{ repository.getTotalResourceCount() }} 个文件
        <span class="mx-2">·</span>
        <v-icon icon="mdi-harddisk" size="small" class="mr-1" />
        {{ repository.getFormattedSize() }}
      </div>

      <div v-if="repository.tags.length > 0" class="mt-2">
        <v-chip v-for="tag in repository.tags" :key="tag" size="x-small" class="mr-1">
          {{ tag }}
        </v-chip>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn size="small" variant="text" @click.stop="handleEdit"> 编辑 </v-btn>
      <v-btn size="small" variant="text" @click.stop="handleDelete"> 删除 </v-btn>
      <v-spacer />
      <v-btn
        size="small"
        variant="text"
        :icon="isSynced ? 'mdi-sync' : 'mdi-sync-alert'"
        @click.stop="handleSync"
      />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RepositoryClient } from '@dailyuse/domain-client';

// Props
interface Props {
  repository: RepositoryClient;
  selected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
});

// Emits
const emit = defineEmits<{
  click: [repository: RepositoryClient];
  edit: [repository: RepositoryClient];
  delete: [repository: RepositoryClient];
  sync: [repository: RepositoryClient];
}>();

// Computed
const isSelected = computed(() => props.selected);
const isSynced = computed(() => props.repository.isSynced());

// Methods
function handleClick() {
  emit('click', props.repository);
}

function handleEdit() {
  emit('edit', props.repository);
}

function handleDelete() {
  emit('delete', props.repository);
}

function handleSync() {
  emit('sync', props.repository);
}
</script>

<style scoped>
.repository-card {
  cursor: pointer;
  transition: all 0.2s;
}

.repository-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.repository-card.selected {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>
```

---

## ✅ Web 层检查清单

- [ ] Store 使用 Map 存储领域模型
- [ ] Application Service 进行 DTO → Domain 转换
- [ ] API Client 只返回 DTO
- [ ] Composable 集成 useMessage、useLoading、防抖
- [ ] 组件接收领域模型作为 props
- [ ] 使用组合式 API（setup script）
- [ ] 错误处理统一使用 message
- [ ] Loading 状态统一管理

---

**系列完成**: [[00-MODULE_IMPLEMENTATION_SUMMARY|实现总结与易错点]]

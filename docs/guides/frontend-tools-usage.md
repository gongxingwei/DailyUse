# 前端工具封装使用指南 📚

> DailyUse 项目的前端工具封装最佳实践

---

## 目录

1. [架构设计](#架构设计)
2. [防抖节流（@dailyuse/utils）](#防抖节流)
3. [加载状态管理（@dailyuse/utils）](#加载状态管理)
4. [消息提示（@dailyuse/ui）](#消息提示)
5. [Loading 状态（@dailyuse/ui）](#loading-状态)
6. [完整示例](#完整示例)

---

## 架构设计

### 📦 分层架构

```
┌─────────────────────────────────────────┐
│  @dailyuse/ui (UI 层)                   │
│  ├─ useMessage (Vuetify 确认框)         │
│  ├─ useLoading (Vuetify Loading)        │
│  └─ DuMessageProvider (组件)            │
└─────────────────────────────────────────┘
              ↓ 依赖
┌─────────────────────────────────────────┐
│  @dailyuse/utils (工具层)               │
│  ├─ createDebounce (纯函数)             │
│  ├─ createThrottle (纯函数)             │
│  └─ LoadingState (状态管理类)           │
└─────────────────────────────────────────┘
```

### 🎯 设计原则

1. **框架无关的放 utils** - 纯逻辑，无 UI 依赖
2. **UI 特定的放 ui** - Vuetify 组件和 Composables
3. **向后兼容** - apiUtils 中的简单防抖节流保留
4. **类型安全** - 完整的 TypeScript 支持

---

## 防抖节流

### 基础用法

```typescript
import { createDebounce, createThrottle } from '@dailyuse/utils';

// ✅ 搜索输入防抖
const { debouncedFn: handleSearch } = createDebounce((keyword: string) => {
  console.log('搜索:', keyword);
  searchApi(keyword);
}, 500);

// 用户输入时调用
input.addEventListener('input', (e) => handleSearch(e.target.value));

// ✅ 滚动事件节流
const { throttledFn: handleScroll } = createThrottle(() => {
  console.log('滚动位置:', window.scrollY);
}, 200);

window.addEventListener('scroll', handleScroll);
```

### Promise 防抖（推荐用于 API 调用）

```typescript
import { createDebouncePromise } from '@dailyuse/utils';

// ✅ 自动补全 API
const { debouncedFn: autoComplete } = createDebouncePromise(async (keyword: string) => {
  const res = await searchApi(keyword);
  return res.data;
}, 300);

// Vue 组件中
const keyword = ref('');
const suggestions = ref([]);

watch(keyword, async (value) => {
  if (value) {
    suggestions.value = await autoComplete(value);
  }
});
```

### 批量防抖

```typescript
import { createBatchDebounce } from '@dailyuse/utils';

// ✅ 批量删除
const { debouncedFn: batchDelete } = createBatchDebounce(async (ids: number[]) => {
  console.log('批量删除:', ids);
  await batchDeleteApi(ids);
  message.success(`已删除 ${ids.length} 条记录`);
}, 1000);

// 用户快速点击多个删除按钮
batchDelete(1);
batchDelete(2);
batchDelete(3);
// 1秒后一次性处理: [1, 2, 3]
```

### RAF 节流（动画专用）

```typescript
import { createRAFThrottle } from '@dailyuse/utils';

// ✅ 滚动动画
const { throttledFn: updateScrollProgress } = createRAFThrottle(() => {
  const progress = window.scrollY / document.body.scrollHeight;
  progressBar.value = progress * 100;
});

window.addEventListener('scroll', updateScrollProgress);
```

### 时间窗口节流

```typescript
import { createWindowThrottle } from '@dailyuse/utils';

// ✅ 限制点赞，1秒内只能点击一次
const { throttledFn: handleLike, getRemainingTime } = createWindowThrottle(async () => {
  await likeApi(postId);
  message.success('点赞成功');
}, 1000);

const onClick = () => {
  const success = handleLike();
  if (!success) {
    const remaining = getRemainingTime();
    message.warning(`请等待 ${Math.ceil(remaining / 1000)} 秒`);
  }
};
```

### 装饰器用法

```typescript
import { debounce, throttle } from '@dailyuse/utils';

class SearchService {
  @debounce(500)
  search(keyword: string) {
    console.log('搜索:', keyword);
  }

  @throttle(200)
  scroll() {
    console.log('滚动');
  }
}
```

---

## 加载状态管理

### LoadingState 类（推荐）

```typescript
import { LoadingState } from '@dailyuse/utils';

const userState = new LoadingState<User>();

// 执行异步操作
await userState.execute(async () => {
  return await fetchUser(userId);
});

// 使用状态
if (userState.isLoading) {
  console.log('加载中...');
} else if (userState.error) {
  console.error('错误:', userState.error);
} else if (userState.data) {
  console.log('数据:', userState.data);
}

// 订阅状态变化
userState.subscribe((snapshot) => {
  console.log('状态变化:', snapshot);
});
```

### 包装器模式

```typescript
import { createLoadingWrapper } from '@dailyuse/utils';

const { execute, state, reset } = createLoadingWrapper(async (userId: string) => {
  return await fetchUser(userId);
});

// 执行
await execute('123');

// 访问状态
console.log(state.data); // User 数据
console.log(state.isLoading); // false
console.log(state.error); // null
```

### 重试机制

```typescript
const userState = new LoadingState<User>();

// 最多重试 3 次，每次间隔 1 秒
await userState.retry(async () => fetchUser(userId), 3, 1000);
```

### 轮询加载

```typescript
import { createPollingLoader } from '@dailyuse/utils';

const { start, stop, state } = createPollingLoader(
  async () => {
    return await fetchLatestData();
  },
  5000, // 每 5 秒轮询一次
);

// 开始轮询
start();

// 停止轮询
onUnmounted(() => stop());
```

### 缓存加载

```typescript
import { createCachedLoader } from '@dailyuse/utils';

const { execute, state, clearCache } = createCachedLoader(
  async (userId: string) => fetchUser(userId),
  (userId) => `user-${userId}`,
  60000, // 缓存 1 分钟
);

// 第一次调用会请求 API
await execute('123');
// 第二次调用会使用缓存
await execute('123');

// 清除特定缓存
clearCache('user-123');
```

---

## 消息提示

### 基础用法

```vue
<script setup lang="ts">
import { useMessage } from '@dailyuse/ui';

const message = useMessage();

const handleSuccess = () => {
  message.success('操作成功');
};

const handleError = () => {
  message.error('操作失败');
};

const handleWarning = () => {
  message.warning('请注意');
};

const handleInfo = () => {
  message.info('提示信息');
};
</script>
```

### 确认框（Promise 风格）

```vue
<script setup lang="ts">
import { useMessage } from '@dailyuse/ui';

const message = useMessage();

// ✅ 删除确认
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm('确定要删除这条记录吗？');
    // 用户点击确认
    await deleteApi(id);
    message.success('删除成功');
    await getList();
  } catch {
    // 用户点击取消，静默处理
    console.log('用户取消删除');
  }
};

// ✅ 自定义确认框
const handleAction = async () => {
  const confirmed = await message.confirm({
    title: '确认操作',
    message: '确定要执行此操作吗？',
    type: 'warning',
    confirmText: '确定',
    cancelText: '取消',
  });

  if (confirmed) {
    await executeAction();
  }
};

// ✅ 保存确认
const handleSave = async () => {
  await message.saveConfirm('确定要保存修改吗？');
  await saveApi();
};

// ✅ 离开确认（路由守卫）
onBeforeRouteLeave(async (to, from, next) => {
  if (hasUnsavedChanges.value) {
    const leave = await message.leaveConfirm();
    next(leave);
  } else {
    next();
  }
});
</script>
```

### 在 App.vue 中注册

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <router-view />

    <!-- 全局消息提供者 -->
    <DuMessageProvider />

    <!-- 全局 Loading -->
    <DuLoadingOverlay />
  </div>
</template>

<script setup lang="ts">
import { DuMessageProvider, DuLoadingOverlay } from '@dailyuse/ui';
</script>
```

### 全局实例（跨组件使用）

```typescript
// utils/message.ts
import { getGlobalMessage } from '@dailyuse/ui';

export const message = getGlobalMessage();

// 在任何地方使用
import { message } from '@/utils/message';
message.success('操作成功');
```

---

## Loading 状态

### 基础 Loading

```vue
<script setup lang="ts">
import { useLoading } from '@dailyuse/ui';

const { loading, withLoading } = useLoading();

const handleSubmit = async () => {
  await withLoading(async () => {
    await submitApi(formData.value);
    message.success('提交成功');
  });
};
</script>

<template>
  <v-btn :loading="loading" @click="handleSubmit"> 提交 </v-btn>
</template>
```

### 全局 Loading

```typescript
import { useGlobalLoading } from '@dailyuse/ui';

const globalLoading = useGlobalLoading();

// 显示 Loading
globalLoading.show('正在处理...');

// 隐藏 Loading
globalLoading.hide();

// 自动管理（推荐）
await globalLoading.withLoading(async () => {
  await fetchData();
}, '正在加载数据...');
```

### 按钮 Loading（多按钮场景）

```vue
<script setup lang="ts">
import { useButtonLoading } from '@dailyuse/ui';

const { loadings, createHandler } = useButtonLoading();

const handleSave = createHandler('save', async () => {
  await saveApi();
  message.success('保存成功');
});

const handleDelete = createHandler('delete', async () => {
  await deleteApi();
  message.success('删除成功');
});

const handleExport = createHandler('export', async () => {
  await exportApi();
  message.success('导出成功');
});
</script>

<template>
  <div>
    <v-btn :loading="loadings.save" @click="handleSave">保存</v-btn>
    <v-btn :loading="loadings.delete" @click="handleDelete">删除</v-btn>
    <v-btn :loading="loadings.export" @click="handleExport">导出</v-btn>
  </div>
</template>
```

### 表格 Loading

```vue
<script setup lang="ts">
import { useTableLoading } from '@dailyuse/ui';

const { loading, refreshing, loadingMore, withLoading, withRefresh, withLoadMore } =
  useTableLoading();

const getList = async () => {
  await withLoading(async () => {
    const res = await fetchList({ page: 1 });
    list.value = res.data;
  });
};

const handleRefresh = async () => {
  await withRefresh(async () => {
    await getList();
  });
};

const handleLoadMore = async () => {
  await withLoadMore(async () => {
    const res = await fetchList({ page: page.value + 1 });
    list.value.push(...res.data);
  });
};
</script>

<template>
  <div>
    <v-data-table :loading="loading" :items="list" />

    <v-btn :loading="refreshing" @click="handleRefresh"> 刷新 </v-btn>

    <v-btn :loading="loadingMore" @click="handleLoadMore"> 加载更多 </v-btn>
  </div>
</template>
```

### 高级 Loading（结合 utils）

```vue
<script setup lang="ts">
import { useAdvancedLoading } from '@dailyuse/ui';

const { execute, loading, data, error, hasData, hasError } = useAdvancedLoading(
  async (userId: string) => {
    return await fetchUser(userId);
  },
);

onMounted(async () => {
  await execute('123');
});
</script>

<template>
  <div>
    <v-progress-circular v-if="loading" />
    <v-alert v-else-if="hasError" type="error">
      {{ error }}
    </v-alert>
    <div v-else-if="hasData">
      <h2>{{ data.username }}</h2>
      <p>{{ data.email }}</p>
    </div>
  </div>
</template>
```

---

## 完整示例

### 用户列表页面

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMessage, useTableLoading, useButtonLoading } from '@dailyuse/ui';
import { createDebounce } from '@dailyuse/utils';
import { fetchUserList, deleteUser } from '@/api/user';

const message = useMessage();
const { loading, refreshing, withLoading, withRefresh } = useTableLoading();
const { loadings, createHandler } = useButtonLoading();

const list = ref([]);
const searchKeyword = ref('');

// 获取列表
const getList = async () => {
  await withLoading(async () => {
    const res = await fetchUserList({ keyword: searchKeyword.value });
    list.value = res.data;
  });
};

// 刷新列表
const handleRefresh = async () => {
  await withRefresh(async () => {
    await getList();
  });
};

// 搜索防抖
const { debouncedFn: handleSearch } = createDebounce((keyword: string) => {
  searchKeyword.value = keyword;
  getList();
}, 500);

// 删除用户
const handleDelete = createHandler('delete', async (id: number) => {
  try {
    await message.delConfirm('确定要删除此用户吗？');
    await deleteUser(id);
    message.success('删除成功');
    await getList();
  } catch {
    console.log('取消删除');
  }
});

onMounted(() => getList());
</script>

<template>
  <div>
    <v-text-field label="搜索用户" @input="handleSearch($event.target.value)" />

    <v-btn :loading="refreshing" @click="handleRefresh"> 刷新 </v-btn>

    <v-data-table :loading="loading" :items="list">
      <template #item.actions="{ item }">
        <v-btn
          :loading="loadings[`delete-${item.id}`]"
          color="error"
          size="small"
          @click="handleDelete(item.id)"
        >
          删除
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>
```

### 表单提交

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useMessage, useLoading } from '@dailyuse/ui';
import { submitForm } from '@/api/form';

const message = useMessage();
const { loading, withLoading } = useLoading();

const formData = ref({
  username: '',
  email: '',
});

const handleSubmit = async () => {
  await withLoading(async () => {
    await submitForm(formData.value);
    message.success('提交成功');
    // 重置表单
    formData.value = { username: '', email: '' };
  });
};

// 离开确认
const hasChanges = computed(() => {
  return formData.value.username || formData.value.email;
});

onBeforeRouteLeave(async (to, from, next) => {
  if (hasChanges.value) {
    const leave = await message.leaveConfirm('你有未保存的修改，确定要离开吗？');
    next(leave);
  } else {
    next();
  }
});
</script>

<template>
  <v-form @submit.prevent="handleSubmit">
    <v-text-field v-model="formData.username" label="用户名" />

    <v-text-field v-model="formData.email" label="邮箱" />

    <v-btn :loading="loading" type="submit"> 提交 </v-btn>
  </v-form>
</template>
```

---

## 总结

### ✅ 使用建议

1. **防抖节流** - 从 `@dailyuse/utils` 导入，框架无关
2. **加载状态** - 简单场景用 `useLoading`，复杂场景用 `LoadingState`
3. **消息提示** - 统一使用 `useMessage`，避免直接用 `alert`/`confirm`
4. **全局功能** - 在 App.vue 中注册 `DuMessageProvider` 和 `DuLoadingOverlay`

### 📚 推荐阅读

- [防抖节流原理详解](../frontend-elegant-patterns.md#6-防抖节流封装)
- [Loading 状态管理](../frontend-elegant-patterns.md#5-加载状态管理)
- [Promise 封装模式](../frontend-elegant-patterns.md#1-promise-封装模式)

---

希望这份指南能帮助你写出更优雅的前端代码！🚀

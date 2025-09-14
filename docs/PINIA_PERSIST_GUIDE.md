# Pinia 持久化组件使用指南

## 概述

`pinia-plugin-persistedstate` 是一个 Pinia 插件，可以自动将 store 的状态持久化到浏览器存储中（localStorage、sessionStorage 等）。

## 安装和配置

### 1. 安装插件

```bash
pnpm add pinia-plugin-persistedstate
```

### 2. 在 main.ts 中配置

```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const app = createApp(App);
const pinia = createPinia();

// 注册持久化插件
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
```

## 基本用法

### 1. 最简单的配置 - 持久化整个 store

```typescript
export const useSimpleStore = defineStore('simple', {
  state: () => ({
    user: null,
    settings: {},
    theme: 'light'
  }),
  
  actions: {
    updateUser(user: any) {
      this.user = user;
    }
  }
}, {
  persist: true  // 持久化整个 store
});
```

### 2. 选择性持久化 - 只保存特定字段

```typescript
export const useSelectiveStore = defineStore('selective', {
  state: () => ({
    // 需要持久化的数据
    user: null,
    preferences: {},
    
    // 不需要持久化的临时数据
    isLoading: false,
    currentPage: 1,
    tempData: []
  })
}, {
  persist: {
    key: 'my-store',                    // 自定义存储键名
    paths: ['user', 'preferences'],     // 只持久化这些字段
    storage: localStorage,              // 存储位置
  }
});
```

### 3. 高级配置 - 自定义序列化

```typescript
export const useAdvancedStore = defineStore('advanced', {
  state: () => ({
    goals: [] as Goal[],
    lastSyncTime: null as Date | null,
  })
}, {
  persist: {
    key: 'advanced-store',
    paths: ['goals', 'lastSyncTime'],
    storage: localStorage,
    
    // 自定义序列化器
    serializer: {
      deserialize: (value: string) => {
        const data = JSON.parse(value);
        
        // 恢复复杂对象
        if (data.goals) {
          data.goals = data.goals.map(goalData => Goal.fromDTO(goalData));
        }
        
        // 恢复日期对象
        if (data.lastSyncTime) {
          data.lastSyncTime = new Date(data.lastSyncTime);
        }
        
        return data;
      },
      
      serialize: (value: any) => {
        const data = { ...value };
        
        // 转换复杂对象为可序列化格式
        if (data.goals) {
          data.goals = data.goals.map(goal => goal.toDTO());
        }
        
        return JSON.stringify(data);
      }
    }
  }
});
```

## 在你的项目中的应用

### 替换现有的 goalStore

你可以选择以下两种方式之一：

#### 方式1：修改现有 store

在现有的 `goalStore.ts` 末尾添加持久化配置：

```typescript
export const useGoalStore = defineStore('goal', {
  // ... 现有配置
}, {
  persist: {
    key: 'goal-store',
    paths: ['goals', 'goalDirs', 'selectedGoalUuid', 'selectedDirUuid', 'lastSyncTime'],
    storage: localStorage,
    // ... 自定义序列化器
  }
});
```

#### 方式2：使用新的持久化版本

使用我们创建的 `goalStorePersisted.ts`：

```typescript
// 在组件中
import { useGoalStorePersisted } from './stores/goalStorePersisted';

const goalStore = useGoalStorePersisted();

// 数据会自动从 localStorage 恢复
console.log('已保存的目标:', goalStore.goals);

// 状态更新会自动保存
goalStore.addOrUpdateGoal(newGoal);
goalStore.setSelectedGoal('goal-uuid');
```

### 迁移现有代码

如果你选择使用持久化版本，需要做以下调整：

1. **删除手动的 localStorage 操作**：
   - 不再需要 `saveToLocalStorage()`
   - 不再需要 `loadFromLocalStorage()`
   - 不再需要在 `initialize()` 中手动加载数据

2. **简化初始化逻辑**：
```typescript
// 旧版本
async function initializeApp() {
  const goalStore = useGoalStore();
  goalStore.initialize(); // 手动加载 localStorage
  // ...
}

// 新版本
async function initializeApp() {
  const goalStore = useGoalStorePersisted();
  // 数据已自动恢复，只需要处理业务逻辑
  goalStore.initialize(); // 只做业务初始化
  // ...
}
```

## 配置选项详解

### storage 选项

```typescript
{
  persist: {
    storage: localStorage,     // 长期存储
    // storage: sessionStorage,   // 会话存储
    // storage: window.indexedDB,  // IndexedDB（需要额外配置）
  }
}
```

### 多存储配置

```typescript
{
  persist: [
    {
      key: 'user-data',
      paths: ['user', 'preferences'],
      storage: localStorage,
    },
    {
      key: 'session-data', 
      paths: ['currentSession'],
      storage: sessionStorage,
    }
  ]
}
```

### 回调函数

```typescript
{
  persist: {
    key: 'my-store',
    paths: ['data'],
    
    // 数据恢复前
    beforeRestore: (ctx) => {
      console.log('准备恢复数据');
    },
    
    // 数据恢复后
    afterRestore: (ctx) => {
      console.log('数据已恢复');
      ctx.store.validateData(); // 执行数据验证
    }
  }
}
```

## 最佳实践

### 1. 选择性持久化

只持久化必要的数据，不要保存：
- 临时状态（loading、error）
- UI 状态（pagination、filters）
- 缓存数据（可以重新获取的数据）

### 2. 处理复杂对象

对于包含类实例、日期等复杂对象，使用自定义序列化器：

```typescript
serializer: {
  deserialize: (value: string) => {
    const data = JSON.parse(value);
    
    // 恢复日期
    if (data.createdAt) {
      data.createdAt = new Date(data.createdAt);
    }
    
    // 恢复类实例
    if (data.items) {
      data.items = data.items.map(item => Item.fromDTO(item));
    }
    
    return data;
  },
  
  serialize: (value: any) => {
    const data = { ...value };
    
    // 转换类实例为普通对象
    if (data.items) {
      data.items = data.items.map(item => item.toDTO());
    }
    
    return JSON.stringify(data);
  }
}
```

### 3. 版本控制和迁移

```typescript
{
  persist: {
    key: 'my-store-v2',  // 版本化的键名
    paths: ['data'],
    
    afterRestore: (ctx) => {
      // 检查数据版本并执行迁移
      if (!ctx.store.version || ctx.store.version < '2.0.0') {
        ctx.store.migrateData();
        ctx.store.version = '2.0.0';
      }
    }
  }
}
```

### 4. 错误处理

```typescript
serializer: {
  deserialize: (value: string) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error('反序列化失败:', error);
      return {}; // 返回默认值
    }
  },
  
  serialize: (value: any) => {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.error('序列化失败:', error);
      return JSON.stringify({}); // 返回默认值
    }
  }
}
```

## 性能考虑

1. **避免频繁更新**：对于频繁变化的状态，考虑使用防抖或节流
2. **数据大小**：localStorage 有大小限制（通常 5-10MB）
3. **异步操作**：序列化是同步的，避免在其中执行异步操作

## 调试

### 查看存储的数据

```javascript
// 在浏览器控制台中
console.log(localStorage.getItem('goal-store'));
```

### 清除持久化数据

```javascript
// 在浏览器控制台中
localStorage.removeItem('goal-store');

// 或在代码中
const goalStore = useGoalStore();
goalStore.$reset(); // 重置到初始状态
```

## 总结

使用 Pinia 持久化插件的优势：

1. **自动化**：无需手动管理 localStorage
2. **类型安全**：完整的 TypeScript 支持
3. **灵活配置**：支持选择性持久化和自定义序列化
4. **性能优化**：只在状态变化时保存
5. **开发体验**：自动恢复状态，热重载友好

对于你的 Goal Store，建议使用选择性持久化，只保存核心业务数据，并使用自定义序列化器处理 Goal 和 GoalDir 实体对象。

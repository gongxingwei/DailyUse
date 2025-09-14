// ===== Pinia 持久化组件使用示例 =====

import { defineStore } from 'pinia';
import { Goal, GoalDir } from '@dailyuse/domain-client';

// 方法1：最简单的持久化配置 - 保存整个 store
export const useSimpleStore = defineStore(
  'simple',
  {
    state: () => ({
      user: null as any,
      settings: {},
      theme: 'light',
    }),

    actions: {
      updateUser(user: any) {
        this.user = user;
      },
    },
  },
  {
    persist: true, // 最简单的配置，会持久化整个 store
  },
);

// 方法2：选择性持久化 - 只保存特定字段
export const useSelectiveStore = defineStore(
  'selective',
  {
    state: () => ({
      // 需要持久化的数据
      user: null as any,
      preferences: {},

      // 不需要持久化的临时数据
      isLoading: false,
      currentPage: 1,
      tempData: [],
    }),

    actions: {
      setUser(user: any) {
        this.user = user;
      },
    },
  },
  {
    persist: {
      key: 'my-selective-store', // 自定义存储键名
      paths: ['user', 'preferences'], // 只持久化这些字段
      storage: localStorage, // 存储位置（默认是 localStorage）
    },
  },
);

// 方法3：自定义序列化/反序列化 - 适合复杂对象
export const useGoalStoreWithPersist = defineStore(
  'goal-persist',
  {
    state: () => ({
      goals: [] as any[],
      goalDirs: [] as any[],
      selectedGoalUuid: null as string | null,
      lastSyncTime: null as Date | null,

      // 临时状态，不需要持久化
      isLoading: false,
      error: null as string | null,
    }),

    getters: {
      getGoalByUuid: (state) => (uuid: string) => {
        return state.goals.find((g) => g.uuid === uuid);
      },
    },

    actions: {
      addGoal(goal: any) {
        this.goals.push(goal);
        this.lastSyncTime = new Date();
      },

      setGoals(goals: any[]) {
        this.goals = goals;
        this.lastSyncTime = new Date();
      },
    },
  },
  {
    persist: {
      key: 'goal-store-v2',
      paths: ['goals', 'goalDirs', 'selectedGoalUuid', 'lastSyncTime'],
      storage: localStorage,

      // 自定义序列化器 - 处理复杂对象和日期
      serializer: {
        deserialize: (value: string) => {
          try {
            const data = JSON.parse(value);

            // 将 DTO 转换为实体对象
            if (data.goals) {
              data.goals = data.goals.map((goalData: any) => Goal.fromDTO(goalData));
            }
            if (data.goalDirs) {
              data.goalDirs = data.goalDirs.map((dirData: any) => GoalDir.fromDTO(dirData));
            }

            // 恢复日期对象
            if (data.lastSyncTime) {
              data.lastSyncTime = new Date(data.lastSyncTime);
            }

            return data;
          } catch (error) {
            console.error('反序列化失败:', error);
            return {};
          }
        },

        serialize: (value: any) => {
          try {
            const data = { ...value };

            // 将实体对象转换为 DTO
            if (data.goals) {
              data.goals = data.goals.map((goal: any) => (goal.toDTO ? goal.toDTO() : goal));
            }
            if (data.goalDirs) {
              data.goalDirs = data.goalDirs.map((dir: any) => (dir.toDTO ? dir.toDTO() : dir));
            }

            return JSON.stringify(data);
          } catch (error) {
            console.error('序列化失败:', error);
            return JSON.stringify({});
          }
        },
      },
    },
  },
);

// 方法4：多存储位置配置
export const useMultiStorageStore = defineStore(
  'multi-storage',
  {
    state: () => ({
      userPreferences: {},
      sessionData: {},
      cacheData: {},
    }),

    actions: {
      updatePreferences(prefs: any) {
        this.userPreferences = prefs;
      },
    },
  },
  {
    persist: [
      {
        key: 'user-preferences',
        paths: ['userPreferences'],
        storage: localStorage, // 长期存储
      },
      {
        key: 'session-data',
        paths: ['sessionData'],
        storage: sessionStorage, // 会话存储
      },
      // cacheData 不持久化
    ],
  },
);

// 方法5：条件持久化 - 根据环境决定是否持久化
export const useConditionalStore = defineStore(
  'conditional',
  {
    state: () => ({
      data: [],
      settings: {},
    }),

    actions: {
      setData(data: any[]) {
        this.data = data;
      },
    },
  },
  {
    persist:
      process.env.NODE_ENV === 'production'
        ? {
            key: 'prod-store',
            paths: ['settings'],
          }
        : false, // 开发环境不持久化
  },
);

// ===== 使用示例 =====

// 在组件中使用
/*
<script setup lang="ts">
import { useGoalStoreWithPersist } from './stores/examples';

const goalStore = useGoalStoreWithPersist();

// 数据会自动从 localStorage 恢复
console.log('已保存的目标:', goalStore.goals);

// 添加目标，会自动保存到 localStorage
goalStore.addGoal({
  uuid: 'goal-1',
  name: '测试目标',
  // ... 其他属性
});

// 状态更新会自动持久化
goalStore.selectedGoalUuid = 'goal-1';
</script>
*/

// ===== 手动控制持久化 =====
export const useManualPersistStore = defineStore('manual-persist', {
  state: () => ({
    data: [],
    needsSave: false,
  }),

  actions: {
    // 手动保存
    async saveToPersistence() {
      try {
        const dataToSave = {
          data: this.data,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('manual-store', JSON.stringify(dataToSave));
        this.needsSave = false;
        console.log('数据已保存');
      } catch (error) {
        console.error('保存失败:', error);
      }
    },

    // 手动加载
    async loadFromPersistence() {
      try {
        const saved = localStorage.getItem('manual-store');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.data = parsed.data || [];
          console.log('数据已加载');
        }
      } catch (error) {
        console.error('加载失败:', error);
      }
    },

    // 标记需要保存
    updateData(newData: any[]) {
      this.data = newData;
      this.needsSave = true;
    },
  },
});

// ===== 迁移和版本控制 =====
export const useVersionedStore = defineStore(
  'versioned',
  {
    state: () => ({
      version: '1.0.0',
      data: {},
      migrated: false,
    }),

    actions: {
      // 版本迁移逻辑
      migrate() {
        const savedVersion = localStorage.getItem('store-version');
        if (!savedVersion || savedVersion < this.version) {
          // 执行迁移逻辑
          this.performMigration(savedVersion || '0.0.0');
          localStorage.setItem('store-version', this.version);
          this.migrated = true;
        }
      },

      performMigration(fromVersion: string) {
        console.log(`从版本 ${fromVersion} 迁移到 ${this.version}`);
        // 迁移逻辑...
      },
    },
  },
  {
    persist: {
      key: 'versioned-store',
      paths: ['data'],

      // 在反序列化后执行迁移
      afterRestore: (ctx) => {
        ctx.store.migrate();
      },
    },
  },
);

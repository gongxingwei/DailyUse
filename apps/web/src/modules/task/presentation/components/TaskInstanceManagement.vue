<template>
  <div id="task-instance-management">
    <!-- 日期选择和操作栏 -->
    <div class="instance-controls">
      <!-- 日期选择器 -->
      <div class="date-controls">
        <v-btn icon="mdi-chevron-left" variant="text" @click="previousDay" class="date-nav-btn" />

        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="outlined" prepend-icon="mdi-calendar" class="date-picker-btn">
              {{ formatSelectedDate }}
            </v-btn>
          </template>
          <v-date-picker v-model="selectedDate" @update:model-value="onDateChange" />
        </v-menu>

        <v-btn icon="mdi-chevron-right" variant="text" @click="nextDay" class="date-nav-btn" />

        <v-btn variant="tonal" color="primary" @click="goToToday" class="today-btn">
          今天
        </v-btn>
      </div>

      <!-- 操作按钮 -->
      <div class="action-controls">
        <v-btn color="primary" variant="elevated" prepend-icon="mdi-refresh" @click="refreshInstances"
          :loading="isLoading">
          刷新
        </v-btn>

        <v-btn color="success" variant="elevated" prepend-icon="mdi-plus" @click="generateInstances"
          :loading="isGenerating">
          生成今日任务
        </v-btn>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-cards">
      <v-card class="stat-card" variant="tonal" color="primary">
        <v-card-text class="text-center">
          <div class="stat-number">{{ totalInstances }}</div>
          <div class="stat-label">总任务</div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" variant="tonal" color="success">
        <v-card-text class="text-center">
          <div class="stat-number">{{ completedInstances }}</div>
          <div class="stat-label">已完成</div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" variant="tonal" color="warning">
        <v-card-text class="text-center">
          <div class="stat-number">{{ pendingInstances }}</div>
          <div class="stat-label">待完成</div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" variant="tonal" color="info">
        <v-card-text class="text-center">
          <div class="stat-number">{{ completionRate }}%</div>
          <div class="stat-label">完成率</div>
        </v-card-text>
      </v-card>
    </div>

    <!-- 任务实例列表 -->
    <div class="instances-list">
      <!-- 空状态 -->
      <v-card v-if="instances.length === 0" class="empty-state-card" elevation="0">
        <v-card-text class="text-center pa-12">
          <v-icon size="80" color="primary" class="mb-4">
            mdi-calendar-check-outline
          </v-icon>
          <h3 class="text-h5 mb-4">{{ formatSelectedDate }} 暂无任务</h3>
          <p class="text-body-1 text-medium-emphasis mb-6">
            点击"生成今日任务"按钮创建任务实例，或检查任务模板是否已设置
          </p>
          <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus" @click="generateInstances"
            :loading="isGenerating">
            生成今日任务
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- 任务实例卡片 -->
      <div v-else class="instances-grid">
        <TaskInstanceCard v-for="instance in instances" :key="instance.uuid" :instance="instance"
          @complete="markAsCompleted" @uncomplete="markAsUncompleted" @edit="editInstance" @delete="deleteInstance" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { formatDateWithTemplate } from '../../../../shared/utils/dateUtils';
// TODO: 导入正确的类型和组件
// import TaskInstanceCard from './TaskInstanceCard.vue';

// 临时组件占位
const TaskInstanceCard = { template: '<div>TaskInstanceCard - 待迁移</div>' };

// 临时类型定义
interface TaskInstance {
  uuid: string;
  templateUuid: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'skipped';
  targetDate: Date;
  completedAt?: Date;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration?: number;
  actualDuration?: number;
  [key: string]: any;
}

// 响应式数据
const selectedDate = ref(new Date());
const instances = ref<TaskInstance[]>([]);
const isLoading = ref(false);
const isGenerating = ref(false);

// 计算属性
const formatSelectedDate = computed(() => {
  return formatDateWithTemplate(selectedDate.value, 'YYYY年MM月DD日');
});

const totalInstances = computed(() => instances.value.length);

const completedInstances = computed(() =>
  instances.value.filter(instance => instance.status === 'completed').length
);

const pendingInstances = computed(() =>
  instances.value.filter(instance => instance.status === 'pending').length
);

const completionRate = computed(() => {
  if (totalInstances.value === 0) return 0;
  return Math.round((completedInstances.value / totalInstances.value) * 100);
});

// 方法
const onDateChange = (date: Date | Date[] | null) => {
  if (date && !Array.isArray(date)) {
    selectedDate.value = date;
    loadInstances();
  }
};

const previousDay = () => {
  const newDate = new Date(selectedDate.value);
  newDate.setDate(newDate.getDate() - 1);
  selectedDate.value = newDate;
  loadInstances();
};

const nextDay = () => {
  const newDate = new Date(selectedDate.value);
  newDate.setDate(newDate.getDate() + 1);
  selectedDate.value = newDate;
  loadInstances();
};

const goToToday = () => {
  selectedDate.value = new Date();
  loadInstances();
};

const loadInstances = async () => {
  isLoading.value = true;
  try {
    // TODO: 实现API调用
    console.log('加载任务实例:', formatDateWithTemplate(selectedDate.value, 'YYYY-MM-DD'));
    // const response = await taskInstanceApi.getByDate(selectedDate.value);
    // instances.value = response.data;
  } catch (error) {
    console.error('加载任务实例失败:', error);
  } finally {
    isLoading.value = false;
  }
};

const refreshInstances = () => {
  loadInstances();
};

const generateInstances = async () => {
  isGenerating.value = true;
  try {
    // TODO: 实现生成任务实例的API调用
    console.log('生成任务实例:', formatDateWithTemplate(selectedDate.value, 'YYYY-MM-DD'));
    // const response = await taskInstanceApi.generateForDate(selectedDate.value);
    // instances.value = response.data;
  } catch (error) {
    console.error('生成任务实例失败:', error);
  } finally {
    isGenerating.value = false;
  }
};

const markAsCompleted = async (instance: TaskInstance) => {
  try {
    // TODO: 实现标记完成的API调用
    console.log('标记任务完成:', instance.uuid);
    // await taskInstanceApi.markCompleted(instance.uuid);
    instance.status = 'completed';
    instance.completedAt = new Date();
  } catch (error) {
    console.error('标记任务完成失败:', error);
  }
};

const markAsUncompleted = async (instance: TaskInstance) => {
  try {
    // TODO: 实现取消完成的API调用
    console.log('取消任务完成:', instance.uuid);
    // await taskInstanceApi.markUncompleted(instance.uuid);
    instance.status = 'pending';
    instance.completedAt = undefined;
  } catch (error) {
    console.error('取消任务完成失败:', error);
  }
};

const editInstance = (instance: TaskInstance) => {
  console.log('编辑任务实例:', instance);
  // TODO: 打开编辑对话框或导航到编辑页面
};

const deleteInstance = async (instance: TaskInstance) => {
  try {
    console.log('删除任务实例:', instance.uuid);
    // TODO: 确认对话框
    // await taskInstanceApi.delete(instance.uuid);
    const index = instances.value.findIndex(i => i.uuid === instance.uuid);
    if (index > -1) {
      instances.value.splice(index, 1);
    }
  } catch (error) {
    console.error('删除任务实例失败:', error);
  }
};

// 生命周期
onMounted(() => {
  loadInstances();
});
</script>

<style scoped>
#task-instance-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
}

.instance-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.date-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-nav-btn {
  min-width: 40px;
}

.date-picker-btn {
  min-width: 200px;
  font-weight: 600;
}

.today-btn {
  font-weight: 600;
}

.action-controls {
  display: flex;
  gap: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-card {
  border-radius: 12px;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
  margin-top: 4px;
}

.instances-list {
  flex: 1;
  min-height: 0;
}

.empty-state-card {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.instances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  height: 100%;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .instance-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .date-controls {
    justify-content: center;
  }

  .action-controls {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  #task-instance-management {
    padding: 16px;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .instances-grid {
    grid-template-columns: 1fr;
  }

  .date-picker-btn {
    min-width: 150px;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .date-controls {
    flex-wrap: wrap;
  }
}
</style>

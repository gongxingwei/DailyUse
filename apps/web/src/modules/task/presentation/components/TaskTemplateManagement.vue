<template>
  <div id="task-template-management">
    <!-- 筛选和操作栏 -->
    <div class="template-controls">
      <!-- 状态筛选器 -->
      <div class="template-filters">
        <v-btn-toggle v-model="currentStatus" mandatory variant="outlined" divided class="filter-group">
          <v-btn v-for="status in statusFilters" :key="status.value" :value="status.value" class="filter-button"
            size="large">
            <v-icon :icon="status.icon" start />
            {{ status.label }}
            <v-chip size="small" :color="getStatusChipColor(status.value)" variant="elevated" class="ml-2">
              {{ getTemplateCountByStatus(status.value) }}
            </v-chip>
          </v-btn>
        </v-btn-toggle>
      </div>

      <!-- 操作按钮组 -->
      <div class="action-buttons">
        <!-- 删除所有模板按钮 -->
        <v-btn v-if="allTemplates.length > 0" color="error" variant="outlined" size="large"
          prepend-icon="mdi-delete-sweep" @click="showDeleteAllDialog = true" class="delete-all-button">
          删除所有模板
        </v-btn>

        <!-- 创建按钮 -->
        <v-btn color="primary" variant="elevated" size="large" prepend-icon="mdi-plus" @click="startCreateTaskTemplate"
          class="create-button">
          创建新模板
        </v-btn>
      </div>
    </div>

    <!-- 模板列表 -->
    <div class="template-grid">
      <!-- 空状态 -->
      <v-card v-if="filteredTemplates.length === 0" class="empty-state-card" elevation="2">
        <v-card-text class="text-center pa-8">
          <v-icon :color="getEmptyStateIconColor()" size="64" class="mb-4">
            {{ getEmptyStateIcon() }}
          </v-icon>
          <h3 class="text-h5 mb-2">
            {{ getEmptyStateText() }}
          </h3>
          <p class="text-body-1 text-medium-emphasis">
            {{ getEmptyStateDescription() }}
          </p>
          <v-btn v-if="currentStatus === 'active'" color="primary" variant="tonal" prepend-icon="mdi-plus"
            @click="startCreateTaskTemplate" class="mt-4">
            创建第一个模板
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- TODO: 使用 TaskTemplateCard 组件 -->
      <TaskTemplateCard v-for="template in filteredTemplates" :key="template.uuid" :template="template"
        :status-filters="statusFilters" @edit="startEditTaskTemplate" @delete="deleteTemplate" @pause="pauseTemplate"
        @resume="resumeTemplate" />
    </div>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="error" class="mr-2">mdi-delete-alert</v-icon>
          确认删除
        </v-card-title>
        <v-card-text>
          确定要删除任务模板 "{{ selectedTemplate?.title }}" 吗？
          <br>
          <span class="text-caption text-error">此操作不可恢复，相关的任务实例也会被删除。</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">
            取消
          </v-btn>
          <v-btn color="error" variant="elevated" @click="confirmDelete">
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除所有模板确认对话框 -->
    <v-dialog v-model="showDeleteAllDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="error" class="mr-2">mdi-delete-sweep</v-icon>
          删除所有任务模板
        </v-card-title>
        <v-card-text>
          <v-alert color="error" variant="tonal" class="mb-4">
            <template v-slot:prepend>
              <v-icon>mdi-alert-circle</v-icon>
            </template>
            <strong>警告：此操作将永久删除所有任务模板！</strong>
          </v-alert>
          <p class="mb-2">这将删除 {{ allTemplates.length }} 个任务模板。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteAllDialog = false">
            取消
          </v-btn>
          <v-btn color="error" variant="elevated" @click="confirmDeleteAll">
            删除所有
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
// TODO: 迁移相关的store和组件
// import { useTaskStore } from '../stores/taskStore';
// import TaskTemplateCard from './TaskTemplateCard.vue';

// 临时类型定义
interface TaskTemplate {
  uuid: string;
  title: string;
  status: 'active' | 'paused' | 'deleted';
  [key: string]: any;
}

// 临时组件占位
const TaskTemplateCard = { template: '<div>TaskTemplateCard - 待迁移</div>' };

// 临时数据
const allTemplates = ref<TaskTemplate[]>([]);
const currentStatus = ref<'active' | 'paused' | 'deleted'>('active');
const showDeleteDialog = ref(false);
const showDeleteAllDialog = ref(false);
const selectedTemplate = ref<TaskTemplate | null>(null);

const statusFilters = [
  {
    label: '活跃',
    value: 'active',
    icon: 'mdi-check-circle'
  },
  {
    label: '暂停',
    value: 'paused',
    icon: 'mdi-pause-circle'
  },
  {
    label: '已删除',
    value: 'deleted',
    icon: 'mdi-delete-circle'
  }
];

const filteredTemplates = computed(() => {
  return allTemplates.value.filter(template => template.status === currentStatus.value);
});

// 方法占位
const getStatusChipColor = (status: string) => {
  switch (status) {
    case 'active': return 'success';
    case 'paused': return 'warning';
    case 'deleted': return 'error';
    default: return 'primary';
  }
};

const getTemplateCountByStatus = (status: string) => {
  return allTemplates.value.filter(template => template.status === status).length;
};

const getEmptyStateIcon = () => {
  switch (currentStatus.value) {
    case 'active': return 'mdi-format-list-checks';
    case 'paused': return 'mdi-pause-circle-outline';
    case 'deleted': return 'mdi-delete-outline';
    default: return 'mdi-format-list-checks';
  }
};

const getEmptyStateIconColor = () => {
  switch (currentStatus.value) {
    case 'active': return 'primary';
    case 'paused': return 'warning';
    case 'deleted': return 'error';
    default: return 'primary';
  }
};

const getEmptyStateText = () => {
  switch (currentStatus.value) {
    case 'active': return '暂无活跃的任务模板';
    case 'paused': return '暂无暂停的任务模板';
    case 'deleted': return '暂无已删除的任务模板';
    default: return '暂无任务模板';
  }
};

const getEmptyStateDescription = () => {
  switch (currentStatus.value) {
    case 'active': return '创建第一个任务模板，开始您的生产力之旅';
    case 'paused': return '暂停的模板不会生成新的任务实例';
    case 'deleted': return '已删除的模板会在30天后永久清除';
    default: return '';
  }
};

// TODO: 实现这些方法
const startCreateTaskTemplate = () => {
  console.log('创建任务模板');
};

const startEditTaskTemplate = (template: any) => {
  console.log('编辑任务模板', template);
};

const deleteTemplate = (template: any) => {
  selectedTemplate.value = template;
  showDeleteDialog.value = true;
};

const confirmDelete = () => {
  console.log('确认删除', selectedTemplate.value);
  showDeleteDialog.value = false;
};

const confirmDeleteAll = () => {
  console.log('确认删除所有');
  showDeleteAllDialog.value = false;
};

const pauseTemplate = (template: any) => {
  console.log('暂停模板', template);
};

const resumeTemplate = (template: any) => {
  console.log('恢复模板', template);
};
</script>

<style scoped>
#task-template-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
}

.template-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.template-filters {
  flex: 1;
  min-width: 400px;
}

.filter-group {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-button {
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  flex: 1;
  overflow-y: auto;
}

.empty-state-card {
  grid-column: 1 / -1;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .template-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .template-filters {
    min-width: auto;
  }

  .filter-group {
    width: 100%;
  }

  .action-buttons {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  #task-template-management {
    padding: 16px;
  }

  .template-grid {
    grid-template-columns: 1fr;
  }
}
</style>

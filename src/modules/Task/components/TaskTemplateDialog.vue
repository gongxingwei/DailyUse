<!-- filepath: /d:/myPrograms/DailyUse/src/modules/Task/components/TaskTemplateDialog.vue -->
<template>
  <v-dialog :model-value="visible" max-width="900" persistent scrollable>
    <v-card class="task-template-dialog">
      <v-card-title class="dialog-header">
        <v-icon color="primary" class="mr-2">
          {{ isEditMode ? 'mdi-pencil' : 'mdi-plus' }}
        </v-icon>
        {{ isEditMode ? '编辑任务模板' : '创建任务模板' }}
        <v-spacer />
        <v-btn icon variant="text" @click="$emit('cancel')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="dialog-content">
        <!-- 表单内容 -->
        <TaskTemplateForm
          v-if="localTemplate"
          v-model="localTemplate"
          :is-edit-mode="isEditMode"
        />
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-spacer />
        <v-btn variant="text" @click="$emit('cancel')">
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="handleSave"
          :disabled="!isFormValid"
        >
          {{ isEditMode ? '更新' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { TaskTemplate } from '../types/task';
import TaskTemplateForm from './TaskTemplateForm.vue';

interface Props {
  visible: boolean;
  template?: TaskTemplate | null;
  isEditMode?: boolean;
}

interface Emits {
  (e: 'cancel'): void;
  (e: 'save', template: TaskTemplate): void;
  (e: 'update:visible', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
  template: null
});

const emit = defineEmits<Emits>();

const localTemplate = ref<TaskTemplate | null>(null);
const isFormValid = computed(() => {
  return localTemplate.value?.title?.trim() && localTemplate.value.title.trim().length > 0;
});

// 监听 template 属性变化
watch(() => props.template, (newTemplate) => {
  if (newTemplate) {
    localTemplate.value = { ...newTemplate };
  }
}, { immediate: true });

// 监听 visible 属性变化，重置表单
watch(() => props.visible, (newVisible) => {
  if (!newVisible) {
    localTemplate.value = null;
  }
});

const handleSave = () => {
  if (localTemplate.value && isFormValid.value) {
    emit('save', localTemplate.value);
  }
};
</script>

<style scoped>
.task-template-dialog {
  border-radius: 16px;
}

.dialog-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1), rgba(var(--v-theme-secondary), 0.05));
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.dialog-content {
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-actions {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
  padding: 1rem 1.5rem;
}
</style>
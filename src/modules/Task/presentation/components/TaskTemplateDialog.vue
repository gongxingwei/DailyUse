<!-- filepath: /d:/myPrograms/DailyUse/src/modules/Task/components/TaskTemplateDialog.vue -->
<template>
  <v-dialog :model-value="props.visible" max-width="900" persistent scrollable>
    <v-card class="task-template-dialog">
      <v-card-title class="dialog-header">
        <v-icon color="primary" class="mr-2">
          {{ isEditMode ? 'mdi-pencil' : 'mdi-plus' }}
        </v-icon>
        {{ isEditMode ? '编辑任务模板' : '创建任务模板' }}
      </v-card-title>

      <v-card-text class="dialog-content"> <!-- 表单内容 -->
        <TaskTemplateForm ref="formRef" :is-edit-mode="isEditMode" />
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-spacer />
        <v-btn variant="text" @click="$emit('cancel')">
          取消
        </v-btn>
        <v-btn color="primary" variant="elevated" @click="handleSave" :disabled="!canSave">
          {{ props.isEditMode ? '更新' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TaskTemplateForm from './TaskTemplateForm/TaskTemplateForm.vue';


interface Props {
  visible: boolean;
  isEditMode?: boolean;
}

interface Emits {
  (e: 'cancel'): void;
  (e: 'save'): void;
  (e: 'update:visible', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
  template: null
});

const emit = defineEmits<Emits>();
const formRef = ref();

const handleSave = async () => {
 
    emit('save');
};

const canSave = computed(() => {
  console.log('Checking form validity...',formRef.value?.isValid);
  return formRef.value?.isValid ?? false;
})

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
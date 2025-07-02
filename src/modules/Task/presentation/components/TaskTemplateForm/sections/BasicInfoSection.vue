<!-- widgets/BasicInfoSection.vue -->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-information-outline</v-icon>
      基础信息
    </v-card-title>
    <v-card-text>
      <v-row> <v-col cols="12">
          <v-text-field v-model="title" label="任务标题" placeholder="请输入任务标题" :rules="titleRules" variant="outlined"
            required counter="100" />
        </v-col>

        <v-col cols="12">
          <v-textarea v-model="description" label="任务描述" placeholder="请输入任务描述（可选）" :rules="descriptionRules"
            variant="outlined" rows="3" counter="1000" no-resize />
        </v-col>

      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const updateTemplate = (updater: (template: TaskTemplate) => void) => {
  const updatedTemplate = props.modelValue.clone();
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

const title = computed({
  get: () => props.modelValue.title,
  set: (value: string) => {
    updateTemplate((template) => {
      template.updateTitle(value);
    });
  }
});

const description = computed({
  get: () => props.modelValue.description,
  set: (value: string) => {
    updateTemplate((template) => {
      template.updateDescription(value);
    });
  }
});


// 验证规则
const titleRules = [
  (v: string) => !!v || '任务标题是必填的',
  (v: string) => (v && v.length <= 100) || '任务标题不能超过100个字符'
];

const descriptionRules = [
  (v: string) => !v || v.length <= 1000 || '任务描述不能超过1000个字符'
];
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>

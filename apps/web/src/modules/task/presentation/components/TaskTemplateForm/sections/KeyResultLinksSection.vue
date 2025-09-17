<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-title>
      <v-icon start>mdi-target</v-icon>
      关键结果链接
    </v-card-title>
    <v-card-text>
      <div class="text-center py-8">
        <v-icon size="48" color="grey-lighten-1" class="mb-3">
          mdi-link-off
        </v-icon>
        <div class="text-body-2 text-grey">
          关键结果链接功能正在开发中
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import type { TaskTemplate } from '@dailyuse/domain-client';

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 暂时总是返回valid
watch(
  () => props.modelValue,
  () => {
    emit('update:validation', true);
  },
  { deep: true, immediate: true }
);
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
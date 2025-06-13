<!-- widgets/MetadataSection.vue -->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-information-outline</v-icon>
      任务元数据
    </v-card-title>
    <v-card-text>
      <v-row>
        <!-- 任务分类 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="localData.metadata.category"
            label="任务分类"
            :items="categoryOptions"
            variant="outlined"
            required
          />
        </v-col>

        <!-- 任务难度 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="localData.metadata.difficulty"
            label="任务难度"
            :items="difficultyOptions"
            variant="outlined"
            required
          />
        </v-col>

        <!-- 预估时长 -->
        <v-col cols="12" md="6">
          <v-text-field 
            v-model.number="localData.metadata.estimatedDuration" 
            label="预估时长（分钟）"
            type="number" 
            variant="outlined" 
            min="1" 
            max="1440"
            :rules="durationRules"
          />
        </v-col>

        <!-- 任务地点 -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="localData.metadata.location"
            label="任务地点（可选）"
            variant="outlined"
            prepend-inner-icon="mdi-map-marker-outline"
          />
        </v-col>

        <!-- 任务标签 -->
        <v-col cols="12">
          <v-combobox
            v-model="localData.metadata.tags"
            label="任务标签"
            variant="outlined"
            multiple
            chips
            closable-chips
            :items="tagSuggestions"
            prepend-inner-icon="mdi-tag-multiple-outline"
            hint="按回车键添加新标签"
            persistent-hint
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaskTemplate } from '../../../types/task';

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 分类选项
const categoryOptions = [
  { title: '工作', value: 'work' },
  { title: '学习', value: 'study' },
  { title: '生活', value: 'life' },
  { title: '健康', value: 'health' },
  { title: '社交', value: 'social' },
  { title: '娱乐', value: 'entertainment' },
  { title: '习惯', value: 'habit' },
  { title: '其他', value: 'general' }
];

// 难度选项
const difficultyOptions = [
  { title: '⭐ 很简单', value: 1 },
  { title: '⭐⭐ 简单', value: 2 },
  { title: '⭐⭐⭐ 一般', value: 3 },
  { title: '⭐⭐⭐⭐ 困难', value: 4 },
  { title: '⭐⭐⭐⭐⭐ 很困难', value: 5 }
];

// 标签建议
const tagSuggestions = [
  '重要', '紧急', '例行', '学习', '工作', '会议', '运动', '阅读', 
  '编程', '设计', '写作', '思考', '计划', '回顾', '沟通', '创作'
];

// 时长验证规则
const durationRules = [
  (v: number) => !v || v > 0 || '预估时长必须大于0分钟',
  (v: number) => !v || v <= 1440 || '预估时长不能超过24小时(1440分钟)'
];
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>

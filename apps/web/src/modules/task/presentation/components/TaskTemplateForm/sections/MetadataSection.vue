<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-information-outline</v-icon>
      任务元数据
    </v-card-title>
    <v-card-text>
      <v-row>
        

        <!-- 重要性 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="importance"
            label="重要性"
            :items="importanceOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            required
          />
        </v-col>

        <!-- 紧急性 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="urgency"
            label="紧急性"
            :items="urgencyOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            required
          />
        </v-col>
        
        <!-- 任务分类 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="category"
            label="任务分类"
            :items="categoryOptions"
            variant="outlined"
            required
          />
        </v-col>

        <!-- 预估时长 -->
        <v-col cols="12" md="6">
          <v-text-field 
            v-model.number="estimatedDuration" 
            label="预估时长（分钟）"
            type="number" 
            variant="outlined" 
            min="1" 
            max="1440"
            :rules="durationRules"
          />
        </v-col>

        <!-- 任务标签 -->
        <v-col cols="12">
          <v-combobox
            v-model="tags"
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
import type { TaskTemplate } from '@/modules/task/domain/aggregates/taskTemplate';
import { ImportanceLevel } from '@dailyuse/contracts';
import { UrgencyLevel } from '@dailyuse/contracts';

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();



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


// 重要性选项
const importanceOptions = [
  { title: '极其重要', value: ImportanceLevel.Vital, subtitle: '对生活/工作有重大影响，如健康检查、家人重要日子' },
  { title: '非常重要', value: ImportanceLevel.Important, subtitle: '对目标实现很关键，如职业发展相关任务' },
  { title: '中等重要', value: ImportanceLevel.Moderate, subtitle: '值得做但不是关键，如技能提升、社交活动' },
  { title: '不太重要', value: ImportanceLevel.Minor, subtitle: '可做可不做，如日常琐事' },
  { title: '无关紧要', value: ImportanceLevel.Trivial, subtitle: '纯粹消遣，如游戏娱乐' },
];


// 紧急性选项
const urgencyOptions = [
  { title: '非常紧急', value: UrgencyLevel.Critical, subtitle: '需要立即处理，如药物提醒、紧急会议' },
  { title: '高度紧急', value: UrgencyLevel.High, subtitle: '今天必须处理，如当天截止的工作任务' },
  { title: '中等紧急', value: UrgencyLevel.Medium, subtitle: '近期需要处理，如本周需要完成的报告' },
  { title: '低度紧急', value: UrgencyLevel.Low, subtitle: '可以稍后处理，如长期学习计划' },
  { title: '无期限', value: UrgencyLevel.None, subtitle: '没有具体时间要求，如兴趣学习、休闲活动' },
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

const category = computed({
  get: () => props.modelValue.metadata.category,
  set: (value: string) => {
    const updatedTemplate = props.modelValue.clone();
    updatedTemplate.updateMetadata({
      ...updatedTemplate.metadata,
      category: value
    });
    emit('update:modelValue', updatedTemplate);
  }
});


const importance = computed({
  get: () => props.modelValue.metadata.importance,
  set: (value: string) => {
    const updatedTemplate = props.modelValue.clone();
    updatedTemplate.updateMetadata({
      ...updatedTemplate.metadata,
      importance: value as ImportanceLevel
    });
    emit('update:modelValue', updatedTemplate);
  }
});

const urgency = computed({
  get: () => props.modelValue.metadata.urgency,
  set: (value: string) => {
    const updatedTemplate = props.modelValue.clone();
    updatedTemplate.updateMetadata({
      ...updatedTemplate.metadata,
      urgency: value as UrgencyLevel
    });
    emit('update:modelValue', updatedTemplate);
  }
});

const estimatedDuration = computed({
  get: () => props.modelValue.metadata.estimatedDuration,
  set: (value: number) => {
    const updatedTemplate = props.modelValue.clone();
    updatedTemplate.updateMetadata({
      ...updatedTemplate.metadata,
      estimatedDuration: value
    });
    emit('update:modelValue', updatedTemplate);
  }
});


const tags = computed({
  get: () => props.modelValue.metadata.tags,
  set: (value: string[]) => {
    const updatedTemplate = props.modelValue.clone();
    updatedTemplate.updateMetadata({
      ...updatedTemplate.metadata,
      tags: value
    });
    emit('update:modelValue', updatedTemplate);
  }
});
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>

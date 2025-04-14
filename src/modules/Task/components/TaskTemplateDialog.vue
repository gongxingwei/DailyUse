<template>
    <v-dialog :model-value="visible" max-width="800px">
        <v-card>
            <v-card-title class="d-flex justify-space-between">
                <v-btn variant="text" @click="handleCancel">取消</v-btn>
                <span>{{ tempTask.id === 'temp' ? '新建任务模板' : '编辑任务模板' }}</span>
                <v-btn color="primary" @click="handleSave" :disabled="!isValid">
                    保存
                </v-btn>
            </v-card-title>

            <v-card-text>
                <v-form>
                    <!-- 任务标题 -->
                    <v-text-field v-model="tempTask.title" label="任务标题" :error-messages="errors.title" required />

                    <!-- 任务描述 -->
                    <v-textarea v-model="tempTask.description" label="任务描述（可选）" rows="3" />

                    <!-- 重复设置 -->
                    <v-select v-model="tempTask.repeatPattern.type" label="重复" :items="[
                        { title: '不重复', value: 'none' },
                        { title: '每天', value: 'daily' },
                        { title: '每周', value: 'weekly' },
                    ]" />

                    <!-- 周重复选择 -->
                    <v-btn-toggle v-if="tempTask.repeatPattern.type === 'weekly'" v-model="tempTask.repeatPattern.days"
                        multiple class="my-4">
                        <v-btn v-for="(day, index) in weekDays" :key="index" :value="index" density="compact">
                            {{ day }}
                        </v-btn>
                    </v-btn-toggle>

                    <!-- 日期选择 -->
                    <v-row>
                        <v-col cols="6">
                            <span>开始日期</span>
                            <v-date-picker v-model="startDate" label="开始日期" :min="today" elevation="0"/>
                        </v-col>
                        <v-col cols="6">
                            <span>结束日期</span>
                            <v-date-picker v-model="endDate" label="截止日期" :min="startDate || today" elevation="0"/>
                        </v-col>
                    </v-row>

                    <!-- 关联关键结果 -->
                    <v-card-subtitle>关联的关键结果</v-card-subtitle>
                    <div v-for="(link, index) in tempTask.keyResultLinks" :key="index">
                        <v-row align="center" class="my-2">
                            <v-col cols="4">
                                <v-select v-model="link.goalId" :items="goals" item-title="title" item-value="id"
                                    label="选择目标" @update:model-value="handleGoalChange(index)" />
                            </v-col>
                            <v-col cols="4">
                                <v-select v-model="link.keyResultId" :items="getKeyResults(link.goalId)"
                                    item-title="name" item-value="id" label="选择关键结果" :disabled="!link.goalId" />
                            </v-col>
                            <v-col cols="3">
                                <v-text-field v-model.number="link.incrementValue" type="number" label="增加值" min="0" />
                            </v-col>
                            <v-col cols="1">
                                <v-btn icon="mdi-close" size="small" variant="text"
                                    @click="removeKeyResultLink(index)" />
                            </v-col>
                        </v-row>
                    </div>

                    <v-btn prepend-icon="mdi-plus" variant="outlined" class="mt-4" @click="addKeyResultLink">
                        添加关联的关键结果
                    </v-btn>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useGoalStore } from '@/modules/Goal/stores/goalStore';
import { useTaskStore } from '../stores/taskStore';

const props = defineProps<{
    visible: boolean;
}>();

watch(
    () => props.visible,
    (newVal) => {
        if (newVal) {
            console.log('Dialog opened');
        }
    }
);
const emit = defineEmits<{
    (e: 'save'): void;
    (e: 'cancel'): void;
}>();

const goalStore = useGoalStore();
const taskStore = useTaskStore();
const tempTask = computed({
    get: () => taskStore.tempTaskTemplate,
    set: (value) => {
        taskStore.tempTaskTemplate = value;
    }
});

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const errors = reactive({
    title: '',
});

const goals = computed(() => goalStore.getAllGoals);

const isValid = computed(() => {
    return tempTask.value.title.trim() !== '' && !errors.title;
});

// Methods
const validateForm = () => {
    errors.title = tempTask.value.title.trim() === '' ? '请输入任务标题' : '';
    return !errors.title;
};

const addKeyResultLink = () => {
    tempTask.value.keyResultLinks?.push({
        goalId: '',
        keyResultId: '',
        incrementValue: 1,
    });
};

const removeKeyResultLink = (index: number) => {
    tempTask.value.keyResultLinks?.splice(index, 1);
};

const getKeyResults = (goalId: string) => {
    const goal = goals.value.find(g => g.id === goalId);
    return goal?.keyResults || [];
};

const handleGoalChange = (index: number) => {
    const link = tempTask.value.keyResultLinks?.[index];
    if (link) {
        link.keyResultId = '';
    }
};

const handleSave = () => {
    if (!validateForm()) return;
    emit('save');
};

const handleCancel = () => {
    emit('cancel');
};
// Date
interface DateValue {
  startDate: Date | string | null;
  endDate: Date | string | null;
}
// 日期处理工具函数
const parseDate = (date: any): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

const today = new Date();

// 计算属性处理日期
const startDate = computed({
  get: () => parseDate(tempTask.value.startDate),
  set: (value: Date | null) => {
    tempTask.value.startDate = value ? formatDate(value) : '';
  }
});

const endDate = computed({
  get: () => parseDate(tempTask.value.endDate),
  set: (value: Date | null) => {
    tempTask.value.endDate = value ? formatDate(value) : '';
  }
});
</script>
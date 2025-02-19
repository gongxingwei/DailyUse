<template>
  <v-dialog v-model="dialogVisible" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">编辑任务</v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="editedTodo.title" label="标题" required
                :rules="[v => !!v || '标题不能为空']"></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-textarea v-model="editedTodo.description" label="内容" rows="3"></v-textarea>
            </v-col>

            <!-- 时间配置 -->
            <v-col cols="12">
              <v-select v-model="editedTodo.timeConfig.mode" :items="timeModeOptions" label="任务类型" required
                @change="handleTimeModeChange"></v-select>
            </v-col>

            <!-- Update time input labels -->
            <v-col cols="12" v-if="editedTodo.timeConfig.mode === 'once'">
              <v-text-field v-model="editedTodo.timeConfig.timestamp" label="执行时间" type="datetime-local"
                required></v-text-field>
            </v-col>

            <v-col cols="12" v-else-if="editedTodo.timeConfig.mode === 'daily'">
              <v-text-field v-model="editedTodo.timeConfig.dailyTime" label="每日执行时间" type="time"
                required></v-text-field>
            </v-col>

            <v-col cols="12" v-else-if="editedTodo.timeConfig.mode === 'interval'">
              <div class="d-flex align-center gap-2">
                <v-text-field v-model.number="intervalValue" type="number" label="间隔值" :min="1"
                  :max="intervalUnit === 'minutes' ? 59 : 23" required></v-text-field>
                <v-select v-model="intervalUnit" :items="intervalUnitOptions" label="间隔单位"
                  style="width: 120px"></v-select>
              </div>
            </v-col>
            <v-col cols="12">
              <v-switch v-model="editedTodo.needReminder" label="启用提前通知"></v-switch>

              <div v-if="editedTodo.needReminder" class="d-flex align-center gap-2">
                <v-text-field
    v-model.number="advanceHours"
    type="number"
    label="小时"
    :min="0"
    :max="23"
  ></v-text-field>
  <v-text-field
    v-model.number="advanceMinutes"
    type="number"
    label="分钟"
    :min="0"
    :max="59"
  ></v-text-field>
  <v-text-field
    v-model.number="advanceSeconds"
    type="number"
    label="秒"
    :min="0"
    :max="59"
  ></v-text-field>
              </div>
            </v-col>
            <!-- 优先级 -->
            <v-col cols="12">
              <v-select v-model="editedTodo.urgency" :items="urgencyOptions" label="优先级" required></v-select>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" variant="text" @click="closeDialog">取消</v-btn>
        <v-btn color="primary" variant="text" @click="saveTodo">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useTodoStore } from '../todoStore';
import type { Todo } from '../todoStore';
import type { TimeMode, ScheduleUnit, UrgencyLevel } from '@/shared/types/time';

interface Props {
  modelValue: boolean;
  todo: Todo | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  todo: null
});

const emit = defineEmits(['update:modelValue']);
const todoStore = useTodoStore();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const timeModeOptions = [
  { title: '单次任务', value: 'once' },
  { title: '每日任务', value: 'daily' },
  { title: '间隔任务', value: 'interval' }
];

const intervalUnitOptions = [
  { title: '分钟', value: 'minutes' },
  { title: '小时', value: 'hours' }
];

const urgencyOptions = [
  { title: '普通', value: 'normal' },
  { title: '重要', value: 'critical' },
  { title: '紧急', value: 'low' }
];

const editedTodo = ref<Todo>({
  id: 0,
  title: '',
  description: '',
  timeConfig: {
    mode: 'once' as TimeMode,
    timestamp: '',
    dailyTime: '',
    interval: {
      value: 30,
      unit: 'minutes' as ScheduleUnit
    }
  },
  urgency: 'normal' as UrgencyLevel,
  completed: false,
  needReminder: false,
  advanceTime: {
    hours: 0,
    minutes: 15,
    seconds: 0
  }
});

const intervalValue = computed({
  get: () => editedTodo.value.timeConfig.interval?.value ?? 30,
  set: (value: number) => {
    if (!editedTodo.value.timeConfig.interval) {
      editedTodo.value.timeConfig.interval = {
        value: value,
        unit: 'minutes'
      };
    } else {
      editedTodo.value.timeConfig.interval.value = value;
    }
  }
});

const intervalUnit = computed({
  get: () => editedTodo.value.timeConfig.interval?.unit ?? 'minutes',
  set: (value: ScheduleUnit) => {
    if (!editedTodo.value.timeConfig.interval) {
      editedTodo.value.timeConfig.interval = {
        value: 30,
        unit: value
      };
    } else {
      editedTodo.value.timeConfig.interval.unit = value;
    }
  }
});

const ensureAdvanceTime = () => {
  if (!editedTodo.value.advanceTime) {
    editedTodo.value.advanceTime = {
      hours: 0,
      minutes: 15,
      seconds: 0
    };
  }
};

const advanceHours = computed({
  get: () => editedTodo.value.advanceTime?.hours ?? 0,
  set: (value: number) => {
    ensureAdvanceTime();
    editedTodo.value.advanceTime!.hours = value || undefined;
  }
});

const advanceMinutes = computed({
  get: () => editedTodo.value.advanceTime?.minutes ?? 0,
  set: (value: number) => {
    ensureAdvanceTime();
    editedTodo.value.advanceTime!.minutes = value || undefined;
  }
});

const advanceSeconds = computed({
  get: () => editedTodo.value.advanceTime?.seconds ?? 0,
  set: (value: number) => {
    ensureAdvanceTime();
    editedTodo.value.advanceTime!.seconds = value || undefined;
  }
});

watch(() => editedTodo.value.needReminder, (needReminder) => {
  if (needReminder && !editedTodo.value.advanceTime) {
    editedTodo.value.advanceTime = {
      hours: 0,
      minutes: 15,
      seconds: 0
    };
  }
});

const handleTimeModeChange = () => {
  switch (editedTodo.value.timeConfig.mode) {
    case 'once':
      editedTodo.value.timeConfig.dailyTime = '';
      editedTodo.value.timeConfig.interval = { value: 30, unit: 'minutes' };
      break;
    case 'daily':
      editedTodo.value.timeConfig.timestamp = '';
      editedTodo.value.timeConfig.interval = { value: 30, unit: 'minutes' };
      break;
    case 'interval':
      editedTodo.value.timeConfig.timestamp = '';
      editedTodo.value.timeConfig.dailyTime = '';
      if (!editedTodo.value.timeConfig.interval) {
        editedTodo.value.timeConfig.interval = { value: 30, unit: 'minutes' };
      }
      break;
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
};

watch(() => props.todo, (newTodo) => {
  if (newTodo) {
    editedTodo.value = {
      ...newTodo,
      timeConfig: {
        ...newTodo.timeConfig,
        interval: newTodo.timeConfig.interval || { value: 30, unit: 'minutes' }
      },
      needReminder: newTodo.needReminder ?? false,
      advanceTime: newTodo.advanceTime || {
        hours: 0,
        minutes: 15,
        seconds: 0
      }
    };
  }
}, { immediate: true });

const saveTodo = () => {
  if (editedTodo.value.title.trim()) {
    const todoToUpdate = {
      ...editedTodo.value,
      // Only include advanceTime if needReminder is true
      ...(editedTodo.value.needReminder ? {
        advanceTime: {
          hours: editedTodo.value.advanceTime?.hours || undefined,
          minutes: editedTodo.value.advanceTime?.minutes || undefined,
          seconds: editedTodo.value.advanceTime?.seconds || undefined
        }
      } : { advanceTime: undefined })
    };
    todoStore.updateTodo(todoToUpdate);
    closeDialog();
  }
};
</script>
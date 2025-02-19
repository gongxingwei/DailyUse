<template>
  <v-dialog v-model="dialogVisible" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">添加新任务</v-card-title>
      
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="newTodo.title"
                label="标题"
                required
                :rules="[v => !!v || '标题不能为空']"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="newTodo.description"
                label="内容"
                rows="3"
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="newTodo.timeConfig.mode"
                :items="timeModeOptions"
                label="任务类型"
                required
                @change="handleTimeModeChange"
              ></v-select>
            </v-col>

            <v-col cols="12" v-if="newTodo.timeConfig.mode === 'once'">
              <v-text-field
                v-model="newTodo.timeConfig.timestamp"
                label="执行时间"
                type="datetime-local"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" v-else-if="newTodo.timeConfig.mode === 'daily'">
              <v-text-field
                v-model="newTodo.timeConfig.dailyTime"
                label="每日执行时间"
                type="time"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" v-else-if="newTodo.timeConfig.mode === 'interval'">
              <div class="d-flex align-center gap-2">
                <v-text-field
                  v-model.number="newTodo.timeConfig.interval.value"
                  type="number"
                  label="间隔值"
                  :min="1"
                  :max="newTodo.timeConfig.interval.unit === 'minutes' ? 59 : 23"
                  required
                ></v-text-field>
                <v-select
                  v-model="newTodo.timeConfig.interval.unit"
                  :items="intervalUnitOptions"
                  label="间隔单位"
                  style="width: 120px"
                ></v-select>
              </div>
            </v-col>

            <!-- Update reminder settings -->
            <v-col cols="12">
              <v-switch
                v-model="newTodo.needReminder"
                label="启用通知"
                title="提前多少时间"
              ></v-switch>
              <span class="text-caption text-grey">提前多少时间通知</span>
              <div v-if="newTodo.needReminder" class="d-flex align-center gap-2">
                <v-text-field
                  v-model.number="newTodo.advanceTime.hours"
                  type="number"
                  label="小时"
                  :min="0"
                  :max="23"
                ></v-text-field>
                <v-text-field
                  v-model.number="newTodo.advanceTime.minutes"
                  type="number"
                  label="分钟"
                  :min="0"
                  :max="59"
                ></v-text-field>
                <v-text-field
                  v-model.number="newTodo.advanceTime.seconds"
                  type="number"
                  label="秒"
                  :min="0"
                  :max="59"
                ></v-text-field>
              </div>
            </v-col>

            <!-- 紧急程度 -->
            <v-col cols="12">
              <v-select
                v-model="newTodo.urgency"
                :items="urgencyOptions"
                label="优先级"
                required
              ></v-select>
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
import { ref, computed } from 'vue';
import { useTodoStore } from '../todoStore';
import type { TimeMode, ScheduleUnit, UrgencyLevel } from '@/shared/types/time';

const props = defineProps({
  modelValue: Boolean
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

const newTodo = ref({
  title: '',
  description: '',
  timeConfig: {
    mode: 'once' as TimeMode,
    timestamp: new Date().toISOString().slice(0, 16),
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

const handleTimeModeChange = () => {
  switch (newTodo.value.timeConfig.mode) {
    case 'once':
      newTodo.value.timeConfig.dailyTime = '';
      newTodo.value.timeConfig.interval = { value: 30, unit: 'minutes' };
      break;
    case 'daily':
      newTodo.value.timeConfig.timestamp = '';
      newTodo.value.timeConfig.interval = { value: 30, unit: 'minutes' };
      break;
    case 'interval':
      newTodo.value.timeConfig.timestamp = '';
      newTodo.value.timeConfig.dailyTime = '';
      break;
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
  resetForm();
};

const saveTodo = () => {
  if (newTodo.value.title.trim()) {
    todoStore.addTodo({
      title: newTodo.value.title,
      description: newTodo.value.description,
      timeConfig: newTodo.value.timeConfig,
      urgency: newTodo.value.urgency,
      completed: false,
      needReminder: newTodo.value.needReminder,
      // Only include advanceTime if needReminder is true
      ...(newTodo.value.needReminder && {
        advanceTime: {
          hours: newTodo.value.advanceTime.hours || undefined,
          minutes: newTodo.value.advanceTime.minutes || undefined,
          seconds: newTodo.value.advanceTime.seconds || undefined
        }
      })
    });
    closeDialog();
  }
};

const resetForm = () => {
  newTodo.value = {
    title: '',
    description: '',
    timeConfig: {
      mode: 'once',
      timestamp: new Date().toISOString().slice(0, 16),
      dailyTime: '',
      interval: {
        value: 30,
        unit: 'minutes'
      }
    },
    urgency: 'normal',
    completed: false,
    needReminder: false,
    advanceTime: {
      hours: 0,
      minutes: 15,
      seconds: 0
    }
  };
};
</script>
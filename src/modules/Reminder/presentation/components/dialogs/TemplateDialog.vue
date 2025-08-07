<template>
  <v-dialog :model-value="isOpen" max-width="500" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-bell-plus' }}</v-icon>
        {{ isEditing ? '编辑提醒模板' : '新建提醒模板' }}
        <v-spacer />
        <v-btn icon variant="text" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6 scroll-area">
        <v-form ref="formRef" v-model="isFormValid">
          <!-- 模板名称 -->
          <v-text-field v-model="templateName" label="模板名称" :rules="nameRules" required class="mb-4" />

          <!-- 描述 -->
          <v-textarea v-model="templateDescription" label="描述" rows="3" class="mb-4" />

          <!-- 优先级选择 -->
          <v-select v-model="templateImportanceLevel" :items="priorityOptions" label="优先级" class="mb-4" />

          <!-- 启用开关 -->
          <v-switch v-model="templateSelfEnabled" label="启用模板" color="primary" class="mb-4" />

          <!-- 通知设置 -->
          <v-switch v-model="templateNotificationSound" label="声音" color="primary" class="mb-2" />
          <v-switch v-model="templateNotificationVibration" label="震动" color="primary" class="mb-2" />
          <v-switch v-model="templateNotificationPopup" label="弹窗" color="primary" class="mb-4" />

          <!-- 时间配置 -->
          <div class="mb-4">
            <v-label class="mb-2">提醒时间</v-label>
            <div class="d-flex align-center gap-2 mb-3">
              <v-select v-model="timeHour" :items="hourOptions" label="小时" density="compact" style="width: 100px;" />
              <span>时</span>
              <v-select v-model="timeMinute" :items="minuteOptions" label="分钟" density="compact"
                style="width: 100px;" />
              <span>分</span>
            </div>
            <div class="text-caption text-medium-emphasis">
              已选时间：{{ selectedTime }}
            </div>
          </div>

          <!-- 星期选择器 -->
          <div class="mb-4">
            <v-label class="mb-2">星期</v-label>
            <v-chip-group v-model="timeDaysOfWeek" multiple column>
              <v-chip v-for="day in weekDayOptions" :key="day.value" :value="day.value" variant="outlined" filter>
                {{ day.title }}
              </v-chip>
            </v-chip-group>
            <div class="text-caption text-medium-emphasis mt-1">
              已选星期：{{ selectedDaysText }}
            </div>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="closeDialog">
          取消
        </v-btn>
        <v-btn color="primary" :disabled="!isFormValid" @click="handleSubmit">
          {{ isEditing ? '更新' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ReminderTemplate } from '@/modules/Reminder/domain/entities/reminderTemplate';
import { ImportanceLevel } from '@common/shared/types/importance';
import { RecurrenceRuleHelper } from '@/shared/utils/recurrenceRuleHelpre';

// =====================
// Props & Emits
// =====================
interface Props {
  modelValue: boolean;
  template?: ReminderTemplate | null;
}
const props = withDefaults(defineProps<Props>(), {
  template: null
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'create-template', template: ReminderTemplate): void;
  (e: 'update-template', template: ReminderTemplate): void;
}>();

// =====================
// Dialog 控制
// =====================
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});
const isEditing = computed(() => !!props.template);

// =====================
// 表单数据与绑定
// =====================

// 当前编辑的模板数据（编辑时 clone，新增时 forCreate）
const templateModel = ref<ReminderTemplate>(
  props.template ? props.template.clone() : ReminderTemplate.forCreate()
);

// 表单字段的 computed 绑定
const templateName = computed({
  get: () => templateModel.value.name,
  set: (val: string) => (templateModel.value.name = val)
});
const templateDescription = computed({
  get: () => templateModel.value.description,
  set: (val: string) => (templateModel.value.description = val)
});
const templateImportanceLevel = computed({
  get: () => templateModel.value.importanceLevel,
  set: (val: ImportanceLevel) => (templateModel.value.importanceLevel = val)
});
const templateSelfEnabled = computed({
  get: () => templateModel.value.selfEnabled,
  set: (val: boolean) => (templateModel.value.selfEnabled = val)
});
const templateNotificationSound = computed({
  get: () => templateModel.value.notificationSettings?.sound ?? false,
  set: (val: boolean) => (templateModel.value.notificationSettings.sound = val)
});
const templateNotificationVibration = computed({
  get: () => templateModel.value.notificationSettings?.vibration ?? false,
  set: (val: boolean) => (templateModel.value.notificationSettings.vibration = val)
});
const templateNotificationPopup = computed({
  get: () => templateModel.value.notificationSettings?.popup ?? false,
  set: (val: boolean) => (templateModel.value.notificationSettings.popup = val)
});

// =====================
// 时间与星期相关
// =====================

// 小时、分钟、星期选项
const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  title: `${i.toString().padStart(2, '0')} 时`,
  value: i
}));
const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
  title: `${i.toString().padStart(2, '0')} 分`,
  value: i
}));
const weekDayOptions = [
  { title: '周日', value: 0 },
  { title: '周一', value: 1 },
  { title: '周二', value: 2 },
  { title: '周三', value: 3 },
  { title: '周四', value: 4 },
  { title: '周五', value: 5 },
  { title: '周六', value: 6 }
];

// 选中的时间和星期
const timeHour = ref(9);
const timeMinute = ref(0);
const timeDaysOfWeek = ref<number[]>([]);

// 选中时间和星期的展示文本
const selectedTime = computed(() => {
  return `${timeHour.value.toString().padStart(2, '0')}:${timeMinute.value.toString().padStart(2, '0')}`;
});
const selectedDaysText = computed(() => {
  if (timeDaysOfWeek.value.length === 0) return '无';
  if (timeDaysOfWeek.value.length === 7) return '每天';
  return timeDaysOfWeek.value
    .slice()
    .sort()
    .map(day => weekDayOptions.find(opt => opt.value === day)?.title)
    .join('、');
});

// =====================
// RecurrenceRule 相关转换
// =====================

// 从 RecurrenceRule 解析时间和星期到 UI
const parseFromRecurrenceRule = (rule: any) => {
  const { hour, minute, daysOfWeek } = RecurrenceRuleHelper.toUISelectors(rule);
  timeHour.value = hour;
  timeMinute.value = minute;
  timeDaysOfWeek.value = daysOfWeek;
};

// 将 UI 选择的时间和星期转换为 RecurrenceRule
const convertToRecurrenceRule = () => {
  return RecurrenceRuleHelper.fromUISelectors(
    timeHour.value,
    timeMinute.value,
    timeDaysOfWeek.value
  );
};

// 监听时间相关 UI 变化，实时同步到 model
watch([timeHour, timeMinute, timeDaysOfWeek], () => {
  if (templateModel.value.timeConfig) {
    templateModel.value.timeConfig.schedule = convertToRecurrenceRule();
  }
}, { deep: true });

// =====================
// 校验规则与选项
// =====================
const nameRules = [
  (v: string) => !!v || '名称不能为空',
  (v: string) => v.length >= 2 || '名称至少2个字符'
];
const priorityOptions = [
  { title: '琐事', value: ImportanceLevel.Trivial },
  { title: '次要', value: ImportanceLevel.Minor },
  { title: '一般', value: ImportanceLevel.Moderate },
  { title: '重要', value: ImportanceLevel.Important },
  { title: '关键', value: ImportanceLevel.Vital }
];

// =====================
// 表单引用与校验
// =====================
const formRef = ref();
const isFormValid = ref(false);

// =====================
// 事件处理
// =====================

/**
 * 关闭弹窗并重置表单
 */
const closeDialog = () => {
  isOpen.value = false;
  // 重置表单校验和内容
  formRef.value?.resetValidation?.();
  templateModel.value = props.template ? props.template.clone() : ReminderTemplate.forCreate();
  if (templateModel.value.timeConfig?.schedule) {
    parseFromRecurrenceRule(templateModel.value.timeConfig.schedule);
  } else {
    timeHour.value = 9;
    timeMinute.value = 0;
    timeDaysOfWeek.value = [];
  }
};

/**
 * 提交表单（创建或更新模板）
 */
const handleSubmit = () => {
  if (isFormValid.value) {
    if (props.template) {
      emit('update-template', templateModel.value as ReminderTemplate);
    } else {
      emit('create-template', templateModel.value as ReminderTemplate);
    }
    closeDialog();
  }
};

// =====================
// 弹窗打开时重置表单内容
// =====================
watch(
  [() => props.template, () => props.modelValue],
  ([tpl, modelValue]) => {
    if (modelValue) {
      // 只在弹窗打开时重置
      templateModel.value = tpl ? tpl.clone() : ReminderTemplate.forCreate();
      // 解析时间配置到 UI
      if (templateModel.value.timeConfig?.schedule) {
        parseFromRecurrenceRule(templateModel.value.timeConfig.schedule);
      } else {
        timeHour.value = 9;
        timeMinute.value = 0;
        timeDaysOfWeek.value = [];
      }
      // 重置表单校验
      formRef.value?.resetValidation?.();
    }
  },
  { immediate: true }
);

</script>

<style scoped>
.scroll-area {
  flex: 1 1 auto;
  overflow: auto;
  min-height: 0;
  /* 防止内容撑开父容器 */
}
</style>
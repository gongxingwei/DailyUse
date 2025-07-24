<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit" class="pa-4">
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="form.name"
          label="提醒名称"
          prepend-inner-icon="mdi-bell"
          required
          maxlength="50"
          counter
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="form.groupId"
          label="分组ID"
          prepend-inner-icon="mdi-folder"
        />
      </v-col>
      <v-col cols="12">
        <v-textarea
          v-model="form.description"
          label="描述"
          prepend-inner-icon="mdi-text"
          rows="2"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          v-model="form.importanceLevel"
          :items="importanceOptions"
          label="重要级别"
          prepend-inner-icon="mdi-flag"
          required
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-switch
          v-model="form.enabled"
          label="启用提醒"
          color="primary"
        />
      </v-col>
      <v-col cols="12">
        <v-row>
          <v-col cols="4">
            <v-switch
              v-model="form.notificationSettings!.sound"
              label="声音"
              color="primary"
            />
          </v-col>
          <v-col cols="4">
            <v-switch
              v-model="form.notificationSettings!.vibration"
              label="振动"
              color="primary"
            />
          </v-col>
          <v-col cols="4">
            <v-switch
              v-model="form.notificationSettings!.popup"
              label="弹窗"
              color="primary"
            />
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12">
        <!-- 时间配置，简单示例，实际可根据 Absolute/Relative 类型细化 -->
        <v-select
          v-model="form.timeConfig.type"
          :items="timeTypeOptions"
          label="时间类型"
          required
        />
        <v-text-field
          v-if="form.timeConfig.type === 'absolute'"
          v-model="absoluteTime"
          label="绝对时间（ISO8601）"
          prepend-inner-icon="mdi-calendar-clock"
        />
        <v-text-field
          v-if="form.timeConfig.type === 'relative'"
          v-model="relativeDuration"
          label="相对时间（秒）"
          prepend-inner-icon="mdi-timer"
          type="number"
        />
      </v-col>
    </v-row>
    <v-btn color="primary" type="submit" :loading="loading">保存</v-btn>
  </v-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import type { IReminderTemplate } from "@electron/modules/Reminder";
import { ImportanceLevel } from "@/shared/types/importance";
import { ReminderTemplate } from "../../domain/entities/reminderTemplate";

const emit = defineEmits<{
  (e: "submit", template: ReminderTemplate): void
}>();

const loading = ref(false);
const formRef = ref();

const importanceOptions = [
  { title: "极其重要", value: ImportanceLevel.Vital },
  { title: "非常重要", value: ImportanceLevel.Important },
  { title: "中等重要", value: ImportanceLevel.Moderate },
  { title: "不太重要", value: ImportanceLevel.Minor },
  { title: "无关紧要", value: ImportanceLevel.Trivial },
];

const timeTypeOptions = [
  { title: "绝对时间", value: "absolute" },
  { title: "相对时间", value: "relative" },
];

// 表单数据
const form = reactive<Partial<IReminderTemplate & { timeConfig: any }>>({
  groupId: "",
  name: "",
  description: "",
  importanceLevel: ImportanceLevel.Moderate,
  enabled: true,
  notificationSettings: {
    sound: true,
    vibration: false,
    popup: true,
  },
  timeConfig: {
    type: "absolute",
    times: [],
    name: "",
    description: "",
    duration: 0,
  },
});

// 绝对时间和相对时间的输入辅助
const absoluteTime = ref("");
const relativeDuration = ref(60);

watch(
  () => form.timeConfig.type,
  (type) => {
    if (type === "absolute") {
      form.timeConfig.times = absoluteTime.value ? [absoluteTime.value] : [];
    } else if (type === "relative") {
      form.timeConfig.duration = relativeDuration.value;
    }
  }
);

const handleSubmit = () => {
  loading.value = true;
  // 构造 ReminderTemplate 实例
  const template = new ReminderTemplate(
    form.groupId || "",
    form.name || "",
    form.importanceLevel as any,
    !!form.enabled,
    {
      sound: form.notificationSettings?.sound || false,
      vibration: form.notificationSettings?.vibration || false,
      popup: form.notificationSettings?.popup || false,
    },
    { ...form.timeConfig },
    undefined,
    form.description
  );
  emit("submit", template);
  loading.value = false;
};
</script>
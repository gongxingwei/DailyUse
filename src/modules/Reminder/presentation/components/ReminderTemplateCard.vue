<template>
  <v-dialog v-bind:model-value="show" width="400" persistent>
    <v-card class="mb-2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-bell</v-icon>
        <span>{{ template?.name || '未命名模板' }}</span>
        <v-spacer />
        <v-switch
          v-if="template"
          v-model="isTemplateEnabled"
          inset
          hide-details
          color="primary"
        />
      </v-card-title>
      <v-card-text>
        <div class="mb-2" v-if="template?.description">
          {{ template.description }}
        </div>
        <div class="mb-2">
          <v-chip :color="getImportanceColor(template?.importanceLevel)">
            {{ getImportanceText(template?.importanceLevel) }}
          </v-chip>
        </div>
        <div class="mb-2">
          <span class="label">分组：</span>
          <span>{{ groupName }}</span>
        </div>
        <div class="mb-2">
          <span class="label">启用：</span>
          <span>{{ template?.selfEnabled ? '是' : '否' }}</span>
        </div>
        <div class="mb-2">
          <span class="label">通知：</span>
          <span>
            <span v-if="template?.notificationSettings?.sound">🔔</span>
            <span v-if="template?.notificationSettings?.vibration">📳</span>
            <span v-if="template?.notificationSettings?.popup">💬</span>
          </span>
        </div>
        <div class="mb-2">
          <span class="label">时间配置：</span>
          <span>{{ timeConfigText }}</span>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="handleBack">返回</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { ReminderTemplate } from "../../domain/entities/reminderTemplate";
import { computed, inject } from "vue";
import { useReminderStore } from "../stores/reminderStore";
import { ImportanceLevel } from "@/shared/types/importance";
import { recurrenceRuleToText } from "@common/shared/utils/recurrenceRuleUtils";
import { RecurrenceRule } from "@common/shared/types/recurrenceRule";
const reminderStore = useReminderStore();

const onSetTemplateEnabled = inject<((uuid: string, enabled: boolean) => void) | undefined>('onSetTemplateEnabled');

const props = defineProps<{
  show: boolean;
  template: ReminderTemplate | null;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const isTemplateEnabled = computed({
  get: () => reminderStore.getReminderTemplateEnabledStatus(props.template?.uuid || ''),
  set: (value: boolean) => {
    if (props.template) {
      try {
        onSetTemplateEnabled?.(props.template.uuid, value);
      } catch (error) {
        console.error("Failed to update template enabled status:", error);
      }
    }
  }
});

const groupName = computed(() => {
  const group = reminderStore.getReminderGroupById(props.template?.groupUuid || '');
  return group ? group.name : '未分组';
});

const getImportanceText = (level?: string) => {
  switch (level) {
    case ImportanceLevel.Vital: return "极其重要";
    case ImportanceLevel.Important: return "非常重要";
    case ImportanceLevel.Moderate: return "中等重要";
    case ImportanceLevel.Minor: return "不太重要";
    case ImportanceLevel.Trivial: return "无关紧要";
    default: return "普通";
  }
};
const getImportanceColor = (level?: string) => {
  switch (level) {
    case ImportanceLevel.Vital: return "error";
    case ImportanceLevel.Important: return "warning";
    case ImportanceLevel.Moderate: return "info";
    case ImportanceLevel.Minor: return "success";
    case ImportanceLevel.Trivial: return "default";
    default: return "primary";
  }
};

const timeConfigText = computed(() => {
  console.log("Recurrence Rule:", props.template?.timeConfig);
  const text = recurrenceRuleToText(props.template?.timeConfig.schedule ?? {} as RecurrenceRule);
  return text;
});

const handleBack = () => {
  emit('back');
};
</script>

<style scoped>
.label {
  color: #888;
  margin-right: 4px;
}
</style>
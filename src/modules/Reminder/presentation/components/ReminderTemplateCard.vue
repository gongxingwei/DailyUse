<template>
  <v-dialog v-bind:model-value="show" width="400" persistent>
    <v-card class="mb-2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-bell</v-icon>
        <span>{{ template?.name }}</span>
        <v-spacer />
        <v-switch v-if="template" v-model="template.enabled" inset hide-details color="primary"  @change="toggleEnabled" />
      </v-card-title>
      <v-card-text>
        <div class="mb-2">
          {{ template?.description }}
        </div>
        <div class="mb-2">
          <v-chip>{{ template?.importanceLevel }}</v-chip>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="handleBack">返回</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { ReminderTemplate } from "../../domain/aggregates/reminderTemplate";
import { ref, computed, watch } from "vue";

const props = defineProps<{
  show: boolean;
  template: ReminderTemplate | null;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const expanded = ref(false);
const editing = ref(false);
const localTemplate = ref<ReminderTemplate | null>(props.template ? JSON.parse(JSON.stringify(props.template)) : null);

watch(() => props.template, (val) => {
  if (val) {
    localTemplate.value = JSON.parse(JSON.stringify(val));
  } else {
    localTemplate.value = null;
  }
});

const toggleExpand = () => {
  expanded.value = !expanded.value;
};
const toggleEdit = () => {
  if (editing.value) {
    // 保存逻辑，可 emit('update', localTemplate.value) 或调用 API
  }
  editing.value = !editing.value;
};
const toggleEnabled = () => {


  // 可 emit('update', localTemplate.value) 或调用 API
  // emit('update', localTemplate.value);
};

const getImportanceText = (level: string) => {
  switch (level) {
    case "critical": return "重要";
    case "low": return "低";
    default: return "普通";
  }
};
const getImportanceColor = (level: string) => {
  switch (level) {
    case "critical": return "error";
    case "low": return "success";
    default: return "info";
  }
};

const handleBack = () => {
  emit('back');
};
</script>
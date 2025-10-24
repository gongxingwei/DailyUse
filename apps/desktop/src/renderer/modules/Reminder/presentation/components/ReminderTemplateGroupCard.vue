<template>
  <v-dialog v-bind:model-value="show" width="600" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-folder</v-icon>
        <span>{{ name }}</span>
        <v-spacer />
        <v-switch
          v-model="enableMode"
          :label="enableMode ? '整组控制' : '个体控制'"
          inset
          hide-details
          color="primary"
          class="mr-2"
        />
        <v-switch
          v-model="enabled"
          :label="enabled ? '启用' : '禁用'"
          :disabled="!enableMode"
          inset
          hide-details
          color="primary"
        />
      </v-card-title>
      <v-card-text class="scroll-area">
        <reminder-grid :items="templates" :grid-size="100" />
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="handleBack">返回</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { useReminderStore } from '@renderer/modules/Reminder/presentation/stores/reminderStore';
const reminderStore = useReminderStore();
// components

import ReminderGrid from './grid/ReminderGrid.vue';

const props = defineProps<{
  show: boolean;
  templateGroupUuid: string | null;
}>();

const templateGroup = computed(() => {
  if (!props.templateGroupUuid) return null;
  return reminderStore.getReminderGroupById(props.templateGroupUuid);
});

const onSetGroupEnabled = inject<((uuid: string, enabled: boolean) => void) | undefined>(
  'onSetGroupEnabled',
);
const onSetGroupEnableMode = inject<
  ((uuid: string, mode: 'group' | 'individual') => void) | undefined
>('onSetGroupEnableMode');

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const name = computed(() => templateGroup.value?.name || '未命名组');

const enableMode = computed({
  get: () => {
    return templateGroup.value?.enableMode === 'group' ? true : false;
  },
  set: (val) => {
    if (templateGroup.value) {
      onSetGroupEnableMode?.(templateGroup.value.uuid, val ? 'group' : 'individual');
    }
  },
});

const enabled = computed({
  get: () => templateGroup.value?.enabled ?? false,
  set: (val) => {
    if (templateGroup.value) {
      onSetGroupEnabled?.(templateGroup.value.uuid, val);
      templateGroup.value.enabled = val;
    }
  },
});

const templates = computed(() => {
  return templateGroup.value?.templates || [];
});

const handleBack = () => {
  emit('back');
};
</script>

<style scoped>
.scroll-area {
  flex: 1 1 auto;
  overflow: auto;
  min-height: 0;
  /* 防止内容撑开父容器 */
}
</style>

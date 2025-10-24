<template>
  <v-dialog v-model="isOpen" max-width="400">
    <v-card>
      <v-card-title>
        移动提醒模板到分组
        <v-spacer />
        <v-btn icon variant="text" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-form ref="formRef" v-model="isFormValid">
          <v-select
            v-model="groupUuidProxy"
            :items="groupOptions"
            label="选择目标分组"
            item-title="title"
            item-value="value"
            :item-disabled="(item: any) => item.disabled"
            :rules="[(v) => !!v || '请选择分组']"
            required
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="closeDialog">取消</v-btn>
        <v-btn color="primary" :disabled="!isFormValid" @click="handleMove">移动</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useReminderStore } from '@renderer/modules/Reminder/presentation/stores/reminderStore';
import type { ReminderTemplate } from '@renderer/modules/Reminder/domain/entities/reminderTemplate';

interface Props {
  modelValue: boolean;
  template: ReminderTemplate | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'move', { template, toGroupId }: { template: ReminderTemplate; toGroupId: string }): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const formRef = ref();
const isFormValid = ref(false);

// 获取所有分组，并为当前组加 disabled 和提示
const reminderStore = useReminderStore();

const groupOptions = computed(() =>
  reminderStore.getReminderGroups
    .map((g) => {
      if (!g || !props.template) return null;
      return {
        title: g.uuid === props.template.groupUuid ? `${g.name}（当前所在组）` : g.name,
        value: g.uuid,
        disabled: g.uuid === props.template.groupUuid,
      };
    })
    .filter(Boolean),
);

// 双向绑定 groupUuid
const groupUuidProxy = ref<string>();

const closeDialog = () => {
  isOpen.value = false;
};

const handleMove = () => {
  if (isFormValid.value && groupUuidProxy.value && props.template) {
    emit('move', { template: props.template, toGroupId: groupUuidProxy.value });
    closeDialog();
  }
};

// 弹窗打开时重置校验
watch(isOpen, (val) => {
  if (val && props.template) {
    formRef.value?.resetValidation?.();
    console.log('传入模板所在分组:', props.template);
    groupUuidProxy.value = props.template.groupUuid; // 绑定到当前模板的分组
  }
});
</script>

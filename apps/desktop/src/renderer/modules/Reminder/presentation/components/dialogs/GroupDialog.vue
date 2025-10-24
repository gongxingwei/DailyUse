<template>
  <v-dialog v-model="isOpen" max-width="500" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-folder-plus' }}</v-icon>
        {{ isEditing ? '编辑提醒分组' : '新建提醒分组' }}
        <v-spacer />
        <v-btn icon variant="text" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form ref="formRef" v-model="isFormValid">
          <!-- 分组名称输入框 -->
          <v-text-field
            v-model="groupModelName"
            label="分组名称"
            :rules="nameRules"
            required
            class="mb-4"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="closeDialog"> 取消 </v-btn>
        <v-btn color="primary" :disabled="!isFormValid" @click="handleSubmit">
          {{ isEditing ? '更新' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ReminderTemplateGroup } from '@renderer/modules/Reminder/domain/aggregates/reminderTemplateGroup';

// =====================
// Props & Emits
// =====================
interface Props {
  modelValue: boolean; // 控制弹窗显示
  group?: ReminderTemplateGroup | null; // 编辑时传入的分组对象
}
const props = withDefaults(defineProps<Props>(), {
  group: null,
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update-group', group: ReminderTemplateGroup): void;
  (e: 'create-group', group: ReminderTemplateGroup): void;
}>();

// =====================
// Dialog 控制
// =====================
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
const isEditing = computed(() => !!props.group);

// =====================
// 表单数据与绑定
// =====================

// 当前编辑的分组数据（编辑时 clone，新增时 forCreate）
const groupModel = ref<ReminderTemplateGroup>(
  props.group ? props.group.clone() : ReminderTemplateGroup.forCreate(),
);

// 监听弹窗和 group 变化，弹窗打开时重置表单内容和校验
watch(
  [() => props.modelValue, () => props.group],
  ([modelValue, group]) => {
    if (modelValue) {
      groupModel.value = group ? group.clone() : ReminderTemplateGroup.forCreate();
      formRef.value?.resetValidation?.();
    }
  },
  { immediate: true },
);

// 分组名称的双向绑定
const groupModelName = computed({
  get: () => groupModel.value.name,
  set: (val: string) => (groupModel.value.name = val),
});

// =====================
// 校验规则
// =====================
const nameRules = [
  (v: string) => !!v || '分组名称不能为空',
  (v: string) => v.length >= 2 || '分组名称至少2个字符',
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
 * 关闭弹窗
 */
const closeDialog = () => {
  isOpen.value = false;
};

/**
 * 提交表单（创建或更新分组）
 */
const handleSubmit = () => {
  if (isFormValid.value) {
    if (props.group) {
      emit('update-group', groupModel.value as ReminderTemplateGroup);
    } else {
      emit('create-group', groupModel.value as ReminderTemplateGroup);
    }
    closeDialog();
  }
};
</script>

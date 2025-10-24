<template>
  <v-dialog :model-value="visible" max-width="400" persistent>
    <v-card>
      <v-card-title class="pa-4">
        <v-icon size="24" class="mr-2">mdi-folder-plus</v-icon>
        {{ isEditing ? '编辑目标节点' : '创建目标节点' }}
      </v-card-title>

      <v-form ref="formRef">
        <v-card-text class="pa-4">
          <v-text-field
            v-model="name"
            label="节点名称"
            variant="outlined"
            density="compact"
            :rules="nameRules"
            @keyup.enter="handleSave"
          >
          </v-text-field>

          <v-select
            v-model="icon"
            :items="iconOptions"
            label="选择图标"
            variant="outlined"
            density="compact"
            item-title="text"
            item-value="value"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-icon>{{ item.raw.value }}</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-card-text>
      </v-form>

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="handleCancel">取消</v-btn>
        <v-btn
          color="primary"
          class="ml-2"
          @click="handleSave"
          variant="elevated"
          :disabled="!isFormValid"
        >
          确定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { GoalDir } from '@dailyuse/domain-client';
// composables
import { useGoal } from '../../composables/useGoal';
import { vi } from 'date-fns/locale';

const { createGoalDir, updateGoalDir } = useGoal();

const visible = ref(false);
const propGoalDir = ref<GoalDir | null>(null);
const localGoalDir = ref<GoalDir>(GoalDir.forCreate({ accountUuid: '' }));

const isEditing = computed(() => !!propGoalDir.value);
const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);
const isFormValid = computed(() => {
  return formRef.value?.isValid ?? false;
});

const name = computed({
  get: () => localGoalDir.value.name,
  set: (val: string) => {
    localGoalDir.value.updateInfo({ name: val });
  },
});

const icon = computed({
  get: () => localGoalDir.value.icon,
  set: (val: string) => {
    localGoalDir.value.updateInfo({ icon: val });
  },
});

watch(
  () => localGoalDir.value.name,
  (newName) => {
    console.log('localGoalDir name changed:', newName);
    console.log('isFormValid', isFormValid.value);
    console.log('formRef:', formRef.value);
    console.log('formRef.value?.isValid:', formRef.value?.isValid);
    console.log('isFormValid:', isFormValid.value);
  },
);
const iconOptions = [
  { text: '文件夹', value: 'mdi-folder' },
  { text: '目标', value: 'mdi-target' },
  { text: '学习', value: 'mdi-school' },
  { text: '工作', value: 'mdi-briefcase' },
  { text: '生活', value: 'mdi-home' },
  { text: '健康', value: 'mdi-heart' },
];

const nameRules = [
  (v: string) => !!v || '名称不能为空',
  (v: string) => (v && v.length >= 1) || '名称至少需要2个字符',
  (v: string) => (v && v.length <= 50) || '名称不能超过50个字符',
];

const handleSave = () => {
  if (!isFormValid.value) return;
  if (propGoalDir.value) {
    // 编辑模式
    updateGoalDir(localGoalDir.value.uuid, localGoalDir.value.toDTO());
  } else {
    // 创建模式
    createGoalDir(localGoalDir.value.toDTO());
  }
  closeDialog();
};

const handleCancel = () => {
  closeDialog();
};

const openDialog = (goalDir?: GoalDir) => {
  visible.value = true;
  propGoalDir.value = goalDir || null;
};

const openForCreate = () => {
  openDialog();
};

const openForEdit = (goalDir: GoalDir) => {
  openDialog(goalDir);
};

const closeDialog = () => {
  visible.value = false;
};

watch(
  [() => visible.value, () => propGoalDir.value],
  ([show]) => {
    if (show) {
      localGoalDir.value = propGoalDir.value
        ? propGoalDir.value.clone()
        : GoalDir.forCreate({ accountUuid: '' });
    } else {
      localGoalDir.value = GoalDir.forCreate({ accountUuid: '' });
    }
  },
  { immediate: true },
);

defineExpose({
  openForCreate,
  openForEdit,
});
</script>

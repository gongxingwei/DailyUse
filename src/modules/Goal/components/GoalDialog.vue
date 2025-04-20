<!-- filepath: /D:/myPrograms/DailyUse-front/src/components/AddGoalModal.vue -->
<template>
  <v-dialog v-model="props.visible" height="500" width="800">
    <v-card>
      <!-- Dialog Header -->
      <v-card-title class="d-flex justify-space-between pa-4">
        <v-btn variant="text" @click="handleCancel">取消</v-btn>
        <span class="text-h5">编辑目标</span>
        <v-btn color="primary" @click="handleComplete">完成</v-btn>
      </v-card-title>

      <!-- Tabs -->
      <v-tabs v-model="activeTab" grow>
        <v-tab v-for="(tab, index) in tabs" :key="index" :value="index">
          <v-icon :icon="tab.icon" class="mr-2" />
          {{ tab.name }}
        </v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="activeTab">
          <!-- Basic Info Tab -->
          <v-window-item :value="0">
            <v-form @submit.prevent>
              <!-- Title and Color -->
              <v-row>
                <v-col cols="11">
                  <v-text-field v-model="tempGoal.title" :error-messages="validationErrors.title" label="目标"
                    placeholder="一段话来描述自己的目标" required />
                </v-col>
                <v-col cols="1">
                  <v-color-picker v-model="tempGoal.color" hide-inputs hide-canvas mode="hex" />
                </v-col>
              </v-row>

              <!-- Goal Directory -->
              <v-select v-model="tempGoal.dirId" :items="goalDirs" item-title="name" item-value="id" label="目标文件夹" />

              <!-- Date Range -->
              <v-row>
                <v-col cols="6">
                  <v-text-field v-model="tempGoal.startTime" label="开始时间" type="date"
                    :error-messages="validationErrors.startTime" :rules="startTimeRules" @input="validateDates"
                    :min="minDate" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="tempGoal.endTime" label="结束时间" type="date"
                    :error-messages="validationErrors.endTime" :rules="endTimeRules" @input="validateDates"
                    :min="tempGoal.startTime" />
                </v-col>
              </v-row>

              <!-- Notes -->
              <v-textarea v-model="tempGoal.note" label="备注" rows="3" />
            </v-form>
          </v-window-item>

          <!-- Key Results Tab -->
          <v-window-item :value="1">
            <v-list>
              <!-- Existing Key Results -->
              <v-list-item v-for="kr in tempGoal.keyResults" :key="kr.id"
                @click="startEditKeyResult(tempGoal.id, kr.id)">
                <template v-slot:prepend>
                  <v-icon :color="tempGoal.color">mdi-target</v-icon>
                </template>
                <v-list-item-title>{{ kr.name }}</v-list-item-title>
                <template v-slot:append>
                  <v-btn icon="mdi-delete" variant="text" :color="tempGoal.color"
                    @click.stop="deleteKeyResult(kr.id)" />
                </template>
              </v-list-item>

              <!-- Add New Key Result Button -->
              <v-list-item @click="startCreateKeyResult">
                <template v-slot:prepend>
                  <v-icon :color="tempGoal.color">mdi-plus</v-icon>
                </template>
                <v-list-item-title class="d-flex direction-column justify-flex-start">
                  添加关键结果
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-window-item>

          <!-- Motivation & Feasibility Tab -->
          <v-window-item :value="2">
            <v-textarea v-model="tempGoal.motive" label="动机描述" rows="4" class="mb-4" />
            <v-textarea v-model="tempGoal.feasibility" label="可行性分析" rows="4" />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>

  <KeyResultDialog :visible="showKeyResultDialog" :goal-id="tempGoal.id" @cancel="cancelKeyResultEdit"
    @save="saveKeyResult" />
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useGoalStore } from '../stores/goalStore';
import { useGoalDirStore } from '../stores/goalDirStore';
import type { IGoal } from '../types/goal';
import KeyResultDialog from './KeyResultDialog.vue';
import { storeToRefs } from 'pinia';
import { useGoalDialog } from '@/modules/Goal/composables/useGoalDialog';

const { showKeyResultDialog, startCreateKeyResult, startEditKeyResult, cancelKeyResultEdit, saveKeyResult, deleteKeyResult } = useGoalDialog();
// 传入参数
// visible: 是否显示
// goal: 目标对象
const props = defineProps<{
  visible: boolean;
}>();

// 发送事件
// 保存和关闭事件
const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'save'): void;
}>();

const goalStore = useGoalStore();
const goalDirStore = useGoalDirStore();

const activeTab = ref(0);
const tabs = [
  { name: '基本信息', icon: 'mdi-information' },
  { name: '关键结果', icon: 'mdi-target' },
  { name: '动机与可行性', icon: 'mdi-lightbulb' }
];

const { tempGoal } = storeToRefs(goalStore);

// 获取可以选的目标节点（即用户自己创建的文件夹）
const goalDirs = computed(() => {
  return goalDirStore.getUserDirs;
});

type ValidationState = {
  [K in keyof Partial<IGoal>]: string | undefined;
};
const validationErrors = reactive<ValidationState>({
  title: undefined,
  keyResults: undefined,
  startTime: undefined,
  endTime: undefined,
});
const minDate = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const startTimeRules = [
  (v: string) => !!v || '开始时间不能为空',
  (v: string) => {
    const startDate = new Date(v);
    return startDate >= new Date(minDate.value) || '开始时间不能早于今天';
  }
];

const endTimeRules = [
  (v: string) => !!v || '结束时间不能为空',
  (v: string) => {
    if (!tempGoal.value.startTime) return true;
    const endDate = new Date(v);
    const startDate = new Date(tempGoal.value.startTime);
    return endDate >= startDate || '结束时间不能早于开始时间';
  }
];

const validateDates = () => {
  if (!tempGoal.value.startTime) {
    validationErrors.startTime = '请选择开始时间';
    return false;
  }
  if (!tempGoal.value.endTime) {
    validationErrors.endTime = '请选择结束时间';
    return false;
  }

  const startDate = new Date(tempGoal.value.startTime);
  const endDate = new Date(tempGoal.value.endTime);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    validationErrors.startTime = '开始时间不能早于今天';
    return false;
  }

  if (endDate < startDate) {
    validationErrors.endTime = '结束时间不能早于开始时间';
    return false;
  }

  validationErrors.startTime = undefined;
  validationErrors.endTime = undefined;
  return true;
};

const isValid = computed(() => {
  return !Object.values(validationErrors).some(error => error) &&
    tempGoal.value.title.trim() !== '' &&
    tempGoal.value.startTime &&
    tempGoal.value.endTime &&
    validateDates();
});
function saveGoal() {
  emit('save');
}

const handleCancel = () => {
  emit('cancel');
  activeTab.value = 0;
};
const handleComplete = () => {
  saveGoal();
};
</script>

<style scoped></style>
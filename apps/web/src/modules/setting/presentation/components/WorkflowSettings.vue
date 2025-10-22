<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h3 class="text-h5 mb-4">
          <v-icon class="mr-2">mdi-cog-outline</v-icon>
          工作流设置
        </h3>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-list lines="two">
          <!-- 默认任务视图 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-check-circle</v-icon>
            </template>
            <v-list-item-title>默认任务视图</v-list-item-title>
            <v-list-item-subtitle>打开任务时的默认视图</v-list-item-subtitle>
            <template v-slot:append>
              <v-select
                v-model="localWorkflow.defaultTaskView"
                :items="taskViewOptions"
                item-title="text"
                item-value="value"
                density="compact"
                style="max-width: 150px"
                hide-details
                @update:model-value="handleWorkflowChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 默认目标视图 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-target</v-icon>
            </template>
            <v-list-item-title>默认目标视图</v-list-item-title>
            <v-list-item-subtitle>打开目标时的默认视图</v-list-item-subtitle>
            <template v-slot:append>
              <v-select
                v-model="localWorkflow.defaultGoalView"
                :items="goalViewOptions"
                item-title="text"
                item-value="value"
                density="compact"
                style="max-width: 150px"
                hide-details
                @update:model-value="handleWorkflowChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 默认日程视图 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-calendar</v-icon>
            </template>
            <v-list-item-title>默认日程视图</v-list-item-title>
            <v-list-item-subtitle>打开日程时的默认视图</v-list-item-subtitle>
            <template v-slot:append>
              <v-select
                v-model="localWorkflow.defaultScheduleView"
                :items="scheduleViewOptions"
                item-title="text"
                item-value="value"
                density="compact"
                style="max-width: 150px"
                hide-details
                @update:model-value="handleWorkflowChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 自动保存 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-content-save-auto</v-icon>
            </template>
            <v-list-item-title>自动保存</v-list-item-title>
            <v-list-item-subtitle>自动保存您的更改</v-list-item-subtitle>
            <template v-slot:append>
              <v-switch
                v-model="localWorkflow.autoSave"
                color="primary"
                hide-details
                @update:model-value="handleWorkflowChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 自动保存间隔 -->
          <v-list-item v-if="localWorkflow.autoSave">
            <template v-slot:prepend>
              <v-icon>mdi-timer-outline</v-icon>
            </template>
            <v-list-item-title>自动保存间隔</v-list-item-title>
            <v-list-item-subtitle>自动保存的时间间隔（秒）</v-list-item-subtitle>
            <template v-slot:append>
              <div class="d-flex align-center ga-2">
                <v-text-field
                  v-model.number="localWorkflow.autoSaveInterval"
                  type="number"
                  min="5"
                  max="300"
                  step="5"
                  density="compact"
                  style="max-width: 100px"
                  hide-details
                  @blur="handleWorkflowChange"
                  :disabled="loading"
                />
                <span class="text-body-2">秒</span>
              </div>
            </template>
          </v-list-item>

          <v-divider v-if="localWorkflow.autoSave" />

          <!-- 删除前确认 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-alert-circle-outline</v-icon>
            </template>
            <v-list-item-title>删除前确认</v-list-item-title>
            <v-list-item-subtitle>删除项目前显示确认对话框</v-list-item-subtitle>
            <template v-slot:append>
              <v-switch
                v-model="localWorkflow.confirmBeforeDelete"
                color="primary"
                hide-details
                @update:model-value="handleWorkflowChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>

    <!-- 操作按钮 -->
    <v-row>
      <v-col cols="12" class="d-flex justify-end ga-2">
        <v-btn
          color="primary"
          @click="handleSaveAll"
          :disabled="loading || !hasChanges"
          :loading="loading"
        >
          保存更改
        </v-btn>
        <v-btn
          variant="outlined"
          @click="handleReset"
          :disabled="loading"
        >
          重置
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserSetting } from '../composables/useUserSetting';
import { type SettingContracts } from '@dailyuse/contracts';

// ===== Props =====
const props = defineProps<{
  autoSave?: boolean;
}>();

// ===== Composables =====
const { userSetting, loading, updateWorkflow } = useUserSetting();

// ===== 选项配置 =====
const taskViewOptions = [
  { value: 'LIST', text: '列表视图' },
  { value: 'KANBAN', text: '看板视图' },
  { value: 'CALENDAR', text: '日历视图' },
];

const goalViewOptions = [
  { value: 'LIST', text: '列表视图' },
  { value: 'TREE', text: '树形视图' },
  { value: 'TIMELINE', text: '时间线视图' },
];

const scheduleViewOptions = [
  { value: 'DAY', text: '日视图' },
  { value: 'WEEK', text: '周视图' },
  { value: 'MONTH', text: '月视图' },
];

// ===== 本地状态 =====
const localWorkflow = ref<SettingContracts.UpdateWorkflowRequest>({
  defaultTaskView: 'LIST',
  defaultGoalView: 'LIST',
  defaultScheduleView: 'WEEK',
  autoSave: true,
  autoSaveInterval: 30,
  confirmBeforeDelete: true,
});

const originalWorkflow = ref<SettingContracts.UpdateWorkflowRequest>({});

// ===== 计算属性 =====
const hasChanges = computed(() => {
  return JSON.stringify(localWorkflow.value) !== JSON.stringify(originalWorkflow.value);
});

// ===== 监听用户设置变化 =====
watch(
  () => userSetting.value?.workflow,
  (workflow) => {
    if (workflow) {
      localWorkflow.value = {
        defaultTaskView: workflow.defaultTaskView as 'LIST' | 'KANBAN' | 'CALENDAR',
        defaultGoalView: workflow.defaultGoalView as 'LIST' | 'TREE' | 'TIMELINE',
        defaultScheduleView: workflow.defaultScheduleView as 'DAY' | 'WEEK' | 'MONTH',
        autoSave: workflow.autoSave,
        autoSaveInterval: workflow.autoSaveInterval,
        confirmBeforeDelete: workflow.confirmBeforeDelete,
      };
      originalWorkflow.value = { ...localWorkflow.value };
    }
  },
  { immediate: true, deep: true }
);

// ===== 事件处理 =====
const handleWorkflowChange = async () => {
  if (props.autoSave) {
    await updateWorkflow(localWorkflow.value);
  }
};

const handleSaveAll = async () => {
  await updateWorkflow(localWorkflow.value);
  originalWorkflow.value = { ...localWorkflow.value };
};

const handleReset = () => {
  localWorkflow.value = { ...originalWorkflow.value };
};
</script>

<style scoped>
/* Vuetify 组件自带样式，无需额外 CSS */
</style>

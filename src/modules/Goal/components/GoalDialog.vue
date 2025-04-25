<!-- filepath: /D:/myPrograms/DailyUse-front/src/components/AddGoalModal.vue -->
<template>
  <v-dialog v-model="props.visible" height="500" width="800">
    <v-card>
      <!-- 对话框头部 -->
      <v-card-title class="d-flex justify-space-between pa-4">
        <v-btn variant="text" @click="handleCancel">取消</v-btn>
        <span class="text-h5">编辑目标</span>
        <v-btn color="primary" @click="handleComplete" :disabled="!isValid">完成</v-btn>
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
          <!-- 基本信息 -->
          <v-window-item :value="0">
            <v-form @submit.prevent>
              <!-- 标题和颜色 -->
              <v-row>
                <v-col cols="11">
                  <v-text-field v-model="tempGoal.title" :rules="titleRules" :error-messages="validationErrors.title"
                    label="目标" placeholder="一段话来描述自己的目标" required />
                </v-col>
                <v-col cols="1">
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" :style="{ backgroundColor: tempGoal.color }" class="color-btn" icon>
                        <v-icon color="white">mdi-palette</v-icon>
                      </v-btn>
                    </template>
                    <v-card min-width="200">
                      <v-card-text>
                        <div class="color-grid">
                          <v-btn v-for="color in predefinedColors" :key="color" :style="{ backgroundColor: color }"
                            class="color-option" icon @click="tempGoal.color = color" />
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-menu>
                </v-col>
              </v-row>

              <!-- 目标文件夹 -->
              <v-select v-model="tempGoal.dirId" :items="goalDirs" item-title="name" item-value="id" label="目标文件夹" />

              <!-- 日期 -->
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
              <v-alert v-if="validationErrors.keyResults" type="error" variant="tonal" class="mb-4">
                {{ validationErrors.keyResults }}
              </v-alert>
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
import KeyResultDialog from './KeyResultDialog.vue';
import { useGoalDialog } from '@/modules/Goal/composables/useGoalDialog';

const {
  tempGoal,
  goalDirs,
  activeTab, tabs, predefinedColors,
  showKeyResultDialog, startCreateKeyResult, startEditKeyResult, cancelKeyResultEdit, saveKeyResult, deleteKeyResult,
  validationErrors, titleRules, minDate, startTimeRules, endTimeRules, validateDates, validateKeyResults, isValid
} = useGoalDialog();
// 传入参数
// visible: 是否显示
const props = defineProps<{
  visible: boolean;
}>();



// 发送事件
// 保存和关闭事件
const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'save'): void;
}>();

function saveGoal() {
  emit('save');
}

const handleCancel = () => {
  emit('cancel');
  activeTab.value = 0;
};
const handleComplete = () => {
  if (!validateKeyResults()) {
    activeTab.value = 1;
    return;
  }
  saveGoal();
};
</script>
<style scoped>
.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 8px;
}

.color-btn {
  width: 40px;
  height: 40px;
  border-radius: 4px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  transition: transform 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}
</style>
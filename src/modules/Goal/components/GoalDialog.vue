<!-- filepath: /D:/myPrograms/DailyUse-front/src/components/AddGoalModal.vue -->
<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-container">
      <div class="modal-header">
        <h2>编辑目标</h2>
        <div class="btn-group">
          <button class="" @click="handleCancle">取消</button>
          <button class="" @click="handleComplete">完成</button>
        </div>
      </div>

      <!-- Tabs navigation -->
      <div class="tabs">
        <button v-for="(tab, index) in tabs" :key="index" :class="['tab-btn', { active: activeTab === index }]"
          @click="activeTab = index">
          <Icon :icon="tab.icon" width="20" height="20" />
          <span>{{ tab.name }}</span>
        </button>
      </div>

      <!-- Tab content -->
      <div class="tab-content">
        <!-- Basic Info Tab -->
        <div v-show="activeTab === 0" class="tab-pane">
          <div class="form-group">
            <div class="flex">
              <label for="title">目标</label>
              <span class="error" v-if="validationErrors.title">{{ validationErrors.title }}</span>
            </div>
            <div class="goal-title-input">
              <input type="text" id="title" placeholder="一段话来描述自己的目标" v-model="tempGoal.title" required
                @blur="titleValidation">
              </input>
              <div class="goal-color-picker">
                <input type="color" id="goalColor" v-model="tempGoal.color" class="color-input">
                  <Icon icon="fluent:color-24-filled" width="40" height="40" :style="{ color: tempGoal.color || '#FF5733' }" />
                </input>
              </div>
            </div>
          </div>
          <!-- 颜色 -->


          <div class="form-group">
            <label for="folder">目标文件夹</label>
            <select id="folder" v-model="tempGoal.dirId">
              <option value="">无</option>
              <option v-for="dir in goalDirs" :key="dir.id" :value="dir.id">
                {{ dir.name }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="startTime">开始时间</label>
              <input type="date" id="startTime" v-model="tempGoal.startTime">
            </div>

            <div class="form-group">
              <label for="endTime">结束时间</label>
              <input type="date" id="endTime" v-model="tempGoal.endTime">
            </div>
          </div>

          <div class="form-group">
            <label for="note">备注</label>
            <textarea id="note" v-model="tempGoal.note" rows="3"></textarea>
          </div>
        </div>

        <!-- 关键结果 -->
        <div v-show="activeTab === 1" class="tab-pane">
          <div class="kr-list">
            <!-- Existing Key Results -->
            <div v-for="kr in tempGoal.keyResults" :key="kr.id" class="kr-list-item" @click="startEditKeyResult(kr.id)">
              <div class="kr-info">
                <Icon icon="mdi:target" width="20" height="20" />
                <span class="kr-name">{{ kr.name }}</span>
              </div>
              <button class="icon-btn" @click.stop="deleteKeyResult(kr.id)">
                <Icon icon="material-symbols:delete-outline" width="20" height="20" />
              </button>
            </div>

            <!-- Add New Key Result Button -->
            <div class="kr-list-item add-kr" @click="startCreateKeyResult">
              <div class="kr-info">
                <Icon icon="material-symbols:add" width="20" height="20" />
                <span class="kr-name placeholder">添加关键结果</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Motivation & Feasibility Tab -->
        <div v-show="activeTab === 2" class="tab-pane">
          <div class="form-group">
            <label for="motive">动机描述</label>
            <textarea id="motive" v-model="tempGoal.motive" rows="4"></textarea>
          </div>

          <div class="form-group">
            <label for="feasibility">可行性分析</label>
            <textarea id="feasibility" v-model="tempGoal.feasibility" rows="4"></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
  <KeyResultDialog v-if="showKeyResultDialog" :visible="showKeyResultDialog" :mode="editKeyResultMode" :goal-id="props.goalId"
    :key-result-id="editKeyResultId" @cancel="cancelKeyResultEdit" @save="saveKeyResult" />
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { useGoalStore } from '../stores/goalStore';
import { useGoalDirStore } from '../stores/goalDirStore';
import type { IGoal } from '../types/goal';
import KeyResultDialog from './KeyResultDialog.vue';
import { storeToRefs } from 'pinia';
import { useGoalDialog } from '@/modules/Goal/composables/useGoalDialog';

const { showKeyResultDialog, editKeyResultId, editKeyResultMode , startCreateKeyResult, startEditKeyResult, cancelKeyResultEdit ,saveKeyResult, deleteKeyResult } = useGoalDialog();
// 传入参数
// visible: 是否显示
// goal: 目标对象
// editMode: 是否为编辑模式
const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit';
  goalId: string;
}>();

// 发送事件
// 保存和关闭事件
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save'): void;
  (e: 'update', goal: IGoal): void;
}>();

const goalStore = useGoalStore();
const goalDirStore = useGoalDirStore();

const activeTab = ref(0);
const tabs = [
  { name: '基本信息', icon: 'mdi:information-outline' },
  { name: '关键结果', icon: 'mdi:target' },
  { name: '动机与可行性', icon: 'mdi:lightbulb-outline' }
];

const { tempGoal } = storeToRefs(goalStore);

// 获取可以选的目标节点（即用户自己创建的文件夹）
const goalDirs = computed(() => {
  return goalDirStore.getUserDirs;
});

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    if (props.mode === 'edit' && props.goalId) {
      // 编辑模式: 复制目标对象的属性
      tempGoal.value = goalStore.initTempGoalByGoalId(props.goalId);
    } else {
      // 创建模式: 重置表单数据
      tempGoal.value = goalStore.initTempGoal();
    }
    activeTab.value = 0;
  }
});

type ValidationState = {
  [K in keyof Partial<IGoal>]: string | undefined;
};
const validationErrors = reactive<ValidationState>({
  title: undefined,
  keyResults: undefined,
});

// 表单合法性验证
const isValid = computed(() => {
  return (
    tempGoal.value.title.trim() !== '' &&
    tempGoal.value.keyResults.length > 0 &&
    tempGoal.value.keyResults.every(kr => kr.name.trim() !== '')
  );
});

// 标题验证
const titleValidation = () => {
  if (tempGoal.value.title.trim() === '') {
    validationErrors.title = '目标不能为空';
  } else {
    validationErrors.title = undefined;
  }
};
// // 关键结果名称验证
// const krNameValidation = () => {
//   tempGoal.value.keyResults.forEach((kr, index) => {
//     if (kr.name.trim() === '') {
//       validationErrors.keyResults = `关键结果 #${index + 1} 不能为空`;
//     } else {
//       validationErrors.keyResults = undefined;
//     }
//   });
// }



//  关键结果


function saveGoal() {
  if (!isValid.value) {
    console.log('Form is invalid');
    alert('请填写所有必填项');
    return;
  }
  emit('save');
  closeModal();
}

function closeModal() {
  emit('close');
  activeTab.value = 0;
}

const handleCancle = () => {
  closeModal();
};
const handleComplete = () => {
  saveGoal();
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: rgb(41, 41, 41);
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  height: 700px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #eee;

}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 3px solid transparent;
}

.tab-btn.active {
  color: #4CAF50;
  border-bottom-color: #4CAF50;

}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.tab-pane {
  min-height: 300px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}
/* 目标标题 */
.goal-title-input {
  width: 100%;

  position: static;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

/* 颜色选择器样式 */
.goal-color-picker {
  position: relative;
  width: 40px;
  height: 40px;
  margin-left: 16px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;

}

.color-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.color-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.2s ease;
}

.color-circle:hover {
  transform: scale(1.1);
}

/* 关键结果 */
.kr-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kr-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: rgb(50, 50, 50);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.kr-list-item:hover {
  background-color: rgb(60, 60, 60);
}

.kr-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kr-name {
  font-size: 16px;
}

.kr-name.placeholder {
  color: #666;
}

.add-kr {
  border: 2px dashed #666;
  background-color: transparent;
}

.add-kr:hover {
  border-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
}

.icon-btn {
  padding: 4px;
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ff4444;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid #eee;
  background-color: #f9f9f9;
}

.navigation-buttons,
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: #2196F3;
  color: white;
}

.btn-secondary {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
}

.btn-success {
  background-color: #4CAF50;
  color: white;
}

.btn-success:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}
</style>
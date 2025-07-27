<template>
    <v-dialog
      v-model="props.visible"
      max-width="600"
      persistent
      class="record-dialog"
    >
      <v-card class="record-dialog-card">
        <!-- 对话框头部 -->
        <v-card-title class="record-dialog-header pa-6">
          <div class="d-flex align-center justify-space-between w-100">
            <v-btn
              variant="text"
              color="medium-emphasis"
              prepend-icon="mdi-close"
              @click="handleCancel"
            >
              取消
            </v-btn>
            
            <div class="d-flex align-center">
              <v-icon color="primary" size="24" class="mr-2">mdi-plus-circle</v-icon>
              <span class="text-h6 font-weight-bold">添加记录</span>
            </div>
            
            <v-btn
              color="primary"
              variant="elevated"
              prepend-icon="mdi-check"
              :disabled="!isValid"
              @click="handleSave"
              class="save-btn"
            >
              保存
            </v-btn>
          </div>
        </v-card-title>
  
        <v-divider />
  
        <!-- 表单内容 -->
        <v-card-text class="pa-6">
          <v-form class="record-form">
            <!-- 增加值输入 -->
            <div class="mb-6">
              <v-text-field
                v-model.number="record.value"
                label="增加值"
                type="number"
                variant="outlined"
                prepend-inner-icon="mdi-plus"
                :error-messages="errors.value"
                @blur="validateValue"
                @input="validateValue"
                hide-details="auto"
                class="value-input"
                density="comfortable"
                min="0.1"
                step="0.1"
              >
                <template v-slot:append>
                  <v-chip
                    color="primary"
                    variant="tonal"
                    size="small"
                    class="font-weight-medium"
                  >
                    单位
                  </v-chip>
                </template>
              </v-text-field>
            </div>
  
            <!-- 记录时间 -->
            <div class="mb-6">
              <v-card variant="outlined" class="time-card">
                <v-card-text class="pa-4">
                  <div class="d-flex align-center">
                    <v-icon color="primary" class="mr-3">mdi-clock-outline</v-icon>
                    <div>
                      <div class="text-body-1 font-weight-medium">记录时间</div>
                      <div class="text-h6 text-primary">{{ record.date }}</div>
                    </div>
                    <v-spacer />
                    <v-btn
                      color="primary"
                      variant="text"
                      size="small"
                      prepend-icon="mdi-refresh"
                      @click="updateCurrentTime"
                    >
                      更新
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </div>
  
            <!-- 备注输入 -->
            <div class="mb-4">
              <v-textarea
                v-model="record.note"
                label="备注说明"
                placeholder="添加关于此次记录的详细说明..."
                variant="outlined"
                prepend-inner-icon="mdi-note-text"
                rows="3"
                hide-details="auto"
                density="comfortable"
                class="note-input"
              />
            </div>
  
            <!-- 快速选择值 -->
            <div class="quick-values">
              <div class="text-body-2 text-medium-emphasis mb-3">
                <v-icon size="16" class="mr-1">mdi-lightning-bolt</v-icon>
                快速选择
              </div>
              <div class="d-flex gap-2 flex-wrap">
                <v-chip
                  v-for="quickValue in quickValues"
                  :key="quickValue"
                  :color="record.value === quickValue ? 'primary' : 'surface-variant'"
                  :variant="record.value === quickValue ? 'flat' : 'outlined'"
                  size="small"
                  clickable
                  @click="record.value = quickValue"
                  class="quick-value-chip"
                >
                  {{ quickValue }}
                </v-chip>
              </div>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup lang="ts">
  import { reactive, computed, watch } from 'vue';
  import type { IRecordCreate } from '../types/goal';
  import { formatDateWithTemplate } from '@/shared/utils/dateUtils';
  
  const props = defineProps<{
    visible: boolean;
  }>();
  
  const emit = defineEmits<{
    (e: 'save', record: IRecordCreate): void;
    (e: 'cancel'): void;
  }>();
  
  // 快速选择值
  const quickValues = [1, 2, 5, 10];
  
  const initializeRecord = () => {
    return {
      value: 1,
      date: formatDateWithTemplate(new Date(), 'YYYY-MM-DD HH:mm'),
      note: ''
    };
  };
  
  const initialRecord = initializeRecord();
  const record = reactive<IRecordCreate>({ ...initialRecord });
  
  const errors = reactive({
    value: ''
  });
  
  const validateValue = () => {
    if (!record.value || record.value <= 0) {
      errors.value = '增加值必须大于0';
      return false;
    }
    if (record.value > 10000) {
      errors.value = '增加值不能超过10000';
      return false;
    }
    errors.value = '';
    return true;
  };
  
  const isValid = computed(() => {
    return !errors.value && record.value > 0;
  });
  
  const updateCurrentTime = () => {
    record.date = formatDateWithTemplate(new Date(), 'YYYY-MM-DD HH:mm');
  };
  
  const handleSave = () => {
    if (validateValue()) {
      emit('save', { ...record });
    }
  };
  
  const handleCancel = () => {
    emit('cancel');
  };
  
  // 监听对话框的显示状态，重置表单
  watch(() => props.visible, (newValue) => {
    if (newValue) {
      const newRecord = initializeRecord();
      Object.assign(record, newRecord);
      errors.value = '';
    }
  });
  </script>
  
  <style scoped>
  .record-dialog-card {
    border-radius: 16px;
    overflow: hidden;
  }
  
  .record-dialog-header {
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-primary), 0.02) 100%);
  }
  
  .save-btn {
    box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
    transition: all 0.3s ease;
  }
  
  .save-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(var(--v-theme-primary), 0.4);
  }
  
  .value-input {
    border-radius: 12px;
  }
  
  .value-input :deep(.v-field) {
    border-radius: 12px;
  }
  
  .time-card {
    border-radius: 12px;
    background: rgba(var(--v-theme-primary), 0.02);
    border: 1px solid rgba(var(--v-theme-primary), 0.12);
  }
  
  .note-input {
    border-radius: 12px;
  }
  
  .note-input :deep(.v-field) {
    border-radius: 12px;
  }
  
  .quick-values {
    background: rgba(var(--v-theme-surface-variant), 0.3);
    border-radius: 12px;
    padding: 16px;
  }
  
  .quick-value-chip {
    transition: all 0.2s ease;
  }
  
  .quick-value-chip:hover {
    transform: scale(1.05);
  }
  
  /* 响应式设计 */
  @media (max-width: 600px) {
    .record-dialog-header {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }
    
    .quick-values .d-flex {
      justify-content: center;
    }
  }
  </style>
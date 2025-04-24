<template>
    <v-dialog v-model="props.visible" width="500">
      <v-card>
        <!-- Dialog Header -->
        <v-card-title class="d-flex justify-space-between pa-4">
          <v-btn variant="text" @click="handleCancel">取消</v-btn>
          <span class="text-h5">
            {{ tempKeyResult.id === 'temp' ? '添加关键结果' : '编辑关键结果' }}
          </span>
          <v-btn 
            color="primary" 
            @click="handleSave" 
            :disabled="!isValid"
          >
            保存
          </v-btn>
        </v-card-title>
  
        <v-card-text>
          <!-- Key Result Name -->
          <v-row class="mb-4">
            <v-col cols="2" class="d-flex align-center justify-center">
              <v-icon icon="mdi-flag" size="48" />
            </v-col>
            <v-col cols="10">
              <v-text-field
                v-model="tempKeyResult.name"
                placeholder="例如：完成leetcode题目数量"
                :error-messages="errors.name"
                @blur="validateName"
                hide-details="auto"
              />
            </v-col>
          </v-row>
  
          <!-- Progress Quantification -->
          <v-row class="mb-4">
            <v-col cols="12">
              <div class="text-h6 mb-4">进度量化</div>
              <v-row>
                <v-col cols="6">
                  <v-text-field
                    v-model.number="tempKeyResult.startValue"
                    label="起始值"
                    type="number"
                    :error-messages="errors.startValue"
                    @blur="validateStartValue"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model.number="tempKeyResult.targetValue"
                    label="目标值"
                    type="number"
                    :error-messages="errors.targetValue"
                    @blur="validateTargetValue"
                    hide-details="auto"
                  />
                </v-col>
              </v-row>
            </v-col>
          </v-row>
  
          <!-- Calculation Method -->
          <v-row class="mb-4">
            <v-col cols="12">
              <v-select
                v-model="tempKeyResult.calculationMethod"
                label="计算方式"
                :items="[
                  { title: '求和', value: 'sum' },
                  { title: '平均值', value: 'average' },
                  { title: '最大值', value: 'max' },
                  { title: '最小值', value: 'min' },
                  // { title: '自定义', value: 'custom' }
                ]"
                item-title="title"
                item-value="value"
                hide-details="auto"
              />
            </v-col>
          </v-row>
  
          <!-- Weight -->
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model.number="tempKeyResult.weight"
                label="权重 (0-10)"
                type="number"
                min="0"
                max="10"
                :error-messages="errors.weight"
                @blur="validateWeight"
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup lang="ts">
  import { reactive, computed } from 'vue';
  import { useGoalStore } from '../stores/goalStore';
  import { storeToRefs } from 'pinia';
  
  const { tempKeyResult } = storeToRefs(useGoalStore());
  
  const props = defineProps<{
    visible: boolean;
    goalId: string;
  }>();
  
  const emit = defineEmits<{
    (e: 'save'): void;
    (e: 'cancel'): void;
  }>();
  
  // Form validation
  const errors = reactive({
    name: '',
    startValue: '',
    targetValue: '',
    weight: ''
  });
  
  const validateName = () => {
    if (!tempKeyResult.value.name.trim()) {
      errors.name = '不能为空';
    } else {
      errors.name = '';
    }
  };
  
  const validateStartValue = () => {
    if (tempKeyResult.value.startValue === undefined) {
      errors.startValue = '请输入起始值';
    } else if (tempKeyResult.value.startValue < 0) {
      errors.startValue = '起始值不能小于0';
    } else {
      errors.startValue = '';
    }
  };
  
  const validateTargetValue = () => {
    if (tempKeyResult.value.targetValue === undefined) {
      errors.targetValue = '请输入目标值';
    } else if (tempKeyResult.value.targetValue <= tempKeyResult.value.startValue) {
      errors.targetValue = '目标值必须大于起始值';
    } else {
      errors.targetValue = '';
    }
  };
  
  const validateWeight = () => {
    if (tempKeyResult.value.weight === undefined) {
      errors.weight = '请输入权重';
    } else if (tempKeyResult.value.weight < 0 || tempKeyResult.value.weight > 10) {
      errors.weight = '权重必须在0-10之间';
    } else {
      errors.weight = '';
    }
  };
  
  const validateAll = () => {
    validateName();
    validateStartValue();
    validateTargetValue();
    validateWeight();
  };
  
  const isValid = computed(() => {
    return !Object.values(errors).some(error => error) &&
      tempKeyResult.value.name.trim() !== '' &&
      tempKeyResult.value.startValue !== undefined &&
      tempKeyResult.value.targetValue !== undefined &&
      tempKeyResult.value.weight !== undefined;
  });
  
  const handleSave = () => {
    validateAll();
    if (isValid.value) {
      emit('save');
    }
  };
  
  const handleCancel = () => {
    emit('cancel');
  };
  </script>
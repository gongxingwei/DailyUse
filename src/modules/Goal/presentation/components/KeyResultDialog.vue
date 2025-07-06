<template>
    <v-dialog v-model="props.visible" width="500">
      <v-card>
        <!-- Dialog Header -->
        <v-card-title class="d-flex justify-space-between pa-4">
          <v-btn variant="text" @click="handleCancel">取消</v-btn>
          <span class="text-h5">
            {{ props.keyResult ? '编辑关键结果' : '添加关键结果' }}
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
                v-model="formData.name"
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
                    v-model.number="formData.startValue"
                    label="起始值"
                    type="number"
                    :error-messages="errors.startValue"
                    @blur="validateStartValue"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model.number="formData.targetValue"
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
                v-model="formData.calculationMethod"
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
                v-model.number="formData.weight"
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
  import { reactive, computed, watch } from 'vue';
  import { useGoalStore } from '../stores/goalStore.new';
  import type { IKeyResultCreateDTO } from '../types/goal';
  
  const goalStore = useGoalStore();
  
  const props = defineProps<{
    visible: boolean;
    goalId: string;
    keyResult?: {
      id: string;
      name: string;
      startValue: number;
      targetValue: number;
      currentValue: number;
      calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
      weight: number;
    };
  }>();
  
  const emit = defineEmits<{
    (e: 'save'): void;
    (e: 'cancel'): void;
  }>();

  // Form state
  const formData = reactive<IKeyResultCreateDTO>({
    name: '',
    startValue: 0,
    targetValue: 1,
    currentValue: 0,
    calculationMethod: 'sum',
    weight: 1
  });

  // Initialize form when dialog opens or keyResult prop changes
  watch([() => props.visible, () => props.keyResult], () => {
    if (props.visible) {
      if (props.keyResult) {
        // Editing existing key result
        formData.name = props.keyResult.name;
        formData.startValue = props.keyResult.startValue;
        formData.targetValue = props.keyResult.targetValue;
        formData.currentValue = props.keyResult.currentValue;
        formData.calculationMethod = props.keyResult.calculationMethod;
        formData.weight = props.keyResult.weight;
      } else {
        // Creating new key result
        formData.name = '';
        formData.startValue = 0;
        formData.targetValue = 1;
        formData.currentValue = 0;
        formData.calculationMethod = 'sum';
        formData.weight = 1;
      }
      // Clear errors
      Object.keys(errors).forEach(key => {
        errors[key as keyof typeof errors] = '';
      });
    }
  }, { immediate: true });
  
  // Form validation
  const errors = reactive({
    name: '',
    startValue: '',
    targetValue: '',
    weight: ''
  });
  
  const validateName = () => {
    if (!formData.name.trim()) {
      errors.name = '不能为空';
    } else {
      errors.name = '';
    }
  };
  
  const validateStartValue = () => {
    if (formData.startValue === undefined || formData.startValue === null) {
      errors.startValue = '请输入起始值';
    } else if (formData.startValue < 0) {
      errors.startValue = '起始值不能小于0';
    } else {
      errors.startValue = '';
    }
  };
  
  const validateTargetValue = () => {
    if (formData.targetValue === undefined || formData.targetValue === null) {
      errors.targetValue = '请输入目标值';
    } else if (formData.targetValue <= formData.startValue) {
      errors.targetValue = '目标值必须大于起始值';
    } else {
      errors.targetValue = '';
    }
  };
  
  const validateWeight = () => {
    if (formData.weight === undefined || formData.weight === null) {
      errors.weight = '请输入权重';
    } else if (formData.weight < 0 || formData.weight > 10) {
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
      formData.name.trim() !== '' &&
      formData.startValue !== undefined &&
      formData.targetValue !== undefined &&
      formData.weight !== undefined;
  });
  
  const handleSave = async () => {
    validateAll();
    if (isValid.value) {
      try {
        if (props.keyResult) {
          // TODO: Implement update key result functionality when needed
          console.log('Update key result not implemented yet');
        } else {
          // Add new key result
          await goalStore.addKeyResult(props.goalId, formData);
        }
        emit('save');
      } catch (error) {
        console.error('Failed to save key result:', error);
      }
    }
  };
  
  const handleCancel = () => {
    emit('cancel');
  };
  </script>
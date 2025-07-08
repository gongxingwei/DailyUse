<template>
  <v-dialog v-model="showDialog" max-width="700px" persistent>
    <v-card>
      <!-- 对话框头部 -->
      <v-card-title class="d-flex align-center pa-4">
        <v-icon color="primary" class="mr-3">mdi-target</v-icon>
        <span class="text-h5">{{ dialogTitle }}</span>
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-6">
        <v-form @submit.prevent>
          <!-- 基本信息 -->
          <div class="mb-6">
            <h3 class="text-h6 mb-4">基本信息</h3>
            <v-row>
              <!-- 关键结果名称 -->
              <v-col cols="12">
                <v-text-field
                  v-model="name"
                  label="关键结果名称*"
                  placeholder="例如：新增活跃用户数量"
                  :error-messages="errors.name"
                  variant="outlined"
                  required
                  @input="clearFieldError('name')"
                  @blur="validateField('name')"
                />
              </v-col>
              
              <!-- 描述 -->
              <v-col cols="12">
                <v-textarea
                  v-model="description"
                  label="详细描述"
                  placeholder="描述这个关键结果的具体含义和衡量标准"
                  variant="outlined"
                  rows="2"
                />
              </v-col>
            </v-row>
          </div>
          
          <!-- 数值配置 -->
          <div class="mb-6">
            <h3 class="text-h6 mb-4">数值配置</h3>
            <v-row>
              <!-- 起始值 -->
              <v-col cols="4">
                <v-text-field
                  v-model.number="startValue"
                  label="起始值*"
                  type="number"
                  variant="outlined"
                  :error-messages="errors.startValue"
                  hint="关键结果的初始数值"
                  persistent-hint
                  required
                  @input="clearFieldError('startValue')"
                  @blur="validateField('startValue')"
                />
              </v-col>
              
              <!-- 目标值 -->
              <v-col cols="4">
                <v-text-field
                  v-model.number="targetValue"
                  label="目标值*"
                  type="number"
                  variant="outlined"
                  :error-messages="errors.targetValue"
                  hint="期望达到的目标数值"
                  persistent-hint
                  required
                  @input="clearFieldError('targetValue')"
                  @blur="validateField('targetValue')"
                />
              </v-col>
              
              <!-- 当前值 -->
              <v-col cols="4">
                <v-text-field
                  v-model.number="currentValue"
                  label="当前值"
                  type="number"
                  variant="outlined"
                  hint="目前的实际数值"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </div>
          
          <!-- 高级配置 -->
          <div class="mb-6">
            <h3 class="text-h6 mb-4">高级配置</h3>
            <v-row>
              <!-- 计算方法 -->
              <v-col cols="6">
                <v-select
                  v-model="calculationMethod"
                  :items="calculationMethods"
                  label="进度计算方法*"
                  variant="outlined"
                  hint="选择如何计算进度百分比"
                  persistent-hint
                  required
                />
              </v-col>
              
              <!-- 权重 -->
              <v-col cols="6">
                <v-text-field
                  v-model.number="weight"
                  label="权重*"
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  variant="outlined"
                  :error-messages="errors.weight"
                  hint="该关键结果在目标中的重要程度 (1-10)"
                  persistent-hint
                  required
                  @input="clearFieldError('weight')"
                  @blur="validateField('weight')"
                />
              </v-col>
              
              <!-- 单位 -->
              <v-col cols="6">
                <v-text-field
                  v-model="unit"
                  label="数值单位"
                  placeholder="例如：人、次、元、%"
                  variant="outlined"
                  hint="可选，用于显示数值的单位"
                  persistent-hint
                />
              </v-col>
              
              <!-- 更新频率 -->
              <v-col cols="6">
                <v-select
                  v-model="updateFrequency"
                  :items="updateFrequencies"
                  label="更新频率"
                  variant="outlined"
                  hint="建议的数据更新频率"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </div>
          
          <!-- 进度预览 -->
          <div v-if="progressPercentage >= 0" class="mb-4">
            <h3 class="text-h6 mb-3">进度预览</h3>
            <v-card variant="outlined" class="pa-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-subtitle-1 font-weight-medium">{{ name || '关键结果名称' }}</span>
                <span class="text-h6 font-weight-bold" :class="progressColor">
                  {{ progressPercentage.toFixed(1) }}%
                </span>
              </div>
              
              <v-progress-linear
                :model-value="progressPercentage"
                :color="progressBarColor"
                height="12"
                rounded
                class="mb-2"
              />
              
              <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                <span>{{ startValue }}{{ unit ? ' ' + unit : '' }}</span>
                <span>{{ currentValue }}{{ unit ? ' ' + unit : '' }} / {{ targetValue }}{{ unit ? ' ' + unit : '' }}</span>
              </div>
            </v-card>
          </div>
        </v-form>
      </v-card-text>
      
      <v-divider />
      
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="text"
          @click="showDialog = false"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :disabled="!isFormValid || loading"
          :loading="loading"
          @click="handleSave"
        >
          {{ isEditing ? '更新' : '创建' }}
        </v-btn>
      </v-card-actions>
      
      <!-- 错误提示 -->
      <v-alert
        v-if="errors.submit"
        type="error"
        variant="tonal"
        class="ma-4"
      >
        {{ errors.submit }}
      </v-alert>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { IKeyResult } from '@/modules/Goal/domain/types/goal';

// 定义 props
const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  goalId: string
  keyResultData?: IKeyResult | null
}>();

// 定义 emits
const emit = defineEmits<{
  save: [keyResultData: any]
  cancel: []
}>();

// 内部对话框显示状态
const showDialog = computed({
  get: () => props.visible,
  set: (value: boolean) => {
    if (!value) {
      emit('cancel');
    }
  }
});

// 表单数据
const name = ref('');
const description = ref('');
const startValue = ref(0);
const targetValue = ref(0);
const currentValue = ref(0);
const calculationMethod = ref<'sum' | 'average' | 'max' | 'min' | 'custom'>('sum');
const weight = ref(1);
const unit = ref('');
const updateFrequency = ref('weekly');

// 表单状态
const errors = ref<Record<string, string>>({});
const loading = ref(false);

// 计算属性
const dialogTitle = computed(() => {
  return props.mode === 'edit' ? '编辑关键结果' : '添加关键结果';
});

const isEditing = computed(() => {
  return props.mode === 'edit';
});

const isFormValid = computed(() => {
  return name.value.trim() !== '' && 
         startValue.value !== null && 
         targetValue.value !== null &&
         targetValue.value !== startValue.value;
});

const progressPercentage = computed(() => {
  if (targetValue.value === startValue.value) return 0;
  
  const progress = ((currentValue.value - startValue.value) / (targetValue.value - startValue.value)) * 100;
  return Math.max(0, Math.min(100, progress));
});

// 监听props变化，更新表单数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetForm();
    if (props.mode === 'edit' && props.keyResultData) {
      loadKeyResultData(props.keyResultData);
    }
  }
}, { immediate: true });

watch(() => props.keyResultData, (newKeyResultData) => {
  if (props.visible && props.mode === 'edit' && newKeyResultData) {
    loadKeyResultData(newKeyResultData);
  }
});

// 重置表单
const resetForm = () => {
  name.value = '';
  description.value = '';
  startValue.value = 0;
  targetValue.value = 0;
  currentValue.value = 0;
  calculationMethod.value = 'sum';
  weight.value = 1;
  unit.value = '';
  updateFrequency.value = 'weekly';
  errors.value = {};
};

// 加载关键结果数据到表单
const loadKeyResultData = (keyResult: IKeyResult) => {
  name.value = keyResult.name;
  // 注意：IKeyResult 可能没有 description 字段，这里使用可选处理
  description.value = '';
  startValue.value = keyResult.startValue;
  targetValue.value = keyResult.targetValue;
  currentValue.value = keyResult.currentValue;
  calculationMethod.value = keyResult.calculationMethod;
  weight.value = keyResult.weight;
};

// 表单验证
const validateForm = () => {
  const newErrors: Record<string, string> = {};
  
  if (!name.value.trim()) {
    newErrors.name = '关键结果名称不能为空';
  }
  
  if (startValue.value === null || startValue.value === undefined) {
    newErrors.startValue = '起始值不能为空';
  }
  
  if (targetValue.value === null || targetValue.value === undefined) {
    newErrors.targetValue = '目标值不能为空';
  }
  
  if (targetValue.value === startValue.value) {
    newErrors.targetValue = '目标值不能等于起始值';
  }
  
  if (weight.value < 1 || weight.value > 10) {
    newErrors.weight = '权重必须在 1-10 之间';
  }
  
  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

// 清除单个字段的错误
const clearFieldError = (fieldName: string) => {
  const newErrors = { ...errors.value };
  delete newErrors[fieldName];
  errors.value = newErrors;
};

// 验证单个字段
const validateField = (fieldName: string) => {
  const newErrors = { ...errors.value };
  
  switch (fieldName) {
    case 'name':
      if (!name.value.trim()) {
        newErrors.name = '关键结果名称不能为空';
      } else {
        delete newErrors.name;
      }
      break;
      
    case 'startValue':
      if (startValue.value === null || startValue.value === undefined) {
        newErrors.startValue = '起始值不能为空';
      } else {
        delete newErrors.startValue;
        // 当起始值变化时，也要重新验证目标值
        if (targetValue.value === startValue.value) {
          newErrors.targetValue = '目标值不能等于起始值';
        } else {
          delete newErrors.targetValue;
        }
      }
      break;
      
    case 'targetValue':
      if (targetValue.value === null || targetValue.value === undefined) {
        newErrors.targetValue = '目标值不能为空';
      } else if (targetValue.value === startValue.value) {
        newErrors.targetValue = '目标值不能等于起始值';
      } else {
        delete newErrors.targetValue;
      }
      break;
      
    case 'weight':
      if (weight.value < 1 || weight.value > 10) {
        newErrors.weight = '权重必须在 1-10 之间';
      } else {
        delete newErrors.weight;
      }
      break;
  }
  
  errors.value = newErrors;
};

// 计算方法选项
const calculationMethods = [
  { title: '累加 - 适用于递增指标', value: 'sum' },
  { title: '平均值 - 适用于波动指标', value: 'average' },
  { title: '最大值 - 取最高值', value: 'max' },
  { title: '最小值 - 取最低值', value: 'min' },
  { title: '自定义计算', value: 'custom' }
];

// 更新频率选项
const updateFrequencies = [
  { title: '每日更新', value: 'daily' },
  { title: '每周更新', value: 'weekly' },
  { title: '每月更新', value: 'monthly' },
  { title: '手动更新', value: 'manual' }
];

// 进度颜色计算
const progressColor = computed(() => {
  const progress = progressPercentage.value;
  if (progress >= 80) return 'text-success';
  if (progress >= 60) return 'text-warning';
  if (progress >= 40) return 'text-orange';
  return 'text-error';
});

const progressBarColor = computed(() => {
  const progress = progressPercentage.value;
  if (progress >= 80) return 'success';
  if (progress >= 60) return 'warning';
  if (progress >= 40) return 'orange';
  return 'error';
});

// 处理保存
const handleSave = async () => {
  if (!validateForm()) return;
  
  const keyResultData = {
    goalId: props.goalId,
    name: name.value,
    description: description.value,
    startValue: startValue.value,
    targetValue: targetValue.value,
    currentValue: currentValue.value,
    calculationMethod: calculationMethod.value,
    weight: weight.value,
    unit: unit.value,
    updateFrequency: updateFrequency.value
  };
  
  emit('save', keyResultData);
};
</script>

<style scoped>
/* 对话框样式 */
.v-dialog {
  overflow-y: auto;
}

.v-card {
  overflow-y: auto;
  max-height: 90vh;
}

/* 表单分组样式 */
.v-card-text h3 {
  color: rgb(var(--v-theme-primary));
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.1);
  padding-bottom: 8px;
}

/* 进度预览卡片样式 */
.v-card[variant="outlined"] {
  border: 2px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
}

.v-card[variant="outlined"]:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
}

/* 表单字段样式 */
.v-text-field, .v-textarea, .v-select {
  margin-bottom: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .v-dialog {
    width: 95vw !important;
    max-width: none !important;
  }
  
  .v-card-text {
    padding: 1rem !important;
  }
}
</style>

<style scoped>
.v-progress-linear {
  border-radius: 4px;
}
</style>

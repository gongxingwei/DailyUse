<template>
  <v-dialog :model-value="modelValue" max-width="700px" persistent>
    <v-card>
      <!-- 对话框头部 -->
      <v-card-title class="d-flex align-center pa-4">
        <v-icon color="primary" class="mr-3">mdi-target</v-icon>
        <span class="text-h5">{{ isEditing ? '更新关键结果' : '创建关键结果'}}</span>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent>
          <!-- 基本信息 -->
          <div class="mb-6">
            <h3 class="text-h6 mb-4">基本信息</h3>
            <v-row>
              <!-- 关键结果名称 -->
              <v-col cols="12">
                <v-text-field v-model="localKeyResult.name" label="关键结果名称*" placeholder="例如：新增活跃用户数量"
                  variant="outlined" required />
              </v-col>

              
            </v-row>
          </div>

          <!-- 数值配置 -->
          <div class="mb-6">
            <h3 class="text-h6 mb-4">数值配置</h3>
            <v-row>
              <!-- 起始值 -->
              <v-col cols="4">
                <v-text-field v-model.number="localKeyResult.startValue" label="起始值*" type="number" variant="outlined"
                  hint="关键结果的初始数值" persistent-hint required
                  />
              </v-col>

              <!-- 目标值 -->
              <v-col cols="4">
                <v-text-field v-model.number="localKeyResult.targetValue" label="目标值*" type="number" variant="outlined"
                  hint="期望达到的目标数值" persistent-hint required
                  />
              </v-col>

              <!-- 当前值 -->
              <v-col cols="4">
                <v-text-field v-model.number="localKeyResult.currentValue" label="当前值" type="number" variant="outlined" hint="目前的实际数值"
                  persistent-hint />
              </v-col>
            </v-row>
          </div>

          <!-- 高级配置 -->
          <div class="mb-6">
            <h3 class="text-h6 mb-4">高级配置</h3>
            <v-row>
              <!-- 计算方法 -->
              <v-col cols="6">
                <v-select v-model="localKeyResult.calculationMethod" :items="calculationMethods" label="进度计算方法*" variant="outlined"
                  hint="选择如何计算进度百分比" persistent-hint required />
              </v-col>

              <!-- 权重 -->
              <v-col cols="6">
                <v-text-field v-model.number="localKeyResult.weight" label="权重*" type="number" min="1" max="10" step="1"
                  variant="outlined" hint="该关键结果在目标中的重要程度 (1-10)" persistent-hint
                  required />
              </v-col>
            </v-row>
          </div>

          <!-- 进度预览 -->
          <div v-if="progressPercentage >= 0" class="mb-4">
            <h3 class="text-h6 mb-3">进度预览</h3>
            <v-card variant="outlined" class="pa-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-subtitle-1 font-weight-medium">{{ localKeyResult.name || '关键结果名称' }}</span>
                <span class="text-h6 font-weight-bold" :class="progressColor">
                  {{ progressPercentage.toFixed(1) }}%
                </span>
              </div>

              <v-progress-linear :model-value="progressPercentage" :color="progressBarColor" height="12" rounded
                class="mb-2" />

              <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                <span>{{ localKeyResult.startValue }}</span>
                <span>{{ localKeyResult.currentValue }} / {{ localKeyResult.targetValue }}</span>
              </div>
            </v-card>
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          取消
        </v-btn>
        <v-btn color="primary" variant="elevated" :disabled="!isFormValid || loading" :loading="loading"
          @click="handleSave">
          {{ isEditing ? '更新' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { KeyResult } from '../../domain/entities/keyResult';

// 定义 props
const props = defineProps<{
  modelValue: boolean
  keyResult: KeyResult | null
}>();

// 定义 emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'create-key-result', keyResult: KeyResult): void;
  (e: 'update-key-result', keyResult: KeyResult): void;
}>();


// 表单状态
const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);
const localKeyResult = ref<KeyResult>(KeyResult.forCreate());
const loading = ref(false);
const isEditing = computed(() => !!props.keyResult);
const isFormValid = computed(
  () => formRef.value?.isValid ?? false
)
const progressPercentage = computed(() => {
  if (localKeyResult.value.targetValue === localKeyResult.value.startValue) return 0;

  const progress = ((localKeyResult.value.currentValue - localKeyResult.value.startValue) / (localKeyResult.value.targetValue - localKeyResult.value.startValue)) * 100;
  return Math.max(0, Math.min(100, progress));
});


// 计算方法选项
const calculationMethods = [
  { title: '累加 - 适用于递增指标', value: 'sum' },
  { title: '平均值 - 适用于波动指标', value: 'average' },
  { title: '最大值 - 取最高值', value: 'max' },
  { title: '最小值 - 取最低值', value: 'min' },
  { title: '自定义计算', value: 'custom' }
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
  if (!isFormValid.value) return;
  if (isEditing.value) {
    emit('update-key-result', KeyResult.ensureKeyResultNeverNull(localKeyResult.value));
  } else {
    emit('create-key-result', KeyResult.ensureKeyResultNeverNull(localKeyResult.value));
  }
  closeDialog();
};

const handleCancel = () => {
  closeDialog();
};
const closeDialog = () => {
  emit('update:modelValue', false);
};

watch(
  [() => props.modelValue, () => props.keyResult],
  ([newValue]) => {
    if (newValue) {
      localKeyResult.value = props.keyResult ?
        props.keyResult.clone() :
        KeyResult.forCreate();
    } else {
      localKeyResult.value = KeyResult.forCreate();
    }
  }
)
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
.v-text-field,
.v-textarea,
.v-select {
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

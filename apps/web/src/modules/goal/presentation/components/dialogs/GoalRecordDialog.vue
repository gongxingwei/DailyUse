<template>
  <v-dialog :model-value="modelValue" max-width="600" persistent class="record-dialog">
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
            <span class="text-h6 font-weight-bold">{{ isEditing ? '编辑记录' : '添加记录' }}</span>
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
        <v-form ref="formRef" class="record-form" v-model="formValid">
          <!-- 增加值输入 -->
          <div class="mb-6">
            <v-text-field
              v-model.number="localGoalRecord.value"
              label="增加值"
              type="number"
              variant="outlined"
              prepend-inner-icon="mdi-plus"
              :rules="valueRules"
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
                    <div class="text-h6 text-primary">{{ format(localGoalRecord.lifecycle.createdAt, 'yyyy-MM-dd HH:mm:ss') }}</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>
          <!-- 备注输入 -->
          <div class="mb-4">
            <v-textarea
              v-model="localGoalRecord.note"
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
                :color="localGoalRecord.value === quickValue ? 'primary' : 'surface-variant'"
                :variant="localGoalRecord.value === quickValue ? 'flat' : 'outlined'"
                size="small"
                clickable
                @click="localGoalRecord.value = quickValue"
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
import { computed, watch, ref } from 'vue';
// utils
import { format } from 'date-fns';
// domains
import { GoalRecord } from '@dailyuse/domain-client';
const props = defineProps<{
  modelValue: boolean;
  record: GoalRecord | null;
  goalUuid: string;
  keyResultUuid: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'create-record', record: GoalRecord): void;
  (e: 'update-record', record: GoalRecord): void;
}>();

const quickValues = [1, 2, 5, 10];

const formRef = ref();
const formValid = ref(false);

const localGoalRecord = ref<GoalRecord>(GoalRecord.forCreate(props.goalUuid, props.keyResultUuid));

const isEditing = computed(() => !!props.record);

const valueRules = [
  (v: number) => !!v || '增加值不能为空',
  (v: number) => v > 0 || '增加值必须大于0',
  (v: number) => v <= 10000 || '增加值不能超过10000'
];

const isValid = computed(() => formValid.value && localGoalRecord.value.value > 0);

const handleSave = () => {
  if (formRef.value?.validate()) {
    if (isEditing.value) {
      emit('update-record', localGoalRecord.value as GoalRecord);
    } else {
      emit('create-record', localGoalRecord.value as GoalRecord);
    }
    closeDialog();
  }
};

const handleCancel = () => {
  closeDialog();
};

const closeDialog = () => {
  emit('update:modelValue', false);
};
// 监听弹窗显示，重置表单
watch(
  () => props.modelValue,
  (show) => {
    if (show) {
      localGoalRecord.value = props.record ? props.record.clone() : GoalRecord.forCreate(props.goalUuid, props.keyResultUuid);
    }
  }
);
</script>

<style scoped>
.record-dialog-card {
  border-radius: 16px;
  overflow: hidden;
}

.record-dialog-header {
  border-radius: 16px 16px 0 0;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.record-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.value-input {
  font-size: 1.1rem;
}

.time-card {
  border-radius: 8px;
}

.note-input {
  font-size: 1rem;
}

.quick-values {
  margin-top: 1rem;
}

.quick-value-chip {
  font-size: 1rem;
  min-width: 48px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.quick-value-chip:hover {
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.12);
}

.save-btn {
  font-weight: bold;
  letter-spacing: 0.05em;
}

@media (max-width: 600px) {
  .record-dialog-card {
    border-radius: 8px;
    padding: 0.5rem;
  }
  .record-dialog-header {
    font-size: 1rem;
    padding: 1rem;
  }
  .record-form {
    gap: 1rem;
  }
}
</style>

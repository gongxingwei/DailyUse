<template>
  <div v-if="modelValue" class="dialog-mask" @click.self="handleClose">
    <div class="dialog-container">
      <!-- 标题栏 -->
      <div class="dialog-header">
        <span class="dialog-title">{{ title }}</span>
        <button class="close-btn" @click="handleClose">&times;</button>
      </div>

      <!-- 编辑表单 -->
      <div class="dialog-body">
        <form ref="form" @submit.prevent="handleConfirm">
          <template v-for="(value, key) in formData" :key="key">
            <div class="form-item">
              <label :for="key">{{ formatLabel(key) }}</label>

              <!-- 根据值类型渲染不同的输入控件 -->
              <template v-if="getInputType(value) === 'boolean'">
                <input :id="key" type="checkbox" v-model="formData[key]" class="checkbox-input" />
              </template>

              <template v-else-if="getInputType(value) === 'number'">
                <input :id="key" type="number" v-model.number="formData[key]" class="form-input" />
              </template>

              <template v-else-if="getInputType(value) === 'textarea'">
                <textarea
                  :id="key"
                  v-model="formData[key]"
                  class="form-textarea"
                  :rows="3"
                ></textarea>
              </template>

              <template v-else-if="getInputType(value) === 'select'">
                <select :id="key" v-model="formData[key]" class="form-select">
                  <option v-for="opt in getOptions(key)" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </template>

              <template v-else>
                <input :id="key" type="text" v-model="formData[key]" class="form-input" />
              </template>
            </div>
          </template>
        </form>
      </div>

      <!-- 操作按钮 -->
      <div class="dialog-footer">
        <button class="btn btn-cancel" @click="handleClose">{{ cancelText }}</button>
        <button class="btn btn-confirm" @click="handleConfirm">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  data: Record<string, any> | null;
  options?: Record<string, Array<{ label: string; value: any }>>;
  fieldTypes?: Record<string, string>;
  confirmText?: string;
  cancelText?: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', value: Record<string, any>): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: '编辑',
  confirmText: '确定',
  cancelText: '取消',
  options: () => ({}),
  fieldTypes: () => ({}),
});

const emit = defineEmits<Emits>();
const formData = ref<Record<string, any>>({});

// 监听输入数据变化
watch(
  () => props.data,
  (newData) => {
    formData.value = newData ? { ...newData } : {};
  },
  { immediate: true, deep: true },
);

// 格式化标签文本
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// 获取输入类型
function getInputType(value: any): string {
  const key = Object.keys(formData.value).find((k) => formData.value[k] === value);
  if (key && props.fieldTypes[key]) {
    return props.fieldTypes[key];
  }

  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string' && value.length > 50) return 'textarea';
  if (key && props.options[key]) return 'select';
  return 'text';
}

// 获取选项
function getOptions(key: string) {
  return props.options[key] || [];
}

// 处理关闭
function handleClose() {
  emit('update:modelValue', false);
  emit('cancel');
}

// 处理确认
function handleConfirm() {
  emit('confirm', { ...formData.value });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-container {
  background: #fff;
  border-radius: 8px;
  min-width: 400px;
  max-width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.close-btn {
  border: none;
  background: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0 4px;
}

.close-btn:hover {
  color: #666;
}

.dialog-body {
  padding: 20px;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  background: #fff;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #409eff;
  outline: none;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e8e8e8;
}

.btn-confirm {
  background: #409eff;
  color: #fff;
}

.btn-confirm:hover {
  background: #66b1ff;
}
</style>

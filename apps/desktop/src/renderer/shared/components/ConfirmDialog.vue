<template>
  <Teleport to="body">
    <div class="confirm-overlay" v-if="modelValue" @click="cancel">
      <div class="confirm-dialog" @click.stop>
        <div class="confirm-dialog__title">{{ title }}</div>
        <div class="confirm-dialog__message">{{ message }}</div>
        <div class="confirm-dialog__actions">
          <button class="cancel-button" @click="cancel">{{ cancelText }}</button>
          <button class="confirm-button" @click="confirm">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title: string;
  message: string;
  cancelText: string;
  confirmText: string;
}

const { modelValue, title, message, cancelText, confirmText } = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const cancel = () => {
  emit('update:modelValue', false);
  emit('cancel');
};

const confirm = () => {
  emit('update:modelValue', false);
  emit('confirm');
};
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.confirm-dialog {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  padding: 24px;
  min-width: 300px;
  max-width: 90%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.confirm-dialog__title {
  color: rgb(var(--v-theme-info));
  font-size: 20px;
  font-weight: bold;
}

.confirm-dialog__message {
  font-size: 16px;
  color: rgb(var(--v-theme-on-info));
  margin-top: 12px;
  line-height: 1.5;
}

.confirm-dialog__actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button,
.confirm-button {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}

.cancel-button:hover,
.confirm-button:hover {
  opacity: 0.8;
}

.cancel-button {
  color: rgb(var(--v-theme-error));
}

.confirm-button {
  color: rgb(var(--v-theme-success));
}
</style>

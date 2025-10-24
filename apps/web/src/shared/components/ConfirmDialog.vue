<template>
  <Teleport to="body">
    <div class="confirm-overlay" v-if="modelValue" @click="cancel">
      <div class="confirm-dialog" @click.stop>
        <div class="confirm-dialog__title">{{ title }}</div>
        <div class="confirm-dialog__message">{{ message }}</div>
        <div class="confirm-dialog__actions">
          <v-btn variant="text" color="error" @click="cancel">
            {{ cancelText }}
          </v-btn>
          <v-btn variant="elevated" color="primary" @click="confirm">
            {{ confirmText }}
          </v-btn>
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
  cancelText?: string;
  confirmText?: string;
}

const {
  modelValue,
  title,
  message,
  cancelText = '取消',
  confirmText = '确认',
} = defineProps<Props>();

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
  color: rgb(var(--v-theme-primary));
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
}

.confirm-dialog__message {
  font-size: 16px;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.5;
  margin-bottom: 24px;
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

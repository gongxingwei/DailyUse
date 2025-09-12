<!-- 自定义弹窗组件 - Web适配版 -->
<template>
  <v-dialog v-model="dialogVisible" :width="width" :persistent="!closeOnClickMask" transition="dialog-transition">
    <v-card>
      <!-- 标题区域 -->
      <v-card-title v-if="title || showClose" class="d-flex justify-space-between align-center">
        <span>{{ title }}</span>
        <v-btn v-if="showClose" icon="mdi-close" variant="text" size="small" @click="handleClose"></v-btn>
      </v-card-title>

      <!-- 内容区域 -->
      <v-card-text>
        <slot></slot>
      </v-card-text>

      <!-- 底部按钮区域 -->
      <v-card-actions v-if="$slots.footer">
        <slot name="footer"></slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  title?: string
  width?: string | number
  showClose?: boolean
  closeOnClickMask?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  width: '50%',
  showClose: true,
  closeOnClickMask: true
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

// 双向绑定对话框显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => {
    emit('update:visible', value)
    if (!value) {
      emit('close')
    }
  }
})

// 处理关闭
const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>

<style scoped>
/* Vuetify已经提供了很好的对话框样式，这里只需要少量自定义 */
.v-card-title {
  padding: 16px 24px 8px;
}

.v-card-text {
  padding: 16px 24px;
}

.v-card-actions {
  padding: 8px 24px 16px;
  justify-content: flex-end;
}
</style>

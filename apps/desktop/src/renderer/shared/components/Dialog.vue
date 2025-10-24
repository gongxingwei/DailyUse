<!-- 自定义弹窗组件 -->
<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="visible" class="dialog-mask" @click="handleMaskClick">
        <div class="dialog-container" :style="dialogStyle" @click.stop>
          <!-- 标题区域 -->
          <div class="dialog-header" v-if="title || showClose">
            <h3 class="dialog-title">{{ title }}</h3>
            <button v-if="showClose" class="dialog-close" @click="handleClose">×</button>
          </div>
          <!-- 内容区域 -->
          <div class="dialog-content">
            <slot></slot>
          </div>
          <!-- 底部按钮区域 -->
          <div class="dialog-footer" v-if="$slots.footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  visible: boolean;
  title?: string;
  width?: string | number;
  showClose?: boolean;
  closeOnClickMask?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  width: '50%',
  showClose: true,
  closeOnClickMask: true,
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}>();

// 计算弹窗样式
const dialogStyle = computed(() => {
  return {
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  };
});

// 处理遮罩层点击
const handleMaskClick = () => {
  if (props.closeOnClickMask) {
    handleClose();
  }
};

// 处理关闭
const handleClose = () => {
  emit('update:visible', false);
  emit('close');
};
</script>

<style scoped>
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.dialog-container {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  padding: 20px 20px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title {
  font-size: 18px;
  line-height: 24px;
  margin: 0;
}

.dialog-close {
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  color: #909399;
}

.dialog-close:hover {
  color: #409eff;
}

.dialog-content {
  padding: 20px;
  overflow-y: auto;
}

.dialog-footer {
  padding: 10px 20px 20px;
  text-align: right;
}

/* 过渡动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>

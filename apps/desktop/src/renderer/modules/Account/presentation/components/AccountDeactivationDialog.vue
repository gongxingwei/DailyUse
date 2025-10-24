<template>
  <v-dialog v-model="isVisible" max-width="500px" persistent @click:outside="handleCancel">
    <v-card class="account-deactivation-dialog">
      <v-card-title class="text-h5 error--text">
        <v-icon left color="error">mdi-alert-circle-outline</v-icon>
        账号注销确认
      </v-card-title>

      <v-card-text>
        <div class="mb-4">
          <p class="text-body-1 mb-2">
            您即将注销账号 <strong>{{ username }}</strong
            >，此操作不可逆转。
          </p>
          <p class="text-body-2 text--secondary mb-3">注销后您将失去以下内容：</p>
          <ul class="text-body-2 text--secondary mb-4">
            <li>所有账号数据和设置</li>
            <li>任务和目标记录</li>
            <li>个人资料和偏好设置</li>
            <li>登录凭证和会话</li>
          </ul>
        </div>

        <v-alert v-if="reason" type="info" outlined dense class="mb-4">
          <strong>注销原因：</strong>{{ reason }}
        </v-alert>

        <!-- 密码验证区域 -->
        <div v-if="requiresPasswordVerification">
          <v-text-field
            v-model="password"
            label="请输入您的密码以确认注销"
            type="password"
            outlined
            dense
            :error-messages="passwordError"
            :disabled="isProcessing"
            @keyup.enter="handleConfirm"
            class="mb-3"
          />

          <v-checkbox v-model="confirmDeactivation" :disabled="isProcessing" class="mt-0">
            <template #label>
              <span class="text-body-2"> 我确认理解注销后果并同意继续 </span>
            </template>
          </v-checkbox>
        </div>

        <!-- 管理员操作提示 -->
        <v-alert v-else-if="requestedBy === 'admin'" type="warning" outlined dense>
          管理员强制注销操作，无需密码验证
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn text color="grey" :disabled="isProcessing" @click="handleCancel"> 取消 </v-btn>

        <v-btn
          color="error"
          :disabled="!canConfirm || isProcessing"
          :loading="isProcessing"
          @click="handleConfirm"
        >
          {{ confirmButtonText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  visible: boolean;
  accountUuid: string;
  username: string;
  requestId: string;
  requestedBy: 'user' | 'admin' | 'system';
  reason?: string;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (
    e: 'confirm',
    data: {
      requestId: string;
      verificationMethod: 'password' | 'cancelled';
      password?: string;
      clientInfo?: {
        ipAddress?: string;
        userAgent?: string;
        deviceId?: string;
      };
    },
  ): void;
  (e: 'cancel', requestId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const password = ref('');
const confirmDeactivation = ref(false);
const passwordError = ref('');
const isProcessing = ref(false);

// 计算属性
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const requiresPasswordVerification = computed(() => {
  return props.requestedBy === 'user';
});

const canConfirm = computed(() => {
  if (props.requestedBy === 'admin' || props.requestedBy === 'system') {
    return true;
  }
  return password.value.length > 0 && confirmDeactivation.value;
});

const confirmButtonText = computed(() => {
  if (isProcessing.value) {
    return '处理中...';
  }
  if (props.requestedBy === 'admin') {
    return '确认强制注销';
  }
  if (props.requestedBy === 'system') {
    return '确认系统注销';
  }
  return '确认注销账号';
});

// 监听属性变化
watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      // 重置表单
      password.value = '';
      confirmDeactivation.value = false;
      passwordError.value = '';
      isProcessing.value = false;
    }
  },
);

// 方法
const handleConfirm = async () => {
  if (!canConfirm.value) return;

  passwordError.value = '';
  isProcessing.value = true;

  try {
    // 获取客户端信息
    const clientInfo = {
      userAgent: navigator.userAgent,
      deviceId: generateDeviceId(),
      ipAddress: await getClientIP(),
    };

    // 发送确认数据
    emit('confirm', {
      requestId: props.requestId,
      verificationMethod: 'password',
      password: requiresPasswordVerification.value ? password.value : undefined,
      clientInfo,
    });
  } catch (error) {
    console.error('账号注销确认失败:', error);
    passwordError.value = '操作失败，请重试';
    isProcessing.value = false;
  }
};

const handleCancel = () => {
  if (isProcessing.value) return;

  emit('cancel', props.requestId);
  emit('confirm', {
    requestId: props.requestId,
    verificationMethod: 'cancelled',
  });

  isVisible.value = false;
};

// 辅助函数
const generateDeviceId = (): string => {
  return `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getClientIP = async (): Promise<string> => {
  try {
    // 在实际应用中，可以通过API获取客户端IP
    return '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
};
</script>

<style scoped>
.account-deactivation-dialog {
  border-top: 4px solid #f44336;
}

.account-deactivation-dialog .v-card-title {
  background-color: #ffebee;
  border-bottom: 1px solid #ffcdd2;
}

.account-deactivation-dialog ul {
  padding-left: 20px;
}

.account-deactivation-dialog ul li {
  margin-bottom: 4px;
}
</style>

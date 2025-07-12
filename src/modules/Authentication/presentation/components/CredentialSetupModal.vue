<template>
  <div v-if="isVisible" class="credential-setup-modal">
    <div class="modal-overlay" @click="handleCancel"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>设置登录密码</h2>
        <p class="welcome-message">
          欢迎，{{ currentRequest?.userProfile.firstName || currentRequest?.username }}！
          <br>
          请为您的新账号设置一个安全的登录密码。
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="credential-form">
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="请输入密码（至少8位）"
            required
            :class="{ error: errors.password }"
            @input="validatePassword"
          />
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            required
            :class="{ error: errors.confirmPassword }"
            @input="validateConfirmPassword"
          />
          <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              v-model="formData.rememberMe"
              type="checkbox"
            />
            <span class="checkbox-text">记住我的登录状态</span>
          </label>
        </div>

        <div class="password-strength">
          <div class="strength-label">密码强度：</div>
          <div class="strength-bar">
            <div 
              class="strength-fill" 
              :class="passwordStrengthClass"
              :style="{ width: passwordStrengthWidth }"
            ></div>
          </div>
          <span class="strength-text">{{ passwordStrengthText }}</span>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleCancel"
          >
            取消
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!isFormValid || isSubmitting"
          >
            {{ isSubmitting ? '设置中...' : '确认设置' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { rendererAuthManager } from '../services/rendererAuthenticationManager';

// 响应式数据
const formData = ref({
  password: '',
  confirmPassword: '',
  rememberMe: false
});

const errors = ref({
  password: '',
  confirmPassword: ''
});

const isSubmitting = ref(false);

// 计算属性
const isVisible = computed(() => rendererAuthManager.isRequestActive.value);
const currentRequest = computed(() => rendererAuthManager.currentRequest.value);

const isFormValid = computed(() => {
  return formData.value.password.length >= 8 &&
         formData.value.password === formData.value.confirmPassword &&
         !errors.value.password &&
         !errors.value.confirmPassword;
});

const passwordStrength = computed(() => {
  const password = formData.value.password;
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  return score;
});

const passwordStrengthWidth = computed(() => {
  return `${(passwordStrength.value / 6) * 100}%`;
});

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value;
  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
});

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value;
  if (strength <= 2) return '弱';
  if (strength <= 4) return '中等';
  return '强';
});

// 方法
const validatePassword = () => {
  const password = formData.value.password;
  
  if (password.length === 0) {
    errors.value.password = '';
    return;
  }
  
  if (password.length < 8) {
    errors.value.password = '密码长度至少8位';
    return;
  }
  
  errors.value.password = '';
};

const validateConfirmPassword = () => {
  const { password, confirmPassword } = formData.value;
  
  if (confirmPassword.length === 0) {
    errors.value.confirmPassword = '';
    return;
  }
  
  if (password !== confirmPassword) {
    errors.value.confirmPassword = '两次输入的密码不一致';
    return;
  }
  
  errors.value.confirmPassword = '';
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;
  
  try {
    isSubmitting.value = true;
    
    await rendererAuthManager.submitCredential({
      password: formData.value.password,
      confirmPassword: formData.value.confirmPassword,
      rememberMe: formData.value.rememberMe
    });
    
    // 清空表单
    formData.value = {
      password: '',
      confirmPassword: '',
      rememberMe: false
    };
    errors.value = {
      password: '',
      confirmPassword: ''
    };
    
  } catch (error) {
    console.error('设置密码失败:', error);
    // 这里可以显示错误提示
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  rendererAuthManager.cancelCredentialSetup();
  
  // 清空表单
  formData.value = {
    password: '',
    confirmPassword: '',
    rememberMe: false
  };
  errors.value = {
    password: '',
    confirmPassword: ''
  };
};

// 监听表单数据变化，实时验证
watch(() => formData.value.password, validatePassword);
watch(() => formData.value.confirmPassword, validateConfirmPassword);
</script>

<style scoped>
.credential-setup-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 32px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 32px;
}

.modal-header h2 {
  color: #2d3748;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.welcome-message {
  color: #718096;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.credential-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #4a5568;
  font-size: 14px;
}

.form-group input[type="password"] {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input[type="password"]:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-group input.error {
  border-color: #e53e3e;
}

.error-message {
  color: #e53e3e;
  font-size: 12px;
  margin-top: 4px;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #718096;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.strength-label {
  color: #4a5568;
  font-weight: 500;
  min-width: 80px;
}

.strength-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s, background-color 0.3s;
}

.strength-fill.weak {
  background: #e53e3e;
}

.strength-fill.medium {
  background: #ed8936;
}

.strength-fill.strong {
  background: #38a169;
}

.strength-text {
  color: #718096;
  min-width: 30px;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #edf2f7;
  color: #4a5568;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3182ce;
}
</style>

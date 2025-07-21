<template>
  <div class="login-form-container">
    <div class="login-form">
      <div class="form-header">
        <h2>用户登录</h2>
        <p>请输入您的用户名和密码</p>
      </div>

      <form @submit.prevent="handleLogin" class="form-content">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            placeholder="请输入用户名"
            required
            :disabled="isLoading"
            :class="{ error: errors.username }"
            @input="clearError('username')"
          />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            required
            :disabled="isLoading"
            :class="{ error: errors.password }"
            @input="clearError('password')"
          />
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              v-model="formData.rememberMe"
              type="checkbox"
              :disabled="isLoading"
            />
            <span class="checkbox-text">记住我</span>
          </label>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!isFormValid || isLoading"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </div>

        <div v-if="loginMessage" class="login-message" :class="{ error: !lastLoginSuccess, success: lastLoginSuccess }">
          {{ loginMessage }}
        </div>
      </form>

      <div class="form-footer">
        <a href="#" @click.prevent="$emit('forgot-password')">忘记密码？</a>
        <span class="separator">|</span>
        <a href="#" @click.prevent="$emit('register')">注册新账号</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { rendererAuthService } from '../services/rendererAuthenticationService';

// 事件定义
const emit = defineEmits<{
  'login-success': [result: { accountUuid: string; username: string; sessionId: string }];
  'forgot-password': [];
  'register': [];
}>();

// 响应式数据
const formData = ref({
  username: '',
  password: '',
  rememberMe: false
});

const errors = ref({
  username: '',
  password: ''
});

const isLoading = ref(false);
const loginMessage = ref('');
const lastLoginSuccess = ref(false);

// 计算属性
const isFormValid = computed(() => {
  return formData.value.username.trim().length > 0 &&
         formData.value.password.length > 0 &&
         !errors.value.username &&
         !errors.value.password;
});

// 方法
const clearError = (field: 'username' | 'password') => {
  errors.value[field] = '';
  loginMessage.value = '';
};

const validateForm = (): boolean => {
  let isValid = true;

  // 验证用户名
  if (!formData.value.username.trim()) {
    errors.value.username = '请输入用户名';
    isValid = false;
  } else if (formData.value.username.length < 3) {
    errors.value.username = '用户名至少3个字符';
    isValid = false;
  }

  // 验证密码
  if (!formData.value.password) {
    errors.value.password = '请输入密码';
    isValid = false;
  } else if (formData.value.password.length < 6) {
    errors.value.password = '密码至少6个字符';
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;
  loginMessage.value = '';

  try {
    console.log('🔐 [LoginForm] 开始登录流程:', formData.value.username);

    const result = await rendererAuthService.login(
      formData.value.username,
      formData.value.password
    );

    if (result.success) {
      console.log('✅ [LoginForm] 登录成功:', result);
      
      lastLoginSuccess.value = true;
      loginMessage.value = result.message;

      // 触发登录成功事件
      emit('login-success', {
        accountUuid: result.accountUuid!,
        username: result.username,
        sessionId: result.sessionId!
      });

      // 如果记住我，保存用户名
      if (formData.value.rememberMe) {
        localStorage.setItem('remembered_username', formData.value.username);
      } else {
        localStorage.removeItem('remembered_username');
      }

      // 清空密码字段
      formData.value.password = '';

    } else {
      console.warn('❌ [LoginForm] 登录失败:', result);
      
      lastLoginSuccess.value = false;
      loginMessage.value = result.message;

      // 根据错误码处理特定错误
      switch (result.errorCode) {
        case 'ACCOUNT_NOT_FOUND':
          errors.value.username = '用户名不存在';
          break;
        case 'INVALID_CREDENTIALS':
          errors.value.password = '密码错误';
          break;
        case 'ACCOUNT_LOCKED':
          loginMessage.value = '账号已被锁定，请联系管理员';
          break;
        case 'ACCOUNT_INACTIVE':
          loginMessage.value = '账号未激活，请先激活账号';
          break;
      }
    }

  } catch (error) {
    console.error('❌ [LoginForm] 登录异常:', error);
    
    lastLoginSuccess.value = false;
    loginMessage.value = '登录失败，请稍后重试';
  } finally {
    isLoading.value = false;
  }
};

// 组件挂载时恢复记住的用户名
const restoreRememberedUsername = () => {
  const rememberedUsername = localStorage.getItem('remembered_username');
  if (rememberedUsername) {
    formData.value.username = rememberedUsername;
    formData.value.rememberMe = true;
  }
};

// 在组件挂载时执行
restoreRememberedUsername();
</script>

<style scoped>
.login-form-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-form {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.form-header h2 {
  color: #2d3748;
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.form-header p {
  color: #718096;
  font-size: 14px;
  margin: 0;
}

.form-content {
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

.form-group input[type="text"],
.form-group input[type="password"] {
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input[type="text"]:focus,
.form-group input[type="password"]:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-group input.error {
  border-color: #e53e3e;
}

.form-group input:disabled {
  background: #f7fafc;
  color: #a0aec0;
  cursor: not-allowed;
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

.form-actions {
  margin-top: 8px;
}

.btn {
  width: 100%;
  padding: 14px 24px;
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

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3182ce;
  transform: translateY(-1px);
}

.login-message {
  margin-top: 16px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.login-message.success {
  background: #c6f6d5;
  color: #22543d;
  border: 1px solid #9ae6b4;
}

.login-message.error {
  background: #fed7d7;
  color: #742a2a;
  border: 1px solid #fc8181;
}

.form-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.form-footer a {
  color: #4299e1;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.form-footer a:hover {
  color: #3182ce;
  text-decoration: underline;
}

.separator {
  margin: 0 12px;
  color: #a0aec0;
}
</style>

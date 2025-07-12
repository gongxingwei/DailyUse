<template>
  <v-card 
    class="account-registration-form" 
    elevation="2"
    :loading="isLoading"
  >
    <v-card-title class="text-h5 text-center">
      <v-icon icon="mdi-account-plus" class="mr-2" />
      创建新账号
    </v-card-title>

    <v-card-text>
      <v-form 
        ref="formRef" 
        v-model="formValid" 
        @submit.prevent="handleSubmit"
      >
        <!-- 用户名 -->
        <v-text-field
          v-model="formData.username"
          label="用户名 *"
          placeholder="请输入用户名"
          :rules="usernameRules"
          :error-messages="usernameError"
          prepend-inner-icon="mdi-account"
          variant="outlined"
          class="mb-3"
          required
          @blur="validateUsernameField"
        />

        <!-- 邮箱 -->
        <v-text-field
          v-model="formData.email"
          label="邮箱"
          placeholder="请输入邮箱地址（可选）"
          :rules="emailRules"
          type="email"
          prepend-inner-icon="mdi-email"
          variant="outlined"
          class="mb-3"
        />

        <!-- 手机号 -->
        <v-text-field
          v-model="formData.phone"
          label="手机号"
          placeholder="请输入手机号码（可选）"
          :rules="phoneRules"
          prepend-inner-icon="mdi-phone"
          variant="outlined"
          class="mb-3"
        />

        <!-- 账号类型 -->
        <v-select
          v-model="formData.accountType"
          label="账号类型"
          :items="accountTypeOptions"
          item-title="text"
          item-value="value"
          prepend-inner-icon="mdi-account-cog"
          variant="outlined"
          class="mb-3"
        />

        <!-- 可选信息 -->
        <v-expansion-panels variant="accordion" class="mb-4">
          <v-expansion-panel title="更多信息（可选）">
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="6">
                  <v-text-field
                    v-model="formData.firstName"
                    label="姓名"
                    placeholder="请输入姓名"
                    prepend-inner-icon="mdi-account-details"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="formData.lastName"
                    label="姓氏"
                    placeholder="请输入姓氏"
                    prepend-inner-icon="mdi-account-details"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
              
              <v-select
                v-model="formData.sex"
                label="性别"
                :items="genderOptions"
                item-title="text"
                item-value="value"
                prepend-inner-icon="mdi-gender-male-female"
                variant="outlined"
                clearable
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- 错误信息 -->
        <v-alert
          v-if="error"
          type="error"
          class="mb-3"
          dismissible
          @click:close="clearError"
        >
          {{ error }}
        </v-alert>

        <!-- 提示信息 -->
        <v-alert
          type="info"
          variant="tonal"
          class="mb-3"
          density="compact"
        >
          <v-icon icon="mdi-information" class="mr-2" />
          注册成功后，系统将自动提示您设置登录密码
        </v-alert>
      </v-form>
    </v-card-text>

    <v-card-actions class="px-6 pb-6">
      <v-btn
        variant="outlined"
        size="large"
        @click="handleReset"
        :disabled="isLoading"
      >
        重置
      </v-btn>
      
      <v-spacer />
      
      <v-btn
        color="primary"
        variant="flat"
        size="large"
        :loading="isLoading"
        :disabled="!formValid || isLoading"
        @click="handleSubmit"
      >
        <v-icon icon="mdi-account-plus" class="mr-2" />
        创建账号
      </v-btn>
    </v-card-actions>

    <v-divider />
    
    <v-card-actions class="justify-center">
      <v-btn
        variant="text"
        color="primary"
        @click="$emit('switchToLogin')"
      >
        已有账号？立即登录
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { accountApplicationService } from '../domain/services/rendererAccountApplicationService';
import { AccountType } from '../../domain/types/account';
import type { AccountRegistrationRequest } from '../../domain/types/account';

// 组件事件
const emit = defineEmits<{
  switchToLogin: [];
  registrationSuccess: [userData: any];
}>();

// 响应式数据
const formRef = ref();
const formValid = ref(false);
const usernameError = ref<string>('');

// 表单数据
const formData = reactive<AccountRegistrationRequest>({
  username: '',
  email: '',
  phone: '',
  accountType: AccountType.LOCAL,
  firstName: '',
  lastName: '',
  sex: ''
});

// 计算属性
const isLoading = computed(() => accountApplicationService.isLoading.value);
const error = computed(() => accountApplicationService.error.value);

// 账号类型选项
const accountTypeOptions = [
  { text: '本地账号', value: AccountType.LOCAL },
  { text: '在线账号', value: AccountType.ONLINE },
];

// 性别选项
const genderOptions = [
  { text: '男', value: 'male' },
  { text: '女', value: 'female' },
  { text: '其他', value: 'other' }
];

// 验证规则
const usernameRules = [
  (v: string) => !!v || '用户名不能为空',
  (v: string) => (v && v.length >= 3) || '用户名至少需要3个字符',
  (v: string) => (v && v.length <= 20) || '用户名不能超过20个字符',
  (v: string) => /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(v) || '用户名只能包含字母、数字、下划线和中文'
];

const emailRules = [
  (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '请输入有效的邮箱地址'
];

const phoneRules = [
  (v: string) => !v || /^1[3-9]\d{9}$/.test(v) || '请输入有效的手机号码'
];

// 方法
const validateUsernameField = () => {
  const validation = accountApplicationService.validateUsername(formData.username);
  usernameError.value = validation.valid ? '' : validation.message || '';
};

const clearError = () => {
  accountApplicationService.error.value = null;
};

const handleReset = () => {
  formRef.value?.reset();
  Object.assign(formData, {
    username: '',
    email: '',
    phone: '',
    accountType: AccountType.LOCAL,
    firstName: '',
    lastName: '',
    sex: ''
  });
  usernameError.value = '';
  clearError();
};

const handleSubmit = async () => {
  if (!formValid.value) return;

  // 最终验证
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    const response = await accountApplicationService.registerAccount(formData);
    
    if (response.success) {
      emit('registrationSuccess', response.data);
      // 这里不重置表单，因为用户可能需要查看注册信息
    }
  } catch (error) {
    console.error('注册失败:', error);
  }
};
</script>

<style scoped>
.account-registration-form {
  max-width: 500px;
  margin: 0 auto;
}

.v-expansion-panel-text {
  padding-top: 16px;
}
</style>

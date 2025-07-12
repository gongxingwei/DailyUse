<template>
    <v-form ref="formRef" @submit.prevent="handleRemoteRegister" :loading="accountStore.loading">
        <v-card class="pa-4">
            <!-- <v-card-title class="text-center">注册账号</v-card-title> -->

            <v-card-text>
                <!-- 错误提示 -->
        <v-alert v-if="accountStore.error" type="error" variant="tonal" class="mb-4">
          {{ accountStore.error }}
        </v-alert>

        <!-- 用户名输入框 -->
        <v-text-field 
          v-model="registerForm.username" 
          label="用户名" 
          :rules="usernameRules"
          prepend-inner-icon="mdi-account"
          
          class="mb-3"
          required 
        />

        <!-- 邮箱输入框 -->
        <v-text-field 
          v-model="registerForm.email" 
          label="邮箱" 
          type="email" 
          :rules="emailRules"
          prepend-inner-icon="mdi-email"
          
          class="mb-3"
          required 
        />

        <!-- 密码输入框 -->
        <v-text-field 
          v-model="registerForm.password" 
          label="密码" 
          :type="showPassword ? 'text' : 'password'"
          :rules="passwordRules"
          prepend-inner-icon="mdi-lock"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="showPassword = !showPassword"
          
          class="mb-3"
          required 
        />

        <!-- 确认密码输入框 -->
        <v-text-field 
          v-model="registerForm.confirmPassword" 
          label="确认密码" 
          :type="showConfirmPassword ? 'text' : 'password'"
          :rules="confirmPasswordRules"
          prepend-inner-icon="mdi-lock-check"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
          
          class="mb-3"
          required 
        />

        <!-- 额外选项（可选） -->
        <div class="d-flex align-center justify-space-between mb-4">
          <v-checkbox 
            label="我同意用户协议和隐私政策" 
            color="primary"
            density="compact"
            :rules="[v => !!v || '请同意用户协议']"
          />
        </div>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn color="primary" type="submit" :loading="accountStore.loading">
                    注册
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-form>

    <!-- 弹窗提醒 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top" variant="tonal"
        elevation="4">
        {{ snackbar.message }}
    </v-snackbar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAccountStore } from '../stores/accountStore';
import { useUserAuth } from '../composables/useUserAuth';
import { usernameRules, passwordRules, emailRules } from '../../validations/accountFormRules';
const { formRef, registerForm, snackbar, handleRemoteRegister } = useUserAuth();
const accountStore = useAccountStore();

// 本地状态
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// 确认密码验证规则
const confirmPasswordRules = computed(() => [
  (v: string) => !!v || '请确认密码',
  (v: string) => v === registerForm.password || '两次输入的密码不一致'
]);


</script>

<style scoped>
/* 图标颜色自定义 */
.v-text-field :deep(.v-field__prepend-inner) {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.v-text-field :deep(.v-field__append-inner) {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* 聚焦时图标高亮 */
.v-text-field:focus-within :deep(.v-field__prepend-inner) {
  color: rgb(var(--v-theme-primary));
}

/* 错误状态时图标颜色 */
.v-text-field.v-input--error :deep(.v-field__prepend-inner) {
  color: rgb(var(--v-theme-error));
}
</style>
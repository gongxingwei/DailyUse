<!-- filepath: /d:/myPrograms/DailyUse/src/modules/Account/components/LocalRegisterForm.vue -->
<template>
    <v-form ref="formRef" @submit.prevent="handleLocalRegister" :loading="authStore.loading">
        <v-card class="pa-4">
            <v-card-title class="text-center">
                <v-icon class="mr-2" color="primary">mdi-account-plus</v-icon>
                注册账号
            </v-card-title>

            <v-card-text>
                <!-- 错误提示 -->
                <v-alert 
                    v-if="authStore.error" 
                    type="error" 
                    variant="tonal" 
                    class="mb-4"
                    closable>
                    {{ authStore.error }}
                </v-alert>

                <!-- 用户名输入 -->
                <v-text-field 
                    v-model="registerForm.username" 
                    label="用户名" 
                    :rules="usernameRules"
                    :counter="20"
                    prepend-inner-icon="mdi-account"
                    clearable
                    required />

                <!-- 邮箱输入（可选，已注释） -->
                <!-- <v-text-field 
                    v-model="registerForm.email" 
                    label="邮箱" 
                    type="email" 
                    :rules="emailRules"
                    prepend-inner-icon="mdi-email"
                    clearable
                    required /> -->

                <!-- 密码输入 -->
                <v-text-field 
                    v-model="registerForm.password" 
                    label="密码" 
                    :type="showPassword ? 'text' : 'password'"
                    :rules="passwordRules"
                    :counter="20"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword = !showPassword"
                    clearable
                    required>
                    
                    <!-- 密码强度指示器 -->
                    <template v-slot:details>
                        <div v-if="registerForm.password" class="mt-2">
                            <div class="text-caption mb-1">密码强度:</div>
                            <v-progress-linear
                                :model-value="passwordStrength.score * 25"
                                :color="passwordStrength.color"
                                height="4"
                                rounded />
                            <div class="text-caption mt-1" :class="`text-${passwordStrength.color}`">
                                {{ passwordStrength.text }}
                            </div>
                        </div>
                    </template>
                </v-text-field>

                <!-- 确认密码输入 -->
                <v-text-field 
                    v-model="registerForm.confirmPassword" 
                    label="确认密码" 
                    :type="showConfirmPassword ? 'text' : 'password'"
                    :rules="confirmPasswordRules"
                    prepend-inner-icon="mdi-lock-check"
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showConfirmPassword = !showConfirmPassword"
                    clearable
                    required />

                <!-- 注册选项 -->
                <div class="mt-4">
                    <v-checkbox 
                        v-model="autoRemember"
                        label="注册后自动保存登录信息"
                        color="primary"
                        density="compact" />
                    
                    <v-checkbox 
                        v-model="agreeTerms"
                        :rules="[v => !!v || '请同意服务条款']"
                        color="primary"
                        density="compact">
                        <template v-slot:label>
                            <span>我已阅读并同意 
                                <a href="#" @click.prevent="showTerms = true" class="text-primary">
                                    服务条款
                                </a>
                            </span>
                        </template>
                    </v-checkbox>
                </div>
            </v-card-text>

            <v-card-actions class="px-4 pb-4">
                <v-btn 
                    variant="outlined" 
                    @click="resetForm"
                    :disabled="authStore.loading">
                    重置
                </v-btn>
                <v-spacer />
                <v-btn 
                    color="primary" 
                    type="submit" 
                    :loading="authStore.loading"
                    size="large">
                    <v-icon start>mdi-account-plus</v-icon>
                    注册
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-form>

    <!-- 提示信息 -->
    <v-snackbar 
        v-model="snackbar.show" 
        :color="snackbar.color" 
        :timeout="3000" 
        location="top" 
        variant="tonal"
        elevation="4">
        {{ snackbar.message }}
    </v-snackbar>

    <!-- 服务条款对话框 -->
    <v-dialog v-model="showTerms" max-width="600">
        <v-card>
            <v-card-title>服务条款</v-card-title>
            <v-card-text>
                <div class="text-body-2">
                    <p>欢迎使用我们的服务。在使用本服务前，请仔细阅读以下条款：</p>
                    <ul class="mt-2">
                        <li>您需要对自己的账号安全负责</li>
                        <li>请不要与他人分享您的账号信息</li>
                        <li>我们会保护您的隐私数据安全</li>
                        <li>禁止使用本服务进行违法活动</li>
                    </ul>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn @click="showTerms = false">关闭</v-btn>
                <v-btn color="primary" @click="acceptTerms">同意</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useUserAuth } from '../composables/useUserAuth';

// 组合式函数
const { 
    formRef, 
    registerForm, 
    snackbar, 
    handleLocalRegister 
} = useUserAuth();

const authStore = useAuthStore();

// 本地状态
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const autoRemember = ref(true);
const agreeTerms = ref(false);
const showTerms = ref(false);

// 表单验证规则
const usernameRules = [
    (v: string) => !!v || '请输入用户名',
    (v: string) => v.length >= 3 || '用户名至少3个字符',
    (v: string) => v.length <= 20 || '用户名最多20个字符',
    (v: string) => /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(v) || '用户名只能包含字母、数字、下划线和中文',
];

const emailRules = [
    (v: string) => !!v || '请输入邮箱',
    (v: string) => /.+@.+\..+/.test(v) || '请输入有效的邮箱地址'
];

const passwordRules = [
    (v: string) => !!v || '请输入密码',
    (v: string) => v.length >= 8 || '密码至少8个字符',
    (v: string) => v.length <= 20 || '密码最多20个字符',
    (v: string) => /[a-z]/.test(v) || '密码至少包含一个小写字母',
    (v: string) => /[A-Z]/.test(v) || '密码至少包含一个大写字母',
    (v: string) => /[0-9]/.test(v) || '密码至少包含一个数字',
];

const confirmPasswordRules = [
    (v: string) => !!v || '请确认密码',
    (v: string) => v === registerForm.password || '两次输入的密码不一致'
];

// 密码强度计算
const passwordStrength = computed(() => {
    const password = registerForm.password;
    if (!password) return { score: 0, text: '', color: 'grey' };
    
    let score = 0;
    const checks = [
        password.length >= 8,
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^a-zA-Z0-9]/.test(password),
        password.length >= 12
    ];
    
    score = checks.filter(Boolean).length;
    
    if (score <= 2) return { score: 1, text: '弱', color: 'error' };
    if (score <= 4) return { score: 2, text: '中等', color: 'warning' };
    if (score <= 5) return { score: 3, text: '强', color: 'success' };
    return { score: 4, text: '很强', color: 'success' };
});

// 方法
const resetForm = () => {
    formRef.value?.reset();
    agreeTerms.value = false;
    autoRemember.value = true;
};

const acceptTerms = () => {
    agreeTerms.value = true;
    showTerms.value = false;
};

// 重写注册处理函数以包含新选项
const handleEnhancedRegister = async () => {
    // 调用原始注册函数
    await handleLocalRegister();
    
    // 如果注册成功且选择了自动保存
    if (autoRemember.value) {
        // 这里可以添加额外的逻辑
        console.log('用户选择了自动保存登录信息');
    }
};
</script>

<style scoped>
.text-primary {
    text-decoration: none;
}

.text-primary:hover {
    text-decoration: underline;
}
</style>
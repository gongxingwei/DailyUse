<template>
    <div class="register-container">
        <v-card class="mx-auto" max-width="500" elevation="8">
            <v-card-title class="text-center py-6">
                <h2 class="text-h4 font-weight-bold primary--text">用户注册</h2>
            </v-card-title>

            <v-card-text class="pb-0">
                <!-- 使用UI组件库的注册表单 -->
                <DuRegistrationForm v-model:username="registrationForm.username" v-model:email="registrationForm.email"
                    v-model:password="registrationForm.password"
                    v-model:confirm-password="registrationForm.confirmPassword"
                    v-model:display-name="registrationForm.displayName"
                    v-model:accept-terms="registrationForm.acceptTerms" :loading="authStore.isLoading"
                    :error="authStore.error" :username-rules="usernameRules" :email-rules="emailRules"
                    :password-rules="passwordRules" @submit="handleRegistration" />

                <!-- 错误提示 -->
                <v-alert v-if="authStore.error" type="error" variant="tonal" class="mt-4" closable
                    @click:close="authStore.clearMessages()">
                    {{ authStore.error }}
                </v-alert>
            </v-card-text>

            <v-card-actions class="px-6 pb-6">
                <v-spacer />
                <div class="text-center">
                    <span class="text-body-2">已有账户？</span>
                    <v-btn variant="text" color="primary" class="ml-2" @click="$router.push('/login')">
                        立即登录
                    </v-btn>
                </div>
                <v-spacer />
            </v-card-actions>
        </v-card>

        <!-- 验证对话框 -->
        <v-dialog v-model="showVerificationDialog" max-width="400" persistent>
            <v-card>
                <v-card-title>
                    <span class="text-h5">邮箱验证</span>
                </v-card-title>

                <v-card-text>
                    <p class="text-body-1 mb-4">
                        我们已向 <strong>{{ registrationForm.email }}</strong> 发送了验证邮件。
                        请输入收到的验证码：
                    </p>

                    <v-text-field v-model="verificationCode" label="验证码" placeholder="请输入6位验证码" :loading="isVerifying"
                        :error-messages="verificationError" maxlength="6" counter @keyup.enter="handleVerifyCode" />

                    <div class="text-center mt-4">
                        <v-btn variant="text" color="primary" :loading="isSendingCode" @click="handleResendCode">
                            重新发送验证码
                        </v-btn>
                    </div>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="outlined" @click="handleCancelVerification">
                        取消
                    </v-btn>
                    <v-btn color="primary" variant="flat" :loading="isVerifying"
                        :disabled="!verificationCode || verificationCode.length < 6" @click="handleVerifyCode">
                        验证
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 成功提示 Snackbar -->
        <v-snackbar v-model="showSuccessMessage" color="success" timeout="5000" location="top">
            {{ successMessage }}
            <template #actions>
                <v-btn variant="text" @click="showSuccessMessage = false">
                    关闭
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { DuRegistrationForm } from '@dailyuse/ui';
import type {
    RegistrationRequestDto,
    VerificationCodeRequestDto,
    VerificationCodeConfirmDto
} from '../../application/dtos/AuthDtos';

// ===== Composables =====
const router = useRouter();
const authStore = useAuthStore();

// ===== Reactive State =====
const registrationForm = reactive({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    acceptTerms: false
});

const showVerificationDialog = ref(false);
const verificationCode = ref('');
const isVerifying = ref(false);
const isSendingCode = ref(false);
const verificationError = ref<string | null>(null);
const showSuccessMessage = ref(false);
const successMessage = ref('');
const userId = ref<string>('');

// ===== Form Validation Rules =====
const usernameRules = [
    (v: string) => !!v || '用户名不能为空',
    (v: string) => v.length >= 3 || '用户名至少3位字符',
    (v: string) => /^[a-zA-Z0-9_]+$/.test(v) || '用户名只能包含字母、数字和下划线'
];

const emailRules = [
    (v: string) => !!v || '邮箱不能为空',
    (v: string) => /.+@.+\..+/.test(v) || '请输入有效的邮箱地址'
];

const passwordRules = [
    (v: string) => !!v || '密码不能为空',
    (v: string) => v.length >= 8 || '密码至少8位字符',
    (v: string) => /(?=.*[a-z])/.test(v) || '密码必须包含小写字母',
    (v: string) => /(?=.*[A-Z])/.test(v) || '密码必须包含大写字母',
    (v: string) => /(?=.*\d)/.test(v) || '密码必须包含数字'
];

// ===== Methods =====

/**
 * 处理用户注册
 */
async function handleRegistration(formData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    displayName?: string;
    acceptTerms: boolean;
}) {
    const deviceInfo = {
        deviceId: generateDeviceId(),
        deviceName: getBrowserInfo(),
        userAgent: navigator.userAgent,
        ipAddress: undefined
    };

    const registrationRequest: RegistrationRequestDto = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        displayName: formData.displayName || formData.username,
        acceptTerms: formData.acceptTerms,
        deviceInfo
    };

    const result = await authStore.register(registrationRequest);

    if (result.success) {
        if (result.requiresAction?.type === 'verification') {
            // 需要邮箱验证
            userId.value = result.data?.userId || '';
            showVerificationDialog.value = true;
            successMessage.value = '注册成功！请检查您的邮箱并输入验证码';
            showSuccessMessage.value = true;
        } else {
            // 直接注册成功
            successMessage.value = '注册成功！正在跳转到登录页面...';
            showSuccessMessage.value = true;

            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }
    }
    // 错误处理由store和组件自动处理
}

/**
 * 处理验证码验证
 */
async function handleVerifyCode() {
    if (!verificationCode.value || verificationCode.value.length < 6) {
        verificationError.value = '请输入6位验证码';
        return;
    }

    isVerifying.value = true;
    verificationError.value = null;

    const verifyRequest: VerificationCodeConfirmDto = {
        code: verificationCode.value,
        identifier: registrationForm.email,
        type: 'email'
    };

    try {
        const result = await authStore.verifyCode(verifyRequest);

        if (result.success) {
            successMessage.value = '邮箱验证成功！正在跳转到登录页面...';
            showSuccessMessage.value = true;
            showVerificationDialog.value = false;

            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } else {
            verificationError.value = result.message || '验证码错误，请重试';
        }
    } catch (error) {
        verificationError.value = error instanceof Error ? error.message : '验证失败，请重试';
    } finally {
        isVerifying.value = false;
    }
}

/**
 * 重新发送验证码
 */
async function handleResendCode() {
    isSendingCode.value = true;

    const codeRequest: VerificationCodeRequestDto = {
        type: 'email',
        identifier: registrationForm.email,
        purpose: 'registration'
    };

    try {
        const result = await authStore.sendVerificationCode(codeRequest);

        if (result.success) {
            successMessage.value = '验证码已重新发送到您的邮箱';
            showSuccessMessage.value = true;
        } else {
            verificationError.value = result.message || '发送验证码失败，请稍后重试';
        }
    } catch (error) {
        verificationError.value = error instanceof Error ? error.message : '发送失败，请重试';
    } finally {
        isSendingCode.value = false;
    }
}

/**
 * 取消验证
 */
function handleCancelVerification() {
    showVerificationDialog.value = false;
    verificationCode.value = '';
    verificationError.value = null;

    // 返回注册页面，允许用户重新注册或修改邮箱
    successMessage.value = '验证已取消，您可以重新注册';
    showSuccessMessage.value = true;
}

/**
 * 生成设备ID
 */
function generateDeviceId(): string {
    return `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取浏览器信息
 */
function getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';

    if (userAgent.includes('Chrome')) {
        browserName = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
        browserName = 'Firefox';
    } else if (userAgent.includes('Safari')) {
        browserName = 'Safari';
    } else if (userAgent.includes('Edge')) {
        browserName = 'Edge';
    }

    return `${browserName} - ${navigator.platform}`;
}

// ===== Lifecycle =====
onMounted(async () => {
    // 如果已经登录，重定向到仪表板
    if (authStore.isAuthenticated) {
        router.push('/dashboard');
    }

    // 清除之前的错误消息
    authStore.clearMessages();
});
</script>

<style scoped>
.register-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.v-card {
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.v-card-title {
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white !important;
    border-radius: 16px 16px 0 0;
}

.primary--text {
    color: white !important;
}
</style>

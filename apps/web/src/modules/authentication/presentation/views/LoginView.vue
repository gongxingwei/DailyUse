<template>
    <div class="login-container">
        <v-card class="mx-auto" max-width="400" elevation="8">
            <v-card-title class="text-center py-6">
                <h2 class="text-h4 font-weight-bold primary--text">登录</h2>
            </v-card-title>

            <v-card-text class="pb-0">
                <!-- 使用UI组件库的登录表单 -->
                <DuLoginForm v-model:username="loginForm.username" v-model:password="loginForm.password"
                    v-model:remember-me="loginForm.rememberMe" :loading="authStore.isLoading" :error="authStore.error"
                    :username-rules="usernameRules" :password-rules="passwordRules" @submit="handleLogin">
                    <!-- 自定义附加内容 -->
                    <template #additional-actions>
                        <div class="text-center mt-4">
                            <v-btn variant="text" color="primary" @click="showForgotPassword = true">
                                忘记密码？
                            </v-btn>
                        </div>
                    </template>
                </DuLoginForm>

                <!-- 错误提示 -->
                <v-alert v-if="authStore.error" type="error" variant="tonal" class="mt-4" closable
                    @click:close="authStore.clearMessages()">
                    {{ authStore.error }}
                </v-alert>

                <!-- 警告提示 -->
                <v-alert v-if="authStore.warnings.length > 0" type="warning" variant="tonal" class="mt-4" closable
                    @click:close="authStore.clearMessages()">
                    <div v-for="warning in authStore.warnings" :key="warning">
                        {{ warning }}
                    </div>
                </v-alert>
            </v-card-text>

            <v-card-actions class="px-6 pb-6">
                <v-spacer />
                <div class="text-center">
                    <span class="text-body-2">还没有账户？</span>
                    <v-btn variant="text" color="primary" class="ml-2" @click="$router.push('/register')">
                        立即注册
                    </v-btn>
                </div>
                <v-spacer />
            </v-card-actions>
        </v-card>

        <!-- 忘记密码对话框 -->
        <v-dialog v-model="showForgotPassword" max-width="400">
            <v-card>
                <v-card-title>
                    <span class="text-h5">密码重置</span>
                </v-card-title>

                <v-card-text>
                    <DuPasswordResetForm v-model:email="resetForm.email" :loading="isResetting" :error="resetError"
                        @submit="handlePasswordReset" />
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="showForgotPassword = false">
                        取消
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
import { DuLoginForm, DuPasswordResetForm } from '@dailyuse/ui';
import type { LoginRequestDto, PasswordResetRequestDto } from '../../application/dtos/AuthDtos';

// ===== Composables =====
const router = useRouter();
const authStore = useAuthStore();

// ===== Reactive State =====
const loginForm = reactive({
    username: '',
    password: '',
    rememberMe: false
});

const resetForm = reactive({
    email: ''
});

const showForgotPassword = ref(false);
const isResetting = ref(false);
const resetError = ref<string | null>(null);
const showSuccessMessage = ref(false);
const successMessage = ref('');

// ===== Form Validation Rules =====
const usernameRules = [
    (v: string) => !!v || '用户名不能为空',
    (v: string) => v.length >= 3 || '用户名至少3位字符'
];

const passwordRules = [
    (v: string) => !!v || '密码不能为空',
    (v: string) => v.length >= 6 || '密码至少6位字符'
];

// ===== Methods =====

/**
 * 处理用户登录
 */
async function handleLogin(formData: { username: string; password: string; rememberMe?: boolean }) {
    const deviceInfo = {
        deviceId: generateDeviceId(),
        deviceName: getBrowserInfo(),
        userAgent: navigator.userAgent,
        ipAddress: undefined // Will be determined by server
    };

    const loginRequest: LoginRequestDto = {
        username: formData.username,
        password: formData.password,
        rememberMe: formData.rememberMe,
        deviceInfo
    };

    const result = await authStore.login(loginRequest);

    if (result.success) {
        successMessage.value = '登录成功，正在跳转...';
        showSuccessMessage.value = true;

        // 延迟跳转以显示成功消息
        setTimeout(() => {
            router.push('/dashboard');
        }, 1500);
    }
    // 错误处理由store和组件自动处理
}

/**
 * 处理密码重置请求
 */
async function handlePasswordReset(formData: { email: string }) {
    isResetting.value = true;
    resetError.value = null;

    const resetRequest: PasswordResetRequestDto = {
        email: formData.email,
        resetMethod: 'email',
        deviceInfo: {
            deviceId: generateDeviceId(),
            userAgent: navigator.userAgent,
            ipAddress: undefined
        }
    };

    try {
        const result = await authStore.initiatePasswordReset(resetRequest);

        if (result.success) {
            successMessage.value = '密码重置链接已发送到您的邮箱，请查收';
            showSuccessMessage.value = true;
            showForgotPassword.value = false;
            resetForm.email = '';
        } else {
            resetError.value = result.message;
        }
    } catch (error) {
        resetError.value = error instanceof Error ? error.message : '密码重置请求失败';
    } finally {
        isResetting.value = false;
    }
}

/**
 * 生成设备ID
 */
function generateDeviceId(): string {
    // 简单的设备ID生成（实际项目中应该使用更sophisticated的方法）
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
.login-container {
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

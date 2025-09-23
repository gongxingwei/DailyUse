<!-- 
  增强版注册表单 - 使用通用校验系统
  展示了如何在Vue组件中使用我们的新校验系统
-->
<template>
    <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-container>
            <!-- 错误提示 -->
            <v-alert v-if="formState.errors.value.length > 0" type="error" variant="tonal" class="mb-4" closable>
                <div v-for="(error, index) in formState.errors.value" :key="index">{{ error }}</div>
            </v-alert>

            <!-- 校验系统选择 -->
            <v-row class="mb-4">
                <v-col cols="12">
                    <v-chip-group v-model="validationMode" mandatory>
                        <v-chip value="legacy" color="primary" variant="outlined">
                            传统校验 (Vuetify原生)
                        </v-chip>
                        <v-chip value="universal" color="success" variant="outlined">
                            通用校验系统
                        </v-chip>
                    </v-chip-group>
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="12" md="6" offset-md="3">
                    <h2 class="text-center mb-4">
                        {{ validationMode === 'legacy' ? '传统校验' : '通用校验系统' }} - 注册表单
                    </h2>
                </v-col>
            </v-row>

            <!-- 用户名输入 -->
            <v-row>
                <v-col cols="12">
                    <v-text-field v-if="validationMode === 'legacy'" v-model="registrationData.username" label="用户名"
                        :rules="usernameRules" :counter="20" prepend-inner-icon="mdi-account" clearable required
                        @blur="handleFieldBlur('username')" />
                    <v-text-field v-else v-model="usernameValue" label="用户名 (通用校验)"
                        :error-messages="formState.fields.username?.error.value ? [formState.fields.username.error.value] : []"
                        :loading="formState.fields.username?.validating.value" :counter="20"
                        prepend-inner-icon="mdi-account" clearable required @blur="handleFieldBlur('username')"
                        @focus="handleFieldFocus('username')" />
                    <!-- 显示校验状态 -->
                    <div v-if="validationMode === 'universal' && formState.fields.username" class="mt-1">
                        <v-chip size="small" :color="formState.fields.username.valid.value ? 'success' : 'error'"
                            variant="outlined">
                            {{ formState.fields.username.valid.value ? '有效' : '无效' }}
                        </v-chip>
                        <v-chip v-if="formState.fields.username.dirty.value" size="small" color="info"
                            variant="outlined" class="ml-1">
                            已修改
                        </v-chip>
                        <v-chip v-if="formState.fields.username.touched.value" size="small" color="warning"
                            variant="outlined" class="ml-1">
                            已访问
                        </v-chip>
                    </div>
                </v-col>
            </v-row>

            <!-- 邮箱输入 -->
            <v-row>
                <v-col cols="12">
                    <v-text-field v-if="validationMode === 'legacy'" v-model="registrationData.email" label="邮箱"
                        :rules="emailRules" prepend-inner-icon="mdi-email" clearable required />
                    <v-text-field v-else v-model="emailValue" label="邮箱 (通用校验)"
                        :error-messages="formState.fields.email?.error.value ? [formState.fields.email.error.value] : []"
                        :loading="formState.fields.email?.validating.value" prepend-inner-icon="mdi-email" clearable
                        required @blur="handleFieldBlur('email')" @focus="handleFieldFocus('email')" />
                </v-col>
            </v-row>

            <!-- 密码输入 -->
            <v-row>
                <v-col cols="12">
                    <v-text-field v-if="validationMode === 'legacy'" v-model="registrationData.password" label="密码"
                        :type="showPassword ? 'text' : 'password'" :rules="passwordRules" :counter="20"
                        prepend-inner-icon="mdi-lock" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-inner="showPassword = !showPassword" clearable required />
                    <v-text-field v-else v-model="passwordValue" label="密码 (通用校验)"
                        :type="showPassword ? 'text' : 'password'"
                        :error-messages="formState.fields.password?.error.value ? [formState.fields.password.error.value] : []"
                        :loading="formState.fields.password?.validating.value" :counter="20"
                        prepend-inner-icon="mdi-lock" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-inner="showPassword = !showPassword" clearable required
                        @blur="handleFieldBlur('password')" @focus="handleFieldFocus('password')" />

                    <!-- 密码强度指示器 (仅通用校验模式) -->
                    <div v-if="validationMode === 'universal' && passwordValue" class="mt-2">
                        <div class="text-caption mb-1">密码强度:</div>
                        <v-progress-linear :model-value="passwordStrength.score * 25" :color="passwordStrength.color"
                            height="4" rounded />
                        <div class="text-caption mt-1" :class="`text-${passwordStrength.color}`">
                            {{ passwordStrength.text }}
                        </div>

                        <!-- 显示密码校验的详细信息 -->
                        <div v-if="formState.fields.password?.warnings.value.length > 0" class="mt-2">
                            <v-alert v-for="warning in formState.fields.password.warnings.value" :key="warning"
                                type="warning" variant="tonal" density="compact" class="mb-1">
                                {{ warning }}
                            </v-alert>
                        </div>
                    </div>
                </v-col>
            </v-row>

            <!-- 确认密码输入 -->
            <v-row>
                <v-col cols="12">
                    <v-text-field v-if="validationMode === 'legacy'" v-model="registrationData.confirmPassword"
                        label="确认密码" :type="showConfirmPassword ? 'text' : 'password'" :rules="confirmPasswordRules"
                        prepend-inner-icon="mdi-lock-check"
                        :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-inner="showConfirmPassword = !showConfirmPassword" clearable required />
                    <v-text-field v-else v-model="confirmPasswordValue" label="确认密码 (通用校验)"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        :error-messages="formState.fields.confirmPassword?.error.value ? [formState.fields.confirmPassword.error.value] : []"
                        :loading="formState.fields.confirmPassword?.validating.value"
                        prepend-inner-icon="mdi-lock-check"
                        :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-inner="showConfirmPassword = !showConfirmPassword" clearable required
                        @blur="handleFieldBlur('confirmPassword')" @focus="handleFieldFocus('confirmPassword')" />
                </v-col>
            </v-row>

            <!-- 协议同意 -->
            <v-row>
                <v-col>
                    <v-checkbox v-model="agreeTerms" :rules="[v => !!v || '请同意服务条款']" color="primary" density="compact">
                        <template v-slot:label>
                            <span>我已阅读并同意
                                <a href="#" @click.prevent="showTerms = true" class="text-primary">
                                    服务条款
                                </a>
                            </span>
                        </template>
                    </v-checkbox>
                </v-col>
            </v-row>

            <!-- 表单状态信息 (仅通用校验模式) -->
            <v-row v-if="validationMode === 'universal'">
                <v-col cols="12">
                    <v-card variant="outlined" class="pa-3">
                        <v-card-title class="text-h6">表单状态</v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col cols="6" sm="3">
                                    <v-chip :color="formState.valid.value ? 'success' : 'error'" variant="flat" block>
                                        {{ formState.valid.value ? '✓ 有效' : '✗ 无效' }}
                                    </v-chip>
                                </v-col>
                                <v-col cols="6" sm="3">
                                    <v-chip :color="formState.touched.value ? 'info' : 'default'" variant="outlined"
                                        block>
                                        {{ formState.touched.value ? '已访问' : '未访问' }}
                                    </v-chip>
                                </v-col>
                                <v-col cols="6" sm="3">
                                    <v-chip :color="formState.dirty.value ? 'warning' : 'default'" variant="outlined"
                                        block>
                                        {{ formState.dirty.value ? '已修改' : '未修改' }}
                                    </v-chip>
                                </v-col>
                                <v-col cols="6" sm="3">
                                    <v-chip :color="formState.validating.value ? 'purple' : 'default'"
                                        variant="outlined" block>
                                        {{ formState.validating.value ? '校验中...' : '校验完成' }}
                                    </v-chip>
                                </v-col>
                            </v-row>
                            <div v-if="formState.summary.value" class="mt-2">
                                <v-alert type="info" variant="tonal" density="compact">
                                    {{ formState.summary.value }}
                                </v-alert>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- 操作按钮 -->
            <v-row>
                <v-col class="text-center">
                    <v-btn variant="outlined" @click="resetForm">
                        重置
                    </v-btn>
                </v-col>
                <v-col class="text-center">
                    <v-btn color="primary" type="submit" :loading="submitting"
                        :disabled="validationMode === 'universal' ? !formState.valid.value : !isLegacyFormValid"
                        size="large">
                        <v-icon start>mdi-account-plus</v-icon>
                        注册 ({{ validationMode === 'legacy' ? '传统' : '通用' }})
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>

        <!-- 提示信息 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout">
            {{ snackbar.message }}
        </v-snackbar>
    </v-form>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';

// 导入传统校验规则
import { usernameRules, passwordRules, emailRules } from '../../../../shared/utils/validations/rules';

// 导入新的通用校验系统
import {
    usernameValidationRules,
    passwordValidationRules,
    emailValidationRules,
    createConfirmPasswordRules,
    registrationFormConfig
} from '../../../../shared/utils/validations/accountFormRules';

// 导入Vue组合函数
import { useFormValidation } from '../../../../shared/utils/validations/useFormValidation';

// 定义emit
const emit = defineEmits<{
    (e: 'registration-success'): void;
}>();

// 响应式数据
const validationMode = ref<'legacy' | 'universal'>('legacy');
const submitting = ref(false);
const agreeTerms = ref(false);
const showTerms = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// 传统表单数据
const registrationData = reactive({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
});

// 通用校验系统配置
const { state: formState, methods: formMethods, handleFieldFocus, handleFieldBlur } = useFormValidation({
    config: {
        ...registrationFormConfig,
        defaultTrigger: ['change'] // 移除readonly修饰符
    },
    initialValues: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    },
    validateOnChange: true,
    validateOnBlur: true
});

// 创建计算属性来处理v-model的可选链问题
const usernameValue = computed({
    get: () => formState.fields.username?.value.value || '',
    set: (val) => formMethods.setFieldValue('username', val)
});

const emailValue = computed({
    get: () => formState.fields.email?.value.value || '',
    set: (val) => formMethods.setFieldValue('email', val)
});

const passwordValue = computed({
    get: () => formState.fields.password?.value.value || '',
    set: (val) => formMethods.setFieldValue('password', val)
});

const confirmPasswordValue = computed({
    get: () => formState.fields.confirmPassword?.value.value || '',
    set: (val) => formMethods.setFieldValue('confirmPassword', val)
});

// 传统校验规则
const confirmPasswordRules = [
    (v: string) => !!v || '请确认密码',
    (v: string) => v === registrationData.password || '两次输入的密码不一致'
];

// 表单引用
const formRef = ref<any>(null);

// 计算属性
const isLegacyFormValid = computed(() => {
    return formRef.value?.isValid ?? false;
});

// 密码强度计算
const passwordStrength = computed(() => {
    const password = validationMode.value === 'legacy'
        ? registrationData.password
        : passwordValue.value || '';

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

// 提示信息
const snackbar = reactive({
    show: false,
    message: '',
    color: 'success',
    timeout: 3000
});

// 监听校验模式切换
watch(validationMode, (newMode) => {
    if (newMode === 'universal') {
        // 同步数据到通用校验系统
        formMethods.setFieldValue('username', registrationData.username);
        formMethods.setFieldValue('email', registrationData.email);
        formMethods.setFieldValue('password', registrationData.password);
        formMethods.setFieldValue('confirmPassword', registrationData.confirmPassword);
    } else {
        // 同步数据到传统表单
        registrationData.username = usernameValue.value;
        registrationData.email = emailValue.value;
        registrationData.password = passwordValue.value;
        registrationData.confirmPassword = confirmPasswordValue.value;
    }
});

// 方法
const resetForm = () => {
    if (validationMode.value === 'legacy') {
        formRef.value?.reset();
        registrationData.username = '';
        registrationData.email = '';
        registrationData.password = '';
        registrationData.confirmPassword = '';
    } else {
        formMethods.resetForm();
    }
    agreeTerms.value = false;
};

const showMessage = (message: string, color: string = 'success') => {
    snackbar.message = message;
    snackbar.color = color;
    snackbar.show = true;
};

const handleSubmit = async () => {
    if (!agreeTerms.value) {
        showMessage('请先同意服务条款', 'error');
        return;
    }

    submitting.value = true;

    try {
        let isValid = false;
        let formData: any = {};

        if (validationMode.value === 'legacy') {
            isValid = isLegacyFormValid.value;
            formData = { ...registrationData };
        } else {
            isValid = await formMethods.validateForm('submit');
            formData = {
                username: usernameValue.value,
                email: emailValue.value,
                password: passwordValue.value,
                confirmPassword: confirmPasswordValue.value
            };
        }

        if (!isValid) {
            showMessage('请修正表单错误', 'error');
            return;
        }

        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 2000));

        showMessage(`注册成功! 使用 ${validationMode.value === 'legacy' ? '传统' : '通用'} 校验`, 'success');
        emit('registration-success');

        // 重置表单
        resetForm();

    } catch (error) {
        console.error('Registration error:', error);
        showMessage('注册失败，请重试', 'error');
    } finally {
        submitting.value = false;
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
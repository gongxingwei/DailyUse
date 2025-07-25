<!-- filepath: /d:/myPrograms/DailyUse/src/modules/Account/components/LocalLoginForm.vue -->
<template>
    <v-form @submit.prevent="handleLocalLogin" :loading="loading" ref="formRef">
        <v-card class="pa-4" style="background: transparent;">
            <!-- <v-card-title class="text-center">登录</v-card-title> -->

            <v-card-text>
                <!-- 用户名下拉选择框 -->
                <v-combobox v-model="passwordAuthenticationForm.username" :items="rememberedUsernames"
                    :loading="loading" label="用户名" :rules=usernameRules @update:model-value="handleAccountSelect"
                    prepend-inner-icon="mdi-account" density="comfortable" clearable required>

                    <!-- 自定义下拉选项 -->
                    <template v-slot:item="{ item, props }">
                        <v-list-item v-bind="props" :title="item.raw">
                            <template v-slot:prepend>
                                <v-icon size="small" color="primary">
                                    mdi-account
                                </v-icon>
                            </template>
                            <template v-slot:append>
                                <v-tooltip text="删除此账号记录" location="top">
                                    <template v-slot:activator="{ props: tooltipProps }">
                                        <v-icon v-bind="tooltipProps" color="error" size="small"
                                            @click.stop="handleRemoveAccount(item.raw)" class="ml-2">
                                            mdi-close
                                        </v-icon>
                                    </template>
                                </v-tooltip>
                            </template>
                        </v-list-item>
                    </template>

                    <!-- 无数据时的提示 -->
                    <template v-slot:no-data>
                        <v-list-item>
                            <v-list-item-title class="text-grey">
                                暂无保存的账号
                            </v-list-item-title>
                        </v-list-item>
                    </template>
                </v-combobox>

                <!-- 密码输入框 -->
                <v-text-field v-model="passwordAuthenticationForm.password" label="密码" :rules=passwordRules
                    prepend-inner-icon="mdi-lock" clearable :counter="20" density="comfortable"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword = !showPassword" :type="showPassword ? 'text' : 'password'"
                    required />

                <!-- 记住密码选项 -->
                <v-checkbox v-model="passwordAuthenticationForm.remember" label="记住密码" color="primary"
                    density="comfortable" />
            </v-card-text>

            <v-card-actions class="px-4 pb-4">
                <v-btn color="primary" type="submit" variant="elevated" :loading="loading" :disabled="!!loading || !isCurrentFormValid" block size="large">
                    登录
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-form>

    <!-- 提示信息 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top" variant="tonal"
        elevation="4">
        {{ snackbar.message }}
    </v-snackbar>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { PasswordAuthenticationRequest } from '@/modules/Authentication/domain/types';
import { useSnackbar } from '@/shared/composables/useSnackbar';
// utils
import { usernameRules, passwordRules } from '../../../Account/validations/accountFormRules';
// services
import { AuthenticationService } from "../../application/services/authenticationService";
const authenticationService = AuthenticationService.getInstance();
const { snackbar, showError, showSuccess } = useSnackbar();
const router = useRouter();
const loading = ref(false);
const formRef = ref();
const isCurrentFormValid = computed(() => {
    return formRef.value?.isValid ?? false;
});

const passwordAuthenticationForm = ref<PasswordAuthenticationRequest>({
    username: "Test1",
    password: "Llh123123",
    remember: false,
});


const showPassword = ref(false);

const handleAccountSelect = (selectedUsername: string | null): void => {
    console.log("Selected username:", selectedUsername);
    console.log("Form valid:", formRef.value?.isValid);
    if (selectedUsername) {
        passwordAuthenticationForm.value.username = selectedUsername;
        // const savedPassword = getSavedPasswordForUser(selectedUsername);
        // if (savedPassword) {
        //   passwordAuthenticationForm.password = savedPassword;
        // }
    }
};

const handleRemoveAccount = (username: string): void => {
    // 删除用户信息
    console.log(`Removing account: ${username}`);
};
const handleLocalLogin = async (): Promise<void> => {
    console.log("[useAuthentication]: handleLocalLogin");
    const response = await authenticationService.passwordAuthentication(
        passwordAuthenticationForm.value
    );
    if (response.success) {
        // 登录成功
        showSuccess("登录成功");
        // 跳转到首页
        // router.push("/summary");
        console.log("🚀！！[useAuthentication]: 登录成功", response.data);
    } else {
        // 登录失败
        showError(response.message);
    }
};

const rememberedUsernames = ref([]);
</script>

<style scoped>
.gap-2 {
    gap: 8px;
}
</style>
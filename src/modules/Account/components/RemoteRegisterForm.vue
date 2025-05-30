<template>
    <v-form ref="formRef" @submit.prevent="handleRemoteRegister" :loading="authStore.loading">
        <v-card class="pa-4">
            <v-card-title class="text-center">注册账号</v-card-title>

            <v-card-text>
                <v-alert v-if="authStore.error" type="error" variant="tonal" class="mb-4">
                    {{ authStore.error }}
                </v-alert>

                <v-text-field v-model="registerForm.username" label="用户名" :rules="usernameRules" required />

                <v-text-field v-model="registerForm.email" label="邮箱" type="email" :rules="emailRules" required />

                <v-text-field v-model="registerForm.password" label="密码" type="password" :rules="passwordRules" required />

                <v-text-field v-model="registerForm.confirmPassword" label="确认密码" type="password" :rules="[
                    v => !!v || '请确认密码',
                    v => v === registerForm.password || '两次输入的密码不一致'
                ]" required />
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn color="primary" type="submit" :loading="authStore.loading">
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
import { useAuthStore } from '../stores/authStore';

// composables
import { useUserAuth } from '../composables/useUserAuth';
// utils
import { usernameRules, passwordRules, emailRules } from '@/shared/utils/validations';
const { formRef, registerForm, snackbar, handleRemoteRegister } = useUserAuth();
const authStore = useAuthStore();




</script>
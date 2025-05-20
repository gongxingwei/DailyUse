<template>
    <v-form ref="formRef" @submit.prevent="handleRemoteRegister" :loading="authStore.loading">
        <v-card class="pa-4">
            <v-card-title class="text-center">注册账号</v-card-title>

            <v-card-text>
                <v-alert v-if="authStore.error" type="error" variant="tonal" class="mb-4">
                    {{ authStore.error }}
                </v-alert>

                <v-text-field v-model="registerForm.username" label="用户名" :rules="[
                    v => !!v || '请输入用户名',
                    v => v.length >= 3 || '用户名至少3个字符',
                    v => v.length <= 20 || '用户名最多20个字符',
                ]" required />

                <v-text-field v-model="registerForm.email" label="邮箱" type="email" :rules="[
                    v => !!v || '请输入邮箱',
                    v => /.+@.+\..+/.test(v) || '请输入有效的邮箱地址'
                ]" required />

                <v-text-field v-model="registerForm.password" label="密码" type="password" :rules="[
                    v => !!v || '请输入密码',
                    v => v.length >= 8 || '密码至少8个字符',
                    v => v.length <= 20 || '密码最多20个字符',
                    v => /[a-z]/.test(v) || '密码至少包含一个小写字母',
                    v => /[A-Z]/.test(v) || '密码至少包含一个大写字母',
                    v => /[0-9]/.test(v) || '密码至少包含一个数字',
                ]" required />

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

const { formRef, registerForm, snackbar, handleRemoteRegister } = useUserAuth();
const authStore = useAuthStore();




</script>
<template>
    <v-form @submit.prevent="handleSubmit" :loading="authStore.loading">
        <v-card class="pa-4">
            <v-card-title class="text-center">注册账号</v-card-title>
            
            <v-card-text>
                <v-alert
                    v-if="authStore.error"
                    type="error"
                    variant="tonal"
                    class="mb-4"
                >
                    {{ authStore.error }}
                </v-alert>

                <v-text-field
                    v-model="form.username"
                    label="用户名"
                    :rules="[v => !!v || '请输入用户名']"
                    required
                />

                <v-text-field
                    v-model="form.email"
                    label="邮箱"
                    type="email"
                    :rules="[
                        v => !!v || '请输入邮箱',
                        v => /.+@.+\..+/.test(v) || '请输入有效的邮箱地址'
                    ]"
                    required
                />

                <v-text-field
                    v-model="form.password"
                    label="密码"
                    type="password"
                    :rules="[v => !!v || '请输入密码']"
                    required
                />

                <v-text-field
                    v-model="form.confirmPassword"
                    label="确认密码"
                    type="password"
                    :rules="[
                        v => !!v || '请确认密码',
                        v => v === form.password || '两次输入的密码不一致'
                    ]"
                    required
                />
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn
                    color="primary"
                    type="submit"
                    :loading="authStore.loading"
                >
                    注册
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';
import type { IRegisterForm } from '../types/auth';

const authStore = useAuthStore();
const router = useRouter();

const form = reactive<IRegisterForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
});

async function handleSubmit() {
    if (await authStore.register(form)) {
        // 注册成功后跳转到登录页
        router.push({
            path: '/login',
            query: { 
                registered: 'true',
                username: form.username 
            }
        });
    }
}
</script>
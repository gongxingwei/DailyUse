<template>
    <v-form @submit.prevent="handleSubmit" :loading="authStore.loading">
        <v-card class="pa-4">
            <v-card-title class="text-center">在线账号登录</v-card-title>
            
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
                    v-model="form.password"
                    label="密码"
                    type="password"
                    :rules="[v => !!v || '请输入密码']"
                    required
                />

                <v-checkbox
                    v-model="form.remember"
                    label="记住我"
                />
            </v-card-text>

            <v-card-actions>
                <v-btn
                    color="primary"
                    type="submit"
                    :loading="authStore.loading"
                >
                    登录
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useAuthStore } from '../stores/authStore';

import type { ILoginForm } from '../types/auth';

const authStore = useAuthStore();


const form = reactive<ILoginForm>({
    username: '',
    password: '',
    remember: false,
});

async function handleSubmit() {

}


</script>
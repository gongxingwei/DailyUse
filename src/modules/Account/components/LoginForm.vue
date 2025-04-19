<template>
    <v-form @submit.prevent="handleSubmit" :loading="authStore.loading">
        <v-card class="pa-4">
            <v-alert
                v-if="isNewlyRegistered"
                type="success"
                class="mb-4"
            >
                注册成功！请使用您的账号密码登录
            </v-alert>
            <v-card-title class="text-center">登录</v-card-title>
            
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
                <v-btn to="/register">注册</v-btn>
                <v-spacer />
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
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRoute, useRouter } from 'vue-router';
import type { ILoginForm } from '../types/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive<ILoginForm>({
    username: '',
    password: '',
    remember: false,
});

async function handleSubmit() {
    if (await authStore.login(form)) {
        router.push('/');
    }
}

// 处理注册成功后的跳转
// 如果URL中包含registered=true，则显示注册成功的提示
const isNewlyRegistered = ref(false);
onMounted(() => {
    if (route.query.registered === 'true') {
        isNewlyRegistered.value = true;
        if (route.query.username) {
            form.username = route.query.username as string;
        }
    }
});
</script>
<template>
    <v-form ref="formRef" @submit.prevent="handleRemoteLogin" :loading="authStore.loading">
        <v-card class="pa-4">
            <v-card-title class="text-center">登录</v-card-title>

            <v-card-text>
                <v-combobox v-model="loginForm.username" :items="rememberedUsernames" item-title="username" label="用户名"
                    :rules="usernameRules" @update:model-value="handleAccountSelect" required>
                    <!-- 自定义下拉选项 -->
                    <template v-slot:item="{ item, props }">
                        <v-list-item v-bind="props" :title="item.raw">
                            <template v-slot:append>
                                <v-icon color="error" size="small" @click.stop="handleRemoveSavedAccount(item.raw)">
                                    mdi-close
                                </v-icon>
                            </template>
                        </v-list-item>
                    </template>
                </v-combobox>
                <v-text-field v-model="loginForm.password" label="密码" type="password" :rules="passwordRules"
                    required />
                <v-checkbox v-model="loginForm.remember" label="记住我" />
            </v-card-text>

            <v-card-actions>
                <v-btn color="primary" type="submit" :loading="authStore.loading">
                    登录
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
import { computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useUserAuth } from '../composables/useUserAuth';
// utils
import { usernameRules, passwordRules } from '@/shared/utils/validations';
const { rememberedUsers, formRef, loginForm, snackbar, handleRemoteLogin, handleAccountSelect, handleRemoveSavedAccount } = useUserAuth();
const authStore = useAuthStore();

const rememberedUsernames = computed(() =>
    rememberedUsers.value.filter(user => user.accountType === 'online').map(user => user.username)
);
</script>
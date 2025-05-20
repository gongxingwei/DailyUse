<template>
    <v-form ref="formRef" @submit.prevent="handleRemoteLogin" :loading="authStore.loading">
        <v-card class="pa-4">
            <v-card-title class="text-center">登录</v-card-title>

            <v-card-text>
                <v-combobox v-model="loginForm.username" :items="savedUsernames" item-title="username" label="用户名"
                    :rules="[v => !!v || '请输入用户名']" @update:model-value="handleAccountSelect" required>
                    <!-- 自定义下拉选项 -->
                    <template v-slot:item="{ item, props }">
                        <v-list-item v-bind="props" :title="item.raw">
                            <template v-slot:append>
                                <v-icon color="error" size="small"
                                    @click.stop="handleRemoveSavedAccount(item.raw)">
                                    mdi-close
                                </v-icon>
                            </template>
                        </v-list-item>
                    </template>
                </v-combobox>
                <v-text-field v-model="loginForm.password" label="密码" type="password" :rules="[v => !!v || '请输入密码']"
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
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useUserAuth } from '../composables/useUserAuth';

const { savedAccounts, formRef, loginForm, snackbar, handleRemoteLogin, handleAccountSelect, handleRemoveSavedAccount } = useUserAuth();
const authStore = useAuthStore();

const savedUsernames = ref<string[]>([]);

</script>
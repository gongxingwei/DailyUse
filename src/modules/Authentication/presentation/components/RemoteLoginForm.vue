<template>
    <v-form ref="formRef" @submit.prevent="handleRemoteLogin" :loading="accountStore.loading">
        <v-card class="pa-4">
            <!-- <v-card-title class="text-center">登录</v-card-title> -->

            <v-card-text>
                <v-combobox v-model="loginForm.username" :items="rememberedUsernames" item-title="username" label="用户名"
                    prepend-inner-icon="mdi-account" :loading="accountStore.loading"    
                    clearable :counter="20" 
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
                    prepend-inner-icon="mdi-lock" clearable :counter="20"
                    required />
                <v-checkbox v-model="loginForm.remember" label="记住我" />
            </v-card-text>

            <v-card-actions class="px-4 pb-4">
                <v-btn color="primary" type="submit" :loading="accountStore.loading" block>
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
import { useAccountStore } from '../../../Account/presentation/stores/accountStore';
import { useUserAuth } from '../../../Account/presentation/composables/useUserAuth';
// utils
import { usernameRules, passwordRules } from '../../../Account/validations/accountFormRules';
const { rememberedUsers, formRef, loginForm, snackbar, handleRemoteLogin, handleAccountSelect, handleRemoveSavedAccount } = useUserAuth();
const accountStore = useAccountStore();

const rememberedUsernames = computed(() =>
    rememberedUsers.value.filter(user => user.accountType === 'online').map(user => user.username)
);
</script>
<!-- filepath: /d:/myPrograms/DailyUse/src/modules/Account/components/LocalLoginForm.vue -->
<template>
    <v-form ref="formRef" @submit.prevent="handleLcoalLogin" :loading="authStore.loading">
        <v-card class="pa-4">
            <!-- <v-card-title class="text-center">登录</v-card-title> -->

            <v-card-text>
                <!-- 用户名下拉选择框 -->
                <v-combobox v-model="loginForm.username" :items="rememberedUsernames" :loading="isLoadingUsers"
                    label="用户名" :rules=usernameRules @update:model-value="handleAccountSelect" 
                    prepend-inner-icon="mdi-account"
                    density="comfortable"
                    clearable required>

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
                                            @click.stop="handleRemoveSavedAccount(item.raw)" class="ml-2">
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
                <v-text-field v-model="loginForm.password" label="密码" :rules=passwordRules
                    prepend-inner-icon="mdi-lock" clearable :counter="20" density="comfortable"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword = !showPassword" :type="showPassword ? 'text' : 'password'"
                    required />

                <!-- 记住密码选项 -->
                <v-checkbox v-model="loginForm.remember" label="记住密码" color="primary" density="comfortable" />
            </v-card-text>

            <v-card-actions class="px-4 pb-4">
                <v-btn color="primary" type="submit" :loading="authStore.loading" :disabled="!!loading" block
                    size="large">
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
import { computed, ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useUserAuth } from '../composables/useUserAuth';
// utils
import { usernameRules, passwordRules } from '@/shared/utils/validations';
// 组合式函数
const {
    formRef,
    loginForm,
    snackbar,
    loading,
    rememberedUsers,
    isLoadingUsers,
    handleLcoalLogin,
    handleAccountSelect,
    handleRemoveSavedAccount,
} = useUserAuth();

const authStore = useAuthStore();

// 本地状态
const showPassword = ref(false);

// 计算属性
const rememberedUsernames = computed(() =>
    rememberedUsers.value.filter(user => user.accountType === 'local').map(user => user.username)
);
</script>

<style scoped>
.gap-2 {
    gap: 8px;
}
</style>
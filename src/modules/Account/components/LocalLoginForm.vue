<!-- filepath: /d:/myPrograms/DailyUse/src/modules/Account/components/LocalLoginForm.vue -->
<template>
    <v-form ref="formRef" @submit.prevent="handleLcoalLogin" :loading="authStore.loading">
        <v-card class="pa-4">
            <v-card-title class="text-center">登录</v-card-title>

            <v-card-text>
                <!-- 用户名下拉选择框 -->
                <v-combobox 
                    v-model="loginForm.username" 
                    :items="rememberedUsernames" 
                    :loading="isLoadingUsers"
                    label="用户名"
                    :rules="[v => !!v || '请输入用户名']" 
                    @update:model-value="handleAccountSelect" 
                    clearable
                    required>
                    
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
                                        <v-icon 
                                            v-bind="tooltipProps"
                                            color="error" 
                                            size="small"
                                            @click.stop="handleRemoveSavedAccount(item.raw)"
                                            class="ml-2">
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
                <v-text-field 
                    v-model="loginForm.password" 
                    label="密码" 
                    :rules="[v => !!v || '请输入密码']"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword = !showPassword"
                    :type="showPassword ? 'text' : 'password'"
                    required />

                <!-- 记住密码选项 -->
                <v-checkbox 
                    v-model="loginForm.remember" 
                    label="记住密码" 
                    color="primary"
                    density="compact" />

                <!-- 快速登录按钮区域 -->
                <div v-if="rememberedUsers.length > 0" class="mt-4">
                    <v-divider class="mb-3" />
                    <p class="text-caption text-grey mb-2">快速登录:</p>
                    <div class="d-flex flex-wrap gap-2">
                        <v-chip
                            v-for="user in rememberedUsers"
                            :key="`${user.username}-${user.accountType}`"
                            :loading="loading === user.username"
                            :disabled="!!loading"
                            color="primary"
                            variant="outlined"
                            size="small"
                            clickable
                            @click="handleLocalQuickLogin(user)">
                            <v-icon start size="x-small">mdi-account</v-icon>
                            {{ user.username }}
                            <v-tooltip activator="parent" location="top">
                                <div>
                                    <div>用户: {{ user.username }}</div>
                                    <div>类型: {{ user.accountType === 'local' ? '本地账号' : '在线账号' }}</div>
                                    <div>最后登录: {{ formatLastLoginTime(user.lastLoginTime) }}</div>
                                </div>
                            </v-tooltip>
                        </v-chip>
                    </div>
                </div>
            </v-card-text>

            <v-card-actions class="px-4 pb-4">
                <v-btn 
                    color="primary" 
                    type="submit" 
                    :loading="authStore.loading"
                    :disabled="!!loading"
                    block
                    size="large">
                    登录
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-form>

    <!-- 提示信息 -->
    <v-snackbar 
        v-model="snackbar.show" 
        :color="snackbar.color" 
        :timeout="3000" 
        location="top" 
        variant="tonal"
        elevation="4">
        {{ snackbar.message }}
    </v-snackbar>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useUserAuth } from '../composables/useUserAuth';

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
    handleLocalQuickLogin 
} = useUserAuth();

const authStore = useAuthStore();

// 本地状态
const showPassword = ref(false);

// 计算属性
const rememberedUsernames = computed(() => 
    rememberedUsers.value.map(user => user.username)
);

/**
 * 格式化最后登录时间
 */
const formatLastLoginTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return '今天 ' + date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } else if (diffDays === 1) {
        return '昨天';
    } else if (diffDays < 30) {
        return `${diffDays}天前`;
    } else {
        return date.toLocaleDateString('zh-CN');
    }
};
</script>

<style scoped>
.gap-2 {
    gap: 8px;
}
</style>
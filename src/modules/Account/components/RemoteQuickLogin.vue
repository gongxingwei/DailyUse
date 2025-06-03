<template>
    <v-card class="pa-4 pt-0" elevation="2">
        <!-- <v-card-title class="text-center d-flex align-center justify-center">
            <v-icon class="mr-2" color="primary">mdi-flash</v-icon>
            快速登录
        </v-card-title> -->

        <v-card-text>
            <!-- 无可用账户时显示 -->
            <v-alert v-if="!loading && remoteUsers.length === 0" type="info" variant="tonal" class="mb-4">
                <template v-slot:prepend>
                    <v-icon>mdi-information</v-icon>
                </template>
                <div class="text-body-2">
                    暂无保存的远程账户凭证
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                    请先使用账号密码登录并勾选"记住我"
                </div>
            </v-alert>

            <!-- 远程账户列表 -->
            <div v-else>
                <v-list class="pa-0" density="compact">
                    <v-list-subheader class="text-caption">
                        选择要快速登录的账户
                    </v-list-subheader>

                    <v-list-item v-for="user in remoteUsers" :key="`${user.username}-${user.accountType}`" class="mb-2"
                        @click="handleQuickLogin(user.username)" :disabled="!!loading"
                        :loading="loading === user.username" rounded="lg" variant="outlined">
                        <template v-slot:prepend>
                            <v-avatar size="32" color="primary" variant="tonal">
                                <v-icon size="16">mdi-account-circle</v-icon>
                            </v-avatar>
                        </template>

                        <v-list-item-title class="text-body-2 font-weight-medium">
                            {{ user.username }}
                        </v-list-item-title>

                        <v-list-item-subtitle class="text-caption">
                            <v-chip size="x-small" color="success" variant="flat" class="mr-1">
                                远程账户
                            </v-chip>
                            <span class="text-medium-emphasis">
                                {{ formatLastLoginTime(user.lastLoginTime) }}
                            </span>
                        </v-list-item-subtitle>

                        <template v-slot:append>
                            <!-- 自动登录标识 -->
                            <v-tooltip v-if="user.autoLogin" location="top">
                                <template v-slot:activator="{ props }">
                                    <v-icon v-bind="props" size="16" color="success" class="mr-2">
                                        mdi-auto-fix
                                    </v-icon>
                                </template>
                                <span>自动登录已启用</span>
                            </v-tooltip>

                            <!-- 快速登录按钮 -->
                            <v-btn size="small" variant="flat" color="primary" :loading="loading === user.username"
                                @click.stop="handleQuickLogin(user.username)">
                                <v-icon size="16">mdi-login</v-icon>
                                <span class="ml-1">登录</span>
                            </v-btn>

                            <!-- 删除按钮 -->
                            <v-btn size="small" variant="text" color="error" icon="mdi-close" class="ml-1"
                                @click.stop="handleRemoveAccount(user.username, user.accountType)"
                                :disabled="!!loading" />
                        </template>
                    </v-list-item>
                </v-list>

                <!-- 操作按钮 -->
                <v-divider class="my-3" />

                <div class="d-flex justify-space-between align-center">
                    <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-refresh"
                        @click="refreshRemoteUsers" :loading="refreshing">
                        刷新列表
                    </v-btn>

                    <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete-sweep"
                        @click="handleClearAllRemoteAccounts" :disabled="!!loading || remoteUsers.length === 0">
                        清除全部
                    </v-btn>
                </div>
            </div>
        </v-card-text>

        <!-- 确认删除对话框 -->
        <v-dialog v-model="confirmDialog.show" max-width="400">
            <v-card>
                <v-card-title class="text-h6">
                    {{ confirmDialog.title }}
                </v-card-title>
                <v-card-text>
                    {{ confirmDialog.message }}
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="confirmDialog.show = false">
                        取消
                    </v-btn>
                    <v-btn color="error" variant="flat" @click="confirmDialog.action" :loading="confirmDialog.loading">
                        确认
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 弹窗提醒 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top" variant="tonal"
            elevation="4">
            {{ snackbar.message }}
        </v-snackbar>
    </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserAuth } from '../composables/useUserAuth';
import { loginSessionService} from '../services/loginSessionService';

// 使用 useUserAuth 的状态和方法
const { rememberedUsers, snackbar, loadRememberedUsers, handleRemoteQuickLogin } = useUserAuth();

// 组件内部状态
const loading = ref<string>(''); // 当前正在登录的用户名
const refreshing = ref(false);


// 确认对话框状态
const confirmDialog = ref({
    show: false,
    title: '',
    message: '',
    action: () => { },
    loading: false,
});

// 计算属性：筛选出远程账户
const remoteUsers = computed(() => {
    return rememberedUsers.value.filter(user => user.accountType === 'online');
});

/**
 * 格式化最后登录时间
 */
const formatLastLoginTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return new Date(timestamp).toLocaleDateString();
};



/**
 * 刷新远程用户列表
 */
const refreshRemoteUsers = async () => {
    refreshing.value = true;
    try {
        await loadRememberedUsers();
        snackbar.message = '远程用户列表已刷新';
        snackbar.color = 'success';
        snackbar.show = true;
    } finally {
        refreshing.value = false;
    }
};

/**
 * 处理快速登录
 */
const handleQuickLogin = async (username: string) => {
    loading.value = username;
    try {
        // 调用 useUserAuth 中的远程快速登录方法
        await handleRemoteQuickLogin(username, 'online');

        // 刷新用户列表（更新最后登录时间）
        await loadRememberedUsers();
    } catch (error) {
        console.error('快速登录失败:', error);
        snackbar.message = '快速登录失败，请稍后重试';
        snackbar.color = 'error';
        snackbar.show = true;
    } finally {
        loading.value = '';
    }
};

/**
 * 删除单个账户
 */
const handleRemoveAccount = (username: string, accountType: string) => {
    confirmDialog.value = {
        show: true,
        title: '删除账户凭证',
        message: `确定要删除用户 "${username}" 的登录凭证吗？删除后将无法快速登录该账户。`,
        action: async () => {
            confirmDialog.value.loading = true;
            try {
                const result = await loginSessionService.removeSession(username, accountType);
                if (result.success) {
                    await loadRememberedUsers();
                    snackbar.message = '账户凭证已删除';
                    snackbar.color = 'success';
                    snackbar.show = true;
                } else {
                    throw new Error(result.message || '删除失败');
                }
            } catch (error) {
                console.error('删除账户失败:', error);
                snackbar.message = '删除账户凭证失败，请稍后重试';
                snackbar.color = 'error';
                snackbar.show = true;
            } finally {
                confirmDialog.value.loading = false;
                confirmDialog.value.show = false;
            }
        },
        loading: false,
    };
};

/**
 * 清除所有远程账户凭证
 */
const handleClearAllRemoteAccounts = () => {
    confirmDialog.value = {
        show: true,
        title: '清除全部远程账户',
        message: `确定要清除所有 ${remoteUsers.value.length} 个远程账户的登录凭证吗？此操作不可撤销。`,
        action: async () => {
            confirmDialog.value.loading = true;
            try {
                const remoteSessions = remoteUsers.value.map(user => ({
                    username: user.username,
                    accountType: user.accountType,
                }));

                const result = await loginSessionService.batchRemoveSessions(remoteSessions);
                if (result.success) {
                    await loadRememberedUsers();
                    snackbar.message = '所有远程账户凭证已清除';
                    snackbar.color = 'success';
                    snackbar.show = true;
                } else {
                    throw new Error(result.message || '清除失败');
                }
            } catch (error) {
                console.error('清除所有远程账户失败:', error);
                snackbar.message = '清除远程账户凭证失败，请稍后重试';
                snackbar.color = 'error';
                snackbar.show = true;
            } finally {
                confirmDialog.value.loading = false;
                confirmDialog.value.show = false;
            }
        },
        loading: false,
    };
};

// 组件挂载时加载数据
onMounted(async () => {
    await loadRememberedUsers();

});

// 暴露给父组件的方法
defineExpose({
    refreshRemoteUsers,
    loadRememberedUsers,
});
</script>

<style scoped>
.v-list-item {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    transition: all 0.2s ease;
}

.v-list-item:hover {
    background-color: rgba(var(--v-theme-primary), 0.04);
    border-color: rgba(var(--v-theme-primary), 0.2);
}

.v-list-item--disabled {
    opacity: 0.6;
}
</style>
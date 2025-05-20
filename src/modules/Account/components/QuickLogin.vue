<template>
    <v-container>
        <v-row justify="center" align="center" class="quick-login-container">
            <!-- 账号列表 -->
            <v-col cols="12">
                <v-row v-if="rememberedAccounts.length > 0" justify="center" align="center" class="account-list">
                    <v-col v-for="account in rememberedAccounts" :key="account.username" cols="auto"
                        class="text-center mx-4">
                        <v-hover v-slot="{ isHovering, props }">
                            <div v-bind="props" class="account-wrapper">
                                <v-avatar :color="isHovering ? 'primary' : 'grey'" size="80" class="mb-2 cursor-pointer"
                                    @click="handleLocalQuickLogin(account)" :loading="loading === account.username">
                                    <v-img v-if="account.avatar" :src="account.avatar" />
                                    <span v-else class="text-h4">{{ account.username.charAt(0).toUpperCase() }}</span>
                                </v-avatar>

                                <!-- 菜单按钮 -->
                                <v-btn icon="mdi-dots-vertical-circle" color="blue" size="small" variant="text" class="menu-button"
                                    @click.stop>
                                    <v-menu activator="parent" :close-on-content-click="true">
                                        <v-list>
                                            <v-list-item @click="handleRemoveSavedAccount(account.username)"
                                                prepend-icon="mdi-delete" color="error" title="删除账号" />
                                        </v-list>
                                    </v-menu>
                                </v-btn>

                                <div class="text-subtitle-1">{{ account.username }}</div>
                            </div>
                        </v-hover>
                    </v-col>
                </v-row>
                <v-row v-else justify="center" align="center">
                    <v-col cols="auto">
                        <v-alert type="info" class="text-center">
                            还没有保存的账号，请先登录。
                        </v-alert>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>

        <!-- 弹窗提醒 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top" variant="tonal"
            elevation="4">
            {{ snackbar.message }}
        </v-snackbar>
    </v-container>
</template>

<script setup lang="ts">

// services
// composables
import { useUserAuth } from '../composables/useUserAuth';

const { rememberedAccounts, loading, snackbar, handleLocalQuickLogin, handleRemoveSavedAccount } = useUserAuth();
</script>

<style scoped>
.quick-login-container {
    min-height: 300px;
}

.account-list {
    gap: 2rem;
}

.cursor-pointer {
    cursor: pointer;
}

.v-avatar {
    transition: transform 0.2s;
}

.v-avatar:hover {
    transform: scale(1.1);
}
</style>
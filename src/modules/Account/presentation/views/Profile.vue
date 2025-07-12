<template>
    <div class="profile-page">
        <!-- 页面头部 -->
        <div class="profile-header">
            <div class="d-flex align-center mb-6">
                <v-avatar size="56" color="primary" variant="tonal" class="mr-4">
                    <v-icon size="32">mdi-account-circle</v-icon>
                </v-avatar>
                <div>
                    <h1 class="text-h4 font-weight-bold text-primary mb-1">个人中心</h1>
                    <p class="text-subtitle-1 text-medium-emphasis mb-0">
                        管理您的个人信息和应用数据
                    </p>
                </div>
            </div>
        </div>

        <v-container fluid class="pa-0">
            <v-row class="ma-0">
                <!-- 个人资料卡片 -->
                <v-col cols="12" lg="6" class="pa-2">
                    <v-card class="profile-card" elevation="2">
                        <v-card-title class="profile-card-header">
                            <div class="d-flex align-center">
                                <v-icon color="primary" size="24" class="mr-3">mdi-account-edit</v-icon>
                                <span class="text-h6 font-weight-bold">个人资料</span>
                            </div>
                        </v-card-title>

                        <v-divider />

                        <v-card-text class="pa-6">
                            <!-- 头像区域 -->
                            <div class="avatar-section">
                                <div class="avatar-container">
                                    <v-avatar size="120" class="avatar-main" color="surface-bright">
                                        <v-img v-if="user?.avatar" :src="user.avatar" cover class="avatar-image" />
                                        <v-icon v-else size="64" color="primary">
                                            mdi-account
                                        </v-icon>
                                    </v-avatar>

                                    <!-- 头像上传按钮 -->
                                    <v-btn icon="mdi-camera" size="small" color="primary" variant="elevated"
                                        class="avatar-edit-btn" @click="uploadAvatar">
                                        <v-icon size="16">mdi-camera</v-icon>
                                        <v-tooltip activator="parent" location="bottom">
                                            更换头像
                                        </v-tooltip>
                                    </v-btn>
                                </div>

                                <!-- 用户状态 -->
                                <div class="user-status mt-4">
                                    <v-chip color="success" variant="tonal" size="small"
                                        prepend-icon="mdi-check-circle">
                                        已验证
                                    </v-chip>
                                </div>
                            </div>

                            <!-- 用户信息展示 -->
                            <div class="user-info-display mt-6">
                                <!-- 用户名 -->
                                <div class="info-item">
                                    <div class="info-label">
                                        <v-icon color="medium-emphasis" size="20" class="mr-2">mdi-account</v-icon>
                                        <span class="text-body-2 text-medium-emphasis">用户名</span>
                                    </div>
                                    <div class="info-value">
                                        <span class="text-body-1 font-weight-medium">{{ user?.username || '未设置'
                                            }}</span>
                                    </div>
                                </div>

                                <v-divider class="my-3" />

                                <!-- 邮箱 -->
                                <div class="info-item">
                                    <div class="info-label">
                                        <v-icon color="medium-emphasis" size="20" class="mr-2">mdi-email</v-icon>
                                        <span class="text-body-2 text-medium-emphasis">邮箱地址</span>
                                    </div>
                                    <div class="info-value">
                                        <span class="text-body-1 font-weight-medium">{{ user?.email || '未设置' }}</span>
                                    </div>
                                </div>

                                <v-divider class="my-3" />

                                <!-- 手机号 -->
                                <div class="info-item">
                                    <div class="info-label">
                                        <v-icon color="medium-emphasis" size="20" class="mr-2">mdi-phone</v-icon>
                                        <span class="text-body-2 text-medium-emphasis">手机号码</span>
                                    </div>
                                    <div class="info-value">
                                        <span class="text-body-1 font-weight-medium">{{ user?.phone || '未设置' }}</span>
                                    </div>
                                </div>

                                <v-divider class="my-3" />

                                <!-- 个人简介 -->
                                <div class="info-item">
                                    <div class="info-label">
                                        <v-icon color="medium-emphasis" size="20" class="mr-2">mdi-text</v-icon>
                                        <span class="text-body-2 text-medium-emphasis">个人简介</span>
                                    </div>
                                    <div class="info-value">
                                        <span class="text-body-1 font-weight-medium">
                                            {{ user?.bio || '这个人很懒，什么都没有留下...' }}
                                        </span>
                                    </div>
                                </div>

                                <v-divider class="my-3" />

                                <!-- 注册时间 -->
                                <div class="info-item">
                                    <div class="info-label">
                                        <v-icon color="medium-emphasis" size="20"
                                            class="mr-2">mdi-calendar-clock</v-icon>
                                        <span class="text-body-2 text-medium-emphasis">注册时间</span>
                                    </div>
                                    <div class="info-value">
                                        <span class="text-body-1 font-weight-medium">
                                            {{ user?.createdAt ? formatDate(new Date(user.createdAt).toString()) : '未知' }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- 编辑按钮 -->
                            <div class="edit-section mt-6">
                                <v-btn color="primary" size="large" block variant="elevated" class="text-none"
                                    @click="openEditDialog">
                                    <v-icon start>mdi-pencil</v-icon>
                                    编辑个人信息
                                </v-btn>
                            </div>
                        </v-card-text>

                        <!-- 账号管理操作 -->
                        <v-divider />
                        <v-card-actions class="pa-4">
                            <v-spacer />
                            <v-btn color="info" variant="outlined" prepend-icon="mdi-account-switch"
                                @click="switchAccount" :loading="switching" class="mr-2">
                                切换账号
                            </v-btn>
                            <v-btn color="error" variant="outlined" prepend-icon="mdi-logout" @click="confirmLogout"
                                :loading="loggingOut">
                                退出登录
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>

                <!-- 数据管理卡片 -->
                <v-col cols="12" lg="6" class="pa-2">
                    <v-card class="data-card" elevation="2">
                        <v-card-title class="data-card-header">
                            <div class="d-flex align-center">
                                <v-icon color="primary" size="24" class="mr-3">mdi-database</v-icon>
                                <span class="text-h6 font-weight-bold">数据管理</span>
                            </div>
                        </v-card-title>

                        <v-divider />

                        <v-card-text class="pa-6">
                            <!-- 数据统计 -->
                            <div class="data-stats mb-6">
                                <v-alert type="info" variant="tonal" class="mb-4" icon="mdi-information">
                                    <div class="text-subtitle-2 mb-2">数据概览</div>
                                    <div class="d-flex justify-space-between">
                                        <span>存储大小: <strong>2.4 MB</strong></span>
                                        <span>最后备份: <strong>2天前</strong></span>
                                    </div>
                                </v-alert>
                            </div>

                            <!-- 数据操作列表 -->
                            <v-list class="data-operations" lines="two">
                                <!-- 导出数据 -->
                                <v-list-item class="data-operation-item">
                                    <template v-slot:prepend>
                                        <v-avatar color="success" variant="tonal" size="40">
                                            <v-icon color="success">mdi-download</v-icon>
                                        </v-avatar>
                                    </template>

                                    <v-list-item-title class="font-weight-medium">
                                        导出用户数据
                                    </v-list-item-title>
                                    <v-list-item-subtitle class="text-medium-emphasis">
                                        将您的所有数据导出为 JSON 文件
                                    </v-list-item-subtitle>

                                    <template v-slot:append>
                                        <v-btn color="success" variant="elevated" size="small" @click="exportUserData"
                                            :loading="exporting" class="text-none">
                                            <v-icon start size="16">mdi-download</v-icon>
                                            导出
                                        </v-btn>
                                    </template>
                                </v-list-item>

                                <v-divider class="my-2" />

                                <!-- 导入数据 -->
                                <v-list-item class="data-operation-item">
                                    <template v-slot:prepend>
                                        <v-avatar color="info" variant="tonal" size="40">
                                            <v-icon color="info">mdi-upload</v-icon>
                                        </v-avatar>
                                    </template>

                                    <v-list-item-title class="font-weight-medium">
                                        导入用户数据
                                    </v-list-item-title>
                                    <v-list-item-subtitle class="text-medium-emphasis">
                                        从备份文件恢复您的数据
                                    </v-list-item-subtitle>

                                    <template v-slot:append>
                                        <v-btn color="info" variant="elevated" size="small" @click="importUserData"
                                            :loading="importing" class="text-none">
                                            <v-icon start size="16">mdi-upload</v-icon>
                                            导入
                                        </v-btn>
                                    </template>
                                </v-list-item>

                                <v-divider class="my-2" />

                                <!-- 清除数据 -->
                                <v-list-item class="data-operation-item danger-item">
                                    <template v-slot:prepend>
                                        <v-avatar color="error" variant="tonal" size="40">
                                            <v-icon color="error">mdi-delete-alert</v-icon>
                                        </v-avatar>
                                    </template>

                                    <v-list-item-title class="font-weight-medium text-error">
                                        清除所有数据
                                    </v-list-item-title>
                                    <v-list-item-subtitle class="text-medium-emphasis">
                                        永久删除所有应用数据，无法恢复
                                    </v-list-item-subtitle>

                                    <template v-slot:append>
                                        <v-btn color="error" variant="elevated" size="small" @click="confirmClearData"
                                            :loading="clearing" class="text-none">
                                            <v-icon start size="16">mdi-delete</v-icon>
                                            清除
                                        </v-btn>
                                    </template>
                                </v-list-item>
                            </v-list>

                            <!-- 安全提示 -->
                            <v-alert type="warning" variant="tonal" class="mt-4" icon="mdi-shield-alert">
                                <div class="text-caption">
                                    <strong>安全提示：</strong> 请定期备份您的数据，清除操作不可逆转。
                                </div>
                            </v-alert>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>

        <!-- 编辑个人信息对话框 -->
        <v-dialog v-model="editDialog" max-width="500" persistent>
            <v-card class="edit-dialog-card">
                <v-card-title class="edit-dialog-header">
                    <div class="d-flex align-center">
                        <v-icon color="primary" size="24" class="mr-3">mdi-account-edit</v-icon>
                        <span class="text-h6 font-weight-bold">编辑个人信息</span>
                    </div>
                </v-card-title>

                <v-divider />

                <v-card-text class="pa-6">
                    <v-form ref="editForm" @submit.prevent="updateProfile">
                        <v-text-field v-model="profileForm.username" label="用户名" prepend-inner-icon="mdi-account"
                            readonly variant="outlined" color="primary" class="mb-4" bg-color="surface-variant">
                            <template v-slot:append-inner>
                                <v-icon color="medium-emphasis" size="20">mdi-lock</v-icon>
                            </template>
                        </v-text-field>

                        <v-text-field v-model="profileForm.email" label="邮箱地址" prepend-inner-icon="mdi-email"
                            type="email" variant="outlined" color="primary" class="mb-4" :rules="emailRules" />

                        <v-text-field v-model="profileForm.phone" label="手机号码" prepend-inner-icon="mdi-phone"
                            variant="outlined" color="primary" class="mb-4" placeholder="请输入手机号" />

                        <v-textarea v-model="profileForm.bio" label="个人简介" prepend-inner-icon="mdi-text"
                            variant="outlined" color="primary" rows="3" no-resize placeholder="介绍一下自己..." />
                    </v-form>
                </v-card-text>

                <v-card-actions class="pa-4">
                    <v-spacer />
                    <v-btn color="surface-variant" variant="outlined" @click="closeEditDialog" class="text-none mr-2">
                        取消
                    </v-btn>
                    <v-btn color="primary" variant="elevated" @click="updateProfile" :loading="updating"
                        class="text-none">
                        <v-icon start>mdi-content-save</v-icon>
                        保存
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 确认对话框 -->
        <v-dialog v-model="dialog.show" max-width="460" persistent>
            <v-card class="dialog-card">
                <v-card-title class="dialog-header">
                    <div class="d-flex align-center">
                        <v-icon :color="dialog.confirmColor" size="24" class="mr-3">
                            {{ getDialogIcon(dialog.confirmColor) }}
                        </v-icon>
                        <span class="text-h6 font-weight-bold">{{ dialog.title }}</span>
                    </div>
                </v-card-title>

                <v-divider />

                <v-card-text class="pa-6">
                    <p class="text-body-1 mb-0">{{ dialog.message }}</p>
                </v-card-text>

                <v-card-actions class="pa-4">
                    <v-spacer />
                    <v-btn color="surface-variant" variant="outlined" @click="dialog.show = false"
                        class="text-none mr-2">
                        取消
                    </v-btn>
                    <v-btn :color="dialog.confirmColor" variant="elevated" @click="dialog.onConfirm" class="text-none">
                        确认
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 成功/错误提示 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000" location="top" variant="elevated"
            elevation="6" class="custom-snackbar">
            <div class="d-flex align-center">
                <v-icon :color="snackbar.color === 'error' ? 'white' : 'white'" size="20" class="mr-2">
                    {{ getSnackbarIcon(snackbar.color) }}
                </v-icon>
                <span class="font-weight-medium">{{ snackbar.message }}</span>
            </div>

            <template v-slot:actions>
                <v-btn color="white" variant="text" @click="snackbar.show = false" icon="mdi-close" size="small" />
            </template>
        </v-snackbar>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAccountManagement } from '../presentation/composables/useAccountManagement'
import { useAccountStore } from '../presentation/stores/accountStore'

const accountStore = useAccountStore();

const {
    exporting,
    importing,
    clearing,
    switching,
    loggingOut,
    profileForm,
    dialog,
    snackbar,
    initUserData,
    exportUserData,
    importUserData,
    confirmClearData,
    switchAccount,
    confirmLogout
} = useAccountManagement()

// 新增状态
const editDialog = ref(false)
const updating = ref(false)
const editForm = ref()
const user = computed(() => accountStore.currentUser)
console.log('user:', user.value)
// 邮箱验证规则
const emailRules = [
    (v: string) => !!v || '邮箱不能为空',
    (v: string) => /.+@.+\..+/.test(v) || '邮箱格式不正确',
]

// 打开编辑对话框
const openEditDialog = () => {
    // 初始化表单数据
    profileForm.username = profileForm.username || '未设置'
    profileForm.email = profileForm.email || '未设置'
    profileForm.phone = profileForm.phone || '未设置'
    profileForm.bio = profileForm.bio || '这个人很懒，什么都没有留下...'

    editDialog.value = true
}

// 关闭编辑对话框
const closeEditDialog = () => {
    editDialog.value = false
    // 重置表单
    if (editForm.value) {
        editForm.value.reset()
    }
}

// 更新个人资料
const updateProfile = async () => {
    updating.value = true
    try {
        // 这里实现更新逻辑
        console.log('更新个人资料:', profileForm)

        // 模拟 API 调用
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 更新成功后关闭对话框并显示成功消息
        editDialog.value = false
        snackbar.message = '个人资料更新成功'
        snackbar.color = 'success'
        snackbar.show = true

        // 刷新用户数据
        await initUserData()
    } catch (error) {
        snackbar.message = '更新个人资料失败，请稍后再试'
        snackbar.color = 'error'
        snackbar.show = true
    } finally {
        updating.value = false
    }
}

// 上传头像
const uploadAvatar = () => {
    // 实现头像上传逻辑
    console.log('上传头像')
}

// 格式化日期
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

// 获取对话框图标
const getDialogIcon = (color: string) => {
    switch (color) {
        case 'error': return 'mdi-alert-circle'
        case 'warning': return 'mdi-alert'
        case 'info': return 'mdi-information'
        default: return 'mdi-help-circle'
    }
}

// 获取提示条图标
const getSnackbarIcon = (color: string) => {
    switch (color) {
        case 'success': return 'mdi-check-circle'
        case 'error': return 'mdi-alert-circle'
        case 'warning': return 'mdi-alert'
        case 'info': return 'mdi-information'
        default: return 'mdi-information'
    }
}

onMounted(() => {
    initUserData()
})
</script>

<style scoped>
.profile-page {
    padding: 2rem;
    background: linear-gradient(135deg,
            rgba(var(--v-theme-primary), 0.02) 0%,
            rgba(var(--v-theme-surface), 1) 100%);
}

.profile-header {
    background: linear-gradient(135deg,
            rgba(var(--v-theme-primary), 0.05) 0%,
            rgba(var(--v-theme-secondary), 0.05) 100%);
    border-radius: 20px;
    padding: 2rem;
    margin-bottom: 2rem;
    border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.profile-card,
.data-card {
    border-radius: 16px;
    border: 1px solid rgba(var(--v-theme-outline), 0.12);
    background: rgb(var(--v-theme-surface));
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}

.profile-card:hover,
.data-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}

.profile-card-header,
.data-card-header {
    background: linear-gradient(135deg,
            rgba(var(--v-theme-primary), 0.05) 0%,
            rgba(var(--v-theme-primary), 0.02) 100%);
    padding: 1.5rem;
}

/* 头像部分 */
.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.avatar-container {
    position: relative;
    display: inline-block;
}

.avatar-main {
    border: 4px solid rgba(var(--v-theme-primary), 0.1);
    transition: all 0.3s ease;
}

.avatar-main:hover {
    border-color: rgba(var(--v-theme-primary), 0.3);
    transform: scale(1.02);
}

.avatar-image {
    border-radius: 50%;
}

.avatar-edit-btn {
    position: absolute;
    bottom: 8px;
    right: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.user-status {
    display: flex;
    justify-content: center;
}

/* 用户信息展示 */
.user-info-display {
    background: rgba(var(--v-theme-surface-variant), 0.3);
    border-radius: 12px;
    padding: 1.5rem;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.info-label {
    display: flex;
    align-items: center;
}

.info-value {
    padding-left: 28px;
}

/* 数据管理 */
.data-stats {
    border-radius: 12px;
}

.data-operations {
    background: transparent;
    border-radius: 12px;
}

.data-operation-item {
    border-radius: 12px;
    margin-bottom: 8px;
    padding: 16px;
    transition: all 0.2s ease;
    background: rgba(var(--v-theme-surface-variant), 0.3);
}

.data-operation-item:hover {
    background: rgba(var(--v-theme-surface-variant), 0.5);
    transform: translateX(4px);
}

.danger-item {
    background: rgba(var(--v-theme-error), 0.04);
}

.danger-item:hover {
    background: rgba(var(--v-theme-error), 0.08);
}

/* 对话框 */
.dialog-card,
.edit-dialog-card {
    border-radius: 16px;
    overflow: hidden;
}

.dialog-header,
.edit-dialog-header {
    background: rgba(var(--v-theme-surface-variant), 0.5);
    padding: 1.5rem;
}

/* 提示条 */
.custom-snackbar {
    border-radius: 12px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .profile-page {
        padding: 1rem;
    }

    .profile-header {
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }
}

@media (max-width: 768px) {
    .profile-page {
        padding: 0.5rem;
    }

    .profile-header {
        padding: 1rem;
        margin-bottom: 1rem;
    }

    .avatar-main {
        width: 100px !important;
        height: 100px !important;
    }

    .data-operation-item {
        padding: 12px;
    }

    .user-info-display {
        padding: 1rem;
    }
}

@media (max-width: 600px) {
    .profile-header .d-flex {
        flex-direction: column;
        text-align: center;
    }

    .profile-header .mr-4 {
        margin-right: 0 !important;
        margin-bottom: 1rem;
    }

    .info-value {
        padding-left: 16px;
    }
}
</style>
<template>
    <v-container>
        <v-row>
            <!-- 用户基本信息 -->
            <v-col cols="12" md="6">
                <v-card>
                    <v-card-title class="text-h5">个人资料</v-card-title>
                    <v-card-text>
                        <v-form @submit.prevent="">
                            <v-avatar size="150" class="mb-4">
                                <v-img v-if="user?.avatar" :src="user.avatar" />
                                <v-icon v-else size="150">mdi-account-circle</v-icon>
                            </v-avatar>

                            <v-text-field v-model="profileForm.username" label="用户名" readonly outlined />

                            <v-text-field v-model="profileForm.email" label="邮箱" outlined />

                            <v-btn color="primary" type="submit" :loading="loading">
                                更新资料
                            </v-btn>
                        </v-form>
                    </v-card-text>
                    <!-- 添加账号管理按钮组 -->
                    <v-card-actions>
                        <v-spacer />
                        <v-btn color="primary" variant="text" prepend-icon="mdi-account-switch" @click="switchAccount"
                            :loading="switching">
                            切换账号
                        </v-btn>
                        <v-btn color="error" variant="text" prepend-icon="mdi-logout" @click="confirmLogout"
                            :loading="loggingOut">
                            退出登录
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <!-- 数据管理 -->
            <v-col cols="12" md="6">
                <v-card>
                    <v-card-title class="text-h5">数据管理</v-card-title>
                    <v-card-text>
                        <v-list>
                            <v-list-item>
                                <v-list-item-title>导出用户数据</v-list-item-title>
                                <v-list-item-action>
                                    <v-btn color="primary" @click="exportUserData" :loading="exporting">
                                        导出
                                    </v-btn>
                                </v-list-item-action>
                            </v-list-item>

                            <v-list-item>
                                <v-list-item-title>导入用户数据</v-list-item-title>
                                <v-list-item-action>
                                    <v-btn color="secondary" @click="importUserData" :loading="importing">
                                        导入
                                    </v-btn>
                                </v-list-item-action>
                            </v-list-item>

                            <v-list-item>
                                <v-list-item-title class="text-error">清除所有数据</v-list-item-title>
                                <v-list-item-action>
                                    <v-btn color="error" @click="confirmClearData" :loading="clearing">
                                        清除
                                    </v-btn>
                                </v-list-item-action>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- 确认对话框 -->
        <v-dialog v-model="dialog.show" max-width="400">
            <v-card>
                <v-card-title>{{ dialog.title }}</v-card-title>
                <v-card-text>{{ dialog.message }}</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn color="grey darken-1" @click="dialog.show = false">
                        取消
                    </v-btn>
                    <v-btn :color="dialog.confirmColor" @click="dialog.onConfirm">
                        确认
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAccountManagement } from '../composables/useAccountManagement'

const {
  user,
  loading,
  exporting,
  importing,
  clearing,
  switching,
  loggingOut,
  profileForm,
  dialog,
  initUserData,
  exportUserData,
  importUserData,
  confirmClearData,
  switchAccount,
  confirmLogout
} = useAccountManagement()

onMounted(() => {
  initUserData()
})
</script>

<style scoped>
.v-avatar {
    margin: 0 auto;
    display: block;
}
</style>
<template>
  <v-card class="account-management" elevation="2">
    <v-card-title class="text-h5">
      <v-icon icon="mdi-account-cog" class="mr-2" />
      账号管理
    </v-card-title>

    <v-card-text>
      <!-- 当前用户信息 -->
      <div v-if="currentUser" class="user-info mb-6">
        <v-row align="center" class="mb-4">
          <v-col cols="auto">
            <v-avatar size="64" color="primary">
              <v-img
                v-if="currentUser.avatar"
                :src="currentUser.avatar"
                :alt="currentUser.username"
              />
              <v-icon
                v-else
                icon="mdi-account"
                size="32"
              />
            </v-avatar>
          </v-col>
          
          <v-col>
            <h3 class="text-h6 mb-1">{{ currentUser.username }}</h3>
            <v-chip
              :color="getStatusColor(currentUser.status)"
              size="small"
              class="mb-1"
            >
              {{ getStatusText(currentUser.status) }}
            </v-chip>
            <div class="text-caption text-medium-emphasis">
              账号类型: {{ getAccountTypeText(currentUser.accountType) }}
            </div>
          </v-col>
        </v-row>

        <!-- 用户详细信息 -->
        <v-expansion-panels variant="accordion">
          <v-expansion-panel title="详细信息">
            <v-expansion-panel-text>
              <v-list>
                <v-list-item v-if="currentUser.email">
                  <template #prepend>
                    <v-icon icon="mdi-email" />
                  </template>
                  <v-list-item-title>邮箱</v-list-item-title>
                  <v-list-item-subtitle>{{ currentUser.email }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="currentUser.phone">
                  <template #prepend>
                    <v-icon icon="mdi-phone" />
                  </template>
                  <v-list-item-title>手机号</v-list-item-title>
                  <v-list-item-subtitle>{{ currentUser.phone }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon icon="mdi-calendar-plus" />
                  </template>
                  <v-list-item-title>注册时间</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(currentUser.createdAt) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="currentUser.lastLoginAt">
                  <template #prepend>
                    <v-icon icon="mdi-login" />
                  </template>
                  <v-list-item-title>最后登录</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(currentUser.lastLoginAt) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- 用户信息编辑表单 -->
      <v-expansion-panels v-model="editPanel" variant="accordion" class="mb-4">
        <v-expansion-panel title="编辑个人信息">
          <v-expansion-panel-text>
            <v-form ref="editFormRef" v-model="editFormValid">
              <v-text-field
                v-model="editData.email"
                label="邮箱"
                placeholder="请输入邮箱地址"
                :rules="emailRules"
                type="email"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                class="mb-3"
              />

              <v-text-field
                v-model="editData.phone"
                label="手机号"
                placeholder="请输入手机号码"
                :rules="phoneRules"
                prepend-inner-icon="mdi-phone"
                variant="outlined"
                class="mb-3"
              />

              <v-textarea
                v-model="editData.bio"
                label="个人简介"
                placeholder="介绍一下自己..."
                prepend-inner-icon="mdi-text"
                variant="outlined"
                rows="3"
                class="mb-3"
              />

              <div class="text-right">
                <v-btn
                  variant="outlined"
                  class="mr-2"
                  @click="resetEditForm"
                  :disabled="isLoading"
                >
                  重置
                </v-btn>
                
                <v-btn
                  color="primary"
                  :loading="isLoading"
                  :disabled="!editFormValid || isLoading"
                  @click="handleUpdateInfo"
                >
                  保存更改
                </v-btn>
              </div>
            </v-form>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- 危险操作区域 -->
      <v-card 
        variant="outlined" 
        color="error" 
        class="mt-6"
      >
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert" class="mr-2" />
          危险操作
        </v-card-title>
        
        <v-card-text>
          <p class="text-body-2 mb-4">
            以下操作具有不可逆性，请谨慎操作：
          </p>
          
          <v-btn
            color="error"
            variant="outlined"
            prepend-icon="mdi-account-remove"
            :loading="isLoading"
            @click="showDeactivationDialog = true"
          >
            注销账号
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- 错误信息 -->
      <v-alert
        v-if="error"
        type="error"
        class="mt-4"
        dismissible
        @click:close="clearError"
      >
        {{ error }}
      </v-alert>
    </v-card-text>

    <!-- 账号注销确认对话框 -->
    <AccountDeactivationDialog
      v-model="showDeactivationDialog"
      @confirm="handleAccountDeactivation"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { accountApplicationService } from '../domain/services/rendererAccountApplicationService';
import { AccountStatus, AccountType } from '../../domain/types/account';
import type { User, AccountDeactivationRequest } from '../../domain/types/account';
import AccountDeactivationDialog from './AccountDeactivationDialog.vue';

// 响应式数据
const editFormRef = ref();
const editFormValid = ref(false);
const editPanel = ref<number | undefined>(undefined);
const showDeactivationDialog = ref(false);

// 编辑表单数据
const editData = reactive({
  email: '',
  phone: '',
  bio: ''
});

// 计算属性
const currentUser = computed(() => accountApplicationService.currentUser.value);
const isLoading = computed(() => accountApplicationService.isLoading.value);
const error = computed(() => accountApplicationService.error.value);

// 验证规则
const emailRules = [
  (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '请输入有效的邮箱地址'
];

const phoneRules = [
  (v: string) => !v || /^1[3-9]\d{9}$/.test(v) || '请输入有效的手机号码'
];

// 监听用户数据变化，同步到编辑表单
watch(
  currentUser,
  (user) => {
    if (user) {
      editData.email = user.email || '';
      editData.phone = user.phone || '';
      editData.bio = user.bio || '';
    }
  },
  { immediate: true }
);

// 生命周期
onMounted(async () => {
  await accountApplicationService.getCurrentUser();
});

// 方法
const getStatusColor = (status: AccountStatus): string => {
  switch (status) {
    case AccountStatus.ACTIVE:
      return 'success';
    case AccountStatus.DISABLED:
      return 'warning';
    case AccountStatus.SUSPENDED:
      return 'error';
    case AccountStatus.PENDING_VERIFICATION:
      return 'info';
    default:
      return 'grey';
  }
};

const getStatusText = (status: AccountStatus): string => {
  switch (status) {
    case AccountStatus.ACTIVE:
      return '正常';
    case AccountStatus.DISABLED:
      return '已禁用';
    case AccountStatus.SUSPENDED:
      return '已暂停';
    case AccountStatus.PENDING_VERIFICATION:
      return '待验证';
    default:
      return '未知';
  }
};

const getAccountTypeText = (type: AccountType): string => {
  switch (type) {
    case AccountType.LOCAL:
      return '本地账号';
    case AccountType.ONLINE:
      return '在线账号';
    case AccountType.GUEST:
      return '访客账号';
    default:
      return '未知';
  }
};

const formatDate = (dateTime: any): string => {
  try {
    const date = new Date(dateTime);
    return date.toLocaleString('zh-CN');
  } catch {
    return '无效日期';
  }
};

const clearError = () => {
  accountApplicationService.error.value = null;
};

const resetEditForm = () => {
  if (currentUser.value) {
    editData.email = currentUser.value.email || '';
    editData.phone = currentUser.value.phone || '';
    editData.bio = currentUser.value.bio || '';
  }
};

const handleUpdateInfo = async () => {
  const { valid } = await editFormRef.value.validate();
  if (!valid) return;

  try {
    const response = await accountApplicationService.updateUserInfo(editData);
    
    if (response.success) {
      editPanel.value = undefined; // 关闭编辑面板
    }
  } catch (error) {
    console.error('更新用户信息失败:', error);
  }
};

const handleAccountDeactivation = async (deactivationData: AccountDeactivationRequest) => {
  try {
    const response = await accountApplicationService.requestAccountDeactivation(deactivationData);
    
    if (response.success) {
      showDeactivationDialog.value = false;
      // 注销请求成功发送，等待认证确认
    }
  } catch (error) {
    console.error('账号注销请求失败:', error);
  }
};
</script>

<style scoped>
.account-management {
  max-width: 800px;
  margin: 0 auto;
}

.user-info {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 16px;
}
</style>

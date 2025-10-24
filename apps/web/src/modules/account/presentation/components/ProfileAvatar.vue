<template>
  <div class="profile-avatar-wrapper">
    <v-menu
      v-model="showInfo"
      :close-on-content-click="false"
      offset-x
      location="end"
      min-width="260"
      max-width="320"
      transition="slide-x-transition"
    >
      <template #activator="{ props }">
        <v-avatar v-bind="props" :size="size" class="mb-4" color="primary" style="cursor: pointer">
          <template v-if="avatarUrl">
            <img :src="avatarUrl" alt="用户头像" />
          </template>
          <template v-else>
            <span class="default-avatar-text">{{ '?' }}</span>
          </template>
        </v-avatar>
      </template>
      <div class="user-info-content pa-4">
        <div class="user-info-header mb-2">
          <v-avatar :size="48" color="primary">
            <template v-if="avatarUrl">
              <img :src="avatarUrl" alt="用户头像" />
            </template>
            <template v-else>
              <span class="default-avatar-text">{{ '?' }}</span>
            </template>
          </v-avatar>
          <div class="user-info-basic">
            <div class="user-name ml-3">
              {{ localAccount?.username || '未设置昵称'
              }}<v-icon>{{
                localAccount?.user.sex.value === 0 ? 'mdi-gender-male' : 'mdi-gender-female'
              }}</v-icon>
            </div>
            <div class="user-uuid ml-3">{{ localAccount?.uuid || '未设置UUID' }}</div>
          </div>
        </div>
        <div class="user-detail mb-2">
          <div>邮箱：{{ localAccount?.email || '未绑定' }}</div>
          <div>手机号：{{ localAccount?.phoneNumber || '未绑定' }}</div>
        </div>
        <v-btn color="primary" variant="tonal" class="mt-3" @click="startEditProfile">
          编辑信息
        </v-btn>
      </div>
    </v-menu>
    <!-- 用户信息编辑框 -->
    <profile-dialog
      :model-value="profileDialog.show"
      :user="user as User"
      @update:model-value="profileDialog.show = $event"
      @handle-update-profile="handleUpdateUserProfile"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Account, User } from '@dailyuse/domain-client';
import { useAccountStore } from '@/modules/account/presentation/stores/useAccountStore';

// components
import ProfileDialog from './ProfileDialog.vue';
// composables
import { useAccountService } from '@/modules/account/presentation/composables/useAccountService';

const accountStore = useAccountStore();
const { handleUpdateUserProfile } = useAccountService();

defineProps<{ avatarUrl?: string; size: string }>();

const localAccount = computed(() => accountStore.currentAccount);

const user = computed(() => {
  if (localAccount.value && localAccount.value?.user) {
    return localAccount.value.user;
  }
  return User.forCreate();
});

const profileDialog = ref<{
  show: boolean;
  account: Account | null;
}>({
  show: false,
  account: null,
});

const startEditProfile = () => {
  profileDialog.value.show = true;
  profileDialog.value.account = localAccount.value as Account;
};

const showInfo = ref(false);
</script>

<style scoped>
.profile-avatar-wrapper {
  position: relative;
  display: inline-block;
}

.user-info-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: rgba(var(--v-theme-surface), 1);
}

.user-info-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: rgb(var(--v-theme-font));
}

.user-uuid {
  font-size: 0.9rem;
  color: rgb(var(--v-theme-font));
}

.user-detail {
  font-size: 0.95rem;
  color: #666;
}

.default-avatar-text {
  font-size: 1.5rem;
  font-weight: bold;
}
</style>

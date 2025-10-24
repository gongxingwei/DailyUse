<template>
  <v-card class="pa-4 w-100 h-100" style="background: transparent">
    <v-card-text>
      <div
        v-if="quickLoginAccounts.length > 0"
        class="quick-login-list d-flex flex-column align-center"
      >
        <v-avatar size="64" class="mx-auto my-2">
          <img :src="getAvatarUrl(selectedAccount?.username)" alt="avatar" />
        </v-avatar>
        <v-select
          :model-value="selectedAccountUuid"
          :items="accountOptions"
          item-title="username"
          item-value="accountUuid"
          label="选择账号"
          class="mb-2"
          style="width: 220px"
          dense
          outlined
        >
        </v-select>
        <v-btn
          color="primary"
          block
          class="login-btn"
          :disabled="!selectedAccountUuid"
          @click="onQuickLogin(selectedAccountUuid as string)"
        >
          登录
        </v-btn>
      </div>
      <div v-else class="text-center text-grey mt-6" style="font-size: 1.1rem">
        没有可快速登录账号
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthenticationService } from '../composables/useAuthenticationService';
import type { RememberMeTokenAuthenticationRequest } from '@renderer/modules/Authentication/domain/types';

const { getQuickLoginAccounts, handleLocalQuickLogin } = useAuthenticationService();
const quickLoginAccounts = ref<Array<{ accountUuid: string; username: string; token: string }>>([]);
const selectedAccountUuid = ref<string | null>(null);

const selectedAccount = computed(() => {
  return (
    quickLoginAccounts.value.find((account) => account.accountUuid === selectedAccountUuid.value) ||
    null
  );
});

const accountOptions = computed(() => {
  const options = quickLoginAccounts.value.map((account) => ({
    username: account.username,
    accountUuid: account.accountUuid,
  }));
  console.log('Account options:', options);
  return options;
});

onMounted(async () => {
  quickLoginAccounts.value = await getQuickLoginAccounts();
  if (quickLoginAccounts.value.length > 0) {
    selectedAccountUuid.value = quickLoginAccounts.value[0].accountUuid;
  }
  console.log('Quick login accounts:', JSON.stringify(quickLoginAccounts.value, null, 2));
});

function getAvatarUrl(username?: string) {
  if (!username) return '';
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;
}

const onQuickLogin = async (accountUuid: string) => {
  if (!accountUuid) return;
  const account = quickLoginAccounts.value.find((acc) => acc.accountUuid === accountUuid);
  if (!account) return;
  const request: RememberMeTokenAuthenticationRequest = {
    accountUuid: account.accountUuid,
    username: account.username,
    rememberMeToken: account.token,
    clientInfo: {
      deviceId: 'quick-login',
      userAgent: navigator.userAgent,
      ip: '127.0.0.1',
      location: 'local',
      country: 'CN',
      city: 'Beijing',
    },
  };
  await handleLocalQuickLogin(request);
};
</script>

<style scoped>
.quick-login-list {
  gap: 2rem;
}
.login-btn {
  margin-top: 0.5rem;
}
</style>

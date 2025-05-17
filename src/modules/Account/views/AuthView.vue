<template>
  <v-card class="mx-auto pa-4 auth-view-card">
    <v-tabs v-model="activeMode" align-tabs="center" color="primary">
      <v-tab value="local">本地账户</v-tab>
      <v-tab value="remote">远程账户</v-tab>
    </v-tabs>

    <v-window v-model="activeMode" class="mt-4">
      <!-- 本地账户面板 -->
      <v-window-item value="local">
        <v-tabs v-model="localTab" color="secondary">
          <v-tab value="quick-login">快速登录</v-tab>
          <v-tab value="login">账号密码登录</v-tab>
          <v-tab value="register">注册</v-tab>
        </v-tabs>

        <v-window v-model="localTab" class="mt-4">
          <v-window-item value="quick-login">
            <quick-login />
          </v-window-item>
          <v-window-item value="login">
            <local-login />
          </v-window-item>
          <v-window-item value="register">
            <local-register @register-success="toLocalLogin"/>
          </v-window-item>
        </v-window>
      </v-window-item>

      <!-- 远程账户面板 -->
      <v-window-item value="remote">
        <v-tabs v-model="remoteTab" color="secondary">
          <v-tab value="login">登录</v-tab>
          <v-tab value="register">注册</v-tab>
        </v-tabs>

        <v-window v-model="remoteTab" class="mt-4">
          <v-window-item value="login">
            <remote-login />
          </v-window-item>
          <v-window-item value="register">
            <remote-register />
          </v-window-item>
        </v-window>
      </v-window-item>
    </v-window>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import QuickLogin from '../components/QuickLogin.vue';
import LocalLogin from '../components/LocalLoginForm.vue';
import LocalRegister from '../components/LocalRegisterForm.vue';
import RemoteLogin from '../components/RemoteLoginForm.vue';
import RemoteRegister from '../components/RemoteRegisterForm.vue';
import { sharedDataService } from '../services/sharedDataService';
// stores
import { useAuthStore } from '../stores/authStore';
// types

const authStore = useAuthStore();
// 顶层模式切换：本地/远程
const activeMode = ref('local');

// 本地账户子标签
const localTab = ref('login');

// 远程账户子标签
const remoteTab = ref('login');

const toLocalLogin = () => {
  localTab.value = 'login';
  activeMode.value = 'local';
};

onMounted( async () => {
  const response = await sharedDataService.getAllSavedAccountInfo();
  console.log("获取已保存的账号信息:", response);
  if (response.success && Array.isArray(response.data)) {
    authStore.setSavedAccounts(response.data);
  } else {
    authStore.setSavedAccounts([]);
  }
});
</script>

<style scoped>
.auth-view-card {
  width: 95%;
  max-width: 600px;
  margin: auto;
}

/* 小屏幕设备 (手机, 600px 及以下) */
@media screen and (max-width: 600px) {
  .auth-view-card {
    width: 95%;
    max-width: 100%;
  }
}

/* 中等屏幕设备 (平板电脑, 600px 到 960px) */
@media screen and (min-width: 600px) and (max-width: 960px) {
  .auth-view-card {
    width: 85%;
    max-width: 550px;
  }
}

/* 大屏幕设备 (桌面电脑, 960px 以上) */
@media screen and (min-width: 960px) {
  .auth-view-card {
    width: 80%;
    max-width: 600px;
  }
}

.v-card {
  margin-top: 2rem;
}

.v-window {
  min-height: 300px;
}
</style>
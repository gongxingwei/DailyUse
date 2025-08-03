<template>
  <div id="auth-view">
    <AnimatedTrain />
    <div class="auth-view-container">
      <v-card class="mx-auto pa-4 auth-view-card">
        <v-tabs v-model="activeMode" align-tabs="center" color="primary">
          <v-tab value="local">
            <template #prepend>
              <v-icon>mdi-laptop</v-icon>
            </template>
            本地账户
          </v-tab>
          <v-tab value="remote">
            <template #prepend>
              <v-icon>mdi-cloud</v-icon>
            </template>
            远程账户
          </v-tab>
        </v-tabs>

        <v-window v-model="activeMode">
          <!-- 本地账户面板 -->
          <v-window-item value="local">
            <v-tabs v-model="localTab" color="secondary">
              <v-tab value="quick-login">
                <template #prepend>
                  <v-icon>mdi-flash</v-icon>
                </template>
                快速登录
              </v-tab>
              <v-tab value="login">
                <template #prepend>
                  <v-icon>mdi-login</v-icon>
                </template>
                账号密码登录
              </v-tab>
              <v-tab value="register">
                <template #prepend>
                  <v-icon>mdi-account-plus</v-icon>
                </template>
                注册
              </v-tab>
            </v-tabs>

            <v-window v-model="localTab" class="mt-4">
              <v-window-item value="quick-login">
                <local-quick-login />
              </v-window-item>
              <v-window-item value="login">
                <local-login />
              </v-window-item>
              <v-window-item value="register">
                <local-register @registration-success="toLocalLogin" />
              </v-window-item>
            </v-window>
          </v-window-item>

          <!-- 远程账户面板 -->
          <v-window-item value="remote">
            <v-tabs v-model="remoteTab" color="secondary">
              <v-tab value="quick-login">
                <template #prepend>
                  <v-icon>mdi-flash</v-icon>
                </template>
                快速登录
              </v-tab>
              <v-tab value="login">
                <template #prepend>
                  <v-icon>mdi-login</v-icon>
                </template>
                登录
              </v-tab>
              <v-tab value="register">
                <template #prepend>
                  <v-icon>mdi-account-plus</v-icon>
                </template>
                注册
              </v-tab>
            </v-tabs>

            <v-window v-model="remoteTab">
              <v-window-item value="quick-login">

              </v-window-item>
              <v-window-item value="login">

              </v-window-item>
              <v-window-item value="register">

              </v-window-item>
            </v-window>
          </v-window-item>
        </v-window>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LocalQuickLogin from '@/modules/Authentication/presentation/components/LocalQuickLogin.vue';
import LocalLogin from '@/modules/Authentication/presentation/components/LocalLoginForm.vue';
import LocalRegister from '@/modules/Account/presentation/components/LocalRegisterForm.vue';
import AnimatedTrain from '@/shared/animation/AnimatedTrain.vue';

const activeMode = ref('local');
const localTab = ref('login');
const remoteTab = ref('login');

const toLocalLogin = () => {
  localTab.value = 'login';
  activeMode.value = 'local';
};
</script>

<style scoped>
#auth-view {
  -webkit-app-region: drag;
  width: 100vw;
  height: 100vh;
}


.auth-view-card {
  width: 100%;
  height: 100%;
  margin: auto;
  background: transparent;
  box-shadow: 0 2px 16px rgba(0,0,0,0.12);
  backdrop-filter: blur(8px);
  -webkit-app-region: no-drag;
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
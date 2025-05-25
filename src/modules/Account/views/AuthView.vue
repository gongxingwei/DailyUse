<template>
  <div id="auth-view">
    <!-- 添加火车动画容器 -->
    <div class="train-container">
      <div class="sun"></div>
      <div class="train">
        <!-- 车厢形状 -->
        <div class="locomotive">
          <div class="square1" data-letter="Daily"></div>
          <div class="square2" data-letter="Use"></div>
          <div class="engine">
            <div class="engine-light"></div>
          </div>
        </div>

        <!-- 8个轮子 -->
        <div class="wheels">
          <div class="wheel" data-letter="d"></div>
          <div class="wheel" data-letter="a"></div>
          <div class="wheel" data-letter="i"></div>
          <div class="wheel" data-letter="l"></div>
          <div class="wheel" data-letter="y"></div>
          <div class="wheel" data-letter="u"></div>
          <div class="wheel" data-letter="s"></div>
          <div class="wheel" data-letter="e"></div>
        </div>
      </div>
    </div>
    <div class="auth-view-container">
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
                <local-register @register-success="toLocalLogin" />
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
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import QuickLogin from '../components/QuickLogin.vue';
import LocalLogin from '../components/LocalLoginForm.vue';
import LocalRegister from '../components/LocalRegisterForm.vue';
import RemoteLogin from '../components/RemoteLoginForm.vue';
import RemoteRegister from '../components/RemoteRegisterForm.vue';
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

</script>

<style scoped>
/* 火车动画相关样式 */
.train-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  background: linear-gradient(
    180deg, 
    #1a2a30 0%, 
    #2d2f30 100%
  );
}

/* 火车 */
.train {
  position: absolute;
  bottom: 50px;
  left: -350px;
  /* 初始位置在屏幕外 */
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;

  /* animation: moveTrain 15s linear infinite; */
  animation: moveTrain 10s linear infinite;
}

/* 车厢 */
.locomotive {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.square1 {
  position: relative;
  width: 160px;
  height: 60px;
  background: rgb(var(--v-theme-accent));
  border-radius: 8px;
}

.square1::before {
  content: attr(data-letter);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgb(var(--v-theme-on-surface));
  font-weight: bold;
  font-size: 24px;
}

.square2 {
  position: relative;
  width: 100px;
  height: 60px;
  background: rgb(var(--v-theme-secondary));
  border-radius: 8px;
}

.square2::before {
  content: attr(data-letter);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgb(var(--v-theme-on-surface));
  font-weight: bold;
  font-size: 24px;
}

.circle {
  width: 60px;
  height: 60px;
  background: #2196F3;
  border-radius: 50%;
}

.triangle {
  width: 0;
  height: 0;
  border-left: 30px solid transparent;
  border-right: 30px solid transparent;
  border-bottom: 60px solid #F44336;
}

/* 车头样式 */
.engine {
  position: relative;
  width: 80px;
  height: 60px;
  background: rgb(var(--v-theme-primary));
  border-radius: 8px;
  clip-path: polygon(0 0, 50% 0, 100% 60%, 100% 100%, 0 100%);
}

/* 车头灯 */
.engine-light {
  position: absolute;
  width: 15px;
  height: 15px;
  background: #FFD700;
  border-radius: 50%;
  right: 0;
  top: 70%;
  transform: translateY(-50%);
  box-shadow: 0 0 10px #FFD700;
  animation: glowLight 1s ease-in-out infinite alternate;
}

.wheels {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.wheel {
  width: 30px;
  height: 30px;
  background: #9C27B0;
  border-radius: 50%;
  position: relative;
  animation: rotateWheel 2s linear infinite;
}

.wheel::before {
  content: attr(data-letter);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgb(var(--v-theme-on-surface));
  font-weight: bold;
  font-size: 16px;
}

@keyframes moveTrain {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(calc(100vw + 350px));
  }
}

@keyframes rotateWheel {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.sun {
  position: absolute;
  top: 20px;
  left: -350px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #FFF176, #FFD700);
  box-shadow: 
    0 0 30px #FFD700,
    0 0 60px rgba(255, 215, 0, 0.4);
  z-index: 0;
  animation: sunMove 10s linear infinite;
}
/* 太阳光芒效果 */
.sun::before {
  content: '';
  position: absolute;
  top: -15px;
  left: -15px;
  right: -15px;
  bottom: -15px;
  background: transparent;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.3);
  animation: sunRays 4s linear infinite;
}
/* 优化太阳移动轨迹 */
@keyframes sunMove {
  0% {
    transform: translate(0, 20px);
  }
  25% {
    transform: translate(calc(25vw + 350px), -30px);
  }
  50% {
    transform: translate(calc(50vw + 350px), -50px);
  }
  75% {
    transform: translate(calc(75vw + 350px), -30px);
  }
  100% {
    transform: translate(calc(100vw + 350px), 20px);
  }
}

/* 太阳光芒旋转动画 */
@keyframes sunRays {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 太阳发光效果动画 */
@keyframes sunGlow {
  from {
    box-shadow: 
      0 0 30px #FFD700,
      0 0 60px rgba(255, 215, 0, 0.4);
  }
  to {
    box-shadow: 
      0 0 40px #FFD700,
      0 0 80px rgba(255, 215, 0, 0.6);
  }
}

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
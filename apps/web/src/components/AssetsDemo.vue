<!--
  音频和图片资源使用示例组件
  展示如何使用 @dailyuse/assets 包中的资源
-->
<template>
  <div class="assets-demo">
    <v-card class="ma-4 pa-4">
      <v-card-title>📦 Assets 资源库使用示例</v-card-title>

      <!-- 图片资源示例 -->
      <v-card-text>
        <h3 class="mb-4">🖼️ 图片资源</h3>
        <div class="image-showcase mb-6">
          <v-row>
            <v-col cols="12" md="4">
              <div class="text-center">
                <img :src="logo" alt="Logo SVG" style="width: 100px; height: auto" />
                <p class="text-caption mt-2">Logo SVG</p>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-center">
                <img :src="logo128" alt="Logo 128" style="width: 100px; height: auto" />
                <p class="text-caption mt-2">Logo 128px</p>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-center">
                <img :src="defaultAvatar" alt="Avatar" style="width: 100px; height: auto; border-radius: 50%" />
                <p class="text-caption mt-2">默认头像</p>
              </div>
            </v-col>
          </v-row>
        </div>

        <!-- 音频资源示例 -->
        <h3 class="mb-4">🔊 音频资源</h3>
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-btn block color="success" @click="playSuccess" prepend-icon="mdi-check-circle">
              播放成功音效
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn block color="error" @click="playError" prepend-icon="mdi-alert-circle">
              播放错误音效
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn block color="info" @click="playNotification" prepend-icon="mdi-bell">
              播放通知音效
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn block color="warning" @click="playReminder" prepend-icon="mdi-alarm">
              播放提醒音效
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn block color="orange" @click="playAlert" prepend-icon="mdi-alert">
              播放警告音效
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn block @click="playDefault" prepend-icon="mdi-music-note">
              播放默认音效
            </v-btn>
          </v-col>
        </v-row>

        <!-- 音频控制 -->
        <h3 class="mb-4">⚙️ 音频控制</h3>
        <v-row>
          <v-col cols="12">
            <v-slider
              v-model="volume"
              :min="0"
              :max="100"
              :step="5"
              label="音量"
              prepend-icon="mdi-volume-high"
              @update:model-value="updateVolume"
            >
              <template #append>
                <v-chip size="small">{{ volume }}%</v-chip>
              </template>
            </v-slider>
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="enabled"
              label="启用音效"
              color="primary"
              @update:model-value="updateEnabled"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="muted"
              label="静音"
              color="error"
              @update:model-value="updateMuted"
            />
          </v-col>
        </v-row>

        <!-- 可用音效列表 -->
        <h3 class="mb-4">📋 可用音效列表</h3>
        <v-list density="compact">
          <v-list-item v-for="(soundUrl, soundType) in availableSounds" :key="soundType">
            <template #prepend>
              <v-icon>mdi-music-note</v-icon>
            </template>
            <v-list-item-title>{{ soundType }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ soundUrl }}</v-list-item-subtitle>
            <template #append>
              <v-btn size="small" icon="mdi-play" @click="playSound(soundType)" />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { logo, logo128, defaultAvatar } from '@dailyuse/assets/images';
import { audioService, type SoundType } from '@/services/AudioService';

// 音频控制状态
const volume = ref(50);
const enabled = ref(true);
const muted = ref(false);
const availableSounds = ref<Record<string, string>>({});

// 初始化
onMounted(() => {
  volume.value = Math.round(audioService.getVolume() * 100);
  enabled.value = audioService.isEnabled();
  muted.value = audioService.isMuted();
  availableSounds.value = audioService.getAvailableSounds();
});

// 播放音效
const playSuccess = () => audioService.playSuccess();
const playError = () => audioService.playError();
const playNotification = () => audioService.playNotification();
const playReminder = () => audioService.playReminder();
const playAlert = () => audioService.playAlert();
const playDefault = () => audioService.playDefault();

const playSound = (soundType: string) => {
  audioService.play(soundType as SoundType);
};

// 更新音量
const updateVolume = (value: number) => {
  audioService.setVolume(value / 100);
};

// 更新启用状态
const updateEnabled = (value: boolean | null) => {
  audioService.setEnabled(value ?? false);
};

// 更新静音状态
const updateMuted = (value: boolean | null) => {
  audioService.setMuted(value ?? false);
};
</script>

<style scoped>
.assets-demo {
  max-width: 1200px;
  margin: 0 auto;
}

.image-showcase {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 16px;
}
</style>

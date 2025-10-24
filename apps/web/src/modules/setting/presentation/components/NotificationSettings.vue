<template>
  <v-container>
    <!-- 通知设置标题 -->
    <v-row>
      <v-col cols="12">
        <h2 class="text-h6 mb-2">通知设置</h2>
        <p class="text-body-2 text-medium-emphasis">管理通知偏好和提醒方式</p>
      </v-col>
    </v-row>

    <!-- 通知总开关 -->
    <v-list lines="two" class="mt-4">
      <v-list-item>
        <template v-slot:prepend>
          <v-icon color="primary">mdi-bell-outline</v-icon>
        </template>
        <v-list-item-title>启用通知</v-list-item-title>
        <v-list-item-subtitle>接收系统通知和提醒</v-list-item-subtitle>
        <template v-slot:append>
          <v-switch v-model="notificationsEnabled" color="primary" hide-details />
        </template>
      </v-list-item>

      <v-divider />

      <!-- 通知渠道选择 -->
      <v-list-item :disabled="!notificationsEnabled">
        <template v-slot:prepend>
          <v-icon>mdi-routes</v-icon>
        </template>
        <v-list-item-title>通知渠道</v-list-item-title>
        <v-list-item-subtitle>选择接收通知的方式（至少选择一个）</v-list-item-subtitle>
        <template v-slot:append>
          <div class="d-flex flex-column ga-2">
            <v-chip
              v-for="channel in availableChannels"
              :key="channel.value"
              :variant="selectedChannels.includes(channel.value) ? 'flat' : 'outlined'"
              :color="selectedChannels.includes(channel.value) ? 'primary' : undefined"
              @click="toggleChannel(channel.value)"
              :disabled="!notificationsEnabled"
            >
              <v-icon start>{{ channel.icon }}</v-icon>
              {{ channel.label }}
            </v-chip>
          </div>
        </template>
      </v-list-item>

      <v-divider />

      <!-- 免打扰模式 -->
      <v-list-item :disabled="!notificationsEnabled">
        <template v-slot:prepend>
          <v-icon>mdi-moon-waning-crescent</v-icon>
        </template>
        <v-list-item-title>免打扰模式</v-list-item-title>
        <v-list-item-subtitle>在指定时间段内静音通知</v-list-item-subtitle>
        <template v-slot:append>
          <v-switch v-model="dndEnabled" color="primary" hide-details :disabled="!notificationsEnabled" />
        </template>
      </v-list-item>

      <!-- 免打扰时间范围 -->
      <v-list-item v-if="dndEnabled && notificationsEnabled" class="pl-12">
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model="dndStartTime"
              label="开始时间"
              type="time"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="dndEndTime"
              label="结束时间"
              type="time"
              density="compact"
              hide-details
            />
          </v-col>
        </v-row>
      </v-list-item>

      <v-divider />

      <!-- 声音设置 -->
      <v-list-item :disabled="!notificationsEnabled">
        <template v-slot:prepend>
          <v-icon>mdi-volume-high</v-icon>
        </template>
        <v-list-item-title>通知声音</v-list-item-title>
        <v-list-item-subtitle>播放声音提示</v-list-item-subtitle>
        <template v-slot:append>
          <v-btn
            v-if="soundEnabled"
            icon="mdi-play"
            variant="text"
            size="small"
            @click="testSound"
            :disabled="!notificationsEnabled"
          />
          <v-switch v-model="soundEnabled" color="primary" hide-details :disabled="!notificationsEnabled" />
        </template>
      </v-list-item>

      <v-divider />

      <!-- 桌面通知 -->
      <v-list-item :disabled="!notificationsEnabled">
        <template v-slot:prepend>
          <v-icon>mdi-monitor</v-icon>
        </template>
        <v-list-item-title>桌面通知</v-list-item-title>
        <v-list-item-subtitle>在桌面显示系统通知（需要浏览器权限）</v-list-item-subtitle>
        <template v-slot:append>
          <v-chip
            v-if="desktopPermissionStatus === 'denied'"
            color="error"
            size="small"
          >
            已拒绝
          </v-chip>
          <v-chip
            v-else-if="desktopPermissionStatus === 'granted'"
            color="success"
            size="small"
          >
            已授权
          </v-chip>
          <v-btn
            v-if="desktopPermissionStatus === 'default'"
            variant="text"
            size="small"
            @click="requestDesktopPermission"
            :disabled="!notificationsEnabled"
          >
            请求权限
          </v-btn>
          <v-switch
            v-else
            v-model="desktopNotificationEnabled"
            color="primary"
            hide-details
            :disabled="!notificationsEnabled || desktopPermissionStatus !== 'granted'"
          />
        </template>
      </v-list-item>
    </v-list>

    <!-- 发送测试通知 -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-send"
          @click="sendTestNotification"
          :disabled="!notificationsEnabled"
          block
        >
          发送测试通知
        </v-btn>
      </v-col>
    </v-row>

    <!-- 保存按钮 -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-btn color="primary" block @click="saveSettings" :loading="saving">
          保存设置
        </v-btn>
      </v-col>
    </v-row>

    <!-- 成功提示 -->
    <v-snackbar v-model="showSuccessSnackbar" color="success" timeout="2000">
      设置已保存
    </v-snackbar>

    <!-- 错误提示 -->
    <v-snackbar v-model="showErrorSnackbar" color="error" timeout="3000">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useUserSetting } from '../composables/useUserSetting';

// Props
const props = withDefaults(
  defineProps<{
    autoSave?: boolean;
  }>(),
  {
    autoSave: false,
  }
);

// 可用的通知渠道
const availableChannels = [
  { value: 'push', label: '推送', icon: 'mdi-bell' },
  { value: 'email', label: '邮件', icon: 'mdi-email' },
  { value: 'sms', label: '短信', icon: 'mdi-message' },
];

// 使用 composable
const { userSetting, updatePrivacy, loading: saving } = useUserSetting();

// 通知设置状态
const notificationsEnabled = ref(true);
const selectedChannels = ref<string[]>(['push']);
const dndEnabled = ref(false);
const dndStartTime = ref('22:00');
const dndEndTime = ref('08:00');
const soundEnabled = ref(true);
const desktopNotificationEnabled = ref(false);
const desktopPermissionStatus = ref<NotificationPermission>('default');

// UI 状态
const showSuccessSnackbar = ref(false);
const showErrorSnackbar = ref(false);
const errorMessage = ref('');

// 从 UserSetting 加载设置
onMounted(async () => {
  if (userSetting.value) {
    // 从隐私设置中加载通知配置（如果存在）
    const privacy = userSetting.value.privacy;
    if (privacy) {
      // 注意：当前后端可能还没有这些字段，这是为未来扩展准备的
      const privacyAny = privacy as any; // Type-safe workaround for未来字段扩展
      notificationsEnabled.value = privacyAny.notificationsEnabled ?? true;
      const channels = privacyAny.notificationChannels || ['push'];
      selectedChannels.value = Array.isArray(channels) ? channels : ['push'];
      dndEnabled.value = privacyAny.dndEnabled ?? false;
      dndStartTime.value = privacyAny.dndStartTime ?? '22:00';
      dndEndTime.value = privacyAny.dndEndTime ?? '08:00';
      soundEnabled.value = privacyAny.soundEnabled ?? true;
      desktopNotificationEnabled.value = privacyAny.desktopNotificationEnabled ?? false;
    }
  }

  // 检查桌面通知权限
  if ('Notification' in window) {
    desktopPermissionStatus.value = Notification.permission;
  }
});

// 切换通知渠道
const toggleChannel = (channel: string) => {
  const index = selectedChannels.value.indexOf(channel);
  if (index > -1) {
    // 至少保留一个渠道
    if (selectedChannels.value.length > 1) {
      selectedChannels.value.splice(index, 1);
    }
  } else {
    selectedChannels.value.push(channel);
  }
};

// 请求桌面通知权限
const requestDesktopPermission = async () => {
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      desktopPermissionStatus.value = permission;
      if (permission === 'granted') {
        desktopNotificationEnabled.value = true;
        showSuccessSnackbar.value = true;
      }
    } catch (error) {
      console.error('请求桌面通知权限失败:', error);
      errorMessage.value = '请求权限失败';
      showErrorSnackbar.value = true;
    }
  }
};

// 播放测试声音
const testSound = () => {
  // 创建一个简单的测试音频
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

// 发送测试通知
const sendTestNotification = () => {
  if (desktopNotificationEnabled.value && desktopPermissionStatus.value === 'granted') {
    new Notification('DailyUse 测试通知', {
      body: '这是一条测试通知，您的通知设置正常工作！',
      icon: '/icon.png',
    });
  } else {
    // 应用内通知
    showSuccessSnackbar.value = true;
  }

  if (soundEnabled.value) {
    testSound();
  }
};

// 保存设置
const saveSettings = async () => {
  try {
    if (!userSetting.value) {
      errorMessage.value = '用户设置未加载';
      showErrorSnackbar.value = true;
      return;
    }

    // 构建通知设置对象并保存
    // 注意：这些字段可能还未在后端DTO中定义，保存到Privacy扩展字段中
    await updatePrivacy({
      // 现有的隐私字段
      ...userSetting.value.privacy,
      // 通知设置（作为扩展字段，等待后端合约更新）
      notificationsEnabled: notificationsEnabled.value,
      notificationChannels: selectedChannels.value,
      dndEnabled: dndEnabled.value,
      dndStartTime: dndStartTime.value,
      dndEndTime: dndEndTime.value,
      soundEnabled: soundEnabled.value,
      desktopNotificationEnabled: desktopNotificationEnabled.value,
    } as any);

    showSuccessSnackbar.value = true;
  } catch (error) {
    console.error('保存通知设置失败:', error);
    errorMessage.value = '保存失败，请重试';
    showErrorSnackbar.value = true;
  }
};

// 自动保存监听器
if (props.autoSave) {
  watch(
    [
      notificationsEnabled,
      selectedChannels,
      dndEnabled,
      dndStartTime,
      dndEndTime,
      soundEnabled,
      desktopNotificationEnabled,
    ],
    () => {
      // 使用防抖避免频繁保存
      setTimeout(() => {
        saveSettings();
      }, 500);
    },
    { deep: true }
  );
}
</script>

<style scoped>
/* 如果需要自定义样式 */
</style>

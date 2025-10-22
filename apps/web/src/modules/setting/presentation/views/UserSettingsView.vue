<template>
  <v-container fluid>
    <!-- 页面头部 -->
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-2">
          <v-icon class="mr-2" size="large">mdi-cog</v-icon>
          用户设置
        </h1>
        <p class="text-body-1 text-medium-emphasis mb-6">管理您的个人偏好和应用配置</p>
      </v-col>
    </v-row>

    <!-- 加载状态 -->
    <v-row v-if="initializing" justify="center">
      <v-col cols="12" class="text-center py-16">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
          class="mb-4"
        />
        <p class="text-body-1">加载设置中...</p>
      </v-col>
    </v-row>

    <!-- 错误状态 -->
    <v-row v-else-if="error" justify="center">
      <v-col cols="12" md="6" class="text-center py-16">
        <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
        <p class="text-h6 text-error mb-4">{{ error }}</p>
        <v-btn color="primary" @click="handleRetry">重试</v-btn>
      </v-col>
    </v-row>

    <!-- 设置内容 -->
    <v-row v-else>
      <v-col cols="12">
        <v-card>
          <!-- 标签页导航 -->
          <v-tabs
            v-model="activeTab"
            bg-color="surface"
            color="primary"
            grow
          >
            <v-tab
              v-for="tab in tabs"
              :key="tab.key"
              :value="tab.key"
            >
              <v-icon start>{{ tab.icon }}</v-icon>
              {{ tab.label }}
            </v-tab>
          </v-tabs>

          <v-divider />

          <!-- 标签页内容 -->
          <v-window v-model="activeTab">
            <!-- 外观设置 -->
            <v-window-item value="appearance">
              <AppearanceSettings :auto-save="true" />
            </v-window-item>

            <!-- 语言和地区 -->
            <v-window-item value="locale">
              <LocaleSettings :auto-save="true" />
            </v-window-item>

            <!-- 工作流 -->
            <v-window-item value="workflow">
              <WorkflowSettings :auto-save="true" />
            </v-window-item>

            <!-- 通知 -->
            <v-window-item value="notifications">
              <NotificationSettings :auto-save="true" />
            </v-window-item>

            <!-- 快捷键 -->
            <v-window-item value="shortcuts">
              <ShortcutSettings :auto-save="true" />
            </v-window-item>

            <!-- 隐私 -->
            <v-window-item value="privacy">
              <PrivacySettings :auto-save="true" />
            </v-window-item>

            <!-- 实验性功能 -->
            <v-window-item value="experimental">
              <ExperimentalSettings :auto-save="true" />
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserSetting } from '../composables/useUserSetting';
import AppearanceSettings from '../components/AppearanceSettings.vue';
import LocaleSettings from '../components/LocaleSettings.vue';
import WorkflowSettings from '../components/WorkflowSettings.vue';
import NotificationSettings from '../components/NotificationSettings.vue';
import ShortcutSettings from '../components/ShortcutSettings.vue';
import PrivacySettings from '../components/PrivacySettings.vue';
import ExperimentalSettings from '../components/ExperimentalSettings.vue';

// ===== 标签页配置 =====
const tabs = [
  { key: 'appearance', label: '外观', icon: 'mdi-palette' },
  { key: 'locale', label: '语言和地区', icon: 'mdi-earth' },
  { key: 'workflow', label: '工作流', icon: 'mdi-cog-outline' },
  { key: 'notifications', label: '通知', icon: 'mdi-bell' },
  { key: 'shortcuts', label: '快捷键', icon: 'mdi-keyboard' },
  { key: 'privacy', label: '隐私', icon: 'mdi-shield-account' },
  { key: 'experimental', label: '实验性功能', icon: 'mdi-flask' },
];

// ===== 状态 =====
const activeTab = ref('appearance');
const initializing = ref(true);
const error = ref('');

// ===== Composables =====
const { initialize } = useUserSetting();

// ===== 生命周期 =====
onMounted(async () => {
  try {
    // TODO: 从认证系统获取当前用户的 accountUuid
    // const accountUuid = useAuth().currentUser?.uuid;
    const mockAccountUuid = 'mock-account-uuid'; // 临时 Mock
    
    await initialize(mockAccountUuid);
  } catch (e) {
    error.value = e instanceof Error ? e.message : '初始化设置失败';
    console.error('Failed to initialize user settings:', e);
  } finally {
    initializing.value = false;
  }
});

// ===== 事件处理 =====

/**
 * 重试加载
 */
const handleRetry = async () => {
  initializing.value = true;
  error.value = '';
  
  try {
    const mockAccountUuid = 'mock-account-uuid';
    await initialize(mockAccountUuid);
  } catch (e) {
    error.value = e instanceof Error ? e.message : '初始化设置失败';
    console.error('Failed to retry initialization:', e);
  } finally {
    initializing.value = false;
  }
};
</script>

<style scoped>
/* Vuetify 组件自带样式，无需额外 CSS */
</style>

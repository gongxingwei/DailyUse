<template>
  <div class="notification-settings">
    <div class="settings-section">
      <h2 class="section-title">通知设置</h2>
      <p class="section-description">管理您的通知偏好</p>

      <!-- Enable Notifications -->
      <div class="setting-item">
        <div class="setting-label">
          <label for="notificationsEnabled">启用通知</label>
          <span class="setting-hint">接收应用通知</span>
        </div>
        <label class="switch">
          <input
            id="notificationsEnabled"
            v-model="notificationsEnabled"
            type="checkbox"
            :disabled="loading"
            @change="handleNotificationsChange"
          />
          <span class="slider"></span>
        </label>
      </div>

      <!-- Email Notifications -->
      <div class="setting-item" :class="{ disabled: !notificationsEnabled }">
        <div class="setting-label">
          <label for="emailNotifications">邮件通知</label>
          <span class="setting-hint">通过邮件接收通知</span>
        </div>
        <label class="switch">
          <input
            id="emailNotifications"
            v-model="emailNotifications"
            type="checkbox"
            :disabled="loading || !notificationsEnabled"
            @change="handleNotificationsChange"
          />
          <span class="slider"></span>
        </label>
      </div>

      <!-- Push Notifications -->
      <div class="setting-item" :class="{ disabled: !notificationsEnabled }">
        <div class="setting-label">
          <label for="pushNotifications">推送通知</label>
          <span class="setting-hint">接收桌面推送通知</span>
        </div>
        <label class="switch">
          <input
            id="pushNotifications"
            v-model="pushNotifications"
            type="checkbox"
            :disabled="loading || !notificationsEnabled"
            @change="handleNotificationsChange"
          />
          <span class="slider"></span>
        </label>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>

    <!-- Notification Types -->
    <div class="settings-section" style="margin-top: 16px">
      <h3 class="section-subtitle">通知类型</h3>
      <p class="section-description">选择您想要接收的通知类型</p>

      <div class="notification-types">
        <div class="notification-type">
          <div class="type-info">
            <div class="type-icon">📋</div>
            <div>
              <div class="type-label">任务通知</div>
              <div class="type-hint">任务截止日期、状态变更等</div>
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" checked :disabled="!notificationsEnabled" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="notification-type">
          <div class="type-info">
            <div class="type-icon">🎯</div>
            <div>
              <div class="type-label">目标通知</div>
              <div class="type-hint">目标进度、里程碑达成等</div>
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" checked :disabled="!notificationsEnabled" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="notification-type">
          <div class="type-info">
            <div class="type-icon">📅</div>
            <div>
              <div class="type-label">日程通知</div>
              <div class="type-hint">即将到来的日程安排</div>
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" checked :disabled="!notificationsEnabled" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="notification-type">
          <div class="type-info">
            <div class="type-icon">⏰</div>
            <div>
              <div class="type-label">提醒通知</div>
              <div class="type-hint">自定义提醒和闹钟</div>
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" checked :disabled="!notificationsEnabled" />
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';

const userPreferencesStore = useUserPreferencesStore();

const notificationsEnabled = ref(userPreferencesStore.notificationSettings.notificationsEnabled);
const emailNotifications = ref(userPreferencesStore.notificationSettings.emailNotifications);
const pushNotifications = ref(userPreferencesStore.notificationSettings.pushNotifications);

const loading = computed(() => userPreferencesStore.loading);
const error = computed(() => userPreferencesStore.error);
const successMessage = ref<string | null>(null);

// Watch for store changes and update local state
watch(
  () => userPreferencesStore.notificationSettings,
  (newSettings) => {
    notificationsEnabled.value = newSettings.notificationsEnabled;
    emailNotifications.value = newSettings.emailNotifications;
    pushNotifications.value = newSettings.pushNotifications;
  },
  { deep: true }
);

async function handleNotificationsChange() {
  try {
    await userPreferencesStore.updateNotificationPreferences({
      notificationsEnabled: notificationsEnabled.value,
      emailNotifications: emailNotifications.value,
      pushNotifications: pushNotifications.value,
    });
    showSuccess('通知设置已更新');
  } catch (err) {
    console.error('更新通知设置失败:', err);
  }
}

function showSuccess(message: string) {
  successMessage.value = message;
  setTimeout(() => {
    successMessage.value = null;
  }, 3000);
}
</script>

<style scoped>
.notification-settings {
  max-width: 800px;
}

.settings-section {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.section-subtitle {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.section-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 24px 0;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border);
  transition: opacity 0.2s ease;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.disabled {
  opacity: 0.5;
}

.setting-label {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.setting-label label {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  cursor: pointer;
}

.setting-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  transition: 0.3s;
  border-radius: 28px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Notification Types */
.notification-types {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-type {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.notification-type:hover {
  background: var(--color-surface-hover);
}

.type-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-icon {
  font-size: 24px;
}

.type-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.type-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: var(--color-error-light);
  color: var(--color-error);
  border-radius: 6px;
  font-size: 14px;
}

.success-message {
  margin-top: 16px;
  padding: 12px;
  background: var(--color-success-light, #d4edda);
  color: var(--color-success, #155724);
  border-radius: 6px;
  font-size: 14px;
}

/* Dark mode adjustments */
:root[data-theme='dark'] .settings-section {
  background: var(--color-surface-dark, #1e1e1e);
}

:root[data-theme='dark'] .notification-type {
  border-color: var(--color-border-dark, #3e3e3e);
}

:root[data-theme='dark'] .notification-type:hover {
  background: var(--color-surface-hover-dark, #2e2e2e);
}

:root[data-theme='dark'] .slider {
  background-color: var(--color-border-dark, #3e3e3e);
}
</style>

<template>
  <div class="advanced-settings">
    <div class="settings-section">
      <h2 class="section-title">高级设置</h2>
      <p class="section-description">配置高级选项和系统行为</p>

      <!-- Auto Launch -->
      <div class="setting-item">
        <div class="setting-label">
          <label for="autoLaunch">开机自启动</label>
          <span class="setting-hint">系统启动时自动启动应用</span>
        </div>
        <label class="switch">
          <input
            id="autoLaunch"
            v-model="autoLaunch"
            type="checkbox"
            :disabled="loading"
            @change="handleAutoLaunchChange"
          />
          <span class="slider"></span>
        </label>
      </div>

      <!-- Analytics -->
      <div class="setting-item">
        <div class="setting-label">
          <label for="analyticsEnabled">使用数据分析</label>
          <span class="setting-hint">帮助我们改进产品体验</span>
        </div>
        <label class="switch">
          <input
            id="analyticsEnabled"
            v-model="analyticsEnabled"
            type="checkbox"
            :disabled="loading"
            @change="handleAnalyticsChange"
          />
          <span class="slider"></span>
        </label>
      </div>

      <!-- Crash Reports -->
      <div class="setting-item">
        <div class="setting-label">
          <label for="crashReportsEnabled">崩溃报告</label>
          <span class="setting-hint">自动发送崩溃报告以帮助诊断问题</span>
        </div>
        <label class="switch">
          <input
            id="crashReportsEnabled"
            v-model="crashReportsEnabled"
            type="checkbox"
            :disabled="loading"
            @change="handleCrashReportsChange"
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

    <!-- Data Management -->
    <div class="settings-section" style="margin-top: 16px">
      <h3 class="section-subtitle">数据管理</h3>
      <p class="section-description">管理您的数据和隐私</p>

      <div class="action-buttons">
        <button class="action-button" @click="handleResetSettings">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            />
          </svg>
          <span>恢复默认设置</span>
        </button>

        <button class="action-button danger" @click="handleClearData">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          <span>清除本地数据</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';

const userPreferencesStore = useUserPreferencesStore();

const autoLaunch = ref(userPreferencesStore.isAutoLaunchEnabled);
const analyticsEnabled = ref(userPreferencesStore.isAnalyticsEnabled);
const crashReportsEnabled = ref(userPreferencesStore.isCrashReportsEnabled);

const loading = computed(() => userPreferencesStore.loading);
const error = computed(() => userPreferencesStore.error);
const successMessage = ref<string | null>(null);

// Watch for store changes and update local state
watch(
  () => userPreferencesStore.preferences,
  (newPrefs) => {
    if (newPrefs) {
      autoLaunch.value = newPrefs.autoLaunch;
      analyticsEnabled.value = newPrefs.analyticsEnabled;
      crashReportsEnabled.value = newPrefs.crashReportsEnabled;
    }
  },
  { deep: true }
);

async function handleAutoLaunchChange() {
  try {
    await userPreferencesStore.updatePreferences({ autoLaunch: autoLaunch.value });
    showSuccess('开机自启动设置已更新');
  } catch (err) {
    console.error('更新开机自启动失败:', err);
  }
}

async function handleAnalyticsChange() {
  try {
    await userPreferencesStore.updatePreferences({ analyticsEnabled: analyticsEnabled.value });
    showSuccess('使用数据分析设置已更新');
  } catch (err) {
    console.error('更新数据分析设置失败:', err);
  }
}

async function handleCrashReportsChange() {
  try {
    await userPreferencesStore.updatePreferences({
      crashReportsEnabled: crashReportsEnabled.value,
    });
    showSuccess('崩溃报告设置已更新');
  } catch (err) {
    console.error('更新崩溃报告设置失败:', err);
  }
}

async function handleResetSettings() {
  if (!confirm('确定要恢复默认设置吗？此操作不可撤销。')) {
    return;
  }

  try {
    await userPreferencesStore.resetToDefault();
    showSuccess('已恢复默认设置');
  } catch (err) {
    console.error('恢复默认设置失败:', err);
  }
}

function handleClearData() {
  if (
    !confirm(
      '警告：此操作将清除所有本地数据，包括缓存、历史记录等。确定要继续吗？此操作不可撤销。'
    )
  ) {
    return;
  }

  // TODO: Implement clear data functionality
  alert('清除数据功能待实现');
}

function showSuccess(message: string) {
  successMessage.value = message;
  setTimeout(() => {
    successMessage.value = null;
  }, 3000);
}
</script>

<style scoped>
.advanced-settings {
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
}

.setting-item:last-child {
  border-bottom: none;
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

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
}

.action-button.danger {
  border-color: var(--color-error-light);
  color: var(--color-error);
}

.action-button.danger:hover {
  background: var(--color-error-light);
  border-color: var(--color-error);
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

:root[data-theme='dark'] .action-button {
  background: var(--color-surface-dark, #1e1e1e);
  border-color: var(--color-border-dark, #3e3e3e);
}

:root[data-theme='dark'] .action-button:hover {
  background: var(--color-surface-hover-dark, #2e2e2e);
}

:root[data-theme='dark'] .slider {
  background-color: var(--color-border-dark, #3e3e3e);
}
</style>

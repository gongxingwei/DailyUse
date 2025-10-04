<template>
  <div class="general-settings">
    <div class="settings-section">
      <h2 class="section-title">常规设置</h2>
      <p class="section-description">管理您的基本偏好设置</p>

      <!-- Language Selection -->
      <div class="setting-item">
        <div class="setting-label">
          <label for="language">语言</label>
          <span class="setting-hint">选择应用显示语言</span>
        </div>
        <select
          id="language"
          v-model="selectedLanguage"
          class="setting-select"
          :disabled="loading"
          @change="handleLanguageChange"
        >
          <option value="zh-CN">简体中文</option>
          <option value="zh-TW">繁體中文</option>
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="ja-JP">日本語</option>
          <option value="ko-KR">한국어</option>
        </select>
      </div>

      <!-- Timezone Selection -->
      <div class="setting-item">
        <div class="setting-label">
          <label for="timezone">时区</label>
          <span class="setting-hint">选择您所在的时区</span>
        </div>
        <select
          id="timezone"
          v-model="selectedTimezone"
          class="setting-select"
          :disabled="loading"
          @change="handleTimezoneChange"
        >
          <optgroup label="亚洲">
            <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
            <option value="Asia/Hong_Kong">香港时间 (UTC+8)</option>
            <option value="Asia/Taipei">台北时间 (UTC+8)</option>
            <option value="Asia/Tokyo">东京时间 (UTC+9)</option>
            <option value="Asia/Seoul">首尔时间 (UTC+9)</option>
            <option value="Asia/Singapore">新加坡时间 (UTC+8)</option>
            <option value="Asia/Dubai">迪拜时间 (UTC+4)</option>
          </optgroup>
          <optgroup label="欧洲">
            <option value="Europe/London">伦敦时间 (UTC+0)</option>
            <option value="Europe/Paris">巴黎时间 (UTC+1)</option>
            <option value="Europe/Berlin">柏林时间 (UTC+1)</option>
            <option value="Europe/Moscow">莫斯科时间 (UTC+3)</option>
          </optgroup>
          <optgroup label="美洲">
            <option value="America/New_York">纽约时间 (UTC-5)</option>
            <option value="America/Chicago">芝加哥时间 (UTC-6)</option>
            <option value="America/Denver">丹佛时间 (UTC-7)</option>
            <option value="America/Los_Angeles">洛杉矶时间 (UTC-8)</option>
            <option value="America/Toronto">多伦多时间 (UTC-5)</option>
          </optgroup>
          <optgroup label="太平洋">
            <option value="Pacific/Auckland">奥克兰时间 (UTC+12)</option>
            <option value="Australia/Sydney">悉尼时间 (UTC+10)</option>
          </optgroup>
        </select>
      </div>

      <!-- Locale Selection -->
      <div class="setting-item">
        <div class="setting-label">
          <label for="locale">区域设置</label>
          <span class="setting-hint">影响日期、时间和数字格式</span>
        </div>
        <select
          id="locale"
          v-model="selectedLocale"
          class="setting-select"
          :disabled="loading"
          @change="handleLocaleChange"
        >
          <option value="zh-CN">中国大陆</option>
          <option value="zh-TW">中国台湾</option>
          <option value="zh-HK">中国香港</option>
          <option value="en-US">美国</option>
          <option value="en-GB">英国</option>
          <option value="ja-JP">日本</option>
          <option value="ko-KR">韩国</option>
        </select>
      </div>

      <!-- Default Module -->
      <div class="setting-item">
        <div class="setting-label">
          <label for="defaultModule">默认模块</label>
          <span class="setting-hint">启动时打开的模块</span>
        </div>
        <select
          id="defaultModule"
          v-model="selectedDefaultModule"
          class="setting-select"
          :disabled="loading"
          @change="handleDefaultModuleChange"
        >
          <option value="dashboard">仪表盘</option>
          <option value="task">任务</option>
          <option value="goal">目标</option>
          <option value="schedule">日程</option>
          <option value="reminder">提醒</option>
          <option value="editor">编辑器</option>
        </select>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';

const userPreferencesStore = useUserPreferencesStore();

const selectedLanguage = ref(userPreferencesStore.currentLanguage);
const selectedTimezone = ref(userPreferencesStore.currentTimezone);
const selectedLocale = ref(userPreferencesStore.currentLocale);
const selectedDefaultModule = ref(userPreferencesStore.defaultModule);

const loading = computed(() => userPreferencesStore.loading);
const error = computed(() => userPreferencesStore.error);
const successMessage = ref<string | null>(null);

// Watch for store changes and update local state
watch(
  () => userPreferencesStore.preferences,
  (newPrefs) => {
    if (newPrefs) {
      selectedLanguage.value = newPrefs.language;
      selectedTimezone.value = newPrefs.timezone;
      selectedLocale.value = newPrefs.locale;
      selectedDefaultModule.value = newPrefs.defaultModule;
    }
  },
  { deep: true }
);

async function handleLanguageChange() {
  try {
    await userPreferencesStore.changeLanguage(selectedLanguage.value);
    showSuccess('语言已更改');
  } catch (err) {
    console.error('更改语言失败:', err);
  }
}

async function handleTimezoneChange() {
  try {
    await userPreferencesStore.updatePreferences({ timezone: selectedTimezone.value });
    showSuccess('时区已更新');
  } catch (err) {
    console.error('更新时区失败:', err);
  }
}

async function handleLocaleChange() {
  try {
    await userPreferencesStore.updatePreferences({ locale: selectedLocale.value });
    showSuccess('区域设置已更新');
  } catch (err) {
    console.error('更新区域设置失败:', err);
  }
}

async function handleDefaultModuleChange() {
  try {
    await userPreferencesStore.updatePreferences({ defaultModule: selectedDefaultModule.value });
    showSuccess('默认模块已更新');
  } catch (err) {
    console.error('更新默认模块失败:', err);
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
.general-settings {
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

.section-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 24px 0;
}

.setting-item {
  display: flex;
  align-items: flex-start;
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
}

.setting-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.setting-select {
  width: 250px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.setting-select:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.setting-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.setting-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

:root[data-theme='dark'] .setting-select {
  background: var(--color-surface-dark, #1e1e1e);
  border-color: var(--color-border-dark, #3e3e3e);
}
</style>

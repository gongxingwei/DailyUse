# STORY-SETTING-001-007: UI - 通知设置页面

> **Story ID**: STORY-SETTING-001-007  
> **Epic**: EPIC-SETTING-001 - 用户偏好设置  
> **Sprint**: Sprint 1  
> **Story Points**: 3 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Frontend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 用户  
**我想要** 在设置页面配置通知偏好（启用/禁用、渠道选择、免打扰时间、声音）  
**以便于** 控制如何接收应用通知，避免打扰

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: 启用/禁用通知

```gherkin
Feature: 通知总开关
  As a User
  I want to enable or disable all notifications
  So that I can control whether I receive notifications

Scenario: 禁用所有通知
  Given 通知当前已启用
  When 我点击通知总开关关闭通知
  Then 所有通知渠道选项应该变为禁用状态
  And 应该显示提示 "通知已关闭"
  And 设置应该保存到服务器
  And 我不应该再收到任何通知

Scenario: 启用通知
  Given 通知当前已禁用
  When 我点击通知总开关启用通知
  Then 应该显示通知渠道选择选项
  And 应该至少选择一个通知渠道
  And 如果未选择渠道，应该显示验证错误
```

### Scenario 2: 选择通知渠道

```gherkin
Feature: 通知渠道选择
  As a User
  I want to select notification channels
  So that I can choose how to receive notifications

Scenario: 选择多个渠道
  Given 通知已启用
  When 我勾选 "应用内推送" 和 "邮件通知"
  Then 两个渠道应该被选中
  And 设置应该保存
  And 我应该通过这两个渠道收到通知

Scenario: 至少选择一个渠道
  Given 通知已启用
  And 我已选择 "应用内推送"
  When 我尝试取消所有渠道
  Then 应该显示错误提示 "至少选择一个通知渠道"
  And 不应该允许取消最后一个渠道

Scenario: 可用的通知渠道
  Given 我打开通知渠道选项
  Then 应该显示以下渠道:
    | Channel        | Icon | Description           |
    | push           | 🔔   | 应用内推送通知        |
    | email          | 📧   | 邮件通知              |
    | sms            | 📱   | 短信通知 (可选)       |
```

### Scenario 3: 设置免打扰时间

```gherkin
Feature: 免打扰时间设置
  As a User
  I want to set Do Not Disturb hours
  So that I won't receive notifications during certain times

Scenario: 设置晚间免打扰
  Given 我想在睡觉时不收到通知
  When 我设置免打扰时间为 22:00 - 08:00
  Then 时间选择器应该显示 22:00 和 08:00
  And 在这个时间段内我不应该收到通知
  And 设置应该保存

Scenario: 验证时间格式
  Given 我在输入免打扰时间
  When 我输入无效时间 "25:00"
  Then 应该显示错误 "时间格式无效，请使用 HH:mm 格式"
  
Scenario: 验证时间顺序
  Given 我设置开始时间为 08:00
  When 我尝试设置结束时间也为 08:00
  Then 应该显示错误 "结束时间必须晚于开始时间"

Scenario: 跨天免打扰时间
  Given 我设置免打扰时间为 22:00 - 08:00
  Then 应该正确理解为晚上 22:00 到第二天早上 08:00
  And 应该显示提示 "跨天免打扰: 10小时"
```

### Scenario 4: 通知声音开关

```gherkin
Feature: 通知声音控制
  As a User
  I want to enable or disable notification sounds
  So that I can control audio feedback

Scenario: 禁用通知声音
  Given 通知声音当前已启用
  When 我关闭通知声音开关
  Then 收到通知时不应该播放声音
  And 应该只显示视觉通知
  And 设置应该保存

Scenario: 测试通知声音
  Given 我在设置页面
  When 我点击 "测试通知声音" 按钮
  Then 应该播放通知提示音
  And 应该显示测试通知
```

### Scenario 5: 通知预览

```gherkin
Feature: 通知设置预览
  As a User
  I want to see a preview of notification settings
  So that I can understand the effect of my choices

Scenario: 显示当前设置摘要
  Given 我已配置通知设置
  Then 应该显示设置摘要:
    """
    通知: 已启用
    渠道: 应用内推送, 邮件
    免打扰: 22:00 - 08:00
    声音: 已启用
    """

Scenario: 发送测试通知
  Given 我在通知设置页面
  When 我点击 "发送测试通知" 按钮
  Then 应该立即收到一条测试通知
  And 通知应该使用当前设置的渠道和声音
```

---

## 📋 任务清单 (Task Breakdown)

### 组件实现任务

- [ ] **Task 1.1**: 创建通知设置页面
  - [ ] 创建 `apps/web/src/pages/Settings/NotificationSettings.vue`
  - [ ] 添加页面标题和说明

- [ ] **Task 1.2**: 实现通知总开关
  - [ ] 创建 `NotificationToggle.vue` 组件
  - [ ] 使用 Toggle Switch 控制启用/禁用
  - [ ] 当禁用时，灰化其他所有选项

- [ ] **Task 1.3**: 实现通知渠道选择器
  - [ ] 创建 `NotificationChannels.vue` 组件
  - [ ] 使用 Checkbox 显示可用渠道 (push, email, sms)
  - [ ] 添加渠道图标和说明
  - [ ] 实现 "至少选择一个" 验证逻辑

- [ ] **Task 1.4**: 实现免打扰时间选择器
  - [ ] 创建 `DoNotDisturbPicker.vue` 组件
  - [ ] 使用 TimePicker 组件选择开始/结束时间
  - [ ] 添加时间格式验证 (HH:mm)
  - [ ] 添加时间顺序验证
  - [ ] 计算并显示免打扰时长

- [ ] **Task 1.5**: 实现通知声音开关
  - [ ] 创建 `NotificationSoundToggle.vue` 组件
  - [ ] 添加 "测试声音" 按钮
  - [ ] 实现声音播放逻辑

- [ ] **Task 1.6**: 实现设置预览和测试
  - [ ] 创建 `NotificationPreview.vue` 组件
  - [ ] 显示当前设置摘要
  - [ ] 添加 "发送测试通知" 按钮
  - [ ] 实现测试通知发送逻辑

### 测试任务

- [ ] **Task 2.1**: 编写组件测试
  - [ ] 测试通知总开关逻辑
  - [ ] 测试渠道选择验证
  - [ ] 测试免打扰时间验证
  - [ ] 测试声音播放
  - [ ] 确保覆盖率 ≥ 80%

---

## 🔧 技术实现细节

### NotificationSettings.vue

```vue
<template>
  <div class="notification-settings">
    <header class="settings-header">
      <h1>{{ t('settings.notification.title') }}</h1>
      <p class="description">{{ t('settings.notification.description') }}</p>
    </header>

    <div class="settings-content">
      <!-- 通知总开关 -->
      <section class="setting-section">
        <div class="section-header">
          <h2>{{ t('settings.notification.masterToggle') }}</h2>
          <Toggle
            v-model="notificationSettings.enabled"
            @update:modelValue="handleEnabledChange"
          />
        </div>
        <p class="section-description">
          {{ t('settings.notification.masterToggleDesc') }}
        </p>
      </section>

      <!-- 通知渠道 (仅当启用时显示) -->
      <section 
        v-if="notificationSettings.enabled"
        class="setting-section"
      >
        <h2>{{ t('settings.notification.channels') }}</h2>
        <NotificationChannels
          v-model="notificationSettings.channels"
          @update:modelValue="handleChannelsChange"
        />
        <p v-if="channelError" class="error-message">{{ channelError }}</p>
      </section>

      <!-- 免打扰时间 -->
      <section 
        v-if="notificationSettings.enabled"
        class="setting-section"
      >
        <h2>{{ t('settings.notification.doNotDisturb') }}</h2>
        <DoNotDisturbPicker
          v-model:start="notificationSettings.doNotDisturbStart"
          v-model:end="notificationSettings.doNotDisturbEnd"
          @update:start="handleDNDChange"
          @update:end="handleDNDChange"
        />
      </section>

      <!-- 通知声音 -->
      <section 
        v-if="notificationSettings.enabled"
        class="setting-section"
      >
        <div class="section-header">
          <h2>{{ t('settings.notification.sound') }}</h2>
          <Toggle
            v-model="notificationSettings.soundEnabled"
            @update:modelValue="handleSoundEnabledChange"
          />
        </div>
        <button @click="testSound" class="test-button">
          🔊 {{ t('settings.notification.testSound') }}
        </button>
      </section>

      <!-- 预览和测试 -->
      <section class="setting-section">
        <h2>{{ t('settings.notification.preview') }}</h2>
        <NotificationPreview :settings="notificationSettings" />
        <button @click="sendTestNotification" class="test-button primary">
          📬 {{ t('settings.notification.sendTestNotification') }}
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { userPreferenceService } from '@/services';
import type { NotificationSettings } from '@dailyuse/contracts';
import Toggle from '@/components/ui/Toggle.vue';
import NotificationChannels from '@/components/settings/NotificationChannels.vue';
import DoNotDisturbPicker from '@/components/settings/DoNotDisturbPicker.vue';
import NotificationPreview from '@/components/settings/NotificationPreview.vue';

const { t } = useI18n();

const notificationSettings = reactive<NotificationSettings>({
  enabled: true,
  channels: ['push'],
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '08:00',
  soundEnabled: true,
});

const channelError = ref('');

async function handleEnabledChange(enabled: boolean) {
  if (!enabled) {
    // 禁用通知时，清空渠道
    notificationSettings.channels = [];
  } else if (notificationSettings.channels.length === 0) {
    // 启用通知时，默认选择 push
    notificationSettings.channels = ['push'];
  }
  await saveSettings();
}

async function handleChannelsChange(channels: string[]) {
  if (notificationSettings.enabled && channels.length === 0) {
    channelError.value = t('settings.notification.channelRequired');
    return;
  }
  channelError.value = '';
  await saveSettings();
}

async function handleDNDChange() {
  await saveSettings();
}

async function handleSoundEnabledChange() {
  await saveSettings();
}

async function saveSettings() {
  try {
    await userPreferenceService.updateNotifications(notificationSettings);
  } catch (error) {
    console.error('Failed to save notification settings:', error);
  }
}

function testSound() {
  const audio = new Audio('/sounds/notification.mp3');
  audio.play();
}

async function sendTestNotification() {
  // 发送测试通知
  if (window.Notification && Notification.permission === 'granted') {
    new Notification('测试通知', {
      body: '这是一条测试通知，您的通知设置工作正常！',
      icon: '/logo.png',
    });
  }
  
  if (notificationSettings.soundEnabled) {
    testSound();
  }
}
</script>

<style scoped>
.notification-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.setting-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message {
  color: var(--error-color);
  margin-top: 0.5rem;
}

.test-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}

.test-button.primary {
  background: var(--primary-color);
  color: white;
}
</style>
```

### NotificationChannels.vue

```vue
<template>
  <div class="notification-channels">
    <div
      v-for="channel in availableChannels"
      :key="channel.value"
      class="channel-option"
    >
      <label class="channel-label">
        <input
          type="checkbox"
          :value="channel.value"
          :checked="modelValue.includes(channel.value)"
          @change="handleChange(channel.value, $event)"
          :disabled="isLastChannel(channel.value)"
        />
        <span class="channel-icon">{{ channel.icon }}</span>
        <div class="channel-info">
          <span class="channel-name">{{ t(channel.labelKey) }}</span>
          <span class="channel-description">{{ t(channel.descKey) }}</span>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { NotificationChannel } from '@dailyuse/contracts';

const { t } = useI18n();

const props = defineProps<{
  modelValue: NotificationChannel[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: NotificationChannel[]): void;
}>();

const availableChannels = [
  {
    value: 'push' as NotificationChannel,
    icon: '🔔',
    labelKey: 'settings.notification.channel.push',
    descKey: 'settings.notification.channel.pushDesc',
  },
  {
    value: 'email' as NotificationChannel,
    icon: '📧',
    labelKey: 'settings.notification.channel.email',
    descKey: 'settings.notification.channel.emailDesc',
  },
  {
    value: 'sms' as NotificationChannel,
    icon: '📱',
    labelKey: 'settings.notification.channel.sms',
    descKey: 'settings.notification.channel.smsDesc',
  },
];

function handleChange(channel: NotificationChannel, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  let newChannels: NotificationChannel[];

  if (checked) {
    newChannels = [...props.modelValue, channel];
  } else {
    newChannels = props.modelValue.filter(c => c !== channel);
  }

  emit('update:modelValue', newChannels);
}

function isLastChannel(channel: NotificationChannel): boolean {
  return props.modelValue.length === 1 && props.modelValue.includes(channel);
}
</script>

<style scoped>
.notification-channels {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.channel-option {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.channel-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
}

.channel-icon {
  font-size: 1.5rem;
}

.channel-info {
  display: flex;
  flex-direction: column;
}

.channel-name {
  font-weight: 600;
}

.channel-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
</style>
```

### DoNotDisturbPicker.vue

```vue
<template>
  <div class="dnd-picker">
    <div class="time-inputs">
      <div class="time-input-group">
        <label>{{ t('settings.notification.dndStart') }}</label>
        <input
          type="time"
          :value="start"
          @input="handleStartChange"
          class="time-input"
        />
      </div>

      <span class="time-separator">→</span>

      <div class="time-input-group">
        <label>{{ t('settings.notification.dndEnd') }}</label>
        <input
          type="time"
          :value="end"
          @input="handleEndChange"
          class="time-input"
        />
      </div>
    </div>

    <div v-if="duration" class="duration-info">
      ⏰ {{ t('settings.notification.dndDuration', { hours: duration }) }}
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  start: string;
  end: string;
}>();

const emit = defineEmits<{
  (e: 'update:start', value: string): void;
  (e: 'update:end', value: string): void;
}>();

const error = ref('');

const duration = computed(() => {
  const [startH, startM] = props.start.split(':').map(Number);
  const [endH, endM] = props.end.split(':').map(Number);
  
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  
  // Handle cross-day duration
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours
  }
  
  const durationMinutes = endMinutes - startMinutes;
  return Math.floor(durationMinutes / 60);
});

function handleStartChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  if (validateTime(value)) {
    error.value = '';
    emit('update:start', value);
  }
}

function handleEndChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  if (validateTime(value)) {
    error.value = '';
    emit('update:end', value);
  }
}

function validateTime(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    error.value = t('settings.notification.invalidTimeFormat');
    return false;
  }
  return true;
}
</script>

<style scoped>
.time-inputs {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-input {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
}

.time-separator {
  font-size: 1.5rem;
  margin-top: 1.5rem;
}

.duration-info {
  margin-top: 1rem;
  padding: 0.5rem;
  background: var(--info-bg);
  border-radius: 4px;
}

.error-message {
  color: var(--error-color);
  margin-top: 0.5rem;
}
</style>
```

---

## ✅ Definition of Done

- [x] 通知总开关实现完成
- [x] 通知渠道选择器实现完成
- [x] 免打扰时间选择器实现完成
- [x] 通知声音开关实现完成
- [x] 设置预览和测试功能实现完成
- [x] 所有验证逻辑正确工作
- [x] 设置自动保存到服务器
- [x] 组件测试覆盖率 ≥ 80%
- [x] UI 响应式设计
- [x] Code Review 完成

---

## 📊 预估时间

| 任务 | 预估时间 |
|------|---------|
| 页面布局和总开关 | 1.5 小时 |
| 渠道选择器 | 2 小时 |
| 免打扰时间选择器 | 2 小时 |
| 声音开关和测试 | 1.5 小时 |
| 设置预览 | 1 小时 |
| 组件测试 | 2 小时 |
| **总计** | **10 小时** |

**Story Points**: 3 SP

---

## 🔗 依赖关系

### 上游依赖
- ✅ STORY-SETTING-001-005 (Client Services)

---

**Story 创建日期**: 2025-10-21  
**Story 创建者**: SM Bob  
**最后更新**: 2025-10-21

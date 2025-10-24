# STORY-SETTING-001-006: UI - 外观设置页面

> **Story ID**: STORY-SETTING-001-006  
> **Epic**: EPIC-SETTING-001 - 用户偏好设置  
> **Sprint**: Sprint 1  
> **Story Points**: 3 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Frontend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 用户  
**我想要** 在设置页面自定义外观选项 (主题、语言、字体大小、侧边栏位置)  
**以便于** 根据个人喜好调整应用界面

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: 主题切换

```gherkin
Feature: 主题切换
  As a User
  I want to switch between light, dark, and auto themes
  So that I can customize the app's appearance

Scenario: 切换到暗色主题
  Given 我在设置页面
  And 当前主题为 'light'
  When 我选择 'dark' 主题选项
  Then 应用应该立即切换到暗色主题
  And 设置应该保存到服务器
  And 下次打开应用时应该使用暗色主题

Scenario: 选择自动主题
  Given 我选择 'auto' 主题
  When 系统时间在白天 (08:00-18:00)
  Then 应用应该使用亮色主题
  When 系统时间在夜晚 (18:00-08:00)
  Then 应用应该使用暗色主题
```

### Scenario 2: 语言切换

```gherkin
Feature: 语言切换
  As a User
  I want to change the app language
  So that I can use the app in my preferred language

Scenario: 切换到英语
  Given 当前语言为 '简体中文'
  When 我选择 'English (US)' 选项
  Then 所有界面文本应该切换到英语
  And 日期格式应该使用 MM/DD/YYYY
  And 设置应该保存

Scenario: 支持的语言列表
  Given 我打开语言下拉菜单
  Then 应该显示以下选项:
    | Language         | Code   |
    | 简体中文         | zh-CN  |
    | English (US)     | en-US  |
    | 日本語           | ja-JP  |
```

### Scenario 3: 字体大小调节

```gherkin
Feature: 字体大小调节
  As a User
  I want to adjust font size
  So that I can improve readability

Scenario: 增大字体
  Given 当前字体大小为 14px
  When 我将滑块移动到 18px
  Then 所有文本应该立即调整大小
  And 预览文本应该显示新的字体大小
  And 设置应该保存

Scenario: 字体大小范围限制
  Given 字体大小滑块
  Then 最小值应该是 12px
  And 最大值应该是 24px
  And 应该以 1px 为步长调整
```

### Scenario 4: 侧边栏位置

```gherkin
Feature: 侧边栏位置切换
  As a User
  I want to move the sidebar to left or right
  So that I can customize the layout

Scenario: 移动侧边栏到右侧
  Given 侧边栏在左侧
  When 我选择 '右侧' 选项
  Then 侧边栏应该立即移动到右侧
  And 主内容区应该调整位置
  And 设置应该保存
```

---

## 📋 任务清单 (Task Breakdown)

### 组件实现任务

- [ ] **Task 1.1**: 创建设置页面布局
  - [ ] 创建 `apps/web/src/pages/Settings/AppearanceSettings.vue`
  - [ ] 添加页面标题和说明
  - [ ] 添加返回按钮
  - [ ] 添加保存按钮 (可选，或自动保存)

- [ ] **Task 1.2**: 实现主题切换器
  - [ ] 创建 `ThemeSelector.vue` 组件
  - [ ] 添加 3 个主题选项卡 (Light, Dark, Auto)
  - [ ] 添加主题预览图
  - [ ] 实现点击切换逻辑
  - [ ] 调用 `userPreferenceService.updateTheme()`
  - [ ] 显示当前选中的主题

- [ ] **Task 1.3**: 实现语言选择器
  - [ ] 创建 `LanguageSelector.vue` 组件
  - [ ] 使用下拉菜单显示语言列表
  - [ ] 显示语言名称和图标 (国旗/语言代码)
  - [ ] 实现语言切换逻辑
  - [ ] 调用 `userPreferenceService.updateLanguage()`
  - [ ] 使用 i18n 切换界面语言

- [ ] **Task 1.4**: 实现字体大小滑块
  - [ ] 创建 `FontSizeSlider.vue` 组件
  - [ ] 使用 Slider 组件 (范围 12-24)
  - [ ] 添加预览文本 (实时显示字体大小)
  - [ ] 实现拖动保存逻辑 (debounce 500ms)
  - [ ] 调用 `userPreferenceService.updateFontSize()`
  - [ ] 应用字体大小到 CSS 变量 `--base-font-size`

- [ ] **Task 1.5**: 实现侧边栏位置切换
  - [ ] 创建 `SidebarPositionToggle.vue` 组件
  - [ ] 使用 Radio Button 或 Toggle Switch
  - [ ] 添加位置示意图
  - [ ] 实现切换逻辑
  - [ ] 调用 `userPreferenceService.updateSidebarPosition()`
  - [ ] 应用 CSS 类切换侧边栏位置

### 样式和动画任务

- [ ] **Task 2.1**: 实现主题切换动画
  - [ ] 添加淡入淡出过渡效果
  - [ ] 使用 CSS 变量管理主题颜色
  - [ ] 创建 `themes.css` 定义所有主题颜色

- [ ] **Task 2.2**: 实现响应式布局
  - [ ] 桌面端：侧边设置栏 + 预览区
  - [ ] 移动端：垂直布局，全宽显示

### 测试任务

- [ ] **Task 3.1**: 编写组件测试
  - [ ] 测试 ThemeSelector 切换逻辑
  - [ ] 测试 LanguageSelector 切换逻辑
  - [ ] 测试 FontSizeSlider 拖动和保存
  - [ ] 测试 SidebarPositionToggle 切换
  - [ ] 确保覆盖率 ≥ 80%

---

## 🔧 技术实现细节

### AppearanceSettings.vue

```vue
<template>
  <div class="appearance-settings">
    <header class="settings-header">
      <h1>{{ t('settings.appearance.title') }}</h1>
      <p class="description">{{ t('settings.appearance.description') }}</p>
    </header>

    <div class="settings-content">
      <!-- 主题切换 -->
      <section class="setting-section">
        <h2>{{ t('settings.appearance.theme') }}</h2>
        <ThemeSelector :value="currentTheme" @change="handleThemeChange" />
      </section>

      <!-- 语言选择 -->
      <section class="setting-section">
        <h2>{{ t('settings.appearance.language') }}</h2>
        <LanguageSelector :value="currentLanguage" @change="handleLanguageChange" />
      </section>

      <!-- 字体大小 -->
      <section class="setting-section">
        <h2>{{ t('settings.appearance.fontSize') }}</h2>
        <FontSizeSlider :value="currentFontSize" @change="handleFontSizeChange" />
      </section>

      <!-- 侧边栏位置 -->
      <section class="setting-section">
        <h2>{{ t('settings.appearance.sidebarPosition') }}</h2>
        <SidebarPositionToggle
          :value="currentSidebarPosition"
          @change="handleSidebarPositionChange"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { userPreferenceService } from '@/services';
import ThemeSelector from '@/components/settings/ThemeSelector.vue';
import LanguageSelector from '@/components/settings/LanguageSelector.vue';
import FontSizeSlider from '@/components/settings/FontSizeSlider.vue';
import SidebarPositionToggle from '@/components/settings/SidebarPositionToggle.vue';

const { t } = useI18n();

const currentTheme = ref<ThemeType>('auto');
const currentLanguage = ref<LanguageType>('zh-CN');
const currentFontSize = ref(14);
const currentSidebarPosition = ref<SidebarPosition>('left');

onMounted(async () => {
  const preference = await userPreferenceService.getCurrentUserPreference();
  if (preference) {
    currentTheme.value = preference.theme;
    currentLanguage.value = preference.language;
    currentFontSize.value = preference.fontSize;
    currentSidebarPosition.value = preference.sidebarPosition;
  }
});

async function handleThemeChange(theme: ThemeType) {
  currentTheme.value = theme;
  await userPreferenceService.updateTheme(theme);
}

async function handleLanguageChange(language: LanguageType) {
  currentLanguage.value = language;
  await userPreferenceService.updateLanguage(language);
}

async function handleFontSizeChange(size: number) {
  currentFontSize.value = size;
  await userPreferenceService.updateFontSize(size);
}

async function handleSidebarPositionChange(position: SidebarPosition) {
  currentSidebarPosition.value = position;
  await userPreferenceService.updateSidebarPosition(position);
}
</script>

<style scoped>
.appearance-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-header {
  margin-bottom: 2rem;
}

.setting-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}
</style>
```

### ThemeSelector.vue

```vue
<template>
  <div class="theme-selector">
    <div class="theme-options">
      <button
        v-for="theme in themes"
        :key="theme.value"
        class="theme-option"
        :class="{ active: modelValue === theme.value }"
        @click="handleSelect(theme.value)"
      >
        <div class="theme-preview" :data-theme="theme.value">
          <div class="preview-header"></div>
          <div class="preview-content"></div>
        </div>
        <span class="theme-label">{{ t(`theme.${theme.value}`) }}</span>
        <CheckIcon v-if="modelValue === theme.value" class="check-icon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ThemeType } from '@dailyuse/contracts';
import { CheckIcon } from '@heroicons/vue/24/solid';

const props = defineProps<{
  modelValue: ThemeType;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: ThemeType): void;
}>();

const themes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto' },
];

function handleSelect(theme: ThemeType) {
  emit('update:modelValue', theme);
}
</script>

<style scoped>
.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.theme-option {
  position: relative;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-option.active {
  border-color: var(--primary-color);
}

.theme-preview {
  width: 100%;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.theme-preview[data-theme='light'] {
  background: #ffffff;
}

.theme-preview[data-theme='dark'] {
  background: #1a1a1a;
}

.theme-preview[data-theme='auto'] {
  background: linear-gradient(90deg, #ffffff 50%, #1a1a1a 50%);
}

.check-icon {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 20px;
  height: 20px;
  color: var(--primary-color);
}
</style>
```

### FontSizeSlider.vue

```vue
<template>
  <div class="font-size-slider">
    <div class="slider-container">
      <span class="size-label">{{ minSize }}px</span>
      <input
        type="range"
        :min="minSize"
        :max="maxSize"
        :value="modelValue"
        @input="handleInput"
        class="slider"
      />
      <span class="size-label">{{ maxSize }}px</span>
    </div>

    <div class="preview-text" :style="{ fontSize: `${modelValue}px` }">
      {{ t('settings.fontSizePreview') }}
    </div>

    <div class="current-value">
      {{ t('settings.currentSize') }}: <strong>{{ modelValue }}px</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

const props = defineProps<{
  modelValue: number;
  minSize?: number;
  maxSize?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const minSize = props.minSize ?? 12;
const maxSize = props.maxSize ?? 24;

const debouncedEmit = useDebounceFn((value: number) => {
  emit('update:modelValue', value);
}, 500);

function handleInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  debouncedEmit(value);
}
</script>

<style scoped>
.slider-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--border-color);
  appearance: none;
}

.slider::-webkit-slider-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
}

.preview-text {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-bottom: 1rem;
}
</style>
```

---

## ✅ Definition of Done

- [x] 所有外观设置组件实现完成
- [x] 主题切换实时生效
- [x] 语言切换实时生效
- [x] 字体大小调整实时预览
- [x] 侧边栏位置切换实时生效
- [x] 所有设置自动保存到服务器
- [x] UI 响应式设计 (桌面/移动)
- [x] 组件测试覆盖率 ≥ 80%
- [x] Code Review 完成

---

## 📊 预估时间

| 任务       | 预估时间      |
| ---------- | ------------- |
| 页面布局   | 1 小时        |
| 主题选择器 | 2 小时        |
| 语言选择器 | 1.5 小时      |
| 字体滑块   | 1.5 小时      |
| 侧边栏切换 | 1 小时        |
| 样式和动画 | 1.5 小时      |
| 组件测试   | 2 小时        |
| **总计**   | **10.5 小时** |

**Story Points**: 3 SP

---

## 🔗 依赖关系

### 上游依赖

- ✅ STORY-SETTING-001-005 (Client Services)

---

**Story 创建日期**: 2025-10-21  
**Story 创建者**: SM Bob

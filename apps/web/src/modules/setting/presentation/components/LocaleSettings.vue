<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h3 class="text-h5 mb-4">
          <v-icon class="mr-2">mdi-earth</v-icon>
          语言和地区设置
        </h3>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-list lines="two">
          <!-- 语言设置 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-translate</v-icon>
            </template>
            <v-list-item-title>显示语言</v-list-item-title>
            <v-list-item-subtitle>选择您的界面语言</v-list-item-subtitle>
            <template v-slot:append>
              <v-select
                v-model="localLocale.language"
                :items="languageOptions"
                item-title="text"
                item-value="value"
                density="compact"
                style="max-width: 180px"
                hide-details
                @update:model-value="handleLanguageChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 时区设置 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-clock-outline</v-icon>
            </template>
            <v-list-item-title>时区</v-list-item-title>
            <v-list-item-subtitle>设置您的时区</v-list-item-subtitle>
            <template v-slot:append>
              <v-text-field
                v-model="localLocale.timezone"
                placeholder="Asia/Shanghai"
                density="compact"
                style="max-width: 200px"
                hide-details
                @blur="handleTimezoneChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 日期格式设置 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-calendar</v-icon>
            </template>
            <v-list-item-title>日期格式</v-list-item-title>
            <v-list-item-subtitle>选择日期显示格式</v-list-item-subtitle>
            <template v-slot:append>
              <v-select
                v-model="localLocale.dateFormat"
                :items="dateFormatOptions"
                item-title="text"
                item-value="value"
                density="compact"
                style="max-width: 220px"
                hide-details
                @update:model-value="handleDateFormatChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 时间格式设置 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-clock-time-four-outline</v-icon>
            </template>
            <v-list-item-title>时间格式</v-list-item-title>
            <v-list-item-subtitle>选择时间显示格式</v-list-item-subtitle>
            <template v-slot:append>
              <v-btn-toggle
                v-model="localLocale.timeFormat"
                mandatory
                density="compact"
                @update:model-value="handleTimeFormatChange"
                :disabled="loading"
              >
                <v-btn value="24H" size="small">24小时制</v-btn>
                <v-btn value="12H" size="small">12小时制</v-btn>
              </v-btn-toggle>
            </template>
          </v-list-item>

          <v-divider />

          <!-- 周开始日设置 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-calendar-week</v-icon>
            </template>
            <v-list-item-title>每周开始日</v-list-item-title>
            <v-list-item-subtitle>日历的每周第一天</v-list-item-subtitle>
            <template v-slot:append>
              <v-btn-toggle
                v-model="localLocale.weekStartsOn"
                mandatory
                density="compact"
                @update:model-value="handleWeekStartChange"
                :disabled="loading"
              >
                <v-btn :value="0" size="small">周日</v-btn>
                <v-btn :value="1" size="small">周一</v-btn>
              </v-btn-toggle>
            </template>
          </v-list-item>

          <v-divider />

          <!-- 货币设置 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-currency-usd</v-icon>
            </template>
            <v-list-item-title>货币</v-list-item-title>
            <v-list-item-subtitle>选择显示货币单位</v-list-item-subtitle>
            <template v-slot:append>
              <v-select
                v-model="localLocale.currency"
                :items="currencyOptions"
                item-title="text"
                item-value="value"
                density="compact"
                style="max-width: 180px"
                hide-details
                @update:model-value="handleCurrencyChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>

    <!-- 操作按钮 -->
    <v-row>
      <v-col cols="12" class="d-flex justify-end ga-2">
        <v-btn
          color="primary"
          @click="handleSaveAll"
          :disabled="loading || !hasChanges"
          :loading="loading"
        >
          保存更改
        </v-btn>
        <v-btn variant="outlined" @click="handleReset" :disabled="loading"> 重置 </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserSetting } from '../composables/useUserSetting';
import { type SettingContracts } from '@dailyuse/contracts';

// ===== Props =====
const props = defineProps<{
  autoSave?: boolean; // 是否自动保存
}>();

// ===== Composables =====
const { userSetting, loading, updateLocale, switchLanguage } = useUserSetting();

// ===== 选项配置 =====
const languageOptions = [
  { value: 'zh-CN', text: '简体中文' },
  { value: 'zh-TW', text: '繁體中文' },
  { value: 'en-US', text: 'English (US)' },
  { value: 'en-GB', text: 'English (UK)' },
  { value: 'ja-JP', text: '日本語' },
  { value: 'ko-KR', text: '한국어' },
];

const dateFormatOptions = [
  { value: 'YYYY-MM-DD', text: 'YYYY-MM-DD (2024-01-15)' },
  { value: 'DD/MM/YYYY', text: 'DD/MM/YYYY (15/01/2024)' },
  { value: 'MM/DD/YYYY', text: 'MM/DD/YYYY (01/15/2024)' },
];

const currencyOptions = [
  { value: 'CNY', text: 'CNY (人民币 ¥)' },
  { value: 'USD', text: 'USD (美元 $)' },
  { value: 'EUR', text: 'EUR (欧元 €)' },
  { value: 'GBP', text: 'GBP (英镑 £)' },
  { value: 'JPY', text: 'JPY (日元 ¥)' },
  { value: 'KRW', text: 'KRW (韩元 ₩)' },
  { value: 'HKD', text: 'HKD (港币 HK$)' },
  { value: 'TWD', text: 'TWD (新台币 NT$)' },
];

// ===== 本地状态 =====
const localLocale = ref<SettingContracts.UpdateLocaleRequest>({
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24H',
  weekStartsOn: 1, // 1 = Monday, 0 = Sunday
  currency: 'CNY',
});

const originalLocale = ref<SettingContracts.UpdateLocaleRequest>({});

// ===== 计算属性 =====
const hasChanges = computed(() => {
  return JSON.stringify(localLocale.value) !== JSON.stringify(originalLocale.value);
});

// ===== 监听用户设置变化 =====
watch(
  () => userSetting.value?.locale,
  (locale) => {
    if (locale) {
      localLocale.value = {
        language: locale.language as 'zh-CN' | 'zh-TW' | 'en-US' | 'en-GB' | 'ja-JP' | 'ko-KR',
        timezone: locale.timezone,
        dateFormat: locale.dateFormat as 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY',
        timeFormat: locale.timeFormat as '12H' | '24H',
        weekStartsOn: locale.weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        currency: locale.currency as 'CNY' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'KRW' | 'HKD' | 'TWD',
      };
      originalLocale.value = { ...localLocale.value };
    }
  },
  { immediate: true, deep: true },
);

// ===== 事件处理 =====

/**
 * 语言变化处理
 */
const handleLanguageChange = async () => {
  if (props.autoSave && localLocale.value.language) {
    await switchLanguage(localLocale.value.language);
  }
};

/**
 * 时区变化处理
 */
const handleTimezoneChange = async () => {
  if (props.autoSave) {
    await updateLocale({ timezone: localLocale.value.timezone });
  }
};

/**
 * 日期格式变化处理
 */
const handleDateFormatChange = async () => {
  if (props.autoSave) {
    await updateLocale({ dateFormat: localLocale.value.dateFormat });
  }
};

/**
 * 时间格式变化处理
 */
const handleTimeFormatChange = async () => {
  if (props.autoSave && localLocale.value.timeFormat) {
    await updateLocale({ timeFormat: localLocale.value.timeFormat });
  }
};

/**
 * 周开始日变化处理
 */
const handleWeekStartChange = async () => {
  if (props.autoSave && localLocale.value.weekStartsOn !== undefined) {
    await updateLocale({ weekStartsOn: localLocale.value.weekStartsOn });
  }
};

/**
 * 货币变化处理
 */
const handleCurrencyChange = async () => {
  if (props.autoSave) {
    await updateLocale({ currency: localLocale.value.currency });
  }
};

/**
 * 保存所有更改
 */
const handleSaveAll = async () => {
  await updateLocale(localLocale.value);
  originalLocale.value = { ...localLocale.value };
};

/**
 * 重置为原始值
 */
const handleReset = () => {
  localLocale.value = { ...originalLocale.value };
};
</script>

<style scoped>
/* Vuetify 组件自带样式，无需额外 CSS */
</style>

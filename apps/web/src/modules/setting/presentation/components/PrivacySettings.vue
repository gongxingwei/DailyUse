<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h3 class="text-h5 mb-4">
          <v-icon class="mr-2">mdi-shield-account</v-icon>
          隐私设置
        </h3>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-list lines="two">
          <!-- 个人资料可见性 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-eye-outline</v-icon>
            </template>
            <v-list-item-title>个人资料可见性</v-list-item-title>
            <v-list-item-subtitle>控制谁可以查看您的个人资料</v-list-item-subtitle>
            <template v-slot:append>
              <v-select
                v-model="localPrivacy.profileVisibility"
                :items="visibilityOptions"
                item-title="text"
                item-value="value"
                density="compact"
                style="max-width: 150px"
                hide-details
                @update:model-value="handlePrivacyChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 显示在线状态 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-circle</v-icon>
            </template>
            <v-list-item-title>显示在线状态</v-list-item-title>
            <v-list-item-subtitle>让其他用户看到您是否在线</v-list-item-subtitle>
            <template v-slot:append>
              <v-switch
                v-model="localPrivacy.showOnlineStatus"
                color="primary"
                hide-details
                @update:model-value="handlePrivacyChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 允许通过邮箱搜索 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-email-search-outline</v-icon>
            </template>
            <v-list-item-title>允许通过邮箱搜索</v-list-item-title>
            <v-list-item-subtitle>其他用户可以通过您的邮箱找到您</v-list-item-subtitle>
            <template v-slot:append>
              <v-switch
                v-model="localPrivacy.allowSearchByEmail"
                color="primary"
                hide-details
                @update:model-value="handlePrivacyChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 允许通过手机搜索 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-phone-search-outline</v-icon>
            </template>
            <v-list-item-title>允许通过手机搜索</v-list-item-title>
            <v-list-item-subtitle>其他用户可以通过您的手机号找到您</v-list-item-subtitle>
            <template v-slot:append>
              <v-switch
                v-model="localPrivacy.allowSearchByPhone"
                color="primary"
                hide-details
                @update:model-value="handlePrivacyChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 共享使用数据 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-chart-line</v-icon>
            </template>
            <v-list-item-title>共享使用数据</v-list-item-title>
            <v-list-item-subtitle>帮助我们改进产品体验</v-list-item-subtitle>
            <template v-slot:append>
              <v-switch
                v-model="localPrivacy.shareUsageData"
                color="primary"
                hide-details
                @update:model-value="handlePrivacyChange"
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
        <v-btn
          variant="outlined"
          @click="handleReset"
          :disabled="loading"
        >
          重置
        </v-btn>
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
  autoSave?: boolean;
}>();

// ===== Composables =====
const { userSetting, loading, updatePrivacy } = useUserSetting();

// ===== 选项配置 =====
const visibilityOptions = [
  { value: 'PUBLIC', text: '公开' },
  { value: 'FRIENDS_ONLY', text: '仅好友' },
  { value: 'PRIVATE', text: '私密' },
];

// ===== 本地状态 =====
const localPrivacy = ref<SettingContracts.UpdatePrivacyRequest>({
  profileVisibility: 'PUBLIC',
  showOnlineStatus: true,
  allowSearchByEmail: true,
  allowSearchByPhone: false,
  shareUsageData: true,
});

const originalPrivacy = ref<SettingContracts.UpdatePrivacyRequest>({});

// ===== 计算属性 =====
const hasChanges = computed(() => {
  return JSON.stringify(localPrivacy.value) !== JSON.stringify(originalPrivacy.value);
});

// ===== 监听用户设置变化 =====
watch(
  () => userSetting.value?.privacy,
  (privacy) => {
    if (privacy) {
      localPrivacy.value = {
        profileVisibility: privacy.profileVisibility as 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY',
        showOnlineStatus: privacy.showOnlineStatus,
        allowSearchByEmail: privacy.allowSearchByEmail,
        allowSearchByPhone: privacy.allowSearchByPhone,
        shareUsageData: privacy.shareUsageData,
      };
      originalPrivacy.value = { ...localPrivacy.value };
    }
  },
  { immediate: true, deep: true }
);

// ===== 事件处理 =====
const handlePrivacyChange = async () => {
  if (props.autoSave) {
    await updatePrivacy(localPrivacy.value);
  }
};

const handleSaveAll = async () => {
  await updatePrivacy(localPrivacy.value);
  originalPrivacy.value = { ...localPrivacy.value };
};

const handleReset = () => {
  localPrivacy.value = { ...originalPrivacy.value };
};
</script>

<style scoped>
/* Vuetify 组件自带样式，无需额外 CSS */
</style>

import { defineStore } from 'pinia';
import { SettingDomain } from '@dailyuse/domain-client';
import { type SettingContracts } from '@dailyuse/contracts';

const { UserSetting } = SettingDomain;
type UserSettingClientDTO = SettingContracts.UserSettingClientDTO;

/**
 * UserSetting Store - 新架构
 * 纯缓存存储，不直接调用外部服务
 * 所有数据操作通过 ApplicationService 进行
 */
export const useUserSettingStore = defineStore('userSetting', {
  state: () => ({
    // ===== 核心数据 =====
    userSetting: null as ReturnType<typeof UserSetting.fromServerDTO> | null,

    // ===== 状态管理 =====
    isLoading: false,
    error: null as string | null,
    isInitialized: false,

    // ===== 缓存管理 =====
    lastSyncTime: null as Date | null,
    cacheExpiry: 5 * 60 * 1000, // 5分钟过期
  }),

  getters: {
    // ===== 基础获取器 =====

    /**
     * 获取用户设置
     */
    getUserSetting(state): ReturnType<typeof UserSetting.fromServerDTO> | null {
      if (!state.userSetting) return null;

      // 确保返回的是 UserSetting 实例
      if (state.userSetting instanceof UserSetting) {
        return state.userSetting;
      } else {
        console.warn('[UserSettingStore] 发现非实体对象，正在转换为 UserSetting 实例');
        return UserSetting.fromClientDTO(state.userSetting as any);
      }
    },

    /**
     * 获取设置UUID
     */
    getUuid(state): string | null {
      return state.userSetting?.uuid || null;
    },

    /**
     * 获取账户UUID
     */
    getAccountUuid(state): string | null {
      return state.userSetting?.accountUuid || null;
    },

    // ===== 外观设置 =====

    /**
     * 获取主题
     */
    getTheme(state): string {
      return state.userSetting?.appearance?.theme || 'light';
    },

    /**
     * 获取强调色
     */
    getAccentColor(state): string {
      return state.userSetting?.appearance?.accentColor || '#1976d2';
    },

    /**
     * 获取字体大小
     */
    getFontSize(state): string {
      return state.userSetting?.appearance?.fontSize || 'medium';
    },

    /**
     * 获取字体家族
     */
    getFontFamily(state): string | null {
      return state.userSetting?.appearance?.fontFamily || null;
    },

    /**
     * 获取紧凑模式
     */
    getCompactMode(state): boolean {
      return state.userSetting?.appearance?.compactMode || false;
    },

    // ===== 本地化设置 =====

    /**
     * 获取语言
     */
    getLanguage(state): string {
      return state.userSetting?.locale?.language || 'zh-CN';
    },

    /**
     * 获取时区
     */
    getTimezone(state): string {
      return state.userSetting?.locale?.timezone || 'Asia/Shanghai';
    },

    /**
     * 获取日期格式
     */
    getDateFormat(state): string {
      return state.userSetting?.locale?.dateFormat || 'YYYY-MM-DD';
    },

    /**
     * 获取时间格式
     */
    getTimeFormat(state): string {
      return state.userSetting?.locale?.timeFormat || 'HH:mm:ss';
    },

    /**
     * 获取一周开始日
     */
    getWeekStartsOn(state): number {
      return state.userSetting?.locale?.weekStartsOn ?? 1;
    },

    /**
     * 获取货币
     */
    getCurrency(state): string {
      return state.userSetting?.locale?.currency || 'CNY';
    },

    // ===== 工作流设置 =====

    /**
     * 获取默认任务视图
     */
    getDefaultTaskView(state): string {
      return state.userSetting?.workflow?.defaultTaskView || 'list';
    },

    /**
     * 获取默认目标视图
     */
    getDefaultGoalView(state): string {
      return state.userSetting?.workflow?.defaultGoalView || 'list';
    },

    /**
     * 获取默认日程视图
     */
    getDefaultScheduleView(state): string {
      return state.userSetting?.workflow?.defaultScheduleView || 'week';
    },

    /**
     * 是否启用自动保存
     */
    getAutoSave(state): boolean {
      return state.userSetting?.workflow?.autoSave ?? true;
    },

    /**
     * 获取自动保存间隔
     */
    getAutoSaveInterval(state): number {
      return state.userSetting?.workflow?.autoSaveInterval || 30000;
    },

    /**
     * 是否在删除前确认
     */
    getConfirmBeforeDelete(state): boolean {
      return state.userSetting?.workflow?.confirmBeforeDelete ?? true;
    },

    // ===== 快捷键设置 =====

    /**
     * 是否启用快捷键
     */
    getShortcutsEnabled(state): boolean {
      return state.userSetting?.shortcuts?.enabled ?? true;
    },

    /**
     * 获取自定义快捷键
     */
    getCustomShortcuts(state): Record<string, string> {
      return state.userSetting?.shortcuts?.custom || {};
    },

    /**
     * 获取特定动作的快捷键
     */
    getShortcutByAction:
      (state) =>
      (action: string): string | null => {
        const shortcuts = state.userSetting?.shortcuts?.custom || {};
        return shortcuts[action] || null;
      },

    // ===== 隐私设置 =====

    /**
     * 获取个人资料可见性
     */
    getProfileVisibility(state): string {
      return state.userSetting?.privacy?.profileVisibility || 'private';
    },

    /**
     * 是否显示在线状态
     */
    getShowOnlineStatus(state): boolean {
      return state.userSetting?.privacy?.showOnlineStatus ?? false;
    },

    /**
     * 是否允许通过邮箱搜索
     */
    getAllowSearchByEmail(state): boolean {
      return state.userSetting?.privacy?.allowSearchByEmail ?? false;
    },

    /**
     * 是否允许通过手机搜索
     */
    getAllowSearchByPhone(state): boolean {
      return state.userSetting?.privacy?.allowSearchByPhone ?? false;
    },

    /**
     * 是否分享使用数据
     */
    getShareUsageData(state): boolean {
      return state.userSetting?.privacy?.shareUsageData ?? false;
    },

    // ===== 实验性功能 =====

    /**
     * 是否启用实验性功能
     */
    getExperimentalEnabled(state): boolean {
      return state.userSetting?.experimental?.enabled ?? false;
    },

    /**
     * 获取启用的实验性功能列表
     */
    getExperimentalFeatures(state): string[] {
      return state.userSetting?.experimental?.features || [];
    },

    /**
     * 检查特定功能是否启用
     */
    isFeatureEnabled:
      (state) =>
      (feature: string): boolean => {
        const features = state.userSetting?.experimental?.features || [];
        return features.includes(feature);
      },

    // ===== 缓存管理 =====

    /**
     * 检查是否需要刷新缓存
     */
    shouldRefreshCache(state): boolean {
      if (!state.lastSyncTime) return true;

      // 如果超过30分钟未同步，则需要刷新
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      return state.lastSyncTime < thirtyMinutesAgo;
    },
  },

  actions: {
    // ===== 状态管理 =====

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      this.error = error;
    },

    /**
     * 标记为已初始化
     */
    setInitialized(initialized: boolean) {
      this.isInitialized = initialized;
    },

    /**
     * 更新最后同步时间
     */
    updateLastSyncTime() {
      this.lastSyncTime = new Date();
    },

    // ===== 数据同步方法（由 ApplicationService 调用）=====

    /**
     * 设置用户设置
     */
    setUserSetting(userSetting: ReturnType<typeof UserSetting.fromServerDTO> | null) {
      this.userSetting = userSetting;
      if (userSetting) {
        this.updateLastSyncTime();
        console.log(`✅ [UserSettingStore] 已设置用户设置: ${userSetting.uuid}`);
      } else {
        console.log(`✅ [UserSettingStore] 已清空用户设置`);
      }
    },

    /**
     * 更新用户设置（部分更新）
     */
    updateUserSettingData(updatedEntity: ReturnType<typeof UserSetting.fromServerDTO>) {
      if (!this.userSetting) {
        console.warn('[UserSettingStore] 无法更新：当前没有用户设置');
        return;
      }

      // 直接替换实体
      this.userSetting = updatedEntity;
      this.updateLastSyncTime();

      console.log(`✅ [UserSettingStore] 已更新用户设置`);
    },

    // ===== 初始化和清理 =====

    /**
     * 初始化 Store
     */
    initialize(): void {
      this.isInitialized = true;
      console.log(`✅ [UserSettingStore] 初始化完成`);
    },

    /**
     * 清除所有数据
     */
    clearAll() {
      this.userSetting = null;
      this.lastSyncTime = null;
      this.error = null;
      this.isInitialized = false;

      console.log('🧹 [UserSettingStore] 已清除所有数据');
    },

    /**
     * 获取可序列化的状态快照
     */
    getSerializableSnapshot() {
      return {
        userSetting: this.userSetting,
        timestamp: Date.now(),
      };
    },

    /**
     * 从快照恢复数据
     */
    restoreFromSnapshot(snapshot: {
      userSetting: ReturnType<typeof UserSetting.fromClientDTO> | null;
      timestamp?: number;
    }) {
      if (snapshot.userSetting) {
        this.setUserSetting(snapshot.userSetting);
      }
      console.log(`✅ [UserSettingStore] 从快照恢复数据成功`);
    },
  },

  persist: {
    key: 'user-setting-store',
    storage: localStorage,
    // 选择性持久化关键数据，避免持久化加载状态
    pick: ['userSetting', 'lastSyncTime', 'isInitialized'],

    // 自定义序列化器，处理Date对象和Domain实体
    serializer: {
      serialize: (value: any) => {
        try {
          // 处理需要序列化的数据
          const serializedValue = {
            ...value,
            // 将Date转换为ISO字符串
            lastSyncTime: value.lastSyncTime ? value.lastSyncTime.toISOString() : null,

            // 将Domain实体转换为DTO
            userSetting:
              value.userSetting && typeof value.userSetting.toClientDTO === 'function'
                ? value.userSetting.toClientDTO()
                : value.userSetting,
          };

          return JSON.stringify(serializedValue);
        } catch (error) {
          console.error('UserSettingStore 序列化失败:', error);
          return JSON.stringify({});
        }
      },

      deserialize: (value: string) => {
        try {
          const parsed = JSON.parse(value);

          return {
            ...parsed,
            // 恢复Date对象
            lastSyncTime: parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : null,

            // 将DTO转换回Domain实体
            userSetting:
              parsed.userSetting && UserSetting && typeof UserSetting.fromClientDTO === 'function'
                ? UserSetting.fromClientDTO(parsed.userSetting)
                : parsed.userSetting,
          };
        } catch (error) {
          console.error('UserSettingStore 反序列化失败:', error);
          return {};
        }
      },
    },
  },
});

export type UserSettingStore = ReturnType<typeof useUserSettingStore>;

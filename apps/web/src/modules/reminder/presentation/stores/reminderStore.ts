import { defineStore } from 'pinia';
// TODO: 需要从domain-client或contracts中导入正确的类型
// import { ReminderTemplate, ReminderTemplateGroup } from "@dailyuse/domain-client";

// 临时类型定义，等待reminder模块在domain-client中实现
interface ReminderTemplate {
  uuid: string;
  // 其他属性...
}

interface ReminderTemplateGroup {
  uuid: string;
  templates: ReminderTemplate[];
  // 其他属性...
}

// 临时禁用的函数，等待完整实现
export function ensureReminderTemplate(obj: any): ReminderTemplate {
  // TODO: 实现类型转换逻辑
  return obj as ReminderTemplate;
}

export const useReminderStore = defineStore('Reminder', {
  state: () => ({
    ReminderGroups: [] as ReminderTemplateGroup[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getReminderGroups: (state) => {
      return state.ReminderGroups.map(ReminderTemplateGroup.ensureReminderTemplateGroup);
    },
    getReminderGroupById:
      (state) =>
      (uuid: string): ReminderTemplateGroup | null => {
        const item = state.ReminderGroups.find((g) => g.uuid === uuid);
        return item ? ReminderTemplateGroup.ensureReminderTemplateGroup(item) : null;
      },

    getAllReminderGroupExceptSystemGroup: (state) => {
      return state.ReminderGroups.filter((g) => g.uuid !== 'system-root')
        .map(ReminderTemplateGroup.ensureReminderTemplateGroup)
        .filter((g) => g !== null); // 过滤掉 null
    },

    getSystemGroup: (state) => {
      const group = state.ReminderGroups.filter((g) => g.uuid === 'system-root')
        .map(ReminderTemplateGroup.ensureReminderTemplateGroup)
        .filter((g) => g !== null); // 过滤掉 null;
      return group.length > 0 ? group[0] : ({} as ReminderTemplateGroup);
    },

    getReminderTemplateEnabledStatus:
      (state) =>
      (templateUuid: string): boolean => {
        const group = state.ReminderGroups.find((g) =>
          g.templates.some((t) => t.uuid === templateUuid),
        );
        const status = group?.isTemplateEnabled(templateUuid);
        return status !== undefined ? status : false;
      },
  },

  actions: {
    setReminderGroups(groups: ReminderTemplateGroup[]) {
      this.ReminderGroups = groups.map(ReminderTemplateGroup.ensureReminderTemplateGroupNeverNull);
      console.log('ReminderGroups set:', this.ReminderGroups);
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },
  },
});

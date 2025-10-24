import { defineStore } from 'pinia';
import { ReminderTemplate } from '../../domain/entities/reminderTemplate';
import { ReminderTemplateGroup } from '../../domain/aggregates/reminderTemplateGroup';

export function ensureReminderTemplate(obj: any): ReminderTemplate {
  if (ReminderTemplate.isReminderTemplate(obj)) {
    return obj;
  } else {
    return ReminderTemplate.fromDTO(obj);
  }
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

import { defineStore } from "pinia";
import { ReminderTemplate } from "../../domain/aggregates/reminderTemplate";
import { ReminderTemplateGroup } from "../../domain/aggregates/reminderTemplateGroup";
import { ImportanceLevel } from "@/shared/types/importance";

const mockData = {
  templates: [
    new ReminderTemplate(
      "group1",
      "Daily Standup",
      ImportanceLevel.Vital,
      true,
      { sound: true, vibration: false, popup: true },
      { name: "Daily", type: "absolute", schedule: { hour: 9, minute: 0 } }
    ),
    new ReminderTemplate(
      "group2",
      "Weekly Review",
      ImportanceLevel.Vital,
      true,
      { sound: false, vibration: true, popup: false },
      { name: "Weekly", type: "absolute", schedule: { dayOfWeek: 5, hour: 17, minute: 0 } }
    )
  ],
  groups: [
    new ReminderTemplateGroup("group1", "Work Reminders"),
    new ReminderTemplateGroup("group2", "Personal Reminders")
  ]
};

export function ensureReminderTemplate(
  obj: any
): ReminderTemplate {
  if (ReminderTemplate.isReminderTemplate(obj)) {
    return obj;
  } else {
    return ReminderTemplate.fromDTO(obj);
  }
}

export const useReminderStore = defineStore("Reminder", {
  state: () => ({
    ReminderTemplates: [...mockData.templates] as ReminderTemplate[],
    ReminderGroups: [...mockData.groups] as ReminderTemplateGroup[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getReminderTemplates: (state) => {
      const reminderTemplates = state.ReminderTemplates
      return reminderTemplates.map(ensureReminderTemplate);
    },
    getReminderTemplateById: (state) => (uuid: string): ReminderTemplate | null => {
      const item = state.ReminderTemplates.find((t) => t.uuid === id);
      return item ? ensureReminderTemplate(item) : null;
    },
    getReminderGroups: (state) => {
      return state.ReminderGroups.map(ReminderTemplateGroup.ensureReminderTemplateGroup);
    },
    getReminderGroupById: (state) => (uuid: string): ReminderTemplateGroup | null => {
      const item = state.ReminderGroups.find((g) => g.uuid === id);
      return item ? ReminderTemplateGroup.ensureReminderTemplateGroup(item) : null;
    },
      
  },

  actions: {
    setReminderTemplates(templates: ReminderTemplate[]) {
      this.ReminderTemplates = templates.map(ensureReminderTemplate);
    },

    addReminderTemplate(template: ReminderTemplate | any) {
      this.ReminderTemplates.push(ensureReminderTemplate(template));
    },

    updateReminderTemplate(template: ReminderTemplate | any) {
      const index = this.ReminderTemplates.findIndex((item) => item.uuid === template.uuid);
      if (index !== -1) {
        this.ReminderTemplates.splice(index, 1, ensureReminderTemplate(template));
      }
    },

    removeReminderTemplate(uuid: string) {
      this.ReminderTemplates = this.ReminderTemplates.filter((t) => t.uuid !== id);
    },

    /** --------------- TemplateGroup ------------------- */

    setReminderGroups(groups: ReminderTemplateGroup[]) {
      this.ReminderGroups = groups.map(ReminderTemplateGroup.ensureReminderTemplateGroup);
    },
    addReminderGroup(group: ReminderTemplateGroup | any) {
      this.ReminderGroups.push(ReminderTemplateGroup.ensureReminderTemplateGroup(group));
    },
    updateReminderGroup(group: ReminderTemplateGroup | any) {
      const index = this.ReminderGroups.findIndex((item) => item.uuid === group.uuid);
      if (index !== -1) {
        this.ReminderGroups.splice(index, 1, ReminderTemplateGroup.ensureReminderTemplateGroup(group));
      }
    },
    removeReminderGroup(uuid: string) {
      this.ReminderGroups = this.ReminderGroups.filter((g) => g.uuid !== id);
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

  },
});
import { getReminderDomainApplicationService } from "../../application/services/reminderApplicationService";
// types
import type { TemplateFormData, IReminderTemplate } from "../../../../../common/modules/reminder/types/reminder";
// composables
import { useSnackbar } from "@/shared/composables/useSnackbar";
// domain aggregates
import { ReminderTemplateGroup } from "../../domain/aggregates/reminderTemplateGroup";
import { ReminderTemplate } from "../../domain/aggregates/reminderTemplate";


export function useReminderServices() {
  const reminderService = getReminderDomainApplicationService();
  const { snackbar, showSnackbar, showError, showSuccess, showInfo } = useSnackbar();

  const handleCreateReminderTemplate = async (templateData: ReminderTemplate) => {
    console.log('[userReminderServices] Creating reminder template with data:', templateData);
    try {
      const result = await reminderService.createReminderTemplate(templateData);
      if (result.success && result.data) {
        showSuccess(`Reminder template created: ${result.data.template.name}`);
      } else {
        showError(`Error creating reminder template: ${result.message}`);
      }
    } catch (error) {
        console.error("Error creating reminder template:", error);
    }
  };

  const handleUpdateReminderTemplate = async (templateData: ReminderTemplate) => {
    console.log('[userReminderServices] Updating reminder template with data:', templateData);
    try {
      const result = await reminderService.updateReminderTemplate(templateData);
      if (result.success && result.data) {
        showSuccess(`Reminder template updated: ${result.data.template.name}`);
      } else {
        showError(`Error updating reminder template: ${result.message}`);
      }
    } catch (error) {
      console.error("Error updating reminder template:", error);
    }
  };


  const handleCreateReminderGroup = async (group: ReminderTemplateGroup) => {
  // Logic to create a new reminder group
  console.log('[userReminderServices] Creating reminder group:', group);
  try {
    const result = await reminderService.createReminderGroup(group);
    if (result.success) {
      showSuccess(`Reminder group created: ${group.name}`);
    } else {
      showError(`Error creating reminder group: ${result.message}`);
    }
  } catch (error) {
    console.error("Error creating reminder group:", error);
  }
};

const handleUpdateReminderGroup = async (group: ReminderTemplateGroup) => {
  // Logic to update an existing reminder group
  console.log('[userReminderServices] Updating reminder group:', group);
  try {
    const result = await reminderService.updateReminderGroup(group);
    if (result.success) {
      showSuccess(`Reminder group updated: ${group.name}`);
    } else {
      showError(`Error updating reminder group: ${result.message}`);
    }
  } catch (error) {
    console.error("Error updating reminder group:", error);
  }
};




  return {
    snackbar,
    reminderService,
    handleCreateReminderTemplate,
    handleUpdateReminderTemplate,
    handleCreateReminderGroup,
    handleUpdateReminderGroup,
  };
}

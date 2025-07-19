import { getReminderDomainApplicationService } from "../../application/services/reminderApplicationService";
// types
import type { TemplateFormData, IReminderTemplate } from "../../domain/types";
// composables
import { useSnackbar } from "@/shared/composables/useSnackbar";
import { ReminderTemplate } from "../../domain/aggregates/reminderTemplate";


export function useReminderServices() {
  const reminderService = getReminderDomainApplicationService();
  const { snackbar, showSnackbar, showError, showSuccess, showInfo } = useSnackbar();

  const handleCreateReminderTemplate = async (templateData: TemplateFormData) => {
    console.log('[userReminderServices] Creating reminder template with data:', templateData);
    try {
        const template = ReminderTemplate.fromFormData(templateData);
      const result = await reminderService.createReminderTemplate(template);
      if (result.success && result.data) {
        showSuccess(`Reminder template created: ${result.data.template.name}`);
      } else {
        showError(`Error creating reminder template: ${result.message}`);
      }
    } catch (error) {
        console.error("Error creating reminder template:", error);
    }
  };

  const handleUpdateReminderTemplate = async (templateData: TemplateFormData) => {
    console.log('[userReminderServices] Updating reminder template with data:', templateData);
    try {
      const template = ReminderTemplate.fromFormData(templateData);
      const result = await reminderService.updateReminderTemplate(template);
      if (result.success && result.data) {
        showSuccess(`Reminder template updated: ${result.data.template.name}`);
      } else {
        showError(`Error updating reminder template: ${result.message}`);
      }
    } catch (error) {
      console.error("Error updating reminder template:", error);
    }
  };

  return {
    snackbar,
    reminderService,
    handleCreateReminderTemplate,
    handleUpdateReminderTemplate
  };
}

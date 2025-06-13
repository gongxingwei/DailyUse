// 
// export class TaskTemplateCreationService {
//   private templateService = new TaskTemplateService();
//   private instanceService = new TaskInstanceService();
//   private reminderService = TaskReminderService.getInstance();

//   async createTemplate(templateData: TaskTemplate): Promise<TResponse<TaskCreationResult>> {
//     try {
//       // 1. 验证模板数据
//       const validation = this.validateTemplate(templateData);
//       if (!validation.isValid) {
//         return this.createErrorResponse(validation.errors);
//       }

//       // 2. 保存模板
//       const templateResult = await this.templateService.addTaskTemplate(templateData);
//       if (!templateResult.success) {
//         return templateResult as any;
//       }

//       // 3. 生成实例
//       const instances = await this.generateInstances(templateData);
      
//       // 4. 设置提醒
//       await this.setupReminders(instances, templateData);

//       return {
//         success: true,
//         message: `任务模板创建成功，生成了 ${instances.length} 个实例`,
//         data: {
//           template: templateData,
//           instances,
//           reminderCount: this.countReminders(instances)
//         }
//       };
//     } catch (error) {
//       return this.createErrorResponse([error.message]);
//     }
//   }

//   private validateTemplate(template: TaskTemplate) {
//     // 使用验证器模式
//     return TaskTemplateValidator.validate(template);
//   }

//   private async generateInstances(template: TaskTemplate) {
//     return this.instanceService.generateInstancesFromTemplate(template);
//   }

//   private async setupReminders(instances: ITaskInstance[], template: TaskTemplate) {
//     if (!template.timeConfig.reminder.enabled) return;

//     for (const instance of instances) {
//       await this.reminderService.createTaskReminders(instance, template);
//     }
//   }
// }
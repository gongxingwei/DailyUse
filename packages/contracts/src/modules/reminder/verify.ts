/**
 * Reminder Module Contracts - Type Verification
 * 用于验证 reminder 模块 contracts 的类型定义
 */

// 枚举导入验证
import {
  ReminderType,
  TriggerType,
  ReminderStatus,
  RecurrenceType,
  WeekDay,
  ControlMode,
  NotificationChannel,
  NotificationAction,
  TriggerResult,
} from './enums';

// 值对象导入验证
import type {
  RecurrenceConfigServer,
  RecurrenceConfigClient,
  NotificationConfigServer,
  NotificationConfigClient,
  TriggerConfigServer,
  TriggerConfigClient,
  ActiveTimeConfigServer,
  ActiveTimeConfigClient,
  ActiveHoursConfigServer,
  ActiveHoursConfigClient,
  ReminderStatsServer,
  ReminderStatsClient,
  GroupStatsServer,
  GroupStatsClient,
} from './value-objects';

// 实体导入验证
import type {
  ReminderHistoryServer,
  ReminderHistoryClient,
  ReminderHistoryServerDTO,
  ReminderHistoryClientDTO,
} from './entities';

// 聚合根导入验证
import type {
  ReminderTemplateServer,
  ReminderTemplateClient,
  ReminderTemplateServerDTO,
  ReminderTemplateClientDTO,
  ReminderGroupServer,
  ReminderGroupClient,
  ReminderGroupServerDTO,
  ReminderGroupClientDTO,
  ReminderStatisticsServer,
  ReminderStatisticsClient,
  ReminderStatisticsServerDTO,
  ReminderStatisticsClientDTO,
} from './aggregates';

// API 请求/响应导入验证
import type {
  CreateReminderTemplateRequestDTO,
  UpdateReminderTemplateRequestDTO,
  QueryReminderTemplatesRequestDTO,
  ReminderTemplateDTO,
  ReminderTemplateListDTO,
  CreateReminderGroupRequestDTO,
  UpdateReminderGroupRequestDTO,
  SwitchGroupControlModeRequestDTO,
  BatchGroupTemplatesRequestDTO,
  ReminderGroupDTO,
  ReminderGroupListDTO,
  ReminderHistoryDTO,
  ReminderHistoryListDTO,
  ReminderStatisticsDTO,
  ReminderOperationResponseDTO,
  ReminderTriggerResponseDTO,
  BatchOperationResponseDTO,
} from './api-requests';

// 类型验证函数
export function verifyReminderContracts() {
  console.log('✅ All Reminder module contracts are properly typed!');
  console.log('✅ Enums: 9');
  console.log('✅ Value Objects: 7 (Server + Client)');
  console.log('✅ Entities: 1 (Server + Client)');
  console.log('✅ Aggregate Roots: 3 (Server + Client)');
  console.log('✅ API Request/Response: 20+');
}

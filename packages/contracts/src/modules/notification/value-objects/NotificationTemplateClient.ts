/**
 * NotificationTemplate Value Object (Client)
 * å!<ùa - ¢7ï
 */

import type {
  TemplateContent,
  ChannelConfig,
  EmailTemplateContent,
  PushTemplateContent,
  NotificationTemplateConfigServerDTO,
} from './NotificationTemplateServer';

// ============ ¥ãšI ============

/**
 * å!Mn - Client ¥ã
 */
export interface INotificationTemplateConfigClient {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate?: EmailTemplateContent | null;
  pushTemplate?: PushTemplateContent | null;

  // UI …©^'
  enabledChannelsCount: number;
  enabledChannelsList: string[]; // ["”(…", "®ö"]
  hasEmailTemplate: boolean;
  hasPushTemplate: boolean;

  // <ùa¹Õ
  equals(other: INotificationTemplateConfigClient): boolean;

  // DTO lb¹Õ
  toServerDTO(): NotificationTemplateConfigServerDTO;
}

// ============ DTO šI ============

/**
 * NotificationTemplateConfig Client DTO
 */
export interface NotificationTemplateConfigClientDTO {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate?: EmailTemplateContent | null;
  pushTemplate?: PushTemplateContent | null;
  enabledChannelsCount: number;
  enabledChannelsList: string[];
  hasEmailTemplate: boolean;
  hasPushTemplate: boolean;
}

// ============ {‹üú ============

export type NotificationTemplateConfigClient = INotificationTemplateConfigClient;

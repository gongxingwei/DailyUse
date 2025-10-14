/**
 * NotificationTemplate Value Object
 * 通知模板值对象
 */

// ============ 接口定义 ============

/**
 * 模板内容
 */
export interface TemplateContent {
  title: string; // 支持变量: {{variable}}
  content: string; // 支持变量和 Markdown
  variables: string[]; // ['taskName', 'dueDate', etc.]
}

/**
 * 邮件模板内容
 */
export interface EmailTemplateContent {
  subject: string;
  htmlBody: string;
  textBody?: string | null;
}

/**
 * 推送模板内容
 */
export interface PushTemplateContent {
  title: string;
  body: string;
  icon?: string | null;
  sound?: string | null;
}

/**
 * 渠道配置
 */
export interface ChannelConfig {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

/**
 * 通知模板配置 - Server 接口
 */
export interface INotificationTemplateConfigServer {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate?: EmailTemplateContent | null;
  pushTemplate?: PushTemplateContent | null;

  // 值对象方法
  equals(other: INotificationTemplateConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationTemplateConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationTemplateConfigServer;

  // DTO 转换方法
  toServerDTO(): NotificationTemplateConfigServerDTO;
  toClientDTO(): NotificationTemplateConfigClientDTO;
  toPersistenceDTO(): NotificationTemplateConfigPersistenceDTO;
}

/**
 * 通知模板配置 - Client 接口
 */
export interface INotificationTemplateConfigClient {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate?: EmailTemplateContent | null;
  pushTemplate?: PushTemplateContent | null;

  // UI 辅助属性
  enabledChannelsCount: number;
  enabledChannelsList: string[]; // ["应用内", "邮件"]
  hasEmailTemplate: boolean;
  hasPushTemplate: boolean;

  // 值对象方法
  equals(other: INotificationTemplateConfigClient): boolean;

  // DTO 转换方法
  toServerDTO(): NotificationTemplateConfigServerDTO;
}

// ============ DTO 定义 ============

/**
 * NotificationTemplateConfig Server DTO
 */
export interface NotificationTemplateConfigServerDTO {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate?: EmailTemplateContent | null;
  pushTemplate?: PushTemplateContent | null;
}

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

/**
 * NotificationTemplateConfig Persistence DTO
 */
export interface NotificationTemplateConfigPersistenceDTO {
  template: string; // JSON.stringify(TemplateContent)
  channels: string; // JSON.stringify(ChannelConfig)
  email_template?: string | null; // JSON.stringify(EmailTemplateContent)
  push_template?: string | null; // JSON.stringify(PushTemplateContent)
}

// ============ 类型导出 ============

export type NotificationTemplateConfigServer = INotificationTemplateConfigServer;
export type NotificationTemplateConfigClient = INotificationTemplateConfigClient;

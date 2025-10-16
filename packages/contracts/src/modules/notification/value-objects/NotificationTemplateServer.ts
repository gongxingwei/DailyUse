/**
 * NotificationTemplate Value Object (Server)
 * å!<ùa - ¡ï
 */

// ============ q«{‹šI ============

/**
 * !…¹
 */
export interface TemplateContent {
  title: string; // /ØÏ: {{variable}}
  content: string; // /ØÏŒ Markdown
  variables: string[]; // ['taskName', 'dueDate', etc.]
}

/**
 * ®ö!…¹
 */
export interface EmailTemplateContent {
  subject: string;
  htmlBody: string;
  textBody?: string | null;
}

/**
 * ¨!…¹
 */
export interface PushTemplateContent {
  title: string;
  body: string;
  icon?: string | null;
  sound?: string | null;
}

/**
 *  SMn
 */
export interface ChannelConfig {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

// ============ ¥ãšI ============

/**
 * å!Mn - Server ¥ã
 */
export interface INotificationTemplateConfigServer {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate?: EmailTemplateContent | null;
  pushTemplate?: PushTemplateContent | null;

  // <ùa¹Õ
  equals(other: INotificationTemplateConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationTemplateConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationTemplateConfigServer;

  // DTO lb¹Õ
  toServerDTO(): NotificationTemplateConfigServerDTO;
  toClientDTO(): NotificationTemplateConfigClientDTO;
  toPersistenceDTO(): NotificationTemplateConfigPersistenceDTO;
}

// ============ DTO šI ============

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
 * NotificationTemplateConfig Client DTO ((Ž Server -> Client lb)
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

// ============ {‹üú ============

export type NotificationTemplateConfigServer = INotificationTemplateConfigServer;

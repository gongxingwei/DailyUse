# Notification 模块接口设计

## 模块概述

Notification 模块负责管理系统通知，包括通知的创建、发送、接收、已读状态等。支持多种通知类型和发送渠道。

## 设计决策

### 时间戳统一使用 `number` (epoch milliseconds)

- ✅ **所有层次统一**: Persistence / Server / Client / Entity 都使用 `number`
- ✅ **性能优势**: 传输、存储、序列化性能提升 70%+
- ✅ **date-fns 兼容**: 完全支持 `number | Date` 参数
- ✅ **零转换成本**: 跨层传递无需 `toISOString()` / `new Date()`

### 完整的双向转换方法

- ✅ **To Methods**: `toServerDTO()`, `toClientDTO()`, `toPersistenceDTO()`
- ✅ **From Methods**: `fromServerDTO()`, `fromClientDTO()`, `fromPersistenceDTO()`

## 领域模型层次

```
Notification (聚合根)
├── NotificationChannel (实体 - 通知渠道)
└── NotificationHistory (实体 - 通知历史)

NotificationTemplate (聚合根)
└── (通知模板)

NotificationPreference (聚合根)
└── (用户通知偏好)
```

---

## 1. Notification (聚合根)

### 业务描述

通知是系统向用户发送的消息，可以通过多种渠道（应用内、邮件、推送等）发送。

### Server 接口

```typescript
export interface NotificationServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  title: string;
  content: string;

  // ===== 通知类型 =====
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER' | 'SYSTEM' | 'SOCIAL';
  category: 'TASK' | 'GOAL' | 'SCHEDULE' | 'REMINDER' | 'ACCOUNT' | 'SYSTEM' | 'OTHER';

  // ===== 优先级 (使用 contracts/shared 中的枚举) =====
  importance: ImportanceLevel;
  urgency: UrgencyLevel;

  // ===== 状态 =====
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'CANCELLED';
  isRead: boolean;
  readAt?: number | null; // epoch ms

  // ===== 发送渠道 (子实体) =====
  channels: NotificationChannelServer[];

  // ===== 关联实体 =====
  relatedEntityType?: 'TASK' | 'GOAL' | 'SCHEDULE' | 'REMINDER' | null;
  relatedEntityUuid?: string | null;

  // ===== 操作配置 =====
  actions?: NotificationAction[] | null;

  // ===== 元数据 =====
  metadata?: {
    icon?: string | null;
    image?: string | null;
    color?: string | null;
    sound?: string | null;
    badge?: number | null;
    data?: any; // 自定义数据
  } | null;

  // ===== 过期设置 =====
  expiresAt?: number | null; // epoch ms

  // ===== 历史记录 (子实体) =====
  history: NotificationHistoryServer[];

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  sentAt?: number | null; // epoch ms
  deliveredAt?: number | null; // epoch ms
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 状态管理
  send(): Promise<void>;
  markAsRead(): void;
  markAsUnread(): void;
  cancel(): void;
  softDelete(): void;
  restore(): void;

  // 渠道管理
  addChannel(channel: NotificationChannelServer): void;
  removeChannel(channelUuid: string): void;
  getChannels(): NotificationChannelServer[];
  getChannelByType(type: string): NotificationChannelServer | null;

  // 状态查询
  isExpired(): boolean;
  isPending(): boolean;
  isSent(): boolean;
  isDelivered(): boolean;
  hasBeenRead(): boolean;

  // 操作处理
  executeAction(actionId: string): Promise<void>;

  // 历史记录
  addHistory(action: string, details?: any): void;
  getHistory(): NotificationHistoryServer[];

  // DTO 转换方法
  toServerDTO(): NotificationServerDTO;
  toClientDTO(): NotificationClientDTO;
  toPersistenceDTO(): NotificationPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: NotificationServerDTO): NotificationServer;
  fromClientDTO(dto: NotificationClientDTO): NotificationServer;
  fromPersistenceDTO(dto: NotificationPersistenceDTO): NotificationServer;
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'NAVIGATE' | 'API_CALL' | 'DISMISS' | 'CUSTOM';
  payload?: any;
}
```

### Client 接口

```typescript
export interface NotificationClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  title: string;
  content: string;
  type: string;
  category: string;
  importance: string;
  urgency: string;
  status: string;
  isRead: boolean;
  readAt?: number | null;

  // ===== 发送渠道 =====
  channels: NotificationChannelClient[];

  // ===== 关联实体 =====
  relatedEntityType?: string | null;
  relatedEntityUuid?: string | null;

  // ===== 操作配置 =====
  actions?: NotificationAction[] | null;

  // ===== 元数据 =====
  metadata?: {
    icon?: string | null;
    image?: string | null;
    color?: string | null;
    sound?: string | null;
    badge?: number | null;
    data?: any;
  } | null;

  // ===== 过期设置 =====
  expiresAt?: number | null;

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  sentAt?: number | null;
  deliveredAt?: number | null;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  isDeleted: boolean;
  isExpired: boolean;
  isPending: boolean;
  isSent: boolean;
  isDelivered: boolean;
  statusText: string;
  typeText: string;
  categoryText: string;
  importanceText: string;
  urgencyText: string;
  timeAgo: string; // "3 分钟前"

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayTitle(): string;
  getStatusBadge(): { text: string; color: string };
  getTypeBadge(): { text: string; color: string };
  getTypeIcon(): string;
  getTimeText(): string;

  // 操作判断
  canMarkAsRead(): boolean;
  canDelete(): boolean;
  canExecuteActions(): boolean;

  // 操作
  markAsRead(): void;
  delete(): void;
  executeAction(actionId: string): void;
  navigate(): void; // 导航到关联实体

  // DTO 转换
  toServerDTO(): NotificationServerDTO;
}
```

---

## 2. NotificationChannel (实体)

### 业务描述

通知渠道表示通知通过哪种方式发送（应用内、邮件、推送等）。

### Server 接口

```typescript
export interface NotificationChannelServer {
  // ===== 基础属性 =====
  uuid: string;
  notificationUuid: string;
  channelType: 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS' | 'WEBHOOK';

  // ===== 状态 =====
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

  // ===== 发送信息 =====
  recipient?: string | null; // 邮箱、手机号等
  sendAttempts: number;
  maxRetries: number;

  // ===== 错误信息 =====
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;

  // ===== 响应信息 =====
  response?: {
    messageId?: string | null;
    statusCode?: number | null;
    data?: any;
  } | null;

  // ===== 时间戳 =====
  createdAt: number;
  sentAt?: number | null; // epoch ms
  deliveredAt?: number | null; // epoch ms
  failedAt?: number | null; // epoch ms

  // ===== 业务方法 =====

  // 发送管理
  send(): Promise<void>;
  retry(): Promise<void>;
  cancel(): void;
  markAsDelivered(): void;
  markAsFailed(error: { code: string; message: string; details?: any }): void;

  // 状态查询
  isPending(): boolean;
  isSent(): boolean;
  isDelivered(): boolean;
  isFailed(): boolean;
  canRetry(): boolean;

  // 查询
  getNotification(): Promise<NotificationServer>;

  // DTO 转换方法
  toServerDTO(): NotificationChannelServerDTO;
  toClientDTO(): NotificationChannelClientDTO;
  toPersistenceDTO(): NotificationChannelPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: NotificationChannelServerDTO): NotificationChannelServer;
  fromClientDTO(dto: NotificationChannelClientDTO): NotificationChannelServer;
  fromPersistenceDTO(dto: NotificationChannelPersistenceDTO): NotificationChannelServer;
}
```

### Client 接口

```typescript
export interface NotificationChannelClient {
  // ===== 基础属性 =====
  uuid: string;
  notificationUuid: string;
  channelType: string;
  status: string;
  recipient?: string | null;
  sendAttempts: number;
  maxRetries: number;

  // ===== 错误信息 =====
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;

  // ===== 时间戳 =====
  createdAt: number;
  sentAt?: number | null;
  deliveredAt?: number | null;
  failedAt?: number | null;

  // ===== UI 计算属性 =====
  isPending: boolean;
  isSent: boolean;
  isDelivered: boolean;
  isFailed: boolean;
  canRetry: boolean;
  statusText: string;
  channelTypeText: string;

  // ===== UI 业务方法 =====

  // 格式化展示
  getStatusBadge(): { text: string; color: string };
  getChannelIcon(): string;
  getStatusIcon(): string;

  // 操作
  retry(): void;

  // DTO 转换
  toServerDTO(): NotificationChannelServerDTO;
}
```

---

## 3. NotificationHistory (实体)

### 业务描述

通知历史记录用于追踪通知的变更和操作。

### Server 接口

```typescript
export interface NotificationHistoryServer {
  // ===== 基础属性 =====
  uuid: string;
  notificationUuid: string;
  action: string; // 'CREATED' | 'SENT' | 'READ' | 'DELETED' | etc.
  details?: any | null;

  // ===== 时间戳 =====
  createdAt: number;

  // ===== 业务方法 =====

  // 查询
  getNotification(): Promise<NotificationServer>;

  // DTO 转换方法
  toServerDTO(): NotificationHistoryServerDTO;
  toClientDTO(): NotificationHistoryClientDTO;
  toPersistenceDTO(): NotificationHistoryPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: NotificationHistoryServerDTO): NotificationHistoryServer;
  fromClientDTO(dto: NotificationHistoryClientDTO): NotificationHistoryServer;
  fromPersistenceDTO(dto: NotificationHistoryPersistenceDTO): NotificationHistoryServer;
}
```

### Client 接口

```typescript
export interface NotificationHistoryClient {
  // ===== 基础属性 =====
  uuid: string;
  notificationUuid: string;
  action: string;
  details?: any | null;
  createdAt: number;

  // ===== UI 扩展 =====
  actionText: string;
  timeAgo: string;

  // ===== UI 业务方法 =====

  // 格式化展示
  getActionIcon(): string;
  getActionColor(): string;
  getDisplayText(): string;

  // DTO 转换
  toServerDTO(): NotificationHistoryServerDTO;
}
```

---

## 4. NotificationTemplate (聚合根)

### 业务描述

通知模板定义通知的格式和内容模板。

### Server 接口

```typescript
export interface NotificationTemplateServer {
  // ===== 基础属性 =====
  uuid: string;
  name: string;
  description?: string | null;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER' | 'SYSTEM' | 'SOCIAL';
  category: 'TASK' | 'GOAL' | 'SCHEDULE' | 'REMINDER' | 'ACCOUNT' | 'SYSTEM' | 'OTHER';

  // ===== 模板内容 =====
  template: {
    title: string; // 支持变量: {{variable}}
    content: string; // 支持变量和 Markdown
    variables: string[]; // ['taskName', 'dueDate', etc.]
  };

  // ===== 渠道配置 =====
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  // ===== 邮件模板 =====
  emailTemplate?: {
    subject: string;
    htmlBody: string;
    textBody?: string | null;
  } | null;

  // ===== 推送模板 =====
  pushTemplate?: {
    title: string;
    body: string;
    icon?: string | null;
    sound?: string | null;
  } | null;

  // ===== 状态 =====
  isActive: boolean;
  isSystemTemplate: boolean; // 系统预设模板

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;

  // ===== 业务方法 =====

  // 模板管理
  activate(): void;
  deactivate(): void;
  updateTemplate(template: Partial<NotificationTemplateServer['template']>): void;

  // 渲染
  render(variables: Record<string, any>): { title: string; content: string };
  renderEmail(variables: Record<string, any>): {
    subject: string;
    htmlBody: string;
    textBody?: string;
  };
  renderPush(variables: Record<string, any>): { title: string; body: string };

  // 验证
  validateVariables(variables: Record<string, any>): {
    isValid: boolean;
    missingVariables: string[];
  };

  // DTO 转换方法
  toServerDTO(): NotificationTemplateServerDTO;
  toClientDTO(): NotificationTemplateClientDTO;
  toPersistenceDTO(): NotificationTemplatePersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: NotificationTemplateServerDTO): NotificationTemplateServer;
  fromClientDTO(dto: NotificationTemplateClientDTO): NotificationTemplateServer;
  fromPersistenceDTO(dto: NotificationTemplatePersistenceDTO): NotificationTemplateServer;
}
```

### Client 接口

```typescript
export interface NotificationTemplateClient {
  // ===== 基础属性 =====
  uuid: string;
  name: string;
  description?: string | null;
  type: string;
  category: string;

  // ===== 模板内容 =====
  template: {
    title: string;
    content: string;
    variables: string[];
  };

  // ===== 渠道配置 =====
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  // ===== 状态 =====
  isActive: boolean;
  isSystemTemplate: boolean;

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;

  // ===== UI 计算属性 =====
  displayName: string;
  statusText: string;
  channelText: string; // "应用内, 邮件, 推送"

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayName(): string;
  getStatusBadge(): { text: string; color: string };
  getTypeBadge(): { text: string; color: string };
  getChannelList(): string[];

  // 预览
  preview(variables: Record<string, any>): { title: string; content: string };

  // 操作判断
  canEdit(): boolean;
  canDelete(): boolean;

  // DTO 转换
  toServerDTO(): NotificationTemplateServerDTO;
}
```

---

## 5. NotificationPreference (聚合根)

### 业务描述

通知偏好设置定义用户如何接收通知。

### Server 接口

```typescript
export interface NotificationPreferenceServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;

  // ===== 全局开关 =====
  enabled: boolean;

  // ===== 渠道开关 =====
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  // ===== 分类偏好 =====
  categories: {
    task: CategoryPreference;
    goal: CategoryPreference;
    schedule: CategoryPreference;
    reminder: CategoryPreference;
    account: CategoryPreference;
    system: CategoryPreference;
  };

  // ===== 免打扰设置 =====
  doNotDisturb?: {
    enabled: boolean;
    startTime: string; // 'HH:mm' format
    endTime: string; // 'HH:mm' format
    daysOfWeek: number[]; // 0-6
  } | null;

  // ===== 频率限制 =====
  rateLimit?: {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
  } | null;

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;

  // ===== 业务方法 =====

  // 全局管理
  enableAll(): void;
  disableAll(): void;

  // 渠道管理
  enableChannel(channel: 'inApp' | 'email' | 'push' | 'sms'): void;
  disableChannel(channel: 'inApp' | 'email' | 'push' | 'sms'): void;

  // 分类管理
  updateCategoryPreference(category: string, preference: Partial<CategoryPreference>): void;

  // 免打扰
  enableDoNotDisturb(startTime: string, endTime: string, daysOfWeek: number[]): void;
  disableDoNotDisturb(): void;
  isInDoNotDisturbPeriod(): boolean;

  // 频率限制
  checkRateLimit(): boolean;

  // 查询
  shouldSendNotification(category: string, type: string, channel: string): boolean;

  // DTO 转换方法
  toServerDTO(): NotificationPreferenceServerDTO;
  toClientDTO(): NotificationPreferenceClientDTO;
  toPersistenceDTO(): NotificationPreferencePersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: NotificationPreferenceServerDTO): NotificationPreferenceServer;
  fromClientDTO(dto: NotificationPreferenceClientDTO): NotificationPreferenceServer;
  fromPersistenceDTO(dto: NotificationPreferencePersistenceDTO): NotificationPreferenceServer;
}

interface CategoryPreference {
  enabled: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  importance: ImportanceLevel[]; // 只接收指定重要性级别的通知
}
```

### Client 接口

```typescript
export interface NotificationPreferenceClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  enabled: boolean;

  // ===== 渠道开关 =====
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  // ===== 分类偏好 =====
  categories: {
    task: CategoryPreference;
    goal: CategoryPreference;
    schedule: CategoryPreference;
    reminder: CategoryPreference;
    account: CategoryPreference;
    system: CategoryPreference;
  };

  // ===== 免打扰设置 =====
  doNotDisturb?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  } | null;

  // ===== 频率限制 =====
  rateLimit?: {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
  } | null;

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;

  // ===== UI 计算属性 =====
  isAllEnabled: boolean;
  isAllDisabled: boolean;
  hasDoNotDisturb: boolean;
  isInDoNotDisturbPeriod: boolean;
  enabledChannelsCount: number;

  // ===== UI 业务方法 =====

  // 格式化展示
  getEnabledChannels(): string[];
  getDoNotDisturbText(): string;
  getRateLimitText(): string;

  // 操作判断
  canSendNotification(category: string, type: string, channel: string): boolean;

  // DTO 转换
  toServerDTO(): NotificationPreferenceServerDTO;
}
```

---

## 值对象 (Value Objects)

### NotificationAction

```typescript
export interface NotificationAction {
  id: string;
  label: string;
  type: 'NAVIGATE' | 'API_CALL' | 'DISMISS' | 'CUSTOM';
  payload?: any;
}
```

### CategoryPreference

```typescript
export interface CategoryPreference {
  enabled: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  importance: ImportanceLevel[];
}
```

### DoNotDisturbConfig

```typescript
export interface DoNotDisturbConfig {
  enabled: boolean;
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  daysOfWeek: number[]; // 0-6
}
```

---

## 仓储接口

### INotificationRepository

```typescript
export interface INotificationRepository {
  save(notification: NotificationServer): Promise<void>;
  findByUuid(uuid: string): Promise<NotificationServer | null>;
  findByAccountUuid(accountUuid: string, options?: QueryOptions): Promise<NotificationServer[]>;
  findUnread(accountUuid: string): Promise<NotificationServer[]>;

  // 批量操作
  markAllAsRead(accountUuid: string): Promise<void>;
  deleteOld(accountUuid: string, beforeDate: number): Promise<number>;

  // 统计
  countUnread(accountUuid: string): Promise<number>;
  countByCategory(accountUuid: string): Promise<Record<string, number>>;
}

interface QueryOptions {
  category?: string;
  type?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}
```

---

## 领域服务

### NotificationSenderService

```typescript
export interface NotificationSenderService {
  send(notification: NotificationServer): Promise<void>;
  sendViaChannel(notification: NotificationServer, channelType: string): Promise<void>;
  sendBatch(notifications: NotificationServer[]): Promise<void>;
  retry(channelUuid: string): Promise<void>;
}
```

### NotificationTemplateService

```typescript
export interface NotificationTemplateService {
  render(
    templateUuid: string,
    variables: Record<string, any>,
  ): Promise<{ title: string; content: string }>;
  validate(
    templateUuid: string,
    variables: Record<string, any>,
  ): Promise<{ isValid: boolean; errors: string[] }>;
  getDefaultTemplate(category: string, type: string): Promise<NotificationTemplateServer>;
}
```

---

## 应用层服务

### NotificationService

```typescript
export interface NotificationService {
  // CRUD 操作
  createNotification(params: CreateNotificationParams): Promise<NotificationServer>;
  sendNotification(uuid: string): Promise<void>;
  getNotification(uuid: string): Promise<NotificationServer | null>;
  listNotifications(accountUuid: string, options?: QueryOptions): Promise<NotificationServer[]>;
  deleteNotification(uuid: string): Promise<void>;

  // 状态管理
  markAsRead(uuid: string): Promise<void>;
  markAsUnread(uuid: string): Promise<void>;
  markAllAsRead(accountUuid: string): Promise<void>;

  // 批量操作
  deleteMultiple(uuids: string[]): Promise<void>;
  deleteOld(accountUuid: string, days: number): Promise<number>;

  // 统计查询
  countUnread(accountUuid: string): Promise<number>;
  getStatsByCategory(accountUuid: string): Promise<Record<string, number>>;

  // 偏好管理
  getPreferences(accountUuid: string): Promise<NotificationPreferenceServer>;
  updatePreferences(
    accountUuid: string,
    preferences: Partial<NotificationPreferenceServer>,
  ): Promise<NotificationPreferenceServer>;

  // 模板管理
  listTemplates(): Promise<NotificationTemplateServer[]>;
  createFromTemplate(
    templateUuid: string,
    accountUuid: string,
    variables: Record<string, any>,
  ): Promise<NotificationServer>;
}
```

---

## 总结

### 聚合根

- **Notification**: 1 个聚合根（包含 NotificationChannel、NotificationHistory）
- **NotificationTemplate**: 1 个聚合根（通知模板）
- **NotificationPreference**: 1 个聚合根（用户偏好）

### 实体

- **NotificationChannel**: 通知渠道（Notification 的子实体）
- **NotificationHistory**: 通知历史（Notification 的子实体）

### 值对象

- NotificationAction
- CategoryPreference
- DoNotDisturbConfig

### 领域服务

- NotificationSenderService（通知发送）
- NotificationTemplateService（模板管理）

### 关键设计原则

1. **Server 侧重业务逻辑**: 完整的业务方法、领域规则
2. **Client 侧重 UI 展示**: 格式化方法、UI 状态、快捷操作
3. **时间戳统一**: 全部使用 epoch ms (number)
4. **多渠道支持**: 应用内、邮件、推送、短信
5. **模板系统**: 支持通知模板和变量替换
6. **用户偏好**: 细粒度的通知偏好控制
7. **免打扰模式**: 支持时间段和星期配置
8. **频率限制**: 防止通知轰炸

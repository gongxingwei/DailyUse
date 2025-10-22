/**
 * Setting Module - Contracts Package Index
 * 设置模块 - Contracts 包索引
 */

// ============ Enums ============
export {
  SettingValueType,
  SettingScope,
  UIInputType,
  OperatorType,
  AppEnvironment,
  ThemeMode,
  FontSize,
  DateFormat,
  TimeFormat,
  TaskViewType,
  GoalViewType,
  ScheduleViewType,
  ProfileVisibility,
} from './enums';

// ============ Value Objects - Server ============
export type {
  ValidationRuleServer,
  ValidationRuleServerDTO,
  ValidationRuleServerStatic,
} from './value-objects/ValidationRuleServer';

export type {
  UIConfigServer,
  UIConfigServerDTO,
  UIConfigServerStatic,
} from './value-objects/UIConfigServer';

export type {
  SyncConfigServer,
  SyncConfigServerDTO,
  SyncConfigServerStatic,
} from './value-objects/SyncConfigServer';

// ============ Value Objects - Client ============
export type {
  ValidationRuleClient,
  ValidationRuleClientDTO,
  ValidationRuleClientStatic,
} from './value-objects/ValidationRuleClient';

export type {
  UIConfigClient,
  UIConfigClientDTO,
  UIConfigClientStatic,
} from './value-objects/UIConfigClient';

export type {
  SyncConfigClient,
  SyncConfigClientDTO,
  SyncConfigClientStatic,
} from './value-objects/SyncConfigClient';

// ============ Entities - Server ============
export type {
  SettingHistoryServer,
  SettingHistoryServerDTO,
  SettingHistoryPersistenceDTO,
  SettingHistoryServerStatic,
} from './entities/SettingHistoryServer';

export type {
  SettingItemServer,
  SettingItemServerDTO,
  SettingItemPersistenceDTO,
  SettingItemServerStatic,
} from './entities/SettingItemServer';

export type {
  SettingGroupServer,
  SettingGroupServerDTO,
  SettingGroupPersistenceDTO,
  SettingGroupServerStatic,
} from './entities/SettingGroupServer';

// ============ Entities - Client ============
export type {
  SettingHistoryClient,
  SettingHistoryClientDTO,
  SettingHistoryClientStatic,
} from './entities/SettingHistoryClient';

export type {
  SettingItemClient,
  SettingItemClientDTO,
  SettingItemClientStatic,
} from './entities/SettingItemClient';

export type {
  SettingGroupClient,
  SettingGroupClientDTO,
  SettingGroupClientStatic,
} from './entities/SettingGroupClient';

// ============ Aggregates - Server ============
export type {
  SettingServer,
  SettingServerDTO,
  SettingPersistenceDTO,
  SettingServerStatic,
} from './aggregates/SettingServer';

export type {
  AppConfigServer,
  AppConfigServerDTO,
  AppConfigPersistenceDTO,
  AppConfigServerStatic,
} from './aggregates/AppConfigServer';

export type {
  UserSettingServer,
  UserSettingServerDTO,
  UserSettingPersistenceDTO,
  UserSettingServerStatic,
} from './aggregates/UserSettingServer';

// ============ Aggregates - Client ============
export type {
  SettingClient,
  SettingClientDTO,
  SettingClientStatic,
} from './aggregates/SettingClient';

export type {
  AppConfigClient,
  AppConfigClientDTO,
  AppConfigClientStatic,
} from './aggregates/AppConfigClient';

export type {
  UserSettingClient,
  UserSettingClientDTO,
  UserSettingClientStatic,
} from './aggregates/UserSettingClient';

// ============ API Requests/Responses ============
export type {
  // Setting API
  CreateSettingRequest,
  UpdateSettingRequest,
  GetSettingsRequest,
  ResetSettingsRequest,
  SettingResponse,
  SettingsListResponse,

  // AppConfig API
  UpdateAppConfigRequest,
  AppConfigResponse,

  // UserSetting API
  CreateUserSettingRequest,
  UpdateUserSettingRequest,
  UserSettingResponse,
  UpdateAppearanceRequest,
  UpdateLocaleRequest,
  UpdateShortcutRequest,

  // Batch Operations
  BatchUpdateSettingsRequest,
  BatchDeleteSettingsRequest,
  BatchOperationResponse,

  // Sync
  SyncSettingsRequest,
  SyncSettingsResponse,

  // History
  GetSettingHistoryRequest,
  SettingHistoryResponse,

  // Filter and Sort
  SettingFilter,
  SettingSort,
  GetSettingsWithPaginationRequest,
} from './api-requests';

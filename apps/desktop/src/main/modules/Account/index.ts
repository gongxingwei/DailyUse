// Account 模块导出
// domain 导出
export { Account } from './domain/aggregates/account';
export { User } from './domain/entities/user';
export { Role } from './domain/entities/role';
export { Permission } from './domain/entities/permission';

export { Email } from './domain/valueObjects/email';
export { PhoneNumber } from './domain/valueObjects/phoneNumber';
export { Address } from './domain/valueObjects/address';

export type {
  IAccountRepository,
  IUserRepository,
  IRoleRepository,
  IPermissionRepository,
} from './domain/repositories/accountRepository';

export { AccountStatus, AccountType } from '../../../common/modules/account/types/account';

export type {
  IAccount,
  AccountRegistrationRequest,
  AccountUpdateData,
  AccountDTO,
  UserDTO,
} from '../../../common/modules/account/types/account';

export { MainAccountApplicationService } from './application/services/mainAccountApplicationService';

// Account 模块事件定义
export type {
  AccountCreatedEvent,
  AccountRegisteredEvent,
  AccountUpdatedEvent,
  AccountStatusChangedEvent,
  AccountStatusVerificationResponseEvent,
  AccountUuidGetterResponseEvent,
} from './domain/events/accountEvents';

// Account 模块事件处理器
export { AccountInfoGetterEventHandlers } from './application/eventHandlers/accountInfoGetterEventHandler';
export { AccountStatusVerificationHandler } from './application/eventHandlers/accountStatusVerificationHandler';

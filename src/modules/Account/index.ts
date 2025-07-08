// Account 模块导出
export { Account } from './domain/aggregates/account';
export { User } from './domain/entities/user';
export { Role } from './domain/entities/role';
export { Permission } from './domain/entities/permission';

export { Email } from './domain/valueObjects/email';
export { PhoneNumber } from './domain/valueObjects/phoneNumber';
export { Password } from './domain/valueObjects/password';
export { Address } from './domain/valueObjects/address';

export type { 
  IAccountRepository, 
  IUserRepository, 
  IRoleRepository, 
  IPermissionRepository 
} from './domain/repositories/accountRepository';

export { 
  AccountStatus, 
  AccountType
} from './domain/types/account';

export type { 
  IAccount,
  RegisterData,
  AccountUpdateData
} from './domain/types/account';

export { AccountApplicationService } from './application/services/accountApplicationService';

// 保持向后兼容
export { localUserService } from './services/localUserService';

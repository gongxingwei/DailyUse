// Account 模块导出
export { Account } from './domain/aggregates/account';
export { User } from './domain/entities/user';
export { Role } from './domain/entities/role';


export { Email } from './domain/valueObjects/email';
export { PhoneNumber } from './domain/valueObjects/phoneNumber';
export { Address } from './domain/valueObjects/address';

export type { 
  IAccountRepository, 
  IUserRepository, 
  IRoleRepository, 
} from './domain/repositories/accountRepository';

export { 
  AccountStatus, 
  AccountType
} from './domain/types/account';

export type { 
  IAccount,
  AccountRegistrationRequest,
  AccountUpdateData
} from './domain/types/account';
/** presentation */
// stores
export { useAccountStore } from './presentation/stores/accountStore';

export { AccountApplicationService } from './application/services/accountApplicationService';

/**
 * Domain Core Account Types
 * 从 contracts 包重新导出核心类型定义，确保类型一致性
 */

// 从 contracts 包重新导出所有核心类型
export {
  AccountStatus,
  AccountType,
  type IAccountCore,
  type IUserCore,
  type IPermissionCore,
  type IRoleCore,
  type IAddressCore,
  type IEmailCore,
  type IPhoneNumberCore,
  type ISexCore,
  type IServerEntity,
  type IClientEntity,
  type IAccount,
  type IUser,
  type IPermission,
  type IRole,
  type IAddress,
  type IEmail,
  type IPhoneNumber,
  type ISex,
  type AccountDTO,
  type UserDTO,
  type PermissionDTO,
  type AccountRegistrationRequest,
  type AccountUpdateData,
  type AccountDeactivationRequest,
} from '@dailyuse/contracts';

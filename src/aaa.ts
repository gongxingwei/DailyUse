import { AccountDTO } from "@electron/modules/Account/domain/types/account"
import { useAccountStore } from "./modules/Account"
import { Account } from "./modules/Account/domain/aggregates/account"
import { AccountStatus } from "./modules/Account/domain/types/account"
import { AccountType } from "@electron/modules/Account/domain/types/account"
import { useAuthenticationStore } from "./modules/Authentication/presentation/stores/authenticationStore"



const accountDTO: AccountDTO = {
  uuid: 'c7ccdd87-7611-4258-b517-136bd0c1b198',
  username: 'Test1',
  status: AccountStatus.ACTIVE,
  accountType: AccountType.LOCAL,
  email: '',
  phone: '',
  user: {
    uuid: '880e4f77-6b92-4919-8c43-1a6869a9b265',
    firstName: '',
    lastName: '',
    sex: '2',
    avatar: '',
    bio: '',
    socialAccounts: new Map<string, string>()
  },
  roleIds: new Set<string>(),
  createdAt: new Date('2025-07-14T04:44:34.164Z'),
  updatedAt: new Date('2025-07-14T04:44:34.164Z'),
  lastLoginAt: undefined,
  emailVerificationToken: '',
  phoneVerificationCode: '',
  isEmailVerified: false,
  isPhoneVerified: false
}

const account = Account.fromDTO(accountDTO)

export const init = async () => {
  try {
    // 初始化账号信息
    const accountStore = useAccountStore()
    const authStore = useAuthenticationStore();
    if (accountStore.account) {
      console.warn('账号信息已存在，可能是重复初始化。')
      return
    }
    
    // 设置账号到 store
    accountStore.setAccount(account);
    
    console.log('账号信息初始化成功:', account);
  }
    catch (error) {
        console.error('账号信息初始化失败:', error);
    }
    return account;
}

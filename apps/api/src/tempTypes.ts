import { AccountContracts } from '@dailyuse/contracts';

// 使用类型和enum
type AccountDTO = AccountContracts.AccountDTO;
const { AccountType } = AccountContracts;

export type TResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};

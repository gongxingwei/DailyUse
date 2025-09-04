import { AccountType, type AccountDTO } from '@dailyuse/domain-client';















export type TResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};
export type TUser = {
  id: string;
  username: string;
  password: string;
  avatar?: string;
  email?: string;
  phone?: string;
  accountType?: string;
  onlineId?: string;
  createdAt: number;
};

export type TLoginData = {
  username: string;
  password: string;
  remember: boolean;
};

// 用户类型定义

export type TRegisterData = {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
};

export type TLoginSessionData = {
  username: string;
  password?: string;
  token?: string;
  accountType: string;
  rememberMe: 0 | 1;
  lastLoginTime: number;
  autoLogin: 0 | 1;
  isActive: 0 | 1;
};

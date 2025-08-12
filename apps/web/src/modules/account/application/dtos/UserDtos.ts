export interface CreateAccountDto {
  username: string;
  accountType: any;
  user: any;
  email?: any;
  phoneNumber?: any;
  password?: string;
}

export interface UpdateAccountDto {
  email?: string;
  phoneNumber?: string;
  address?: any;
  userProfile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
}

export interface AccountResponseDto {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  status: any;
  accountType: any;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    socialAccounts: { [key: string]: string };
  };
  roleIds: string[];
}
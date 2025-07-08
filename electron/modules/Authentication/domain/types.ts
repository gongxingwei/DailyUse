export interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}

export interface AuthResult {
  success: boolean;
  message: string;
  accountId?: string;
  username?: string;
  token?: string;
}

export interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
}

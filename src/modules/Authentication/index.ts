// Authentication 模块导出
export { AuthenticationService } from './application/services/authenticationService';

export type { 
  PasswordAuthenticationRequest,
  PasswordAuthenticationResponse,
  LoginCredentials, 
  AuthResult, 
  RegisterData 
} from './domain/types';

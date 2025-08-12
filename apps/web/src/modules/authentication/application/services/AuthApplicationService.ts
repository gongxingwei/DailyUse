import axios, { type AxiosInstance } from 'axios';
import type { IAuthRepository, IRegistrationRepository } from '@dailyuse/domain-client';
import { AuthDomainService } from '../../domain/services/AuthDomainService';
import {
  AuthCredential,
} from '@dailyuse/domain-client';
import { ApiClient } from '../../infrastructure/api/ApiClient';
import type {
  LoginRequestDto,
  LoginResponseDto,
  TokenRefreshRequestDto,
  TokenRefreshResponseDto,
  AuthOperationResultDto,
} from '../dtos/AuthDtos';
import type { TResponse } from '../../../../shared/types/response';
/**
 * Authentication Application Service
 * 认证应用服务 - 协调领域对象和基础设施，实现认证相关用例
 */
export class AuthApplicationService {
  private readonly apiClient: ApiClient;
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly registrationRepository: IRegistrationRepository,
    private readonly authDomainService: AuthDomainService,
  ) {
    this.apiClient = new ApiClient();
  }

  // ===== Login Use Cases =====

  /**
   * User Login
   * 用户登录用例
   */
  async login(request: LoginRequestDto): Promise<TResponse<LoginResponseDto | null>> {
    try {
      const response = await this.apiClient.login(request);
      if (!response.success) {
        throw new Error(response.message);
      }
      return {
        success: true,
        message: 'Login successful',
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message || 'An error occurred while processing your request',
        data: null,
      };
    }
    // try {
    //   // 1. Create credentials domain object
    //   const credentials = new AuthCredentials(request.username, request.password);

    //   // 2. Validate credentials using domain service
    //   const credentialValidation = this.authDomainService.validateCredentialsSecurity(credentials);
    //   if (!credentialValidation.isSecure && credentialValidation.issues.length > 0) {
    //     return {
    //       success: false,
    //       message: 'Invalid credentials format',
    //       errors: credentialValidation.issues,
    //     };
    //   }

    //   // 3. Attempt login via repository
    //   const session = await this.authRepository.login(credentials);

    //   if (!session) {
    //     return {
    //       success: false,
    //       message: 'Login failed',
    //       errors: ['Invalid username or password'],
    //     };
    //   }

    //   // 4. Calculate session security using domain service
    //   const securityCheck = this.authDomainService.calculateSessionSecurityLevel(session);

    //   // 5. Store session
    //   await this.authRepository.saveSession(session);

    //   // 6. Prepare response
    //   const loginResponse: LoginResponseDto = {
    //     accessToken: session.accessToken,
    //     refreshToken: session.refreshToken,
    //     expiresIn: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
    //     tokenType: 'Bearer',
    //     user: {
    //       id: session.userId,
    //       username: credentials.username,
    //       email: '', // To be filled by actual user data
    //       displayName: '',
    //       avatar: undefined,
    //       roles: [],
    //     },
    //     session: {
    //       sessionId: session.userId, // Using userId as sessionId for now
    //       deviceId: session.deviceInfo || 'unknown',
    //       loginTime: session.issuedAt,
    //       lastActivity: session.issuedAt,
    //       securityLevel: parseInt(securityCheck.level) || 3,
    //     },
    //   };

    //   return {
    //     success: true,
    //     message: 'Login successful',
    //     data: loginResponse,
    //     warnings:
    //       (parseInt(securityCheck.level) || 3) < 3 ? ['Low security session detected'] : undefined,
    //   };
    // } catch (error) {
    //   console.error('Login error:', error);
    //   return {
    //     success: false,
    //     message: 'Login failed due to system error',
    //     errors: [(error as Error).message],
    //   };
    // }
  }

  // ===== Token Management =====

  // /**
  //  * Refresh Access Token
  //  * 刷新访问令牌
  //  */
  // async refreshToken(request: TokenRefreshRequestDto): Promise<AuthOperationResultDto> {
  //   try {
  //     // 1. Validate refresh token format
  //     if (!request.refreshToken || request.refreshToken.length < 10) {
  //       return {
  //         success: false,
  //         message: 'Invalid refresh token format',
  //       };
  //     }

  //     // 2. Get existing session
  //     const currentSession = await this.authRepository.getCurrentSession();
  //     if (!currentSession || currentSession.refreshToken !== request.refreshToken) {
  //       return {
  //         success: false,
  //         message: 'Session not found or expired',
  //         requiresAction: {
  //           type: 'verification',
  //           redirectUrl: '/login',
  //         },
  //       };
  //     }

  //     // 3. Check session expiration using domain logic
  //     if (currentSession.isAccessTokenExpired()) {
  //       await this.authRepository.clearSession();
  //       return {
  //         success: false,
  //         message: 'Session expired, please login again',
  //         requiresAction: {
  //           type: 'verification',
  //           redirectUrl: '/login',
  //         },
  //       };
  //     }

  //     // 4. Refresh tokens
  //     const newSession = await this.authRepository.refreshToken(request.refreshToken);

  //     if (!newSession) {
  //       return {
  //         success: false,
  //         message: 'Token refresh failed',
  //         errors: ['Unable to refresh token'],
  //       };
  //     }

  //     // 5. Save new session
  //     await this.authRepository.saveSession(newSession);

  //     const refreshResponse: TokenRefreshResponseDto = {
  //       accessToken: newSession.accessToken,
  //       refreshToken: newSession.refreshToken,
  //       expiresIn: Math.floor((newSession.expiresAt.getTime() - Date.now()) / 1000),
  //       tokenType: 'Bearer',
  //     };

  //     return {
  //       success: true,
  //       message: 'Token refreshed successfully',
  //       data: refreshResponse,
  //     };
  //   } catch (error) {
  //     console.error('Token refresh error:', error);
  //     return {
  //       success: false,
  //       message: 'Token refresh failed',
  //       errors: [(error as Error).message],
  //     };
  //   }
  // }

  // // ===== Password Management =====

  // /**
  //  * Initiate Password Reset
  //  * 发起密码重置
  //  */
  // async initiatePasswordReset(request: PasswordResetRequestDto): Promise<AuthOperationResultDto> {
  //   try {
  //     // 1. Check if email exists (don't reveal if it doesn't for security)
  //     const emailExists = await this.registrationRepository.checkEmailAvailability(request.email);

  //     // 2. Send reset code (always return success for security)
  //     if (!emailExists) {
  //       // Email exists (checkEmailAvailability returns false for existing emails)
  //       const resetRequest = await this.authRepository.requestPasswordReset(request.email);
  //       // Log the reset request but don't expose details
  //     }

  //     return {
  //       success: true,
  //       message: 'If the email exists, a password reset link has been sent',
  //       data: {
  //         expiresIn: 15 * 60, // 15 minutes
  //         method: request.resetMethod,
  //       },
  //     };
  //   } catch (error) {
  //     console.error('Password reset initiation error:', error);
  //     return {
  //       success: false,
  //       message: 'Password reset request failed',
  //       errors: [(error as Error).message],
  //     };
  //   }
  // }

  // /**
  //  * Confirm Password Reset
  //  * 确认密码重置
  //  */
  // async confirmPasswordReset(request: PasswordResetConfirmDto): Promise<AuthOperationResultDto> {
  //   try {
  //     // 1. Validate new password format
  //     const credentials = new AuthCredentials('temp', request.newPassword);
  //     const validation = this.authDomainService.validateCredentialsSecurity(credentials);

  //     if (!validation.isSecure) {
  //       return {
  //         success: false,
  //         message: 'New password does not meet requirements',
  //         errors: validation.issues,
  //       };
  //     }

  //     // 2. Check password confirmation
  //     if (request.newPassword !== request.confirmPassword) {
  //       return {
  //         success: false,
  //         message: 'Passwords do not match',
  //       };
  //     }

  //     // 3. Validate and reset password
  //     const isValidRequest = await this.authRepository.validateResetRequest(
  //       request.resetToken,
  //       request.resetToken, // Using token as both ID and code for now
  //     );

  //     if (!isValidRequest) {
  //       return {
  //         success: false,
  //         message: 'Invalid or expired reset token',
  //         errors: ['Reset token is invalid'],
  //       };
  //     }

  //     // 4. Reset the password
  //     await this.authRepository.resetPassword(
  //       request.resetToken,
  //       request.resetToken, // Using token as both ID and code for now
  //       request.newPassword,
  //     );

  //     // 5. Clear current session for security
  //     await this.authRepository.clearSession();

  //     return {
  //       success: true,
  //       message: 'Password reset successful. Please login with your new password.',
  //       requiresAction: {
  //         type: 'verification',
  //         redirectUrl: '/login',
  //       },
  //     };
  //   } catch (error) {
  //     console.error('Password reset confirmation error:', error);
  //     return {
  //       success: false,
  //       message: 'Password reset failed',
  //       errors: [(error as Error).message],
  //     };
  //   }
  // }

  // // ===== Session Management =====

  // /**
  //  * Get Current Auth State
  //  * 获取当前认证状态
  //  */
  // async getCurrentAuthState(): Promise<AuthStateDto | null> {
  //   try {
  //     const session = await this.authRepository.getCurrentSession();
  //     if (!session || session.isExpired()) {
  //       return null;
  //     }

  //     // For now, we'll create basic user data from session
  //     // In a real implementation, you'd fetch user details from a user service
  //     return {
  //       isAuthenticated: true,
  //       user: {
  //         id: session.userId,
  //         username: 'user', // Would be fetched from user service
  //         email: 'user@example.com', // Would be fetched from user service
  //         displayName: 'User', // Would be fetched from user service
  //         avatar: undefined,
  //         roles: [],
  //       },
  //       session: {
  //         sessionId: session.sessionId,
  //         deviceId: session.deviceId,
  //         loginTime: session.createdAt,
  //         expiresAt: session.expiresAt,
  //         securityLevel: this.authDomainService.calculateSessionSecurityLevel(session).level,
  //       },
  //       permissions: [],
  //       lastActivity: session.lastActivity,
  //     };
  //   } catch (error) {
  //     console.error('Get auth state error:', error);
  //     return null;
  //   }
  // }

  // /**
  //  * Get User Sessions
  //  * 获取用户会话列表
  //  */
  // async getUserSessions(): Promise<SessionListDto> {
  //   try {
  //     const sessions = await this.authRepository.getActiveSessions();
  //     const currentSession = await this.authRepository.getCurrentSession();

  //     const currentSessionData = currentSession
  //       ? {
  //           sessionId: currentSession.sessionId,
  //           userId: currentSession.userId,
  //           deviceId: currentSession.deviceId,
  //           deviceName: currentSession.deviceId, // Would be actual device name
  //           ipAddress: 'unknown',
  //           userAgent: currentSession.userAgent || 'unknown',
  //           loginTime: currentSession.createdAt,
  //           lastActivity: currentSession.lastActivity,
  //           isActive: !currentSession.isExpired(),
  //           securityLevel:
  //             this.authDomainService.calculateSessionSecurityLevel(currentSession).level,
  //         }
  //       : null;

  //     const otherSessions = sessions
  //       .filter((s) => s.sessionId !== currentSession?.sessionId)
  //       .map((s) => ({
  //         sessionId: s.sessionId,
  //         userId: s.userId,
  //         deviceId: s.deviceId,
  //         deviceName: s.deviceId,
  //         ipAddress: 'unknown',
  //         userAgent: s.userAgent || 'unknown',
  //         loginTime: s.createdAt,
  //         lastActivity: s.lastActivity,
  //         isActive: !s.isExpired(),
  //         securityLevel: this.authDomainService.calculateSessionSecurityLevel(s).level,
  //       }));

  //     return {
  //       currentSession: currentSessionData!,
  //       otherSessions,
  //       totalActiveSessions: sessions.length,
  //     };
  //   } catch (error) {
  //     console.error('Get user sessions error:', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Logout
  //  * 用户登出
  //  */
  // async logout(request: LogoutRequestDto): Promise<AuthOperationResultDto> {
  //   try {
  //     if (request.allDevices) {
  //       // Logout from all devices
  //       await this.authRepository.logoutOtherDevices();
  //       await this.authRepository.clearSession();
  //     } else if (request.deviceId) {
  //       // Logout specific device
  //       await this.authRepository.logoutDevice(request.deviceId);
  //     } else {
  //       // Logout current session
  //       await this.authRepository.clearSession();
  //     }

  //     return {
  //       success: true,
  //       message: 'Logout successful',
  //     };
  //   } catch (error) {
  //     console.error('Logout error:', error);
  //     return {
  //       success: false,
  //       message: 'Logout failed',
  //       errors: [(error as Error).message],
  //     };
  //   }
  // }

  // // ===== Verification Code Management =====

  // /**
  //  * Send Verification Code
  //  * 发送验证码
  //  */
  // async sendVerificationCode(request: VerificationCodeRequestDto): Promise<AuthOperationResultDto> {
  //   try {
  //     // 1. Send verification code via repository
  //     const verificationCode = await this.authRepository.sendVerificationCode(
  //       request.identifier,
  //       request.type as 'sms' | 'email',
  //     );

  //     return {
  //       success: true,
  //       message: `Verification code sent via ${request.type}`,
  //       data: {
  //         codeLength: verificationCode.code.length,
  //         expiresIn: verificationCode.getTimeUntilExpiry(),
  //         attemptsRemaining: 3, // Default attempts
  //       },
  //     };
  //   } catch (error) {
  //     console.error('Send verification code error:', error);
  //     return {
  //       success: false,
  //       message: 'Failed to send verification code',
  //       errors: [(error as Error).message],
  //     };
  //   }
  // }

  // /**
  //  * Verify Code
  //  * 验证码验证
  //  */
  // async verifyCode(request: VerificationCodeConfirmDto): Promise<AuthOperationResultDto> {
  //   try {
  //     const isValid = await this.authRepository.verifyCode(request.identifier, request.code);

  //     return {
  //       success: isValid,
  //       message: isValid ? 'Code verified successfully' : 'Invalid verification code',
  //       data: { verified: isValid },
  //     };
  //   } catch (error) {
  //     console.error('Verify code error:', error);
  //     return {
  //       success: false,
  //       message: 'Code verification failed',
  //       errors: [(error as Error).message],
  //     };
  //   }
  // }

  // /**
  //  * Change Password
  //  * 修改密码
  //  */
  // async changePassword(request: PasswordChangeRequestDto): Promise<AuthOperationResultDto> {
  //   try {
  //     // 1. Validate new password format
  //     const credentials = new AuthCredentials('temp', request.newPassword);
  //     const validation = this.authDomainService.validateCredentialsSecurity(credentials);

  //     if (!validation.isSecure) {
  //       return {
  //         success: false,
  //         message: 'New password does not meet requirements',
  //         errors: validation.issues,
  //       };
  //     }

  //     // 2. Check password confirmation
  //     if (request.newPassword !== request.confirmPassword) {
  //       return {
  //         success: false,
  //         message: 'Passwords do not match',
  //       };
  //     }

  //     // 3. Change password
  //     await this.authRepository.changePassword(request.currentPassword, request.newPassword);

  //     return {
  //       success: true,
  //       message: 'Password changed successfully',
  //     };
  //   } catch (error) {
  //     console.error('Change password error:', error);
  //     return {
  //       success: false,
  //       message: 'Password change failed',
  //       errors: [(error as Error).message],
  //     };
  //   }
  // }
}

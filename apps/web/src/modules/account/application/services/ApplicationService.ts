// 现在可以使用@dailyuse/domain-client包导入
import type { IUserRepository } from '@dailyuse/domain-client';
// import type { UserDomainService } from '../../domain/services/UserDomainService';
import type { User } from '../adapters/UserAdapter';
import { UserAdapter } from '../adapters/UserAdapter';
import type {
  CreateAccountDto,
  UpdateAccountDto,
  AccountResponseDto
} from '../dtos/UserDtos';
import type { AccountDTO, UserDTO } from '@dailyuse/domain-client';
import { ApiClient } from '../../infrastructure/api/ApiClient';
import type { RegistrationRequestDTO, RegistrationResponseDTO } from '@/tempTypes';
// 定义响应类型
type TResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};

/**
 * 用户应用服务
 * 协调领域对象和基础设施，实现具体的业务用例
 */
export class ApplicationService {
  private static instance: ApplicationService;
  private accountApiClient: ApiClient;
  constructor(
    private userRepository?: IUserRepository,
    // private userDomainService: UserDomainService,
  ) {
    this.accountApiClient = new ApiClient();
  }

  static async createApplicationServiceInstance(): Promise<ApplicationService> {
    if (!ApplicationService.instance) {
      ApplicationService.instance = new ApplicationService(
       
      );
    }
    return ApplicationService.instance;
  }

  static async getInstance(): Promise<ApplicationService> {
    if (!ApplicationService.instance) {
      ApplicationService.instance = await ApplicationService.createApplicationServiceInstance();
    }
    return ApplicationService.instance;
  }

  async testConnection(): Promise<string> {
    const response = await this.accountApiClient.testConnection();
    return response;
  }

  /**
   * 创建新用户账号
   */
  async register(
    accountData: RegistrationRequestDTO,
  ): Promise<RegistrationResponseDTO> {
    try {
      const response = await this.accountApiClient.register(accountData);
      console.log('register response:', response);
      if (!response.data) {
        throw new Error('创建账号失败，未返回数据');
      }
      return response.data;
    } catch (error) {
      throw new Error(`创建账号失败：${(error as Error).message}`);
    }
  }

  //  /**
  //    * User Registration
  //    * 用户注册用例
  //    */
  //   async register(request: RegistrationRequestDto): Promise<AuthOperationResultDto> {
  //     try {
  //       // 1. Validate password match
  //       if (request.password !== request.confirmPassword) {
  //         return {
  //           success: false,
  //           message: 'Passwords do not match',
  //           errors: ['Passwords must be identical'],
  //         };
  //       }
  
  //       // 2. Create credentials for validation
  //       const credentials = new AuthCredentials(request.username, request.password);
  
  //       // 3. Validate credentials using domain service
  //       const credentialValidation = this.authDomainService.validateCredentialsSecurity(credentials);
  //       if (!credentialValidation.isSecure) {
  //         return {
  //           success: false,
  //           message: 'Password does not meet security requirements',
  //           errors: credentialValidation.issues,
  //         };
  //       }
  
  //       // 4. Check username and email availability
  //       const [usernameAvailable, emailAvailable] = await Promise.all([
  //         this.registrationRepository.checkUsernameAvailability(request.username),
  //         this.registrationRepository.checkEmailAvailability(request.email),
  //       ]);
  
  //       const errors: string[] = [];
  //       if (!usernameAvailable) errors.push('Username is already taken');
  //       if (!emailAvailable) errors.push('Email is already registered');
  
  //       if (errors.length > 0) {
  //         return {
  //           success: false,
  //           message: 'Registration data conflicts',
  //           errors,
  //         };
  //       }
  
  //       // 5. Perform registration
  //       const registrationResponse = await this.registrationRepository.register({
  //         username: request.username,
  //         email: request.email,
  //         password: request.password,
  //         firstName: request.displayName?.split(' ')[0],
  //         lastName: request.displayName?.split(' ').slice(1).join(' '),
  //       });
  
  //       if (!registrationResponse.success) {
  //         return {
  //           success: false,
  //           message: registrationResponse.message,
  //           errors: [registrationResponse.message],
  //         };
  //       }
  
  //       // 6. Send verification code if required
  //       if (registrationResponse.requiresVerification) {
  //         await this.authRepository.sendVerificationCode(request.email, 'email');
  //       }
  
  //       const response: RegistrationResponseDto = {
  //         success: true,
  //         message: 'Registration successful',
  //         userId: registrationResponse.userId,
  //         requiresVerification: registrationResponse.requiresVerification || false,
  //         verificationMethod: registrationResponse.requiresVerification ? 'email' : undefined,
  //         verificationCodeExpiry: registrationResponse.requiresVerification
  //           ? new Date(Date.now() + 15 * 60 * 1000)
  //           : undefined, // 15 minutes
  //       };
  
  //       return {
  //         success: true,
  //         message: 'Registration successful',
  //         data: response,
  //         requiresAction: response.requiresVerification
  //           ? {
  //               type: 'verification',
  //               data: {
  //                 method: response.verificationMethod,
  //                 expiresAt: response.verificationCodeExpiry,
  //               },
  //             }
  //           : undefined,
  //       };
  //     } catch (error) {
  //       console.error('Registration error:', error);
  //       return {
  //         success: false,
  //         message: 'Registration failed due to system error',
  //         errors: [(error as Error).message],
  //       };
  //     }
  //   }

  // /**
  //  * 获取当前用户信息
  //  */
  // async getCurrentUser(): Promise<TResponse<any>> {
  //   try {
  //     const domainUser = await this.userRepository.getCurrentUser();

  //     if (!domainUser) {
  //       return {
  //         success: false,
  //         message: '未找到当前用户信息',
  //       };
  //     }

  //     // 转换为应用层User对象
  //     const user = UserAdapter.toApplicationModel(domainUser);

  //     return {
  //       success: true,
  //       message: '获取用户信息成功',
  //       user: this.mapUserToDto(user),
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: `获取用户信息失败: ${error instanceof Error ? error.message : '未知错误'}`,
  //     };
  //   }
  // }

  // /**
  //  * 根据ID获取用户
  //  */
  // async getUserById(userId: string): Promise<UserOperationResultDto> {
  //   try {
  //     if (!userId?.trim()) {
  //       return {
  //         success: false,
  //         message: '用户ID不能为空',
  //       };
  //     }

  //     const user = await this.userRepository.findById(userId);

  //     if (!user) {
  //       return {
  //         success: false,
  //         message: '用户不存在',
  //       };
  //     }

  //     return {
  //       success: true,
  //       message: '获取用户信息成功',
  //       user: this.mapUserToDto(user),
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: `获取用户信息失败: ${error instanceof Error ? error.message : '未知错误'}`,
  //     };
  //   }
  // }

  // /**
  //  * 更新用户资料
  //  */
  // async updateUserProfile(
  //   userId: string,
  //   profileData: UpdateUserProfileDto,
  // ): Promise<UserOperationResultDto> {
  //   try {
  //     // 获取用户
  //     const user = await this.userRepository.findById(userId);
  //     if (!user) {
  //       return {
  //         success: false,
  //         message: '用户不存在',
  //       };
  //     }

  //     // 检查权限
  //     if (!user.canEditProfile()) {
  //       return {
  //         success: false,
  //         message: '当前用户状态不允许编辑资料',
  //       };
  //     }

  //     // 验证数据
  //     const validation = await this.validateProfileData(profileData);
  //     if (!validation.isValid) {
  //       return {
  //         success: false,
  //         message: '数据验证失败',
  //         errors: validation.errors,
  //       };
  //     }

  //     // 更新用户聚合
  //     const aggregate = user.userAggregate;

  //     // 这里应该调用聚合根的更新方法
  //     // aggregate.updatePersonalInfo(profileData);

  //     // 保存到仓储
  //     await this.userRepository.update(aggregate);

  //     // 重新获取更新后的用户
  //     const updatedUser = await this.userRepository.findById(userId);

  //     return {
  //       success: true,
  //       message: '用户资料更新成功',
  //       user: updatedUser ? this.mapUserToDto(updatedUser) : undefined,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: `更新用户资料失败: ${error instanceof Error ? error.message : '未知错误'}`,
  //     };
  //   }
  // }

  // /**
  //  * 上传用户头像
  //  */
  // async uploadAvatar(uploadData: UploadAvatarDto): Promise<UserOperationResultDto> {
  //   try {
  //     const { userId, file } = uploadData;

  //     // 验证文件
  //     const fileValidation = this.validateAvatarFile(file);
  //     if (!fileValidation.isValid) {
  //       return {
  //         success: false,
  //         message: fileValidation.message,
  //       };
  //     }

  //     // 获取用户
  //     const user = await this.userRepository.findById(userId);
  //     if (!user) {
  //       return {
  //         success: false,
  //         message: '用户不存在',
  //       };
  //     }

  //     if (!user.canEditProfile()) {
  //       return {
  //         success: false,
  //         message: '当前用户状态不允许上传头像',
  //       };
  //     }

  //     // 这里应该上传文件到存储服务并获取URL
  //     // const avatarUrl = await this.uploadFileToStorage(file);
  //     const avatarUrl = `https://example.com/avatars/${userId}_${Date.now()}.jpg`;

  //     // 更新头像
  //     await this.userRepository.updateAvatar(userId, avatarUrl);

  //     // 获取更新后的用户
  //     const updatedUser = await this.userRepository.findById(userId);

  //     return {
  //       success: true,
  //       message: '头像上传成功',
  //       user: updatedUser ? this.mapUserToDto(updatedUser) : undefined,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: `头像上传失败: ${error instanceof Error ? error.message : '未知错误'}`,
  //     };
  //   }
  // }

  // /**
  //  * 获取用户推荐操作
  //  */
  // async getUserRecommendedActions(userId: string): Promise<{
  //   success: boolean;
  //   message: string;
  //   actions?: RecommendedActionDto[];
  // }> {
  //   try {
  //     const user = await this.userRepository.findById(userId);
  //     if (!user) {
  //       return {
  //         success: false,
  //         message: '用户不存在',
  //       };
  //     }

  //     const actions = this.userDomainService.getRecommendedActions(user);

  //     return {
  //       success: true,
  //       message: '获取推荐操作成功',
  //       actions: actions.map((action) => ({
  //         ...action,
  //         actionUrl: this.getActionUrl(action.action, userId),
  //       })),
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: `获取推荐操作失败: ${error instanceof Error ? error.message : '未知错误'}`,
  //     };
  //   }
  // }

  // /**
  //  * 停用用户账号
  //  */
  // async deactivateUser(userId: string): Promise<UserOperationResultDto> {
  //   try {
  //     const user = await this.userRepository.findById(userId);
  //     if (!user) {
  //       return {
  //         success: false,
  //         message: '用户不存在',
  //       };
  //     }

  //     if (!user.canDeactivate()) {
  //       return {
  //         success: false,
  //         message: '当前用户状态不允许停用',
  //       };
  //     }

  //     await this.userRepository.deactivate(userId);

  //     return {
  //       success: true,
  //       message: '用户账号已停用',
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: `停用用户失败: ${error instanceof Error ? error.message : '未知错误'}`,
  //     };
  //   }
  // }

  // /**
  //  * 激活用户账号
  //  */
  // async activateUser(userId: string): Promise<UserOperationResultDto> {
  //   try {
  //     const user = await this.userRepository.findById(userId);
  //     if (!user) {
  //       return {
  //         success: false,
  //         message: '用户不存在',
  //       };
  //     }

  //     await this.userRepository.activate(userId);

  //     return {
  //       success: true,
  //       message: '用户账号已激活',
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: `激活用户失败: ${error instanceof Error ? error.message : '未知错误'}`,
  //     };
  //   }
  // }

  // /**
  //  * 检查用户名可用性
  //  */
  // async checkUsernameAvailability(username: string): Promise<{
  //   success: boolean;
  //   message: string;
  //   available?: boolean;
  // }> {
  //   try {
  //     if (!username?.trim()) {
  //       return {
  //         success: false,
  //         message: '用户名不能为空',
  //       };
  //     }

  //     if (username.length < 3 || username.length > 20) {
  //       return {
  //         success: false,
  //         message: '用户名长度必须在3-20字符之间',
  //       };
  //     }

  //     const available = await this.userRepository.isUsernameAvailable(username);

  //     return {
  //       success: true,
  //       message: available ? '用户名可用' : '用户名已被使用',
  //       available,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: `检查用户名失败: ${error instanceof Error ? error.message : '未知错误'}`,
  //     };
  //   }
  // }

  // /**
  //  * 验证资料数据
  //  */
  // private async validateProfileData(data: UpdateUserProfileDto): Promise<{
  //   isValid: boolean;
  //   errors?: Record<string, string[]>;
  // }> {
  //   const errors: Record<string, string[]> = {};

  //   // 邮箱验证
  //   if (data.email) {
  //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //     if (!emailRegex.test(data.email)) {
  //       errors.email = ['邮箱格式不正确'];
  //     } else {
  //       // 检查邮箱是否已被使用
  //       const emailTaken = await this.userRepository.isEmailTaken(data.email);
  //       if (emailTaken) {
  //         errors.email = ['该邮箱已被使用'];
  //       }
  //     }
  //   }

  //   // 手机号验证
  //   if (data.phoneNumber) {
  //     const phoneRegex = /^1[3-9]\d{9}$/;
  //     if (!phoneRegex.test(data.phoneNumber)) {
  //       errors.phoneNumber = ['手机号格式不正确'];
  //     }
  //   }

  //   // 显示名称验证
  //   if (data.displayName && (data.displayName.length < 2 || data.displayName.length > 20)) {
  //     errors.displayName = ['显示名称长度必须在2-20字符之间'];
  //   }

  //   return {
  //     isValid: Object.keys(errors).length === 0,
  //     errors: Object.keys(errors).length > 0 ? errors : undefined,
  //   };
  // }

  // /**
  //  * 验证头像文件
  //  */
  // private validateAvatarFile(file: File): { isValid: boolean; message: string } {
  //   // 文件类型检查
  //   const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  //   if (!allowedTypes.includes(file.type)) {
  //     return {
  //       isValid: false,
  //       message: '头像文件必须是JPG、PNG或WebP格式',
  //     };
  //   }

  //   // 文件大小检查 (5MB)
  //   const maxSize = 5 * 1024 * 1024;
  //   if (file.size > maxSize) {
  //     return {
  //       isValid: false,
  //       message: '头像文件大小不能超过5MB',
  //     };
  //   }

  //   return {
  //     isValid: true,
  //     message: '文件验证通过',
  //   };
  // }

  // /**
  //  * 生成操作URL
  //  */
  // private getActionUrl(action: string, userId: string): string {
  //   const actionUrls: Record<string, string> = {
  //     upload_avatar: `/profile/${userId}/avatar`,
  //     complete_profile: `/profile/${userId}/edit`,
  //     change_password: `/profile/${userId}/password`,
  //   };

  //   return actionUrls[action] || `/profile/${userId}`;
  // }
}

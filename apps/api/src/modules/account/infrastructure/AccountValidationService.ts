import { Account } from '@dailyuse/domain-server';
import type { UpdateAccountDto } from '../application/services/AccountApplicationService';
import { type RegistrationByUsernameAndPasswordRequestDTO } from '../../../tempTypes';

export class AccountValidationService {
  /**
   * 验证账户创建数据
   */
  async validateAccountCreation(
    createDto: RegistrationByUsernameAndPasswordRequestDTO,
  ): Promise<void> {
    const errors: string[] = [];

    // 验证用户名
    if (!createDto.username || createDto.username.trim().length === 0) {
      errors.push('用户名不能为空');
    } else if (createDto.username.length < 3) {
      errors.push('用户名至少需要3个字符');
    } else if (createDto.username.length > 50) {
      errors.push('用户名不能超过50个字符');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(createDto.username)) {
      errors.push('用户名只能包含字母、数字、下划线和连字符');
    }

    // // 验证邮箱格式
    // if (createDto.email && typeof createDto.email === 'string') {
    //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    //   if (!emailRegex.test(createDto.email)) {
    //     errors.push('邮箱格式不正确');
    //   }
    // }

    // // 验证手机号格式
    // if (createDto.phoneNumber && typeof createDto.phoneNumber === 'string') {
    //   const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    //   if (!phoneRegex.test(createDto.phoneNumber)) {
    //     errors.push('手机号格式不正确');
    //   }
    // }

    // 验证密码强度
    if (createDto.password) {
      if (createDto.password.length < 8) {
        errors.push('密码至少需要8个字符');
      }
      if (!/(?=.*[a-z])/.test(createDto.password)) {
        errors.push('密码必须包含至少一个小写字母');
      }
      if (!/(?=.*[A-Z])/.test(createDto.password)) {
        errors.push('密码必须包含至少一个大写字母');
      }
      if (!/(?=.*\d)/.test(createDto.password)) {
        errors.push('密码必须包含至少一个数字');
      }
    }

    // 验证用户信息
    // if (!createDto.user) {
    //   errors.push('用户信息不能为空');
    // } else {
    //   if (!createDto.user.firstName || createDto.user.firstName.trim().length === 0) {
    //     errors.push('名字不能为空');
    //   }
    //   if (!createDto.user.lastName || createDto.user.lastName.trim().length === 0) {
    //     errors.push('姓氏不能为空');
    //   }
    // }

    // 验证账户类型
    if (!createDto.accountType) {
      errors.push('账户类型不能为空');
    }

    // 如果有验证错误，抛出异常
    if (errors.length > 0) {
      throw new Error(`账户创建验证失败: ${errors.join(', ')}`);
    }

    // TODO: 添加额外的业务规则验证
    // 例如：检查用户名是否已存在、邮箱是否已被使用等
  }

  /**
   * 验证账户更新数据
   */
  async validateAccountUpdate(
    updateDto: UpdateAccountDto,
    existingAccount: Account,
  ): Promise<void> {
    const errors: string[] = [];

    // 验证邮箱格式（如果提供）
    if (updateDto.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateDto.email)) {
        errors.push('邮箱格式不正确');
      }
      // TODO: 检查邮箱是否已被其他账户使用
    }

    // 验证手机号格式（如果提供）
    if (updateDto.phoneNumber) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(updateDto.phoneNumber)) {
        errors.push('手机号格式不正确');
      }
    }

    // 验证用户资料更新
    if (updateDto.userProfile) {
      if (updateDto.userProfile.firstName !== undefined) {
        if (
          !updateDto.userProfile.firstName ||
          updateDto.userProfile.firstName.trim().length === 0
        ) {
          errors.push('名字不能为空');
        } else if (updateDto.userProfile.firstName.length > 100) {
          errors.push('名字不能超过100个字符');
        }
      }

      if (updateDto.userProfile.lastName !== undefined) {
        if (!updateDto.userProfile.lastName || updateDto.userProfile.lastName.trim().length === 0) {
          errors.push('姓氏不能为空');
        } else if (updateDto.userProfile.lastName.length > 100) {
          errors.push('姓氏不能超过100个字符');
        }
      }

      if (updateDto.userProfile.bio !== undefined) {
        if (updateDto.userProfile.bio && updateDto.userProfile.bio.length > 500) {
          errors.push('个人简介不能超过500个字符');
        }
      }

      if (updateDto.userProfile.avatar !== undefined) {
        if (updateDto.userProfile.avatar) {
          // 验证头像URL格式
          try {
            new URL(updateDto.userProfile.avatar);
          } catch {
            errors.push('头像URL格式不正确');
          }
        }
      }
    }

    // 如果有验证错误，抛出异常
    if (errors.length > 0) {
      throw new Error(`账户更新验证失败: ${errors.join(', ')}`);
    }

    // TODO: 添加额外的业务规则验证
  }

  /**
   * 验证邮箱格式
   */
  validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式
   */
  validatePhoneFormat(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 验证密码强度
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('密码至少需要8个字符');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('密码必须包含至少一个小写字母');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('密码必须包含至少一个大写字母');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('密码必须包含至少一个数字');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('密码必须包含至少一个特殊字符');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

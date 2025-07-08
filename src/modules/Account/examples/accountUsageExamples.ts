/**
 * Account 模块使用示例
 * 演示如何在应用中正确初始化和使用新的账号管理架构
 */

import { AccountSystemInitializer } from '@/modules/Account/initialization/accountSystemInitializer';
import { localUserService } from '@/modules/Account/services/localUserService';

// 这里需要导入具体的存储库实现
// 示例中使用模拟实现，实际使用时需要替换为真实实现
class MockAccountRepository {
  // 模拟实现，实际使用时需要实现 IAccountRepository 接口
}

class MockSessionRepository {
  // 模拟实现，实际使用时需要实现 ISessionRepository 接口
}

/**
 * 应用启动时的初始化示例
 */
async function initializeAccountSystem() {
  try {
    // 注意：这里使用模拟实现，实际使用时需要传入真实的存储库实例
    const mockAccountRepo = new MockAccountRepository() as any;
    const mockSessionRepo = new MockSessionRepository() as any;
    
    // 1. 初始化账号系统（这会设置依赖注入）
    const accountAppService = AccountSystemInitializer.initialize(
      mockAccountRepo,
      mockSessionRepo
    );
    
    // 2. 手动将应用服务注入到 localUserService
    localUserService.setAccountApplicationService(accountAppService);
    
    console.log('账号系统初始化成功');
    
    // 3. 现在可以安全地使用 localUserService
    // 所有方法都将使用新的 DDD 架构
    
    return accountAppService;
    
  } catch (error) {
    console.error('账号系统初始化失败:', error);
    throw error;
  }
}

/**
 * 用户注册示例
 */
async function registerUserExample() {
  try {
    const registerData = {
      username: 'testuser',
      password: 'password123',
      confirmPassword: 'password123',
      email: 'test@example.com'
    };
    
    const result = await localUserService.register(registerData);
    
    if (result.success) {
      console.log('注册成功:', result.data);
    } else {
      console.error('注册失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('注册过程中发生错误:', error);
    throw error;
  }
}

/**
 * 用户登录示例
 */
async function loginUserExample() {
  try {
    const loginData = {
      username: 'testuser',
      password: 'password123',
      remember: true
    };
    
    const result = await localUserService.login(loginData);
    
    if (result.success) {
      console.log('登录成功:', result.data);
      // result.data 包含用户信息和令牌
      const { token } = result.data;
      
      // 保存令牌以供后续使用
      localStorage.setItem('authToken', token);
      
    } else {
      console.error('登录失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('登录过程中发生错误:', error);
    throw error;
  }
}

/**
 * 会话验证示例
 */
async function validateSessionExample() {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.log('未找到令牌');
      return { success: false, message: '未登录' };
    }
    
    const result = await localUserService.validateSession(token);
    
    if (result.success) {
      console.log('会话有效:', result.data);
    } else {
      console.error('会话无效:', result.message);
      localStorage.removeItem('authToken');
    }
    
    return result;
  } catch (error) {
    console.error('验证会话时发生错误:', error);
    throw error;
  }
}

/**
 * 用户登出示例
 */
async function logoutUserExample() {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.log('未找到令牌，可能已经登出');
      return { success: true, message: '已登出' };
    }
    
    const result = await localUserService.logoutWithToken(token);
    
    if (result.success) {
      console.log('登出成功');
      localStorage.removeItem('authToken');
    } else {
      console.error('登出失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('登出过程中发生错误:', error);
    throw error;
  }
}

/**
 * 更新用户信息示例
 */
async function updateUserInfoExample() {
  try {
    const username = 'testuser';
    const updateData = {
      email: 'newemail@example.com',
      firstName: 'New',
      lastName: 'Name',
      bio: '更新后的个人简介'
    };
    
    const result = await localUserService.updateUserInfo(username, updateData);
    
    if (result.success) {
      console.log('信息更新成功:', result.data);
    } else {
      console.error('信息更新失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('更新信息时发生错误:', error);
    throw error;
  }
}

/**
 * 获取所有用户示例
 */
async function getAllUsersExample() {
  try {
    const result = await localUserService.getAllUsers();
    
    if (result.success) {
      console.log('获取用户列表成功:', result.data);
    } else {
      console.error('获取用户列表失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('获取用户列表时发生错误:', error);
    throw error;
  }
}

/**
 * 注销账号示例
 */
async function deregisterAccountExample() {
  try {
    const username = 'testuser';
    
    const result = await localUserService.deregistration(username);
    
    if (result.success) {
      console.log('账号注销成功');
      localStorage.removeItem('authToken');
    } else {
      console.error('账号注销失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('注销账号时发生错误:', error);
    throw error;
  }
}

/**
 * 完整的用户操作流程示例
 */
async function completeUserFlowExample() {
  try {
    console.log('开始完整的用户操作流程演示...');
    
    // 1. 初始化系统
    await initializeAccountSystem();
    console.log('✓ 系统初始化完成');
    
    // 2. 注册用户
    const registerResult = await registerUserExample();
    if (!registerResult.success) {
      throw new Error('注册失败');
    }
    console.log('✓ 用户注册完成');
    
    // 3. 登录用户
    const loginResult = await loginUserExample();
    if (!loginResult.success) {
      throw new Error('登录失败');
    }
    console.log('✓ 用户登录完成');
    
    // 4. 验证会话
    const validateResult = await validateSessionExample();
    if (!validateResult.success) {
      throw new Error('会话验证失败');
    }
    console.log('✓ 会话验证完成');
    
    // 5. 更新用户信息
    const updateResult = await updateUserInfoExample();
    if (!updateResult.success) {
      console.warn('更新用户信息失败，但继续流程');
    } else {
      console.log('✓ 用户信息更新完成');
    }
    
    // 6. 获取用户列表
    const usersResult = await getAllUsersExample();
    if (usersResult.success) {
      console.log('✓ 获取用户列表完成');
    }
    
    // 7. 登出用户
    const logoutResult = await logoutUserExample();
    if (!logoutResult.success) {
      console.warn('登出失败，但继续流程');
    } else {
      console.log('✓ 用户登出完成');
    }
    
    console.log('完整流程演示成功完成！');
    
    return { success: true, message: '完整流程演示成功' };
    
  } catch (error) {
    console.error('完整流程演示失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '未知错误' };
  }
}

// 导出所有示例函数
export {
  initializeAccountSystem,
  registerUserExample,
  loginUserExample,
  validateSessionExample,
  logoutUserExample,
  updateUserInfoExample,
  getAllUsersExample,
  deregisterAccountExample,
  completeUserFlowExample
};

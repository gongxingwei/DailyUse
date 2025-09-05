/**
 * API系统测试文件
 * 用于验证新的API客户端是否正常工作
 */

import { api, publicApiClient, AuthService, AccountService } from '@/shared/api';

/**
 * 测试基础API客户端
 */
async function testBasicApiClient() {
  console.log('🧪 测试基础API客户端...');

  try {
    // 测试公共API（无需认证）
    const publicData = await publicApiClient.get('/health');
    console.log('✅ 公共API测试成功:', publicData);

    // 测试缓存功能
    const cachedData = await api.get('/cached-endpoint', {
      enableCache: true,
    });
    console.log('✅ 缓存功能测试成功:', cachedData);
  } catch (error) {
    console.error('❌ 基础API测试失败:', error);
  }
}

/**
 * 测试认证服务
 */
async function testAuthService() {
  console.log('🧪 测试认证服务...');

  try {
    const loginData = {
      username: 'test@example.com',
      password: 'password123',
      rememberMe: true,
    };

    // 测试登录
    const loginResult = await AuthService.login(loginData);
    console.log('✅ 登录测试成功:', loginResult);

    // 测试刷新令牌（如果有token的话）
    if (loginResult.refreshToken) {
      const refreshResult = await AuthService.refreshToken({
        refreshToken: loginResult.refreshToken,
      });
      console.log('✅ 令牌刷新测试成功:', refreshResult);
    }

    // 测试登出
    await AuthService.logout();
    console.log('✅ 登出测试成功');
  } catch (error) {
    console.error('❌ 认证服务测试失败:', error);
  }
}

/**
 * 测试账户服务
 */
async function testAccountService() {
  console.log('🧪 测试账户服务...');

  try {
    // 测试获取账户列表
    const accounts = await AccountService.getAccounts({
      page: 1,
      limit: 10,
    });
    console.log('✅ 账户列表测试成功:', accounts);

    // 测试创建账户
    const newAccount = await AccountService.createAccount({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    console.log('✅ 创建账户测试成功:', newAccount);

    if (newAccount.uuid) {
      // 测试获取单个账户
      const account = await AccountService.getAccountById(newAccount.uuid);
      console.log('✅ 获取账户详情测试成功:', account);

      // 测试更新账户
      const updatedAccount = await AccountService.updateAccount(newAccount.uuid, {
        email: 'updated@example.com',
        nickname: '更新的昵称',
      });
      console.log('✅ 更新账户测试成功:', updatedAccount);

      // 测试删除账户
      await AccountService.deleteAccount(newAccount.uuid);
      console.log('✅ 删除账户测试成功');
    }
  } catch (error) {
    console.error('❌ 账户服务测试失败:', error);
  }
}

/**
 * 测试文件上传
 */
async function testFileUpload() {
  console.log('🧪 测试文件上传...');

  try {
    // 创建测试文件
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

    // 测试文件上传
    const uploadResult = await api.upload('/upload', testFile, {
      onUploadProgress: ({ progress }) => {
        console.log(`📤 上传进度: ${progress}%`);
      },
      maxFileSize: 1024 * 1024, // 1MB
      allowedTypes: ['text/plain'],
    });

    console.log('✅ 文件上传测试成功:', uploadResult);
  } catch (error) {
    console.error('❌ 文件上传测试失败:', error);
  }
}

/**
 * 测试错误处理
 */
async function testErrorHandling() {
  console.log('🧪 测试错误处理...');

  try {
    // 测试404错误
    await api.get('/non-existent-endpoint');
  } catch (error) {
    console.log('✅ 404错误处理测试成功:', error);
  }

  try {
    // 测试验证错误
    await AuthService.login({
      username: '', // 空用户名应该触发验证错误
      password: '',
      rememberMe: false,
    });
  } catch (error) {
    console.log('✅ 验证错误处理测试成功:', error);
  }
}

/**
 * 运行所有测试
 */
export async function runApiTests() {
  console.log('🚀 开始API系统测试...\n');

  await testBasicApiClient();
  console.log('');

  await testAuthService();
  console.log('');

  await testAccountService();
  console.log('');

  await testFileUpload();
  console.log('');

  await testErrorHandling();
  console.log('');

  console.log('🎉 API系统测试完成！');
}

/**
 * 性能测试
 */
export async function runPerformanceTests() {
  console.log('⚡ 开始性能测试...\n');

  const startTime = performance.now();

  // 并发请求测试
  const promises = Array.from({ length: 10 }, (_, i) =>
    publicApiClient.get(`/test-endpoint?id=${i}`),
  );

  try {
    await Promise.all(promises);
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`✅ 并发请求测试完成，耗时: ${duration.toFixed(2)}ms`);

    // 缓存性能测试
    const cacheStartTime = performance.now();

    // 第一次请求（无缓存）
    await api.get('/cached-data', { enableCache: true });
    const firstRequestTime = performance.now() - cacheStartTime;

    // 第二次请求（从缓存）
    const secondRequestStart = performance.now();
    await api.get('/cached-data', { enableCache: true });
    const secondRequestTime = performance.now() - secondRequestStart;

    console.log(`📊 缓存性能对比:`);
    console.log(`   首次请求: ${firstRequestTime.toFixed(2)}ms`);
    console.log(`   缓存请求: ${secondRequestTime.toFixed(2)}ms`);
    console.log(
      `   性能提升: ${(((firstRequestTime - secondRequestTime) / firstRequestTime) * 100).toFixed(1)}%`,
    );
  } catch (error) {
    console.error('❌ 性能测试失败:', error);
  }
}

// 开发环境下自动运行测试
if (import.meta.env.DEV) {
  // 可以在浏览器控制台手动调用
  (window as any).runApiTests = runApiTests;
  (window as any).runPerformanceTests = runPerformanceTests;

  console.log('💡 在控制台中执行以下命令来运行测试:');
  console.log('   runApiTests() - 运行功能测试');
  console.log('   runPerformanceTests() - 运行性能测试');
}

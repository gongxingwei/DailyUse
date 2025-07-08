/**
 * 仓库层测试脚本
 * 验证所有仓库的基本功能
 */

import { initializeDatabase } from '../config/database';
import { RepositoryFactory } from '../shared/services/repositoryFactory';
import { AuthCredential } from '../modules/Authentication/domain/aggregates/authCredential';
import { Password } from '../modules/Authentication/domain/valueObjects/password';
import { Token } from '../modules/Authentication/domain/valueObjects/token';
import { Session } from '../modules/Authentication/domain/entities/session';
import { MFADevice, MFADeviceType } from '../modules/Authentication/domain/entities/mfaDevice';
import { SessionLog, OperationType, RiskLevel } from '../modules/SessionLogging/domain/aggregates/sessionLog';
import { AuditTrail } from '../modules/SessionLogging/domain/entities/auditTrail';
import { IPLocation } from '../modules/SessionLogging/domain/valueObjects/ipLocation';

async function testRepositories() {
  try {
    console.log('🚀 开始测试仓库层...');

    // 初始化数据库
    await initializeDatabase();
    console.log('✅ 数据库初始化成功');

    // 测试 AuthCredential 仓库
    await testAuthCredentialRepository();
    
    // 测试 Token 仓库
    await testTokenRepository();
    
    // 测试 UserSession 仓库
    await testUserSessionRepository();
    
    // 测试 MFADevice 仓库
    await testMFADeviceRepository();
    
    // 测试 SessionLog 仓库
    await testSessionLogRepository();
    
    // 测试 AuditTrail 仓库
    await testAuditTrailRepository();

    console.log('🎉 所有仓库测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

async function testAuthCredentialRepository() {
  console.log('\n📝 测试 AuthCredential 仓库...');
  
  const repo = RepositoryFactory.getAuthCredentialRepository();
  const testAccountId = 'test-account-123';
  
  // 创建认证凭证
  const password = new Password('testPassword123!');
  const credential = new AuthCredential('cred-123', testAccountId, password);
  
  // 保存
  await repo.save(credential);
  console.log('✅ AuthCredential 保存成功');
  
  // 查找
  const found = await repo.findByAccountId(testAccountId);
  console.log('✅ AuthCredential 查找成功:', found?.id);
  
  // 清理
  await repo.delete(credential.id);
  console.log('✅ AuthCredential 删除成功');
}

async function testTokenRepository() {
  console.log('\n🎫 测试 Token 仓库...');
  
  const repo = RepositoryFactory.getTokenRepository();
  const testAccountId = 'test-account-123';
  
  // 创建令牌
  const token = Token.createRememberToken(testAccountId, 'Test Device');
  
  // 保存
  await repo.save(token);
  console.log('✅ Token 保存成功');
  
  // 查找
  const found = await repo.findByValue(token.value);
  console.log('✅ Token 查找成功:', found?.value.substring(0, 10) + '...');
  
  // 查找账户的令牌
  const accountTokens = await repo.findByAccountId(testAccountId);
  console.log('✅ 账户令牌查找成功，数量:', accountTokens.length);
  
  // 清理
  await repo.delete(token.value);
  console.log('✅ Token 删除成功');
}

async function testUserSessionRepository() {
  console.log('\n🔐 测试 UserSession 仓库...');
  
  const repo = RepositoryFactory.getUserSessionRepository();
  const testAccountId = 'test-account-123';
  
  // 创建会话
  const session = new Session(
    'session-123',
    testAccountId,
    'Test Device',
    '192.168.1.1',
    'Mozilla/5.0...'
  );
  
  // 保存
  await repo.save(session);
  console.log('✅ Session 保存成功');
  
  // 查找
  const found = await repo.findById(session.id);
  console.log('✅ Session 查找成功:', found?.id);
  
  // 查找账户的活跃会话
  const activeSessions = await repo.findActiveByAccountId(testAccountId);
  console.log('✅ 账户活跃会话查找成功，数量:', activeSessions.length);
  
  // 清理
  await repo.delete(session.id);
  console.log('✅ Session 删除成功');
}

async function testMFADeviceRepository() {
  console.log('\n📱 测试 MFADevice 仓库...');
  
  const repo = RepositoryFactory.getMFADeviceRepository();
  const testAccountId = 'test-account-123';
  
  // 创建MFA设备
  const device = new MFADevice(
    'mfa-123',
    testAccountId,
    MFADeviceType.TOTP,
    'Google Authenticator'
  );
  device.setTOTPSecret('ABCDEFGHIJKLMNOP');
  device.verify('123456'); // 模拟验证
  
  // 保存
  await repo.save(device);
  console.log('✅ MFADevice 保存成功');
  
  // 查找
  const found = await repo.findById(device.id);
  console.log('✅ MFADevice 查找成功:', found?.id);
  
  // 查找账户的MFA设备
  const accountDevices = await repo.findByAccountId(testAccountId);
  console.log('✅ 账户MFA设备查找成功，数量:', accountDevices.length);
  
  // 清理
  await repo.delete(device.id);
  console.log('✅ MFADevice 删除成功');
}

async function testSessionLogRepository() {
  console.log('\n📊 测试 SessionLog 仓库...');
  
  const repo = RepositoryFactory.getSessionLogRepository();
  const testAccountId = 'test-account-123';
  
  // 创建IP位置
  const ipLocation = new IPLocation(
    '192.168.1.1',
    'China',
    'Beijing',
    'Beijing'
  );
  
  // 创建会话日志
  const sessionLog = new SessionLog(
    'sessionlog-123',
    testAccountId,
    OperationType.LOGIN,
    'Test Device',
    ipLocation,
    'Mozilla/5.0...'
  );
  
  // 保存
  await repo.save(sessionLog);
  console.log('✅ SessionLog 保存成功');
  
  // 查找
  const found = await repo.findById(sessionLog.id);
  console.log('✅ SessionLog 查找成功:', found?.id);
  
  // 查找账户的会话日志
  const accountLogs = await repo.findByAccountId(testAccountId);
  console.log('✅ 账户会话日志查找成功，数量:', accountLogs.length);
  
  // 清理
  await repo.delete(sessionLog.id);
  console.log('✅ SessionLog 删除成功');
}

async function testAuditTrailRepository() {
  console.log('\n🔍 测试 AuditTrail 仓库...');
  
  const repo = RepositoryFactory.getAuditTrailRepository();
  const testAccountId = 'test-account-123';
  
  // 创建IP位置
  const ipLocation = new IPLocation(
    '192.168.1.1',
    'China',
    'Beijing',
    'Beijing'
  );
  
  // 创建审计轨迹
  const auditTrail = new AuditTrail(
    'audit-123',
    testAccountId,
    'login_attempt',
    'User attempted to login',
    RiskLevel.LOW,
    ipLocation,
    'Mozilla/5.0...'
  );
  
  // 保存
  await repo.save(auditTrail);
  console.log('✅ AuditTrail 保存成功');
  
  // 查找
  const found = await repo.findById(auditTrail.id);
  console.log('✅ AuditTrail 查找成功:', found?.id);
  
  // 查找账户的审计轨迹
  const accountTrails = await repo.findByAccountId(testAccountId);
  console.log('✅ 账户审计轨迹查找成功，数量:', accountTrails.length);
  
  // 清理
  await repo.delete(auditTrail.id);
  console.log('✅ AuditTrail 删除成功');
}

// 运行测试
if (require.main === module) {
  testRepositories().catch(console.error);
}

export { testRepositories };

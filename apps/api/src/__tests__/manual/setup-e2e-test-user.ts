/**
 * E2E 测试环境设置脚本
 * 确保测试用户存在
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_USER = {
  username: 'testuser',
  password: 'Test123456!',
  email: 'testuser@example.com',
  displayName: 'E2E Test User',
};

async function setupTestUser() {
  console.log('🔧 设置 E2E 测试环境...\n');

  try {
    // 检查测试用户是否存在
    const existingAccount = await prisma.account.findUnique({
      where: { username: TEST_USER.username },
      include: {
        userProfile: true,
      },
    });

    if (existingAccount) {
      console.log(`✅ 测试用户已存在: ${TEST_USER.username}`);
      console.log(`   Account UUID: ${existingAccount.uuid}`);
      console.log(`   UserProfile UUID: ${existingAccount.userProfile?.uuid || 'N/A'}\n`);
      return;
    }

    console.log(`📝 创建测试用户: ${TEST_USER.username}`);

    // 创建 Credential 和 Account
    const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);

    // 先创建 credential
    const credential = await prisma.authCredential.create({
      data: {
        credentialType: 'password',
        credentialValue: hashedPassword,
      },
    });

    console.log(`   ✅ Credential 创建成功: ${credential.uuid}`);

    // 创建 Account
    const account = await prisma.account.create({
      data: {
        username: TEST_USER.username,
        email: TEST_USER.email,
        status: 'active',
        authCredentials: {
          connect: { uuid: credential.uuid },
        },
      },
    });

    console.log(`   ✅ Account 创建成功: ${account.uuid}`);

    // 创建 UserProfile
    const userProfile = await prisma.userProfile.create({
      data: {
        accountUuid: account.uuid,
        displayName: TEST_USER.displayName,
        firstName: 'Test',
        lastName: 'User',
        sex: 0, // 0 = unknown
      },
    });

    console.log(`   ✅ UserProfile 创建成功: ${userProfile.uuid}`);

    // 创建 NotificationPreference
    const defaultEnabledTypes = JSON.stringify([
      'info',
      'success',
      'warning',
      'error',
      'reminder',
      'system',
      'alert',
      'message',
      'update',
      'schedule_reminder',
      'task_reminder',
      'goal_milestone',
      'custom',
    ]);

    // 创建完整的通知渠道偏好设置
    const channelPreferences = {
      in_app: {
        enabled: true,
        types: [], // 空数组表示允许所有 enabledTypes
        settings: { showPreview: true, displayDuration: 5000 },
      },
      sse: {
        enabled: true,
        types: [], // 允许所有类型
      },
      desktop: {
        enabled: true,
        types: [], // 允许所有类型（包括 schedule_reminder）
      },
      sound: {
        enabled: true,
        types: [], // 允许所有类型
      },
    };

    await prisma.notificationPreference.create({
      data: {
        accountUuid: account.uuid,
        enabledTypes: defaultEnabledTypes,
        channelPreferences: JSON.stringify(channelPreferences),
      },
    });

    console.log(`   ✅ NotificationPreference 创建成功\n`);

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           ✅ E2E 测试环境设置完成                          ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  用户名: ${TEST_USER.username.padEnd(49)} ║`);
    console.log(`║  密码: ${TEST_USER.password.padEnd(51)} ║`);
    console.log(`║  Email: ${TEST_USER.email.padEnd(50)} ║`);
    console.log(`║  Account UUID: ${account.uuid.padEnd(40)} ║`);
    console.log(`║  UserProfile UUID: ${userProfile.uuid.padEnd(36)} ║`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('❌ 设置失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTestUser();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * 数据库种子数据脚本
 * 用于插入测试用户和永久 token，方便 API 测试
 */
async function main() {
  console.log('🌱 开始执行数据库种子脚本...');

  try {
    // 1. 创建测试用户
    const testUsername = 'api-tester';
    const testPassword = 'test123456';
    const testEmail = 'api-tester@example.com';

    // 检查测试用户是否已存在
    const existingUser = await prisma.account.findUnique({
      where: { username: testUsername },
    });

    let testAccount;

    if (existingUser) {
      console.log(`ℹ️  测试用户 "${testUsername}" 已存在，跳过创建...`);
      testAccount = existingUser;
    } else {
      // 创建新的测试用户
      console.log(`👤 创建测试用户: ${testUsername}`);

      testAccount = await prisma.account.create({
        data: {
          username: testUsername,
          email: testEmail,
          accountType: 'local',
          status: 'active',
          emailVerified: true,
          phoneVerified: false,
          roleIds: '["user", "tester"]',
        },
      });

      // 为测试用户创建认证凭据
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const passwordHash = await bcrypt.hash(testPassword, salt);

      await prisma.authCredential.create({
        data: {
          accountUuid: testAccount.uuid,
          passwordHash,
          passwordSalt: salt,
          passwordAlgorithm: 'bcrypt',
          passwordCreatedAt: new Date(),
          isLocked: false,
          failedAttempts: 0,
        },
      });

      console.log(`✅ 测试用户创建成功: ${testUsername}`);
    }

    // 2. 创建永久 API 测试 token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

    // 生成一个 10 年后过期的 JWT token
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 10); // 10年后过期

    const jwtPayload = {
      accountUuid: testAccount.uuid, // 使用 accountUuid 而不是 uuid
      uuid: testAccount.uuid,
      username: testAccount.username,
      accountType: testAccount.accountType,
      exp: Math.floor(expiresAt.getTime() / 1000), // JWT 使用秒为单位
    };

    const jwtToken = jwt.sign(jwtPayload, jwtSecret);

    // 检查永久 token 是否已存在
    const existingToken = await prisma.authToken.findUnique({
      where: { tokenValue: jwtToken },
    });

    if (!existingToken) {
      // 在数据库中存储 token 信息
      await prisma.authToken.create({
        data: {
          tokenValue: jwtToken,
          tokenType: 'access',
          issuedAt: new Date(),
          expiresAt,
          isRevoked: false,
          accountUuid: testAccount.uuid,
          metadata: JSON.stringify({
            purpose: 'api-testing',
            description: '用于 API 测试的永久 token',
            isTestToken: true,
          }),
        },
      });

      console.log(`✅ 永久测试 token 创建成功并保存到数据库`);
    } else {
      console.log(`ℹ️  JWT token 已存在数据库中，跳过保存...`);
    }

    console.log(`🔑 JWT Token: ${jwtToken}`); // 3. 创建一些测试数据（可选）
    await createTestRepositories(testAccount.uuid);

    console.log('🎉 数据库种子脚本执行完成！');
    console.log('');
    console.log('='.repeat(60));
    console.log('📋 测试信息:');
    console.log('='.repeat(60));
    console.log(`👤 测试用户名: ${testUsername}`);
    console.log(`🔒 测试密码: ${testPassword}`);
    console.log(`📧 测试邮箱: ${testEmail}`);
    console.log(`🔑 JWT Token: ${jwtToken}`);
    console.log('');
    console.log('📝 使用方法:');
    console.log('在 API 请求中添加 Header:');
    console.log(`Authorization: Bearer ${jwtToken}`);
    console.log('');
    console.log('🧪 测试命令示例:');
    console.log(
      `curl -H "Authorization: Bearer ${jwtToken}" http://localhost:3888/api/v1/repositories`,
    );
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ 种子脚本执行失败:', error);
    throw error;
  }
}

/**
 * 创建一些测试仓储数据
 */
async function createTestRepositories(accountUuid: string) {
  console.log('📚 创建测试仓储数据...');

  // 检查是否已有测试仓储
  const existingRepo = await prisma.repository.findFirst({
    where: {
      accountUuid,
      name: '测试仓储',
    },
  });

  if (existingRepo) {
    console.log('ℹ️  测试仓储已存在，跳过创建...');
    return;
  }

  // 创建测试仓储（基于当前数据库模式）
  const testRepo = await prisma.repository.create({
    data: {
      accountUuid,
      name: '测试仓储',
      path: '/test/repository',
      description: '这是一个用于 API 测试的示例仓储',
      relatedGoals: JSON.stringify([]),
    },
  });

  console.log('✅ 测试仓储创建成功');
  console.log(`📂 仓储 UUID: ${testRepo.uuid}`);
}

// 执行种子脚本
main()
  .catch((e) => {
    console.error('❌ 种子脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

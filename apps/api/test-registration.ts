/**
 * 用户注册功能测试脚本
 * 用于测试新实现的用户注册 API
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3888/api/v1';

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  profile?: {
    nickname?: string;
    avatarUrl?: string;
    bio?: string;
  };
}

interface RegisterResponse {
  code: number;
  data: {
    account: {
      uuid: string;
      username: string;
      email: string;
      profile: any;
      status: string;
      createdAt: number;
    };
  };
  message: string;
}

/**
 * 测试用户注册
 */
async function testUserRegistration() {
  console.log('🧪 [Test] 开始测试用户注册功能...\n');

  const testCases: {
    name: string;
    request: RegisterRequest;
    expectSuccess: boolean;
  }[] = [
    {
      name: '正常注册 - 完整信息',
      request: {
        username: 'testuser123',
        email: 'test123@example.com',
        password: 'Test1234',
        profile: {
          nickname: 'Test User',
          bio: 'This is a test account',
        },
      },
      expectSuccess: true,
    },
    {
      name: '正常注册 - 最小信息',
      request: {
        username: 'simpleuser',
        email: 'simple@example.com',
        password: 'Simple123',
      },
      expectSuccess: true,
    },
    {
      name: '失败 - 用户名太短',
      request: {
        username: 'ab',
        email: 'short@example.com',
        password: 'Short123',
      },
      expectSuccess: false,
    },
    {
      name: '失败 - 邮箱格式错误',
      request: {
        username: 'baduser',
        email: 'invalid-email',
        password: 'Invalid123',
      },
      expectSuccess: false,
    },
    {
      name: '失败 - 密码太弱',
      request: {
        username: 'weakuser',
        email: 'weak@example.com',
        password: 'weak',
      },
      expectSuccess: false,
    },
  ];

  for (const testCase of testCases) {
    console.log(`📝 测试用例: ${testCase.name}`);
    console.log(`   请求数据:`, {
      username: testCase.request.username,
      email: testCase.request.email,
      password: '******',
    });

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.request),
      });

      const data = (await response.json()) as RegisterResponse;

      if (testCase.expectSuccess) {
        if (response.status === 201) {
          console.log(`   ✅ 成功: ${data.message}`);
          console.log(`   账户UUID: ${data.data.account.uuid}`);
          console.log(`   用户名: ${data.data.account.username}`);
          console.log(`   邮箱: ${data.data.account.email}`);
        } else {
          console.log(`   ❌ 预期成功但失败: ${response.status} - ${data.message}`);
        }
      } else {
        if (response.status !== 201) {
          console.log(`   ✅ 预期失败: ${response.status} - ${data.message}`);
        } else {
          console.log(`   ❌ 预期失败但成功了`);
        }
      }
    } catch (error) {
      console.log(`   ❌ 请求错误:`, error instanceof Error ? error.message : String(error));
    }

    console.log('');
  }

  console.log('🎉 测试完成！');
}

// 运行测试
testUserRegistration().catch((error) => {
  console.error('测试脚本执行失败:', error);
  process.exit(1);
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_USER_ACCOUNT_UUID = '9897aef0-7fad-4908-a0d1-31e9b22599c1';

async function updateNotificationPreferences() {
  try {
    console.log('\n🔧 更新测试用户通知偏好设置...\n');

    const defaultEnabledTypes = [
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
    ];

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

    // 更新或创建通知偏好设置
    const result = await prisma.notificationPreference.upsert({
      where: { accountUuid: TEST_USER_ACCOUNT_UUID },
      update: {
        enabledTypes: JSON.stringify(defaultEnabledTypes),
        channelPreferences: JSON.stringify(channelPreferences),
      },
      create: {
        accountUuid: TEST_USER_ACCOUNT_UUID,
        enabledTypes: JSON.stringify(defaultEnabledTypes),
        channelPreferences: JSON.stringify(channelPreferences),
      },
    });

    console.log('✅ 通知偏好设置已更新\n');
    console.log('UUID:', result.uuid);
    console.log('Account UUID:', result.accountUuid);
    console.log('\nEnabled Types:');
    console.log(JSON.parse(result.enabledTypes || '[]'));
    console.log('\nChannel Preferences:');
    console.log(JSON.parse(result.channelPreferences || '{}'));
    console.log('\n✅ 更新完成！\n');
  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNotificationPreferences();

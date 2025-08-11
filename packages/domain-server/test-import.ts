// 测试 RoleCore 导入
import { RoleCore } from '@dailyuse/domain-core';

console.log('RoleCore imported successfully:', RoleCore);

const testRole = new RoleCore({
  name: 'test',
  description: 'Test role',
  permissions: ['read', 'write'],
});

console.log('Test role created:', testRole.name);

export {};

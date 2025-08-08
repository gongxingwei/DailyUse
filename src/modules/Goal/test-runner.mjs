#!/usr/bin/env node
/**
 * Goal 模块测试套件运行器
 * 运行所有 Goal 模块相关的测试
 */

import { execSync } from 'child_process';
import path from 'path';

const testFiles = [
    'src/modules/Goal/domain/aggregates/goal.test.ts',
    'src/modules/Goal/domain/aggregates/goalDir.test.ts',
    'src/modules/Goal/domain/entities/keyResult.test.ts',
    'src/modules/Goal/domain/entities/record.test.ts',
    'src/modules/Goal/presentation/stores/goalStore.test.ts',
    'src/modules/Goal/presentation/composables/useGoalService.test.ts',
    'src/modules/Goal/presentation/components/GoalDir.test.ts'
];

console.log('🎯 运行 Goal 模块测试套件...\n');

try {
    // 运行特定的测试文件
    const testPattern = testFiles.map(file => path.resolve(file)).join(' ');

    console.log('📂 测试文件:');
    testFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
    });
    console.log('');

    // 运行测试命令
    const command = `npx vitest run ${testPattern} --reporter=verbose`;
    console.log(`🚀 执行命令: ${command}\n`);

    execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd()
    });

    console.log('\n✅ 所有 Goal 模块测试通过！');

} catch (error) {
    console.error('\n❌ 测试运行失败:', error.message);
    process.exit(1);
}

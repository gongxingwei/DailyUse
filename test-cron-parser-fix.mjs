/**
 * 测试 cron-parser 修复
 */

import { CronExpressionParser } from 'cron-parser';

console.log('🧪 测试 cron-parser 使用...\n');

try {
    // 测试 1: 基本用法
    console.log('✅ Test 1: 基本 cron 表达式解析');
    const interval1 = CronExpressionParser.parse('*/5 * * * *');
    console.log('  表达式: */5 * * * * (每5分钟)');
    console.log('  下次执行:', interval1.next().toString());
    console.log('  再下次:', interval1.next().toString());
    console.log('');

    // 测试 2: 每1分钟
    console.log('✅ Test 2: 每1分钟执行');
    const interval2 = CronExpressionParser.parse('* * * * *');
    console.log('  表达式: * * * * *');
    console.log('  下次执行:', interval2.next().toString());
    console.log('');

    // 测试 3: 预定义表达式
    console.log('✅ Test 3: 预定义表达式');
    const interval3 = CronExpressionParser.parse('@hourly');
    console.log('  表达式: @hourly');
    console.log('  下次执行:', interval3.next().toString());
    console.log('');

    // 测试 4: 带选项
    console.log('✅ Test 4: 带时区选项');
    const interval4 = CronExpressionParser.parse('0 9 * * 1-5', {
        currentDate: new Date(),
        tz: 'Asia/Shanghai',
    });
    console.log('  表达式: 0 9 * * 1-5 (工作日9点)');
    console.log('  时区: Asia/Shanghai');
    console.log('  下次执行:', interval4.next().toString());
    console.log('');

    // 测试 5: 使用 take 获取多个日期
    console.log('✅ Test 5: 获取接下来3次执行时间');
    const interval5 = CronExpressionParser.parse('0 */2 * * *');
    const nextThree = interval5.take(3);
    console.log('  表达式: 0 */2 * * * (每2小时)');
    nextThree.forEach((date, index) => {
        console.log(`  第${index + 1}次:`, date.toString());
    });
    console.log('');

    console.log('🎉 所有测试通过！cron-parser 工作正常！\n');
} catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
}

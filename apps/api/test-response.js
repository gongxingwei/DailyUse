/**
 * 新响应系统测试
 */

// 简单测试，看看导入是否工作
console.log('测试新响应系统导入...');

// 测试 contracts 包导入
try {
    const { ResponseStatus, ResponseSeverity } = await import('@dailyuse/contracts');
    console.log('✅ @dailyuse/contracts 导入成功');
    console.log('ResponseStatus:', ResponseStatus);
    console.log('ResponseSeverity:', ResponseSeverity);
} catch (error) {
    console.error('❌ @dailyuse/contracts 导入失败:', error.message);
}

// 测试 utils 包导入
try {
    const { createResponseBuilder, createExpressResponseHelper } = await import('@dailyuse/utils');
    console.log('✅ @dailyuse/utils 导入成功');

    // 测试响应构建器
    if (createResponseBuilder) {
        const builder = createResponseBuilder();
        const response = builder.success({ test: true }, '测试成功');
        console.log('✅ 响应构建器工作正常');
        console.log('响应示例:', JSON.stringify(response, null, 2));
    } else {
        console.log('❌ createResponseBuilder 不可用');
    }
} catch (error) {
    console.error('❌ @dailyuse/utils 导入失败:', error.message);
}

console.log('测试完成');

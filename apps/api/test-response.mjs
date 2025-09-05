import { ResponseStatus, ResponseSeverity } from '@dailyuse/contracts';
import { createResponseBuilder } from '@dailyuse/utils';

console.log('=== 新响应系统测试 ===');

// 测试响应状态
console.log('ResponseStatus.SUCCESS:', ResponseStatus.SUCCESS);
console.log('ResponseSeverity.ERROR:', ResponseSeverity.ERROR);

// 测试响应构建器
const builder = createResponseBuilder({
    requestId: 'test-123',
    version: '1.0.0'
});

// 测试成功响应
const successResponse = builder.success(
    { id: 1, name: '测试用户' },
    '获取用户成功'
);

console.log('\n成功响应示例:');
console.log(JSON.stringify(successResponse, null, 2));

// 测试错误响应
const errorResponse = builder.badRequest('请求参数错误', [
    {
        field: 'email',
        code: 'INVALID_EMAIL',
        message: '邮箱格式不正确'
    }
]);

console.log('\n错误响应示例:');
console.log(JSON.stringify(errorResponse, null, 2));

console.log('\n✅ 新响应系统测试通过！');

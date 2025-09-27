/**
 * 测试调度任务创建脚本
 * 创建一个立即执行的调度任务来测试前端通知集成
 */

const API_BASE = 'http://localhost:3888/api/v1';

// 创建测试账户UUID（使用固定的测试账户）
const TEST_ACCOUNT_UUID = 'test-account-uuid-12345';

/**
 * 创建测试调度任务
 */
async function createTestScheduleTask() {
    const now = new Date();
    const scheduledTime = new Date(now.getTime() + 5000); // 5秒后执行

    const taskData = {
        title: '🔔 前端通知集成测试',
        description: '这是一个测试调度任务，用于验证前端通知系统是否正常工作',
        accountUuid: TEST_ACCOUNT_UUID,
        taskType: 'REMINDER',
        priority: 'HIGH',
        scheduledTime: scheduledTime.toISOString(),
        enabled: true,
        payload: {
            data: {
                message: '恭喜！前端通知集成正常工作 🎉',
                testType: 'notification_integration',
            }
        },
        alertConfig: {
            methods: ['POPUP', 'SOUND'],
            soundVolume: 80,
            popupDuration: 10,
            allowSnooze: false
        },
        recurrence: null // 一次性任务
    };

    try {
        console.log('📅 创建测试调度任务...');
        console.log('⏰ 计划执行时间:', scheduledTime.toLocaleString());

        const response = await fetch(`${API_BASE}/api/schedule/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 注意：实际使用时需要有效的JWT token
                // 'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ 测试任务创建成功:', result.data);
            console.log('🔍 任务UUID:', result.data.uuid);
            console.log('⏳ 请在', scheduledTime.toLocaleString(), '查看前端弹窗通知');

            // 设置监听器来检查任务执行
            setTimeout(() => {
                console.log('⏰ 任务应该已经执行，请检查前端是否显示通知');
            }, 6000);

            return result.data;
        } else {
            const error = await response.text();
            console.error('❌ 创建测试任务失败:', response.status, error);

            if (response.status === 401) {
                console.log('💡 提示：如果是认证错误，请先登录或使用有效的token');
            }
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
        console.log('💡 请确保API服务器正在运行在', API_BASE);
    }
}

/**
 * 查询现有任务状态
 */
async function checkExistingTasks() {
    try {
        console.log('📊 查询现有调度任务...');

        const response = await fetch(`${API_BASE}/api/schedule/tasks?accountUuid=${TEST_ACCOUNT_UUID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const result = await response.json();
            const tasks = result.data || [];

            console.log(`📋 找到 ${tasks.length} 个调度任务:`);
            tasks.forEach((task, index) => {
                console.log(`${index + 1}. ${task.title} [${task.status}] - ${new Date(task.scheduledTime).toLocaleString()}`);
            });

            return tasks;
        } else {
            console.error('❌ 查询任务失败:', response.status);
        }
    } catch (error) {
        console.error('❌ 查询请求失败:', error.message);
    }
}

// 执行测试
async function runTest() {
    console.log('🧪 开始前端通知集成测试...');
    console.log('📱 请确保前端应用已在浏览器中打开: http://localhost:5174/');
    console.log('🔊 请确保浏览器已授权通知权限');
    console.log('');

    // 先查询现有任务
    await checkExistingTasks();
    console.log('');

    // 创建测试任务
    await createTestScheduleTask();
}

// 运行测试
runTest().catch(console.error);
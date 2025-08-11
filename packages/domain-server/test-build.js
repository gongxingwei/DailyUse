// 测试导入
(async () => {
    try {
        const module = await import('./dist/index.mjs');
        console.log('模块导入成功');
        console.log('导出的名称:', Object.keys(module));
        console.log('Account 存在:', 'Account' in module);
        if ('Account' in module) {
            console.log('Account 类型:', typeof module.Account);
        }
    } catch (error) {
        console.error('导入失败:', error.message);
    }
})();

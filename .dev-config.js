/**
 * 开发环境配置
 * 
 * 在开发时，设置 NODE_ENV=development 可以让包直接引用源码
 * 在生产时，使用构建后的文件
 */

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`🚀 Running in ${process.env.NODE_ENV} mode`);

if (process.env.NODE_ENV === 'development') {
    console.log('📦 Using source files directly for better DX');
} else {
    console.log('📦 Using built files for production');
}

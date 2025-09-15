import { spawn } from 'child_process';

// MCP 客户端示例 - 连接到文件系统服务器
class MCPClient {
    constructor() {
        this.serverProcess = null;
        this.requestId = 1;
        this.startServer();
    }

    startServer() {
        console.log('🚀 启动 MCP 文件系统服务器...');

        // 启动服务器进程
        this.serverProcess = spawn('pnpm', [
            'dlx',
            '@modelcontextprotocol/server-filesystem',
            'd:/myPrograms/DailyUse'
        ], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });

        // 监听服务器输出
        this.serverProcess.stdout.on('data', (data) => {
            console.log('📥 服务器输出:', data.toString().trim());
        });

        this.serverProcess.stderr.on('data', (data) => {
            console.error('❌ 服务器错误:', data.toString().trim());
        });

        // 服务器启动后发送初始化消息
        setTimeout(() => {
            this.initialize();
        }, 2000);
    }

    initialize() {
        const initMessage = {
            jsonrpc: '2.0',
            id: this.requestId++,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'test-client',
                    version: '1.0.0'
                }
            }
        };

        console.log('📤 发送初始化消息...');
        this.sendMessage(initMessage);
    }

    sendMessage(message) {
        const jsonStr = JSON.stringify(message);
        console.log('📤 发送:', jsonStr);
        this.serverProcess.stdin.write(jsonStr + '\n');
    }

    // 发送 MCP 请求
    sendRequest(method, params = {}) {
        const message = {
            jsonrpc: '2.0',
            id: this.requestId++,
            method,
            params
        };

        this.sendMessage(message);
    }

    // 列出目录内容
    listDirectory(path) {
        console.log(`📂 列出目录: ${path}`);
        this.sendRequest('tools/list', {
            uri: `file:///${path.replace(/\\/g, '/')}`
        });
    }

    // 读取文件
    readFile(path) {
        console.log(`📄 读取文件: ${path}`);
        this.sendRequest('tools/read', {
            uri: `file:///${path.replace(/\\/g, '/')}`
        });
    }

    // 关闭连接
    close() {
        if (this.serverProcess) {
            console.log('🔌 关闭连接...');
            this.serverProcess.kill();
        }
    }
}

// 使用示例
console.log('=== MCP 连接测试开始 ===\n');

const client = new MCPClient();

// 等待初始化完成后测试
setTimeout(() => {
    console.log('\n=== 执行文件操作测试 ===');

    // 测试列出根目录
    client.listDirectory('d:/myPrograms/DailyUse');

    // 测试读取package.json
    setTimeout(() => {
        client.readFile('d:/myPrograms/DailyUse/package.json');
    }, 1000);

    // 5秒后关闭
    setTimeout(() => {
        console.log('\n=== 测试完成，关闭连接 ===');
        client.close();
        process.exit(0);
    }, 5000);

}, 3000);

// 处理进程退出
process.on('SIGINT', () => {
    console.log('\n👋 收到退出信号，正在关闭...');
    client.close();
    process.exit(0);
});

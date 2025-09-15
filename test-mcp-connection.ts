import { spawn } from 'child_process';
import { Readable } from 'stream';

// MCP 客户端示例 - 连接到文件系统服务器
class MCPClient {
  private serverProcess: any;
  private requestId = 1;

  constructor() {
    this.startServer();
  }

  private startServer() {
    console.log('启动 MCP 文件系统服务器...');

    // 启动服务器进程
    this.serverProcess = spawn(
      'pnpm',
      ['dlx', '@modelcontextprotocol/server-filesystem', 'd:/myPrograms/DailyUse'],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      },
    );

    // 监听服务器输出
    this.serverProcess.stdout.on('data', (data: Buffer) => {
      console.log('服务器输出:', data.toString());
    });

    this.serverProcess.stderr.on('data', (data: Buffer) => {
      console.error('服务器错误:', data.toString());
    });

    // 服务器启动后发送初始化消息
    setTimeout(() => {
      this.initialize();
    }, 2000);
  }

  private initialize() {
    const initMessage = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    };

    console.log('发送初始化消息:', JSON.stringify(initMessage, null, 2));
    this.serverProcess.stdin.write(JSON.stringify(initMessage) + '\n');
  }

  // 发送 MCP 请求
  public sendRequest(method: string, params: any = {}) {
    const message = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params,
    };

    console.log('发送请求:', JSON.stringify(message, null, 2));
    this.serverProcess.stdin.write(JSON.stringify(message) + '\n');
  }

  // 列出目录内容
  public listDirectory(path: string) {
    this.sendRequest('tools/list', {
      uri: `file://${path}`,
    });
  }

  // 读取文件
  public readFile(path: string) {
    this.sendRequest('tools/read', {
      uri: `file://${path}`,
    });
  }

  // 关闭连接
  public close() {
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }
}

// 使用示例
const client = new MCPClient();

// 等待初始化完成后测试
setTimeout(() => {
  console.log('\n=== 测试 MCP 连接 ===');

  // 测试列出根目录
  client.listDirectory('d:/myPrograms/DailyUse');

  // 测试读取package.json
  setTimeout(() => {
    client.readFile('d:/myPrograms/DailyUse/package.json');
  }, 1000);

  // 5秒后关闭
  setTimeout(() => {
    console.log('\n=== 关闭连接 ===');
    client.close();
  }, 5000);
}, 3000);

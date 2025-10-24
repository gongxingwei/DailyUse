#!/usr/bin/env node

/**
 * API 文档生成和导出工具
 * 用于生成 OpenAPI/Swagger 规范文档并导出到 Apifox
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 直接定义 OpenAPI 规范，避免依赖编译
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'DailyUse API',
    version: '1.0.0',
    description: 'DailyUse 应用的 REST API 文档',
    contact: {
      name: 'DailyUse Team',
      email: 'support@dailyuse.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3888/api/v1',
      description: '开发环境',
    },
    {
      url: 'https://api.dailyuse.com/v1',
      description: '生产环境',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: '操作是否成功',
          },
          message: {
            type: 'string',
            description: '响应消息',
          },
          data: {
            type: 'object',
            description: '响应数据',
          },
          metadata: {
            type: 'object',
            properties: {
              timestamp: {
                type: 'number',
                description: '时间戳',
              },
              version: {
                type: 'string',
                description: 'API版本',
              },
            },
          },
        },
        required: ['success', 'message'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            description: '错误消息',
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: '错误代码',
              },
              details: {
                type: 'string',
                description: '错误详情',
              },
            },
          },
        },
        required: ['success', 'message'],
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    // 添加主要的 API 路径
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: '用户登录',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: {
                    type: 'string',
                    example: 'Test1',
                  },
                  password: {
                    type: 'string',
                    example: 'Llh123123',
                  },
                  accountType: {
                    type: 'string',
                    enum: ['GUEST', 'ADMIN'],
                    default: 'GUEST',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '登录成功',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse',
                },
              },
            },
          },
          401: {
            description: '认证失败',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/schedules': {
      get: {
        tags: ['Schedules'],
        summary: '获取调度任务列表',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: {
              type: 'integer',
              default: 1,
            },
          },
          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
              default: 50,
            },
          },
          {
            name: 'search',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: '任务列表',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Schedules'],
        summary: '创建调度任务',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'type', 'triggerTime'],
                properties: {
                  name: {
                    type: 'string',
                    description: '任务名称',
                  },
                  description: {
                    type: 'string',
                    description: '任务描述',
                  },
                  type: {
                    type: 'string',
                    enum: ['ONCE', 'RECURRING', 'CONDITIONAL'],
                  },
                  triggerTime: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: '任务创建成功',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse',
                },
              },
            },
          },
        },
      },
    },
    '/schedules/events': {
      get: {
        tags: ['Schedule Events'],
        summary: 'SSE 事件流连接',
        responses: {
          200: {
            description: 'SSE 连接建立成功',
            content: {
              'text/event-stream': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
};

/**
 * 导出 OpenAPI JSON 文档
 */
async function exportOpenAPIDoc() {
  try {
    const outputPath = path.join(__dirname, '../../docs/api-docs.json');

    // 确保目录存在
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // 写入 JSON 文件
    await fs.writeFile(outputPath, JSON.stringify(openApiSpec, null, 2), 'utf8');

    console.log('✅ OpenAPI 文档已导出到:', outputPath);
    console.log('📋 您可以将此文件导入到 Apifox 中');

    return outputPath;
  } catch (error) {
    console.error('❌ 导出 OpenAPI 文档失败:', error);
    throw error;
  }
}

/**
 * 生成 Apifox 导入指南
 */
async function generateApifoxGuide() {
  const guideContent = `# Apifox API 导入指南

## 方法一：通过 OpenAPI 文档导入（推荐）

### 步骤：
1. 启动 API 服务器：\`pnpm dev:api\`
2. 访问 API 文档：http://localhost:3888/api-docs
3. 获取 OpenAPI JSON：http://localhost:3888/api-docs.json
4. 在 Apifox 中选择"导入" → "OpenAPI/Swagger"
5. 粘贴 JSON 内容或上传文件

### 自动化导出：
运行以下命令生成文档文件：
\`\`\`bash
cd apps/api
node src/scripts/export-api-docs.js
\`\`\`

## 方法二：通过 URL 同步导入

### 步骤：
1. 在 Apifox 中选择"导入" → "URL 导入"
2. 输入：\`http://localhost:3888/api-docs.json\`
3. 选择"定时同步"以保持文档更新

## 方法三：手动创建接口

### 适用场景：
- 需要精确控制接口文档
- 添加自定义测试用例
- 特殊的业务逻辑说明

### API 基础信息：
- **Base URL**: \`http://localhost:3888/api/v1\`
- **认证方式**: Bearer Token (JWT)
- **测试账户**: 
  - Username: Test1
  - Password: Llh123123

## 主要 API 模块：

### 1. 认证模块 (\`/auth\`)
- POST /auth/login - 用户登录
- POST /auth/logout - 用户登出
- POST /auth/refresh - 刷新令牌

### 2. 调度模块 (\`/schedules\`)
- GET /schedules - 获取任务列表
- POST /schedules - 创建任务
- GET /schedules/{uuid} - 获取任务详情
- PUT /schedules/{uuid} - 更新任务
- DELETE /schedules/{uuid} - 删除任务
- POST /schedules/{uuid}/execute - 执行任务
- GET /schedules/events - SSE 事件流

### 3. 账户模块 (\`/accounts\`)
- GET /accounts/profile - 获取用户资料
- PUT /accounts/profile - 更新用户资料

### 4. 任务模块 (\`/tasks\`)
- 完整的 CRUD 操作

### 5. 目标模块 (\`/goals\`)
- 目标管理相关接口

### 6. 提醒模块 (\`/reminders\`)
- 提醒功能相关接口

## 测试建议：

### 1. 认证流程测试
\`\`\`javascript
// 1. 获取登录 Token
POST /auth/login
{
  "username": "Test1",
  "password": "Llh123123",
  "accountType": "GUEST"
}

// 2. 使用 Token 访问受保护接口
Headers: {
  "Authorization": "Bearer <token>"
}
\`\`\`

### 2. 调度任务测试
\`\`\`javascript
// 创建快速提醒
POST /schedules/quick-reminder
{
  "title": "测试提醒",
  "message": "这是一个测试提醒",
  "triggerTime": "2025-09-28T10:00:00Z"
}
\`\`\`

### 3. SSE 连接测试
\`\`\`javascript
// 连接事件流
GET /schedules/events
Accept: text/event-stream
\`\`\`

## 注意事项：

1. **API 响应格式**：所有接口都遵循统一的响应结构
2. **认证令牌**：大部分接口需要 JWT 认证
3. **错误处理**：包含详细的错误码和消息
4. **分页查询**：支持 page/limit 参数
5. **实时更新**：通过 SSE 获取实时事件

## 高级功能：

### 环境变量配置
在 Apifox 中设置环境变量：
- \`baseUrl\`: http://localhost:3888/api/v1
- \`token\`: {{登录后获取的JWT令牌}}

### 自动化测试
创建测试集合，包含：
- 登录获取 Token
- CRUD 操作测试
- 错误场景测试
- 性能测试

### Mock 数据
利用 Apifox 的 Mock 功能为前端开发提供数据。
`;

  const guidePath = path.join(__dirname, '../../docs/apifox-import-guide.md');
  await fs.writeFile(guidePath, guideContent, 'utf8');

  console.log('📖 Apifox 导入指南已生成:', guidePath);
  return guidePath;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始生成 API 文档...');

  try {
    // 导出 OpenAPI 文档
    const docPath = await exportOpenAPIDoc();

    // 生成导入指南
    const guidePath = await generateApifoxGuide();

    console.log('\n✨ API 文档导出完成！');
    console.log('\n📁 生成的文件：');
    console.log(`  - OpenAPI 文档: ${docPath}`);
    console.log(`  - 导入指南: ${guidePath}`);

    console.log('\n🎯 接下来的步骤：');
    console.log('  1. 启动 API 服务器: pnpm dev:api');
    console.log('  2. 访问文档: http://localhost:3888/api-docs');
    console.log('  3. 在 Apifox 中导入: http://localhost:3888/api-docs.json');
  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  }
}

// 直接执行主函数
main();

export { exportOpenAPIDoc, generateApifoxGuide };

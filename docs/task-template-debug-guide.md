# 任务模板创建流程调试指南

## 问题描述
在任务模板创建过程中，出现"An object could not be cloned"错误，表明在主进程和渲染进程之间的IPC通信中存在不可序列化的对象。

## 调试注释添加位置

### 1. 渲染进程 - IPC客户端
**文件**: `src/modules/Task/infrastructure/ipc/taskIpcClient.ts`
**方法**: `createTaskTemplate()`
**调试内容**:
- ✅ 原始DTO数据验证和序列化检查
- ✅ serializeForIpc序列化过程跟踪
- ✅ IPC调用结果验证
- ✅ 克隆错误特殊检测

### 2. 序列化工具
**文件**: `src/shared/utils/ipcSerialization.ts`
**方法**: `serializeForIpc()`
**调试内容**:
- ✅ 对象类型检测和处理流程
- ✅ toDTO/toJSON方法调用跟踪
- ✅ 属性逐个序列化验证
- ✅ 序列化失败的详细诊断

### 3. 主进程 - IPC处理器
**文件**: `electron/modules/Task/ipc/taskIpcHandler.ts`
**处理器**: `task:templates:create`
**调试内容**:
- ✅ 接收数据的序列化验证
- ✅ 应用服务调用跟踪
- ✅ 返回结果序列化验证
- ✅ 序列化问题修复尝试

### 4. 主进程 - 应用服务
**文件**: `electron/modules/Task/application/mainTaskApplicationService.ts`
**方法**: `createTaskTemplate()`, `taskTemplateToData()`
**调试内容**:
- ✅ DTO到领域实体转换跟踪
- ✅ 领域实体验证和序列化检查
- ✅ 数据库操作结果验证
- ✅ 最终返回数据纯化处理

### 5. 主进程 - 领域实体
**文件**: `electron/modules/Task/domain/entities/taskTemplate.ts`
**方法**: `toDTO()`
**调试内容**:
- ✅ DTO对象创建过程跟踪
- ✅ 属性逐个序列化验证
- ✅ 安全版本DTO创建备选方案

### 6. 主进程 - 数据库仓库
**文件**: `electron/modules/Task/infrastructure/repositories/taskTemplateDatabaseRepository.ts`
**方法**: `save()`, `toDbRecord()`, `fromDbRecord()`
**调试内容**:
- ✅ 实体到数据库记录转换跟踪
- ✅ 数据库操作执行验证
- ✅ 返回对象序列化检查
- ✅ 安全返回结果创建

## 调试流程

### 步骤1: 渲染进程数据准备
- 🔍 检查原始DTO数据结构
- 🔍 验证原始数据可序列化性
- 🔍 跟踪serializeForIpc处理过程

### 步骤2: IPC数据传输
- 🔍 验证传输前数据的序列化状态
- 🔍 监控IPC调用过程
- 🔍 检查主进程接收到的数据

### 步骤3: 主进程数据处理
- 🔍 验证接收数据的完整性
- 🔍 跟踪DTO到领域实体的转换
- 🔍 监控数据库保存操作

### 步骤4: 数据返回验证
- 🔍 检查数据库操作返回的实体对象
- 🔍 验证实体转DTO过程
- 🔍 确认返回数据的序列化状态

### 步骤5: 错误定位
- 🔍 识别"An object could not be cloned"错误发生的具体位置
- 🔍 分析不可序列化对象的来源
- 🔍 应用相应的修复策略

## 预期调试输出

所有日志都有统一的格式前缀:
- `🔄` - 进程开始
- `✅` - 操作成功
- `❌` - 操作失败
- `🔍` - 详细检查
- `⚠️` - 警告信息
- `🚨` - 严重错误

### 正常流程输出示例:
```
🔄 [渲染进程-步骤1] IPC客户端：开始创建任务模板
✅ [渲染进程-步骤1] 原始DTO数据可序列化
🔄 [渲染进程-序列化] 开始序列化对象
✅ [渲染进程-序列化] toDTO()调用成功
🔄 [主进程-步骤2] IPC处理器：接收到创建任务模板请求
✅ [主进程-步骤2] 接收到的DTO数据可序列化
🔄 [主进程-步骤3] 应用服务：开始创建任务模板
✅ [主进程-步骤3] DTO转换为领域实体成功
🔄 [主进程-步骤4] 数据库仓库：开始保存TaskTemplate
✅ [主进程-步骤4] 数据库插入操作成功
✅ [主进程-步骤1] IPC调用成功
```

### 错误流程输出示例:
```
❌ [主进程-步骤4] 返回的template对象无法序列化
🚨 [主进程-步骤4] 这可能是"An object could not be cloned"错误的根源
🔄 [主进程-步骤4] 使用DTO作为返回数据修复序列化问题
```

## 手动调试工具

创建了调试脚本: `src/modules/Task/debug/taskTemplateDebug.js`

### 使用方法:
1. 在浏览器开发者工具中加载该脚本
2. 使用以下命令进行测试:
   - `window.debugTaskTemplate.testSerialization()` - 测试基础序列化
   - `window.debugTaskTemplate.testTaskTemplateCreation()` - 测试完整流程
   - `window.debugTaskTemplate.debugStepByStep()` - 分步调试

## 可能的问题点和解决方案

### 问题点1: 领域实体包含不可序列化内容
**检查位置**: TaskTemplate类的实例属性
**解决方案**: 确保toDTO()方法只返回纯数据对象

### 问题点2: 数据库仓库返回实体对象
**检查位置**: save()方法的返回值
**解决方案**: 返回DTO而不是实体对象

### 问题点3: 日期对象处理问题
**检查位置**: lifecycle中的时间字段
**解决方案**: 确保所有日期都转换为字符串或时间戳

### 问题点4: 循环引用
**检查位置**: 对象之间的相互引用
**解决方案**: 使用JSON.parse(JSON.stringify())进行深拷贝

## 下一步操作

1. 运行应用程序并尝试创建任务模板
2. 查看控制台输出，确定错误发生的具体位置
3. 根据调试输出分析不可序列化对象的来源
4. 应用相应的修复策略
5. 验证修复效果

## 注意事项

- 所有调试日志都包含详细的上下文信息
- 错误处理包含了回退机制
- 序列化验证贯穿整个流程
- 提供了多个修复策略的自动尝试

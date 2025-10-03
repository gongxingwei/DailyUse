# DailyUse 项目 AI 自动测试指南

## ⚠️ 重要提醒

### 1. 后端服务启动和测试的正确流程
- **❌ 错误**：在后端服务运行的同一个terminal中发起HTTP请求
- **✅ 正确**：启动后端服务后，**必须在新的terminal中**发起HTTP请求
- **原因**：在同一terminal中执行命令会中断正在运行的后端进程

### 2. 正确的测试流程
```bash
# Terminal 1: 启动后端服务
cd "d:\myPrograms\DailyUse\apps\api" 
npx tsx src/index.ts
# 看到 "[api] listening on http://localhost:3888" 后，保持这个terminal运行

# Terminal 2: 发起API请求测试
# 在新的terminal中执行所有HTTP请求
```

## 📋 项目配置信息

### 服务端口配置
- **API后端**: `http://localhost:3888`
- **Web前端**: `http://localhost:5173` 或 `http://localhost:5174`
- **Desktop应用**: 通常在 Electron 进程中

### API 接口前缀
- **基础路径**: `/api/v1`
- **完整API地址**: `http://localhost:3888/api/v1/{endpoint}`

### 测试账户信息
```json
{
  "username": "Test1",
  "password": "Llh123123",
  "email": "test1@example.com"
}
```

### 认证接口
- **登录**: `POST /api/v1/auth/login`
- **注册**: `POST /api/v1/accounts`
- **刷新token**: `POST /api/v1/auth/refresh`

## 🔐 认证流程

### 1. 创建测试账户（如果不存在）
```powershell
$body = '{"username":"Test1","password":"Llh123123","email":"test1@example.com"}'
$response = Invoke-RestMethod -Uri "http://localhost:3888/api/v1/accounts" -Method POST -ContentType "application/json" -Body $body
```

### 2. 登录获取Token
```powershell
$loginBody = '{"username":"Test1","password":"Llh123123"}'
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3888/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $loginResponse.data.accessToken
```

### 3. 使用Token进行认证请求
```powershell
$headers = @{"Authorization" = "Bearer $token"}
$response = Invoke-RestMethod -Uri "http://localhost:3888/api/v1/{endpoint}" -Method GET -Headers $headers
```

## 📡 Schedule 模块测试

### 创建每分钟提醒任务
```powershell
# 先登录获取token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3888/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"Test1","password":"Llh123123"}'
$token = $loginResponse.data.accessToken
$headers = @{"Authorization" = "Bearer $token"}

# 创建调度任务
$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$body = @"
{
  "name": "测试提醒任务",
  "description": "每分钟测试提醒",
  "taskType": "GENERAL_REMINDER",
  "payload": {
    "type": "GENERAL_REMINDER",
    "data": {
      "message": "这是每分钟的测试提醒！",
      "priority": "high"
    }
  },
  "scheduledTime": "$now",
  "recurrence": {
    "type": "CUSTOM",
    "interval": 1,
    "cronExpression": "* * * * *"
  },
  "priority": "HIGH",
  "alertConfig": {
    "methods": ["POPUP", "SOUND", "SYSTEM_NOTIFICATION"],
    "soundVolume": 80,
    "popupDuration": 10,
    "allowSnooze": true,
    "snoozeOptions": [1, 5, 10]
  },
  "enabled": true
}
"@

$response = Invoke-RestMethod -Uri "http://localhost:3888/api/v1/schedules" -Method POST -ContentType "application/json" -Headers $headers -Body $body
```

### 查询调度任务
```powershell
$schedules = Invoke-RestMethod -Uri "http://localhost:3888/api/v1/schedules" -Method GET -Headers $headers
```

## 🎯 常用API端点

### 账户管理
- `POST /api/v1/accounts` - 创建账户
- `GET /api/v1/accounts/{id}` - 获取账户信息

### 认证
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新Token

### 调度任务
- `POST /api/v1/schedules` - 创建调度任务
- `GET /api/v1/schedules` - 获取调度任务列表
- `GET /api/v1/schedules/{id}` - 获取单个调度任务
- `PUT /api/v1/schedules/{id}` - 更新调度任务
- `DELETE /api/v1/schedules/{id}` - 删除调度任务

### 任务管理
- `GET /api/v1/tasks` - 获取任务列表
- `POST /api/v1/tasks` - 创建任务

### 目标管理
- `GET /api/v1/goals` - 获取目标列表
- `POST /api/v1/goals` - 创建目标

## 🔧 调试信息

### 查看后端日志
后端启动后会显示以下关键信息：
```
✅ Connected to database
✓ Application initialization completed
🚀 [ScheduleTaskScheduler] 调度器启动成功 - 每分钟检查待执行任务
[api] listening on http://localhost:3888
```

### 调度器运行日志
每分钟会看到：
```
🔍 [ScheduleTaskScheduler] 检查待执行任务 - 2025-09-27T07:XX:00.XXXz
📊 [ScheduleTaskScheduler] 找到 X 个待执行任务
⚡ [ScheduleTaskScheduler] 执行任务: 任务名称 (uuid)
📤 [CrossPlatformEventBus] 发送事件: ui:show-popup-reminder
✅ [ScheduleTaskScheduler] 任务执行完成: 任务名称
```

## 🚨 常见错误处理

### 1. 端口占用
```powershell
# 查看端口占用
netstat -ano | findstr :3888

# 杀掉占用进程
taskkill /PID <PID> /F
```

### 2. 数据库连接问题
```bash
# 重置数据库
cd "d:\myPrograms\DailyUse\apps\api"
npx prisma migrate reset --force
npx prisma generate
```

### 3. Token过期
重新登录获取新的token：
```powershell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3888/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"Test1","password":"Llh123123"}'
$token = $loginResponse.data.accessToken
```

## 📱 前端测试

### 启动前端应用
```bash
# Terminal 3: 启动前端应用
cd "d:\myPrograms\DailyUse"
pnpm run dev:web
# 或者
nx serve web
```

### 浏览器访问
- 打开 `http://localhost:5173` 或 `http://localhost:5174`
- 检查浏览器控制台的通知权限
- 观察是否收到调度器的提醒事件

## 💡 测试最佳实践

1. **始终保持后端服务运行**，不要在同一terminal中执行其他命令
2. **使用独立的terminal**进行API测试
3. **先测试登录**，确保认证流程正常
4. **检查后端日志**，确认事件是否正确发送
5. **验证前端接收**，检查浏览器控制台和通知权限
6. **测试完整流程**，从创建任务到收到提醒

## 📝 快速测试脚本

创建 `test-schedule.ps1` 文件：
```powershell
# 测试调度模块的完整脚本
Write-Host "🚀 开始测试调度模块..."

# 1. 登录
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3888/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"Test1","password":"Llh123123"}'
$token = $loginResponse.data.accessToken
$headers = @{"Authorization" = "Bearer $token"}
Write-Host "✅ 登录成功"

# 2. 创建调度任务
$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$body = '{"name":"AI测试提醒","description":"AI自动测试","taskType":"GENERAL_REMINDER","payload":{"type":"GENERAL_REMINDER","data":{"message":"AI测试提醒正常工作！","priority":"high"}},"scheduledTime":"' + $now + '","recurrence":{"type":"CUSTOM","interval":1,"cronExpression":"* * * * *"},"priority":"HIGH","alertConfig":{"methods":["POPUP","SOUND"],"soundVolume":80,"popupDuration":10},"enabled":true}'

$scheduleResponse = Invoke-RestMethod -Uri "http://localhost:3888/api/v1/schedules" -Method POST -ContentType "application/json" -Headers $headers -Body $body
Write-Host "✅ 调度任务创建成功"

# 3. 查询调度任务
$schedules = Invoke-RestMethod -Uri "http://localhost:3888/api/v1/schedules" -Method GET -Headers $headers
Write-Host "📋 当前调度任务数量: $($schedules.data.total)"

Write-Host "🎉 测试完成！请观察后端日志和前端通知。"
```

---

**记住：永远不要在后端服务运行的terminal中执行其他命令！** 🚫
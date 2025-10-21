# Sprint 2b 详细执行计划

> **Sprint ID**: Sprint 2b  
> **Sprint 周期**: Week 5-6 (2025-11-17 ~ 2025-11-28)  
> **Sprint 目标**: 实现专注周期聚焦模式 (GOAL-003)  
> **Story Points**: 23 SP  
> **Epic**: GOAL-003 - 专注周期聚焦模式  
> **状态**: Planning  
> **依赖**: Sprint 2a (Goal 模块基础架构)

---

## 📋 Sprint 概览

### Sprint 目标 (Sprint Goal)

> **为用户提供临时聚焦模式，让用户在关键冲刺期能够屏蔽非核心目标，专注于 1-3 个最重要的目标。**

**核心价值**:
- ✅ 用户可一键开启聚焦模式，快速进入专注状态
- ✅ 支持灵活的聚焦周期管理（本周/本月/自定义）
- ✅ 提供简洁的聚焦视图，减少视觉干扰
- ✅ 自动结束过期聚焦，无需手动管理

### Epic 背景

**业务价值**: 提供临时聚焦模式，让用户在关键冲刺期能够屏蔽非核心目标，专注于 1-3 个最重要的目标。通过 UI 的视觉简化和信息过滤，帮助用户保持专注，提升执行效率。

**用户场景**:
- 季度末冲刺，需要专注完成 2-3 个关键 OKR
- 项目关键期，暂时屏蔽其他日常目标
- 个人专注时段（如深度工作日）

### 技术依赖

**内部依赖**:
- ✅ Sprint 2a 完成的 Goal 模块基础架构
- ✅ Goal 和 KeyResult 实体已实现
- ✅ 用户认证和权限系统

**外部依赖**:
- 定时任务库: Node-Cron
- 通知系统: 用于聚焦结束提醒

---

## 📅 每日执行计划 (Day-by-Day Plan)

### **Week 5: 后端开发 + 定时任务**

#### **Day 1 (2025-11-17 周一): Contracts & Domain 层**

**目标**: 完成 Story-001 (2 SP)

**任务清单**:
- [ ] **09:00-09:15** Sprint 2b Kickoff 会议
  - 全员参与
  - Review Sprint 2a 成果和经验教训
  - Review Sprint 2b 目标和 Story 列表
  - 确认技术栈和分工

- [ ] **09:30-12:00** 开发 Contracts 层 (2.5h)
  - 创建 `packages/contracts/src/goal/FocusModeServerDTO.ts`:
    ```typescript
    export interface FocusModeServerDTO {
      uuid: string;
      userId: string;
      focusedGoalUuids: string[]; // 限制 1-3 个
      startTime: number;
      endTime: number;
      hiddenGoalsMode: 'hide' | 'collapse' | 'deprioritize';
      isActive: boolean;
      createdAt: number;
      updatedAt: number;
    }
    
    export type HiddenGoalsMode = 'hide' | 'collapse' | 'deprioritize';
    
    export interface ActivateFocusModeRequestDTO {
      goalUuids: string[];
      endTime: number;
      hiddenGoalsMode?: HiddenGoalsMode;
    }
    
    export interface ExtendFocusPeriodRequestDTO {
      newEndTime: number;
    }
    
    export interface UpdateFocusedGoalsRequestDTO {
      goalUuids: string[];
    }
    ```
  - 更新 `UserServerDTO` 添加 `activeFocusMode?: FocusModeServerDTO`
  - 编写 Zod schema 验证器:
    ```typescript
    export const ActivateFocusModeSchema = z.object({
      goalUuids: z.array(z.string().uuid()).min(1).max(3),
      endTime: z.number().int().positive(),
      hiddenGoalsMode: z.enum(['hide', 'collapse', 'deprioritize']).optional()
    }).refine(
      data => data.endTime > Date.now(),
      { message: 'endTime 必须是未来时间' }
    );
    ```

- [ ] **13:00-15:00** 开发 Domain 层 (2h)
  - 创建 `packages/domain-server/src/goal/FocusMode.ts` 值对象:
    ```typescript
    export class FocusMode {
      constructor(
        public readonly uuid: string,
        public readonly userId: string,
        public readonly focusedGoalUuids: string[],
        public readonly startTime: number,
        public readonly endTime: number,
        public readonly hiddenGoalsMode: HiddenGoalsMode,
        public readonly isActive: boolean,
        public readonly createdAt: number,
        public readonly updatedAt: number
      ) {
        this.validate();
      }
      
      private validate(): void {
        if (this.focusedGoalUuids.length < 1 || this.focusedGoalUuids.length > 3) {
          throw new TooManyFocusedGoalsError('聚焦目标数量必须在 1-3 个之间');
        }
        
        if (this.startTime >= this.endTime) {
          throw new InvalidFocusPeriodError('startTime 必须小于 endTime');
        }
        
        if (this.endTime <= Date.now() && this.isActive) {
          throw new InvalidFocusPeriodError('已过期的聚焦模式不能激活');
        }
      }
      
      isExpired(): boolean {
        return Date.now() > this.endTime;
      }
      
      getRemainingDays(): number {
        const remainingMs = this.endTime - Date.now();
        return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
      }
      
      deactivate(): FocusMode {
        return new FocusMode(
          this.uuid,
          this.userId,
          this.focusedGoalUuids,
          this.startTime,
          this.endTime,
          this.hiddenGoalsMode,
          false, // isActive = false
          this.createdAt,
          Date.now()
        );
      }
      
      extendPeriod(newEndTime: number): FocusMode {
        if (newEndTime <= this.endTime) {
          throw new InvalidFocusPeriodError('newEndTime 必须大于当前 endTime');
        }
        
        return new FocusMode(
          this.uuid,
          this.userId,
          this.focusedGoalUuids,
          this.startTime,
          newEndTime,
          this.hiddenGoalsMode,
          this.isActive,
          this.createdAt,
          Date.now()
        );
      }
      
      updateFocusedGoals(goalUuids: string[]): FocusMode {
        return new FocusMode(
          this.uuid,
          this.userId,
          goalUuids,
          this.startTime,
          this.endTime,
          this.hiddenGoalsMode,
          this.isActive,
          this.createdAt,
          Date.now()
        );
      }
    }
    ```

- [ ] **15:00-17:00** 编写单元测试 (2h)
  - 测试 DTO 验证逻辑
  - 测试值对象创建和方法
  - 测试边界条件（目标数量、时间范围）
  - 目标覆盖率: ≥ 80%

- [ ] **17:00-17:30** Code Review & 提交
  - Self-review 代码
  - 运行测试
  - 提交 PR: `feat(goal): add focus mode contracts and domain`

**交付物**:
- ✅ `FocusModeServerDTO` 和 Zod schema
- ✅ `FocusMode` 值对象
- ✅ 单元测试覆盖率 ≥ 80%

**验收标准**:
```gherkin
Scenario: DTO 和 Domain 层正确实现
  Given FocusModeServerDTO 已定义
  Then Zod 验证器可正确验证数据
  And FocusMode 可正确创建实例
  And 目标数量限制 1-3 个
  And 时间范围验证正确
  And 所有测试通过
```

---

#### **Day 2 (2025-11-18 周二): Application Service**

**目标**: 完成 Story-002 (3 SP)

**任务清单**:
- [ ] **09:00-12:00** 创建 Application Service (3h)
  - 创建 `apps/api/src/application/goal/FocusModeApplicationService.ts`:
    ```typescript
    export class FocusModeApplicationService {
      constructor(
        private focusModeRepository: FocusModeRepository,
        private goalRepository: GoalRepository,
        private userRepository: UserRepository,
        private notificationService: NotificationService
      ) {}
      
      async activateFocusMode(
        userId: string,
        goalUuids: string[],
        endTime: number,
        hiddenGoalsMode: HiddenGoalsMode = 'hide'
      ): Promise<FocusMode> {
        // 1. 验证用户存在
        const user = await this.userRepository.findById(userId);
        if (!user) throw new UserNotFoundError();
        
        // 2. 验证所有目标存在且属于该用户
        for (const goalUuid of goalUuids) {
          const goal = await this.goalRepository.findByUuid(goalUuid);
          if (!goal || goal.ownerUuid !== userId) {
            throw new GoalNotFoundError(`目标 ${goalUuid} 不存在或不属于当前用户`);
          }
        }
        
        // 3. 检查是否已有激活的聚焦模式
        const existingFocus = await this.focusModeRepository.findActiveByUserId(userId);
        if (existingFocus) {
          throw new FocusModeAlreadyActiveError('已有激活的聚焦模式，请先停用');
        }
        
        // 4. 创建聚焦模式
        const focusMode = new FocusMode(
          uuidv4(),
          userId,
          goalUuids,
          Date.now(),
          endTime,
          hiddenGoalsMode,
          true,
          Date.now(),
          Date.now()
        );
        
        // 5. 保存
        await this.focusModeRepository.save(focusMode);
        
        // 6. 更新用户的 activeFocusMode 字段
        await this.userRepository.updateActiveFocusMode(userId, focusMode);
        
        // 7. 发送通知
        await this.notificationService.send(userId, {
          type: 'focus_mode_activated',
          title: '聚焦模式已开启',
          message: `已聚焦 ${goalUuids.length} 个目标，将持续到 ${new Date(endTime).toLocaleDateString()}`
        });
        
        return focusMode;
      }
      
      async deactivateFocusMode(userId: string): Promise<void> {
        // 1. 获取当前聚焦模式
        const focusMode = await this.focusModeRepository.findActiveByUserId(userId);
        if (!focusMode) {
          throw new FocusModeNotFoundError('没有激活的聚焦模式');
        }
        
        // 2. 停用
        const deactivated = focusMode.deactivate();
        await this.focusModeRepository.update(deactivated);
        
        // 3. 更新用户
        await this.userRepository.updateActiveFocusMode(userId, null);
        
        // 4. 发送通知
        await this.notificationService.send(userId, {
          type: 'focus_mode_deactivated',
          title: '聚焦模式已结束',
          message: '已恢复显示所有目标'
        });
      }
      
      async extendFocusPeriod(userId: string, newEndTime: number): Promise<FocusMode> {
        const focusMode = await this.focusModeRepository.findActiveByUserId(userId);
        if (!focusMode) throw new FocusModeNotFoundError();
        
        const extended = focusMode.extendPeriod(newEndTime);
        await this.focusModeRepository.update(extended);
        await this.userRepository.updateActiveFocusMode(userId, extended);
        
        return extended;
      }
      
      async updateFocusedGoals(userId: string, goalUuids: string[]): Promise<FocusMode> {
        const focusMode = await this.focusModeRepository.findActiveByUserId(userId);
        if (!focusMode) throw new FocusModeNotFoundError();
        
        // 验证目标
        for (const goalUuid of goalUuids) {
          const goal = await this.goalRepository.findByUuid(goalUuid);
          if (!goal || goal.ownerUuid !== userId) {
            throw new GoalNotFoundError();
          }
        }
        
        const updated = focusMode.updateFocusedGoals(goalUuids);
        await this.focusModeRepository.update(updated);
        await this.userRepository.updateActiveFocusMode(userId, updated);
        
        return updated;
      }
      
      async deactivateExpiredFocusModes(): Promise<number> {
        // 定时任务调用：批量停用过期的聚焦模式
        const expiredFocusModes = await this.focusModeRepository.findExpired();
        
        for (const focusMode of expiredFocusModes) {
          const deactivated = focusMode.deactivate();
          await this.focusModeRepository.update(deactivated);
          await this.userRepository.updateActiveFocusMode(focusMode.userId, null);
          
          // 发送通知
          await this.notificationService.send(focusMode.userId, {
            type: 'focus_mode_auto_deactivated',
            title: '聚焦模式已自动结束',
            message: '聚焦周期已到期，已恢复显示所有目标'
          });
        }
        
        return expiredFocusModes.length;
      }
    }
    ```

- [ ] **13:00-15:00** 编写集成测试 (2h)
  - 测试激活/停用聚焦
  - 测试延长周期
  - 测试更新聚焦目标
  - 测试边界情况（重复激活、目标不存在等）

- [ ] **15:00-17:00** 添加错误处理 (2h)
  - 定义自定义错误类:
    - `TooManyFocusedGoalsError`
    - `InvalidFocusPeriodError`
    - `FocusModeAlreadyActiveError`
    - `FocusModeNotFoundError`
  - 添加错误日志

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(goal): add focus mode application service`

**交付物**:
- ✅ `FocusModeApplicationService` 完整实现
- ✅ 错误处理和日志
- ✅ 集成测试覆盖率 ≥ 80%

**验收标准**:
```gherkin
Scenario: 激活聚焦模式
  Given 用户有 5 个目标
  When 调用 activateFocusMode(userId, [goal1, goal2], endTime)
  Then 创建 FocusMode 实体
  And 用户的 activeFocusMode 更新
  And 发送通知

Scenario: 重复激活检测
  Given 用户已有激活的聚焦模式
  When 尝试再次激活
  Then 抛出 FocusModeAlreadyActiveError
```

---

#### **Day 3 (2025-11-19 周三): Infrastructure & Repository**

**目标**: 完成 Story-003 (2 SP)

**任务清单**:
- [ ] **09:00-11:00** 更新 Prisma Schema (2h)
  - 更新 `apps/api/prisma/schema.prisma`:
    ```prisma
    model User {
      id                String    @id @default(uuid())
      uuid              String    @unique @default(uuid())
      email             String    @unique
      // ...existing fields...
      
      // 聚焦模式（JSON 字段）
      activeFocusMode   Json?
      
      createdAt         BigInt
      updatedAt         BigInt
      
      @@map("users")
    }
    
    // activeFocusMode JSON 结构：
    // {
    //   uuid: string,
    //   userId: string,
    //   focusedGoalUuids: string[],
    //   startTime: number,
    //   endTime: number,
    //   hiddenGoalsMode: 'hide' | 'collapse' | 'deprioritize',
    //   isActive: boolean,
    //   createdAt: number,
    //   updatedAt: number
    // }
    ```
  - 运行 `pnpm nx run api:prisma-migrate-dev --name add_focus_mode_to_user`
  - 验证迁移成功

- [ ] **11:00-13:00** 实现 Repository (2h)
  - 创建 `apps/api/src/infrastructure/goal/FocusModeRepository.ts`:
    ```typescript
    export class FocusModeRepository {
      constructor(private prisma: PrismaClient) {}
      
      async save(focusMode: FocusMode): Promise<void> {
        const user = await this.prisma.user.findUnique({
          where: { uuid: focusMode.userId }
        });
        
        if (!user) throw new UserNotFoundError();
        
        await this.prisma.user.update({
          where: { uuid: focusMode.userId },
          data: {
            activeFocusMode: this.toJson(focusMode)
          }
        });
      }
      
      async update(focusMode: FocusMode): Promise<void> {
        await this.prisma.user.update({
          where: { uuid: focusMode.userId },
          data: {
            activeFocusMode: this.toJson(focusMode)
          }
        });
      }
      
      async findActiveByUserId(userId: string): Promise<FocusMode | null> {
        const user = await this.prisma.user.findUnique({
          where: { uuid: userId },
          select: { activeFocusMode: true }
        });
        
        if (!user || !user.activeFocusMode) return null;
        
        const focusMode = this.toDomain(user.activeFocusMode);
        
        return focusMode.isActive ? focusMode : null;
      }
      
      async findExpired(): Promise<FocusMode[]> {
        const now = Date.now();
        
        const users = await this.prisma.user.findMany({
          where: {
            activeFocusMode: { not: null }
          },
          select: { activeFocusMode: true }
        });
        
        const expiredFocusModes: FocusMode[] = [];
        
        for (const user of users) {
          if (!user.activeFocusMode) continue;
          
          const focusMode = this.toDomain(user.activeFocusMode);
          
          if (focusMode.isActive && focusMode.isExpired()) {
            expiredFocusModes.push(focusMode);
          }
        }
        
        return expiredFocusModes;
      }
      
      private toJson(focusMode: FocusMode): any {
        return {
          uuid: focusMode.uuid,
          userId: focusMode.userId,
          focusedGoalUuids: focusMode.focusedGoalUuids,
          startTime: focusMode.startTime,
          endTime: focusMode.endTime,
          hiddenGoalsMode: focusMode.hiddenGoalsMode,
          isActive: focusMode.isActive,
          createdAt: focusMode.createdAt,
          updatedAt: focusMode.updatedAt
        };
      }
      
      private toDomain(data: any): FocusMode {
        return new FocusMode(
          data.uuid,
          data.userId,
          data.focusedGoalUuids,
          data.startTime,
          data.endTime,
          data.hiddenGoalsMode,
          data.isActive,
          data.createdAt,
          data.updatedAt
        );
      }
    }
    ```

- [ ] **14:00-16:00** 编写 Repository 测试 (2h)
  - 使用测试数据库
  - 测试 save、update、findActiveByUserId、findExpired

- [ ] **16:00-17:30** Code Review & 集成测试 (1.5h)
  - 运行所有测试
  - PR: `feat(goal): add focus mode repository and migrations`

**交付物**:
- ✅ Prisma Schema 和数据库迁移
- ✅ `FocusModeRepository` 完整实现
- ✅ Repository 测试覆盖率 ≥ 80%

**验收标准**:
```gherkin
Scenario: Repository 方法正确工作
  Given 用户激活聚焦模式
  When 调用 save(focusMode)
  Then User 表的 activeFocusMode 字段更新
  
  When 调用 findActiveByUserId(userId)
  Then 返回聚焦模式对象
  
  When 调用 findExpired()
  Then 返回所有过期的聚焦模式
```

---

#### **Day 4 (2025-11-20 周四): API Endpoints**

**目标**: 完成 Story-004 (3 SP)

**任务清单**:
- [ ] **09:00-12:00** 创建 Controller (3h)
  - 创建 `apps/api/src/api/goal/FocusModeController.ts`:
    ```typescript
    @Controller('/api/focus-mode')
    export class FocusModeController {
      constructor(private focusModeService: FocusModeApplicationService) {}
      
      @Post('/activate')
      @UseGuards(AuthGuard)
      async activate(
        @CurrentUser() user: User,
        @Body() body: ActivateFocusModeRequestDTO
      ): Promise<FocusModeServerDTO> {
        const focusMode = await this.focusModeService.activateFocusMode(
          user.uuid,
          body.goalUuids,
          body.endTime,
          body.hiddenGoalsMode
        );
        
        return this.toDTO(focusMode);
      }
      
      @Post('/deactivate')
      @UseGuards(AuthGuard)
      async deactivate(@CurrentUser() user: User): Promise<void> {
        await this.focusModeService.deactivateFocusMode(user.uuid);
      }
      
      @Put('/extend')
      @UseGuards(AuthGuard)
      async extend(
        @CurrentUser() user: User,
        @Body() body: ExtendFocusPeriodRequestDTO
      ): Promise<FocusModeServerDTO> {
        const focusMode = await this.focusModeService.extendFocusPeriod(
          user.uuid,
          body.newEndTime
        );
        
        return this.toDTO(focusMode);
      }
      
      @Put('/update-goals')
      @UseGuards(AuthGuard)
      async updateGoals(
        @CurrentUser() user: User,
        @Body() body: UpdateFocusedGoalsRequestDTO
      ): Promise<FocusModeServerDTO> {
        const focusMode = await this.focusModeService.updateFocusedGoals(
          user.uuid,
          body.goalUuids
        );
        
        return this.toDTO(focusMode);
      }
      
      @Get('/active')
      @UseGuards(AuthGuard)
      async getActive(@CurrentUser() user: User): Promise<FocusModeServerDTO | null> {
        const focusMode = await this.focusModeService.getActiveFocusMode(user.uuid);
        
        return focusMode ? this.toDTO(focusMode) : null;
      }
      
      private toDTO(focusMode: FocusMode): FocusModeServerDTO {
        return {
          uuid: focusMode.uuid,
          userId: focusMode.userId,
          focusedGoalUuids: focusMode.focusedGoalUuids,
          startTime: focusMode.startTime,
          endTime: focusMode.endTime,
          hiddenGoalsMode: focusMode.hiddenGoalsMode,
          isActive: focusMode.isActive,
          createdAt: focusMode.createdAt,
          updatedAt: focusMode.updatedAt
        };
      }
    }
    ```

- [ ] **13:00-15:00** 添加路由和验证 (2h)
  - 注册路由到 Express App
  - 添加请求验证中间件（使用 Zod）
  - 添加错误处理

- [ ] **15:00-17:00** 编写 API 测试 (2h)
  - 使用 Supertest
  - 测试所有端点
  - 测试权限检查

- [ ] **17:00-17:30** 更新 OpenAPI 文档
  - 使用 Swagger 注解
  - 生成 API 文档
  - PR: `feat(goal): add focus mode API endpoints`

**交付物**:
- ✅ `FocusModeController` 完整实现
- ✅ 请求验证和错误处理
- ✅ API 测试覆盖率 ≥ 80%
- ✅ OpenAPI 文档更新

**验收标准**:
```gherkin
Scenario: POST 激活聚焦
  Given 用户已认证
  And 请求体 {goalUuids: [uuid1, uuid2], endTime: 1730390399000}
  When POST /api/focus-mode/activate
  Then 返回 200
  And 响应包含 FocusModeServerDTO

Scenario: GET 查询聚焦状态
  Given 用户已激活聚焦
  When GET /api/focus-mode/active
  Then 返回 200
  And 响应包含当前聚焦详情
  
  Given 用户未激活聚焦
  When GET /api/focus-mode/active
  Then 返回 200
  And 响应为 null
```

---

#### **Day 5 (2025-11-21 周五): 定时任务 + Code Review**

**目标**: 完成定时任务 + Code Review Week 5

**任务清单**:
- [ ] **09:00-11:00** 实现定时任务 (2h)
  - 安装 Node-Cron: `pnpm add node-cron @types/node-cron`
  - 创建 `apps/api/src/jobs/FocusModeCleanupJob.ts`:
    ```typescript
    import cron from 'node-cron';
    
    export class FocusModeCleanupJob {
      constructor(private focusModeService: FocusModeApplicationService) {}
      
      start(): void {
        // 每小时执行一次（0 分时）
        cron.schedule('0 * * * *', async () => {
          console.log('[FocusModeCleanupJob] 开始检查过期的聚焦模式...');
          
          try {
            const count = await this.focusModeService.deactivateExpiredFocusModes();
            console.log(`[FocusModeCleanupJob] 已停用 ${count} 个过期聚焦模式`);
          } catch (error) {
            console.error('[FocusModeCleanupJob] 错误:', error);
          }
        });
        
        console.log('[FocusModeCleanupJob] 定时任务已启动（每小时执行一次）');
      }
    }
    ```
  - 在 `apps/api/src/main.ts` 中启动定时任务:
    ```typescript
    // 启动定时任务
    const focusModeCleanupJob = new FocusModeCleanupJob(focusModeService);
    focusModeCleanupJob.start();
    ```

- [ ] **11:00-12:00** 测试定时任务 (1h)
  - 编写单元测试（Mock cron）
  - 手动触发测试
  - 验证日志输出

- [ ] **13:00-15:00** Code Review 会议 (2h)
  - Review Week 5 所有代码
  - 讨论技术债务
  - 确认重构需求

- [ ] **15:00-17:00** 修复 Review 问题 (2h)
  - 根据 Review 意见修改代码
  - 提交最终版本

- [ ] **17:00-17:30** 每日站会 & 周总结
  - 汇报 Week 5 进展
  - 讨论下周计划

**交付物**:
- ✅ 定时任务完整实现
- ✅ 定时任务测试
- ✅ Week 5 所有代码 Review 完成

---

### **Week 6: 前端开发 + E2E 测试**

#### **Day 6 (2025-11-24 周一): Client Services**

**目标**: 完成 Story-005 (2 SP)

**任务清单**:
- [ ] **09:00-12:00** 创建 Client Service (3h)
  - 创建 `packages/domain-client/src/goal/FocusModeClientService.ts`:
    ```typescript
    export class FocusModeClientService {
      constructor(private httpClient: HttpClient) {}
      
      async activateFocusMode(
        goalUuids: string[],
        endTime: number,
        hiddenGoalsMode?: HiddenGoalsMode
      ): Promise<FocusModeClientDTO> {
        const response = await this.httpClient.post('/api/focus-mode/activate', {
          goalUuids,
          endTime,
          hiddenGoalsMode: hiddenGoalsMode || 'hide'
        });
        
        return response.data;
      }
      
      async deactivateFocusMode(): Promise<void> {
        await this.httpClient.post('/api/focus-mode/deactivate');
      }
      
      async extendFocusPeriod(newEndTime: number): Promise<FocusModeClientDTO> {
        const response = await this.httpClient.put('/api/focus-mode/extend', {
          newEndTime
        });
        
        return response.data;
      }
      
      async updateFocusedGoals(goalUuids: string[]): Promise<FocusModeClientDTO> {
        const response = await this.httpClient.put('/api/focus-mode/update-goals', {
          goalUuids
        });
        
        return response.data;
      }
      
      async getActiveFocusMode(): Promise<FocusModeClientDTO | null> {
        const response = await this.httpClient.get('/api/focus-mode/active');
        return response.data;
      }
    }
    ```

- [ ] **13:00-15:00** 集成 React Query (2h)
  - 创建 hooks:
    ```typescript
    export function useActiveFocusMode() {
      return useQuery({
        queryKey: ['focus-mode', 'active'],
        queryFn: () => focusModeService.getActiveFocusMode(),
        staleTime: 60 * 1000, // 1 分钟缓存
        refetchInterval: 5 * 60 * 1000 // 5 分钟自动刷新
      });
    }
    
    export function useActivateFocusMode() {
      const queryClient = useQueryClient();
      
      return useMutation({
        mutationFn: (params: { goalUuids: string[]; endTime: number }) =>
          focusModeService.activateFocusMode(params.goalUuids, params.endTime),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['focus-mode'] });
          queryClient.invalidateQueries({ queryKey: ['goals'] });
        }
      });
    }
    
    export function useDeactivateFocusMode() {
      const queryClient = useQueryClient();
      
      return useMutation({
        mutationFn: () => focusModeService.deactivateFocusMode(),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['focus-mode'] });
          queryClient.invalidateQueries({ queryKey: ['goals'] });
        }
      });
    }
    ```

- [ ] **15:00-17:00** 编写客户端测试 (2h)
  - Mock HTTP responses
  - 测试 React Query hooks
  - 测试缓存和自动刷新

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(goal): add focus mode client services`

**交付物**:
- ✅ `FocusModeClientService` 完整实现
- ✅ React Query hooks
- ✅ 客户端测试覆盖率 ≥ 80%

---

#### **Day 7 (2025-11-25 周二): UI - 聚焦配置面板**

**目标**: 完成 Story-006 (3 SP)

**任务清单**:
- [ ] **09:00-12:00** 创建配置面板组件 (3h)
  - 创建 `apps/web/src/features/goal/components/FocusModeConfigPanel.vue`
  - 实现目标多选列表（最多 3 个）
  - 实现周期选择（本周/本月/自定义）
  - 实现隐藏模式选择

- [ ] **13:00-15:00** 添加表单验证 (2h)
  - 至少选 1 个目标，最多 3 个
  - 结束时间必须是未来时间
  - 显示友好的错误提示

- [ ] **15:00-17:00** 编写组件测试 (2h)
  - 测试目标选择逻辑
  - 测试周期计算
  - 测试表单验证

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(goal): add focus mode config panel UI`

**交付物**:
- ✅ `FocusModeConfigPanel.vue` 组件
- ✅ 表单验证和错误提示
- ✅ 组件测试覆盖率 ≥ 80%

---

#### **Day 8 (2025-11-26 周三): UI - 聚焦模式视图**

**目标**: 完成 Story-007 (4 SP)

**任务清单**:
- [ ] **09:00-12:00** 创建聚焦视图组件 (3h)
  - 创建 `FocusedGoalList.vue`
  - 实现聚焦状态栏（剩余天数、退出按钮）
  - 实现"查看全部"/"返回聚焦"切换

- [ ] **13:00-15:00** 视觉优化 (2h)
  - 聚焦模式下只显示聚焦目标
  - 非聚焦模式下高亮聚焦目标
  - 视觉强化（大卡片、高亮边框）

- [ ] **15:00-17:00** 编写组件测试 (2h)
  - 测试聚焦/非聚焦视图切换
  - 测试状态栏显示
  - 测试视觉样式

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(goal): add focused goal list UI`

**交付物**:
- ✅ `FocusedGoalList.vue` 组件
- ✅ 聚焦状态栏和切换逻辑
- ✅ 组件测试覆盖率 ≥ 80%

---

#### **Day 9 (2025-11-27 周四): UI - 聚焦管理 + E2E 准备**

**目标**: 完成 Story-008 (2 SP) + 准备 E2E

**任务清单**:
- [ ] **09:00-11:00** 创建管理组件 (2h)
  - 创建 `FocusModeManager.vue`
  - 显示当前聚焦详情
  - 实现"延长聚焦"功能
  - 实现"提前结束"功能
  - 实现"调整目标"功能

- [ ] **11:00-12:00** 添加确认对话框 (1h)
  - 提前结束确认
  - 调整目标确认

- [ ] **13:00-15:00** E2E 测试准备 (2h)
  - Review 所有前端组件
  - 添加 `data-testid` 属性
  - 确认测试环境配置

- [ ] **15:00-17:00** 编写管理组件测试 (2h)
  - 测试延长周期
  - 测试提前结束
  - 测试调整目标

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(goal): add focus mode manager UI`

**交付物**:
- ✅ `FocusModeManager.vue` 组件
- ✅ 确认对话框
- ✅ E2E 测试准备完成
- ✅ 组件测试覆盖率 ≥ 80%

---

#### **Day 10 (2025-11-28 周五): E2E Tests + Sprint Review**

**目标**: 完成 Story-009 (2 SP) + Sprint Review

**任务清单**:
- [ ] **09:00-12:00** 编写 E2E 测试 (3h)
  - 使用 Playwright
  - 创建 `apps/web/e2e/goal/focus-mode.spec.ts`
  - 测试完整的聚焦流程
  - 测试边界情况

- [ ] **13:00-15:00** Bug Fixes & 优化 (2h)
  - 修复 E2E 测试发现的问题
  - 性能优化
  - 最终代码清理

- [ ] **15:00-17:00** Sprint Review 会议 (2h)
  - **参与者**: 全员 + 产品经理
  - **议程**:
    - Demo 聚焦模式功能（15 分钟）
    - Review Story 完成情况（30 分钟）
    - 讨论技术债务（15 分钟）
    - 收集反馈（15 分钟）
    - 确认 Sprint 2b 是否达到 DoD（10 分钟）

- [ ] **17:00-17:30** Sprint Retrospective 会议 (30 分钟)
  - 回顾 Sprint 2a + 2b 整体表现
  - 总结经验教训
  - 为 Sprint 3 制定改进计划

**交付物**:
- ✅ E2E 测试套件完整
- ✅ 所有测试通过
- ✅ Sprint Review 完成
- ✅ Sprint Retrospective 完成

---

## 📊 Sprint 统计

### Story 完成情况

| Story ID | 标题 | SP | 预估工时 | 实际工时 | 状态 |
|----------|------|----|---------|---------|----|
| STORY-GOAL-003-001 | Contracts & Domain | 2 | 0.5d | - | Planning |
| STORY-GOAL-003-002 | Application Service | 3 | 1d | - | Planning |
| STORY-GOAL-003-003 | Infrastructure | 2 | 0.5d | - | Planning |
| STORY-GOAL-003-004 | API Endpoints | 3 | 1d | - | Planning |
| STORY-GOAL-003-005 | Client Services | 2 | 0.5d | - | Planning |
| STORY-GOAL-003-006 | UI - 配置面板 | 3 | 1d | - | Planning |
| STORY-GOAL-003-007 | UI - 聚焦视图 | 4 | 1.5d | - | Planning |
| STORY-GOAL-003-008 | UI - 聚焦管理 | 2 | 0.5d | - | Planning |
| STORY-GOAL-003-009 | 定时任务 & E2E | 2 | 0.5d | - | Planning |

**总计**: 23 SP, 预估 7.5 工作日

---

## ✅ Definition of Done (DoD)

### Story 级别 DoD

每个 Story 必须满足:
- [ ] 所有验收标准通过
- [ ] 代码覆盖率 ≥ 80%
- [ ] ESLint 检查通过
- [ ] TypeScript 编译无错误
- [ ] Code Review 完成并批准
- [ ] API 文档更新（如适用）
- [ ] 性能指标达标

### Sprint 级别 DoD

Sprint 2b 必须满足:
- [ ] 所有 9 个 Stories 状态为 Done
- [ ] 所有测试通过（单元 + 集成 + E2E）
- [ ] 无 P0 Bug
- [ ] P1 Bug ≤ 3 个
- [ ] 代码覆盖率 ≥ 80%
- [ ] 可部署到 Staging 环境
- [ ] Sprint Review 完成
- [ ] Sprint Retrospective 完成
- [ ] 定时任务稳定运行

---

## 🚨 风险管理

| 风险 | 概率 | 影响 | 缓解策略 | 负责人 |
|------|------|------|---------|--------|
| 定时任务失败 | 中 | 高 | 添加监控和告警，准备手动触发脚本 | 后端负责人 |
| 多设备状态不一致 | 中 | 中 | React Query 实时轮询，设置 5 分钟刷新 | 前端负责人 |
| JSON 字段查询性能 | 低 | 中 | 如需频繁查询，考虑创建专门表 | 后端负责人 |
| 用户忘记聚焦模式 | 低 | 低 | 到期前 3 天提醒 | 产品经理 |

---

## 📈 Sprint 监控指标

同 Sprint 2a，详见 [sprint-02a-plan.md](./sprint-02a-plan.md)

---

## 🔧 技术栈总结

同 Sprint 2a，额外增加:
- **定时任务**: Node-Cron 3.x

---

## 📚 参考文档

- [Epic: GOAL-003 - 专注周期聚焦模式](../epics/epic-goal-003-focus-mode.md)
- [Sprint 2a 计划](./sprint-02a-plan.md)
- [PM 阶段总结](../PM_PHASE_SUMMARY.md)

---

## 🎯 Sprint 成功标准

Sprint 2b 被认为成功当且仅当:
1. ✅ 所有 9 个 Stories 完成并通过验收
2. ✅ 所有 DoD 检查项通过
3. ✅ 可在 Staging 环境正常运行
4. ✅ 产品经理验收通过
5. ✅ 定时任务稳定运行（监控 7 天无故障）
6. ✅ 团队准备好开始 Sprint 3

---

**Sprint 计划创建于**: 2025-10-21  
**计划审批**: 待团队 Review  
**前置条件**: Sprint 2a 完成  
**下一步**: 等待 Sprint 2a 完成后启动

---

*祝 Sprint 2b 顺利！🚀*

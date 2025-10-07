# Reminder 模块启用状态重构方案

**日期**: 2025-01-10  
**状态**: ⚠️ 需要重构

---

## ❌ 当前问题

### 1. 状态存储混乱

```typescript
// ReminderTemplate
_enabled: boolean      // ❌ 不应该直接存储
_selfEnabled: boolean  // ✅ 应该保留

// 当前问题：
// - enabled 和 selfEnabled 同时存储，导致状态不一致
// - enabled 可以被直接修改，破坏了状态计算逻辑
```

### 2. 状态计算错误

**当前响应数据**:
```json
{
  "groupUuid": null,  // 无组
  "enabled": false,   // ❌ 应该 = selfEnabled (true)
  "selfEnabled": true,
  "effectiveEnabled": false  // ❌ 应该 = true
}
```

**正确逻辑应该是**:
- 无组时：`enabled = selfEnabled` → `true`
- 有组 + GROUP模式：`enabled = group.enabled`
- 有组 + INDIVIDUAL模式：`enabled = selfEnabled`

---

## ✅ 正确的重构方案

### 方案A：enabled 改为计算属性（推荐）

#### 1. 数据库层面

**ReminderTemplate 表**:
```sql
-- 移除 enabled 字段
ALTER TABLE ReminderTemplate DROP COLUMN enabled;

-- 只保留 selfEnabled 字段
ALTER TABLE ReminderTemplate 
  ADD COLUMN selfEnabled BOOLEAN NOT NULL DEFAULT TRUE;
```

**迁移脚本**:
```sql
-- 在删除 enabled 之前，先将数据迁移到 selfEnabled
UPDATE ReminderTemplate 
SET selfEnabled = enabled 
WHERE groupUuid IS NULL;  -- 无组的模板

-- 对于有组的模板，保留原有的 selfEnabled
-- enabled 将由组状态计算得出
```

#### 2. 聚合根层面

**ReminderTemplateCore**:
```typescript
export abstract class ReminderTemplateCore extends AggregateRoot {
  // 只存储 selfEnabled
  protected _selfEnabled: boolean;
  
  // 组相关状态（用于计算 enabled）
  protected _groupUuid?: string;
  protected _groupEnabled?: boolean;
  protected _groupEnableMode?: ReminderTemplateEnableMode;

  /**
   * enabled 是计算属性（只读）
   */
  get enabled(): boolean {
    // 无组：使用自身启用状态
    if (!this._groupUuid || this._groupEnabled === undefined) {
      return this._selfEnabled;
    }

    // 有组：根据组的启用模式决定
    const enableMode = this._groupEnableMode || ReminderTemplateEnableMode.GROUP;
    
    if (enableMode === ReminderTemplateEnableMode.GROUP) {
      // GROUP 模式：跟随组的启用状态
      return this._groupEnabled;
    } else {
      // INDIVIDUAL 模式：使用自身启用状态
      return this._selfEnabled;
    }
  }

  /**
   * 更新自身启用状态
   */
  updateSelfEnabled(selfEnabled: boolean, context?: { accountUuid: string }): void {
    const oldEffectiveEnabled = this.enabled;
    this._selfEnabled = selfEnabled;
    const newEffectiveEnabled = this.enabled;
    
    this.updateVersion();

    // 只有当有效启用状态发生变化时，才发布事件
    if (oldEffectiveEnabled !== newEffectiveEnabled) {
      this.addDomainEvent({
        eventType: 'ReminderTemplateStatusChanged',
        aggregateId: this.uuid,
        payload: {
          templateUuid: this.uuid,
          oldEnabled: oldEffectiveEnabled,
          newEnabled: newEffectiveEnabled,
          template: this.toDTO(),
        },
      });
    }
  }

  /**
   * 设置组状态（由 Repository 在加载时调用）
   */
  setGroupState(
    groupEnabled: boolean,
    groupEnableMode: ReminderTemplateEnableMode
  ): void {
    this._groupEnabled = groupEnabled;
    this._groupEnableMode = groupEnableMode;
  }

  /**
   * 向后兼容的 effectiveEnabled
   */
  get effectiveEnabled(): boolean {
    return this.enabled;
  }
}
```

**ReminderTemplateGroupCore**:
```typescript
export abstract class ReminderTemplateGroupCore extends AggregateRoot {
  protected _enabled: boolean;  // ✅ 组的 enabled 保留存储
  protected _enableMode: ReminderTemplateEnableMode;

  /**
   * 切换组启用状态
   */
  toggleEnabled(enabled: boolean, context?: { accountUuid: string }): void {
    if (this._enabled === enabled) return;
    
    this._enabled = enabled;
    this.updateTimestamp();

    // GROUP 模式：通知所有模板状态已变化
    if (this._enableMode === ReminderTemplateEnableMode.GROUP) {
      this.templates.forEach((template) => {
        // 更新模板的组状态
        template.setGroupState(this._enabled, this._enableMode);
        
        // 触发模板的状态变化事件
        template.notifyGroupStatusChanged(context);
      });
    }
  }

  /**
   * 更新组的启用模式
   */
  updateEnableMode(enableMode: ReminderTemplateEnableMode): void {
    if (this._enableMode === enableMode) return;
    
    const oldMode = this._enableMode;
    this._enableMode = enableMode;
    this.updateTimestamp();

    // 通知所有模板更新组状态
    this.templates.forEach((template) => {
      template.setGroupState(this._enabled, this._enableMode);
      
      // 如果切换到 GROUP 模式，触发状态变化事件
      if (enableMode === ReminderTemplateEnableMode.GROUP) {
        template.notifyGroupStatusChanged();
      }
    });
  }
}
```

#### 3. Repository 层面

**ReminderTemplateRepository**:
```typescript
async getByUuid(uuid: string): Promise<ReminderTemplate | null> {
  const dto = await this.prisma.reminderTemplate.findUnique({
    where: { uuid },
    include: {
      group: true, // 包含关联的组
    },
  });

  if (!dto) return null;

  const template = ReminderTemplate.fromPrismaDTO(dto);

  // 如果有组，设置组状态
  if (dto.group) {
    template.setGroupState(dto.group.enabled, dto.group.enableMode);
  }

  return template;
}
```

#### 4. Controller 层面

**API 接口**:
```typescript
// ✅ 正确：更新 selfEnabled
PATCH /api/v1/reminders/templates/:uuid/self-enabled
{
  "selfEnabled": false
}

// ❌ 错误：不应该直接更新 enabled
PUT /api/v1/reminders/templates/:uuid
{
  "enabled": false  // enabled 是计算属性，不应该接受此参数
}
```

**Controller 实现**:
```typescript
class ReminderTemplateController {
  /**
   * 更新模板的自身启用状态
   */
  static async updateTemplateSelfEnabled(req, res) {
    const { uuid } = req.params;
    const { selfEnabled } = req.body;
    
    const template = await templateRepo.getByUuid(uuid);
    template.updateSelfEnabled(selfEnabled, {
      accountUuid: req.user.accountUuid
    });
    
    await templateRepo.save(template);
    
    return responseBuilder.sendSuccess(res, template.toClient());
  }
}
```

#### 5. DTO 层面

**toDTO()**:
```typescript
toDTO(): IReminderTemplate {
  return {
    uuid: this.uuid,
    groupUuid: this._groupUuid,
    selfEnabled: this._selfEnabled,  // ✅ 存储字段
    enabled: this.enabled,            // ✅ 计算属性
    effectiveEnabled: this.enabled,   // ✅ 向后兼容
    // ...
  };
}
```

**fromDTO()**:
```typescript
static fromDTO(dto: any): ReminderTemplate {
  return new ReminderTemplate({
    uuid: dto.uuid,
    groupUuid: dto.groupUuid,
    selfEnabled: dto.selfEnabled || dto.enabled, // 兼容旧数据
    // enabled 不再作为输入参数
  });
}
```

---

## 🔄 迁移步骤

### 步骤 1: 数据库迁移

```sql
-- 1. 备份当前数据
CREATE TABLE ReminderTemplate_backup AS 
SELECT * FROM ReminderTemplate;

-- 2. 对于无组的模板，将 enabled 迁移到 selfEnabled
UPDATE ReminderTemplate 
SET selfEnabled = enabled 
WHERE groupUuid IS NULL;

-- 3. 添加组状态字段（临时）
ALTER TABLE ReminderTemplate
ADD COLUMN groupEnabled BOOLEAN,
ADD COLUMN groupEnableMode VARCHAR(20);

-- 4. 填充组状态（从 ReminderTemplateGroup 表）
UPDATE ReminderTemplate t
SET 
  groupEnabled = g.enabled,
  groupEnableMode = g.enableMode
FROM ReminderTemplateGroup g
WHERE t.groupUuid = g.uuid;
```

### 步骤 2: 代码重构

1. ✅ 修改 ReminderTemplateCore
2. ✅ 修改 ReminderTemplateGroupCore
3. ✅ 修改 Repository 加载逻辑
4. ✅ 修改 Controller 接口
5. ✅ 修改前端调用

### 步骤 3: 测试

1. ✅ 单元测试：enabled 计算逻辑
2. ✅ 集成测试：组状态同步
3. ✅ E2E 测试：前端启用/禁用

### 步骤 4: 清理

```sql
-- 测试通过后，删除 enabled 字段
ALTER TABLE ReminderTemplate DROP COLUMN enabled;

-- 删除临时的组状态字段（改为运行时计算）
ALTER TABLE ReminderTemplate 
DROP COLUMN groupEnabled,
DROP COLUMN groupEnableMode;
```

---

## 📝 API 变更清单

### 新增接口

```typescript
// 更新模板自身启用状态
PATCH /api/v1/reminders/templates/:uuid/self-enabled
Request: { selfEnabled: boolean }
Response: ReminderTemplateResponse
```

### 移除参数

```typescript
// 创建/更新模板时不再接受 enabled 参数
PUT /api/v1/reminders/templates/:uuid
Request: {
  // enabled: boolean,  // ❌ 移除
  selfEnabled?: boolean  // ✅ 保留
}
```

### 响应数据变更

```json
{
  "enabled": true,  // ✅ 计算属性（只读）
  "selfEnabled": true,  // ✅ 存储字段
  "effectiveEnabled": true  // ✅ 向后兼容（= enabled）
}
```

---

## ✅ 测试用例

### 测试1: 无组模板

```typescript
// 创建无组模板
const template = new ReminderTemplate({
  name: 'Test',
  selfEnabled: true,
});

expect(template.enabled).toBe(true); // enabled = selfEnabled

// 更新 selfEnabled
template.updateSelfEnabled(false);
expect(template.enabled).toBe(false);
```

### 测试2: GROUP 模式

```typescript
// 创建组（GROUP 模式）
const group = new ReminderTemplateGroup({
  name: 'Test Group',
  enabled: true,
  enableMode: 'group',
});

// 添加模板
const template = group.addTemplate({
  name: 'Test Template',
  selfEnabled: true,
});

template.setGroupState(group.enabled, group.enableMode);

// enabled 应该跟随组
expect(template.enabled).toBe(true); // = group.enabled

// 禁用组
group.toggleEnabled(false);
template.setGroupState(group.enabled, group.enableMode);

expect(template.enabled).toBe(false); // 跟随组
expect(template.selfEnabled).toBe(true); // selfEnabled 不变
```

### 测试3: INDIVIDUAL 模式

```typescript
// 创建组（INDIVIDUAL 模式）
const group = new ReminderTemplateGroup({
  enabled: true,
  enableMode: 'individual',
});

const template = group.addTemplate({
  selfEnabled: false,
});

template.setGroupState(group.enabled, group.enableMode);

// enabled 应该使用 selfEnabled
expect(template.enabled).toBe(false); // = selfEnabled

// 禁用组不影响模板
group.toggleEnabled(false);
template.setGroupState(group.enabled, group.enableMode);

expect(template.enabled).toBe(false); // 仍然 = selfEnabled
```

---

## 🎯 下一步行动

由于当前文件已被破坏，建议：

1. **回滚当前更改** (`git checkout packages/domain-core/src/reminder/aggregates/ReminderTemplateCore.ts`)
2. **创建新分支** (`git checkout -b refactor/reminder-enabled-state`)
3. **按步骤重构**：
   - 先添加 `setGroupState()` 方法
   - 修改 `enabled` getter 使用组状态
   - 添加 `updateSelfEnabled()` 方法
   - 修改 Repository 加载逻辑
   - 修改 Controller 接口
   - 更新前端调用
4. **测试验证**
5. **数据库迁移**

---

**当前状态**: ❌ 代码已破坏，需要回滚  
**推荐方案**: 方案A - enabled 改为计算属性  
**估计工时**: 4-6 小时

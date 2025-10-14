# Setting 模块 Domain-Server 包 - 实现进度

## 当前状态

已开始 Setting 模块的 domain-server 包实现，参考 Authentication 和 Goal 模块的模式。

## 已完成

### 1. 值对象 (Value Objects) ✅
- `ValidationRule.ts` - 验证规则值对象 (143行)
- `UIConfig.ts` - UI配置值对象 (135行)
- `SyncConfig.ts` - 同步配置值对象 (70行)

### 2. 实体 (Entities) ⏳
- `SettingHistory.ts` - 设置历史实体 (完成，140行)
- `SettingItem.ts` - ❌ 待创建
- `SettingGroup.ts` - ❌ 待创建

### 3. 聚合根 (Aggregates) ⏳
- `Setting.ts` - 设置聚合根 (部分完成，370行，有类型错误需修复)
- `AppConfig.ts` - ❌ 待创建
- `UserSetting.ts` - ❌ 待创建

## 遇到的问题

### 接口定义不一致

contracts 包中的接口定义与实际实现需求存在差异：

1. **返回类型不匹配**:
   - `validate()` 方法：实现返回 `{ valid, error }`,接口要求 `{ isValid, errors }`
   - `history` 属性：实现返回 `SettingHistory[] | null`,接口要求 `SettingHistoryServer[]`

2. **DTO vs Interface**:
   - 值对象的 `toServerDTO()` 返回 DTO 类型
   - 但聚合根接口期望返回完整的值对象接口类型

3. **PersistenceDTO 字段缺失**:
   - 缺少 `is_system_setting` 字段
   - 历史记录存储方式不明确

## 解决方案

### 选项 1: 修正 contracts 包接口定义 (推荐)

修改 `packages/contracts/src/modules/setting/` 下的接口，使其与实际需求匹配：

1. 统一验证返回格式为 `{ valid: boolean; error?: string }`
2. `history` 改为可选的 `SettingHistoryServer[] | null`
3. 聚合根中的值对象直接使用 DTO 类型，不嵌套接口

### 选项 2: 调整 domain-server 实现 (当前方案)

根据 contracts 包定义的接口进行适配：

1. 修改 `validate()` 返回格式
2. `history` getter 始终返回数组（空数组而非 null）
3. `toServerDTO()` 返回的值对象字段使用实例而非 DTO

## 建议的实现步骤

由于 Setting 模块的接口设计与 Authentication/Goal 模块有较大差异，建议：

1. **先完善 contracts 包**:
   - 参考 AuthenticationContracts 和 GoalContracts
   - 统一接口设计风格
   - 确保 Server/Client DTO 定义清晰

2. **简化实体结构**:
   - 将 SettingItem 和 Setting Group 作为独立聚合根，而非实体
   - 或者将它们作为 Setting 的子实体，明确所属关系

3. **domain-server 实现顺序**:
   ```
   a. 修正 contracts 接口定义
   b. 完成值对象实现（已完成）
   c. 完成实体实现
   d. 完成聚合根实现
   e. 创建仓储接口
   f. 创建领域服务
   g. 单元测试验证
   ```

## 下一步行动

### 立即行动
1. 查看并理解 Authentication 模块的接口设计
2. 对比 Setting contracts 包的接口定义
3. 决定采用哪种解决方案

### 中期目标
1. 完成所有实体类实现
2. 完成所有聚合根实现
3. 通过 typecheck 验证

### 长期目标
1. 实现仓储接口
2. 实现领域服务
3. 编写单元测试

## 文件清单

### 已创建文件
```
packages/domain-server/src/setting/
├── value-objects/
│   ├── ValidationRule.ts ✅
│   ├── UIConfig.ts ✅
│   └── SyncConfig.ts ✅
├── entities/
│   └── SettingHistory.ts ✅
└── aggregates/
    └── Setting.ts ⏳ (有错误)
```

### 待创建文件
```
packages/domain-server/src/setting/
├── entities/
│   ├── SettingItem.ts
│   └── SettingGroup.ts
├── aggregates/
│   ├── AppConfig.ts
│   └── UserSetting.ts
├── repositories/
│   ├── ISettingRepository.ts
│   ├── IAppConfigRepository.ts
│   └── IUserSettingRepository.ts
├── services/
│   └── SettingDomainService.ts
└── index.ts
```

## 估计工作量

- 修正接口定义: 2-3小时
- 完成实体实现: 2-3小时
- 完成聚合根实现: 4-6小时
- 仓储和服务: 2-3小时
- 测试和验证: 2-3小时

**总计**: 12-18小时

## 备注

Setting 模块比 Authentication 模块更复杂，因为：
1. 支持多种值类型（STRING, NUMBER, BOOLEAN, JSON等）
2. 包含验证规则、UI配置、同步配置等多个值对象
3. 需要变更历史追踪
4. 支持分组和层级结构
5. 涉及账户、设备、系统三个作用域

建议在实现前先完全理清接口设计和数据模型关系。

---

**状态**: 进行中 (约30%完成)  
**最后更新**: 2025-10-14  
**下次行动**: 决定接口修正方案

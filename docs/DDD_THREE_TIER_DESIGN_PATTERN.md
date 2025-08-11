# DDD三层架构设计模式

## 架构概述

```
domain-core/     ← 纯业务逻辑，前后端共享
domain-server/   ← 服务端业务逻辑 + 基础设施
domain-client/   ← 客户端业务逻辑 + UI交互
```

## 继承策略

### 1. 值对象继承模式

```typescript
// domain-core/valueObjects/EmailCore.ts
export class EmailCore extends ValueObject {
  private readonly _value: string; // 使用private，通过getter访问

  get value(): string {
    return this._value;
  }
}

// domain-server/valueObjects/Email.ts
export class Email extends EmailCore {
  verify(): Email {
    return new Email(this.value, true, new Date()); // 使用getter
  }

  // 服务端特定方法
  async sendVerificationEmail(): Promise<boolean> {
    /* ... */
  }
}

// domain-client/valueObjects/Email.ts
export class Email extends EmailCore {
  verify(): Email {
    return new Email(this.value, true, new Date());
  }

  // 客户端特定方法
  showValidationUI(): void {
    /* ... */
  }
}
```

### 2. 实体继承模式

```typescript
// domain-core/entities/UserCore.ts
export class UserCore extends Entity {
  protected _email: EmailCore;

  get email(): EmailCore {
    return this._email;
  }
}

// domain-server/entities/User.ts
export class User extends UserCore {
  // 服务端特定方法
  async hashPassword(password: string): Promise<void> {
    /* ... */
  }
  async save(): Promise<void> {
    /* ... */
  }
}
```

## 接口设计策略

### 选项1：直接继承（推荐简单场景）

```typescript
export class Email extends EmailCore {
  // 直接继承，添加层特定方法
}
```

### 选项2：接口 + 继承（推荐复杂场景）

```typescript
// 定义服务端接口
interface IServerEmail extends IEmailCore {
  sendVerificationEmail(): Promise<boolean>;
  isBlacklisted(): Promise<boolean>;
}

export class Email extends EmailCore implements IServerEmail {
  async sendVerificationEmail(): Promise<boolean> {
    /* ... */
  }
  async isBlacklisted(): Promise<boolean> {
    /* ... */
  }
}
```

## 职责分离原则

| 层级   | 职责                           | 示例方法                                            |
| ------ | ------------------------------ | --------------------------------------------------- |
| Core   | 纯业务规则，数据验证           | `validate()`, `equals()`, `toString()`              |
| Server | 基础设施集成，持久化，外部服务 | `save()`, `sendEmail()`, `hashPassword()`           |
| Client | UI交互，表单验证，用户体验     | `showError()`, `validateInput()`, `formatDisplay()` |

## 访问控制最佳实践

1. **Core层使用 `private readonly`**：确保不可变性
2. **通过 `public get` 提供访问**：受控访问
3. **Server/Client层使用getter**：保持封装性
4. **避免 `protected`**：除非确实需要子类直接访问

## 示例：完整的邮箱值对象设计

```typescript
// domain-core/
export class EmailCore extends ValueObject {
  private readonly _value: string;
  private readonly _isVerified: boolean;

  constructor(value: string, isVerified = false) {
    super();
    this.validate(value);
    this._value = value.toLowerCase().trim();
    this._isVerified = isVerified;
  }

  get value(): string {
    return this._value;
  }
  get isVerified(): boolean {
    return this._isVerified;
  }

  protected validate(email: string): void {
    /* 验证逻辑 */
  }
  equals(other: ValueObject): boolean {
    /* 相等性比较 */
  }
}

// domain-server/
export class Email extends EmailCore {
  verify(): Email {
    return new Email(this.value, true); // ✅ 使用getter
  }

  async sendVerificationEmail(): Promise<boolean> {
    // 服务端专用：邮件发送逻辑
    return await emailService.send(this.value);
  }
}

// domain-client/
export class Email extends EmailCore {
  verify(): Email {
    return new Email(this.value, true); // ✅ 使用getter
  }

  showValidationError(): void {
    // 客户端专用：显示验证错误
    UI.showError(`邮箱 ${this.value} 格式不正确`);
  }
}
```

## 总结

- ✅ **推荐**：使用 `private readonly` + `public getter` 模式
- ✅ **继承**：Server/Client 层直接继承 Core 层
- ✅ **封装**：通过方法而非属性直接访问内部状态
- ❌ **避免**：使用 `protected` 破坏封装性
- ❌ **避免**：在子类中直接访问私有属性

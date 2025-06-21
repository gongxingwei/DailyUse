export abstract class Entity {
  protected constructor(protected readonly _id: string) {}

  get id(): string {
    return this._id;
  }

  equals(other: Entity): boolean {
    if (!(other instanceof Entity)) {
      return false;
    }
    return this._id === other._id;
  }

  protected static generateId(): string {
    // 简单的 ID 生成，您也可以使用 uuid
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}
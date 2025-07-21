import { generateUUID } from "../utils/uuid";

export abstract class Entity {
  protected constructor(protected readonly _uuid: string) {}

  get uuid(): string {
    return this._uuid;
  }

  equals(other: Entity): boolean {
    if (!(other instanceof Entity)) {
      return false;
    }
    return this._uuid === other._uuid;
  }

  protected static generateId(): string {
    return generateUUID();
  }
}
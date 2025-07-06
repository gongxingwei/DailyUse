import { generateUUID } from "../utils/uuid";

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
    return generateUUID();
  }
}
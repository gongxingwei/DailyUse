import { AggregateRoot } from '@dailyuse/utils';
import type { IRepository } from '../types';

export interface RepositoryProps {
  name: string;
  path: string;
  uuid?: string;
  description?: string;
  relatedGoals?: string[];
}

export class Repository extends AggregateRoot implements IRepository {
  private _name: string;
  private _path: string;
  private _description?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _relatedGoals?: string[];

  constructor(props: RepositoryProps) {
    super(props.uuid || Repository.generateUUID());
    this._name = props.name;
    this._path = props.path;
    this._description = props.description;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._relatedGoals = props.relatedGoals || [];
  }

  get id(): string {
    return this._uuid;
  }
  get name(): string {
    return this._name;
  }
  get path(): string {
    return this._path;
  }
  get description(): string | undefined {
    return this._description;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get relatedGoals(): string[] | undefined {
    return this._relatedGoals;
  }
  set name(value: string) {
    this._name = value;
    this._updatedAt = new Date();
  }
  set path(value: string) {
    this._path = value;
    this._updatedAt = new Date();
  }
  set description(value: string | undefined) {
    this._description = value;
    this._updatedAt = new Date();
  }
  set relatedGoals(value: string[] | undefined) {
    this._relatedGoals = value;
    this._updatedAt = new Date();
  }

  static isRepository(obj: any): obj is Repository {
    return (
      obj instanceof Repository ||
      (obj &&
        typeof obj.uuid === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.path === 'string')
    );
  }

  static ensureRepository(obj: any): Repository | null {
    if (obj instanceof Repository) {
      return obj;
    }
    if (Repository.isRepository(obj)) {
      return Repository.fromDTO(obj);
    }
    return null;
  }

  static ensureRepositoryNeverNull(obj: any): Repository {
    if (obj instanceof Repository) {
      return obj;
    }
    if (Repository.isRepository(obj)) {
      return Repository.fromDTO(obj);
    }
    return new Repository({
      name: '随机仓库',
      path: '',
      description: '这是一个随机仓库',
      relatedGoals: [],
    });
  }

  toDTO(): IRepository {
    return {
      uuid: this._uuid,
      name: this._name,
      path: this._path,
      description: this._description,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      relatedGoals: this._relatedGoals,
    };
  }

  static fromDTO(dto: IRepository): Repository {
    const repository = new Repository({
      name: dto.name,
      path: dto.path,
      uuid: dto.uuid,
      description: dto.description,
      relatedGoals: dto.relatedGoals,
    });
    repository._createdAt = dto.createdAt ? new Date(dto.createdAt) : new Date();
    repository._updatedAt = dto.updatedAt ? new Date(dto.updatedAt) : new Date();
    return repository;
  }
}

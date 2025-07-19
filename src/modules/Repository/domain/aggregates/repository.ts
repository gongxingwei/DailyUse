import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import type { IRepository } from "../types";

export class Repository extends AggregateRoot implements IRepository {

    private _name: string;
    private _path: string;
    private _description?: string;
    private _createdAt: Date;
    private _updatedAt: Date;
    private _relatedGoals?: string[]; // 关联的目标ID列表

    constructor(
        name: string,
        path: string,
        id?: string,
        description?: string,
        relatedGoals?: string[],
    ) {
        super(id || Repository.generateId());
        this._name = name;
        this._path = path;
        this._description = description;
        this._createdAt = new Date();
        this._updatedAt = new Date();
        this._relatedGoals = relatedGoals || [];
        
    }

    get id(): string {
        return this._id;
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
        return obj instanceof Repository || (obj && typeof obj.id === 'string' && typeof obj
            .name === 'string' && typeof obj.path === 'string');
    }

    toDTO(): IRepository {
        return {
            id: this._id,
            name: this._name,
            path: this._path,
            description: this._description,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        }
    }

    static fromDTO(dto: IRepository): Repository {
        const repository = new Repository(
            dto.name,
            dto.path,
            dto.id,
            dto.description,
            dto.relatedGoals
        );
        repository._createdAt = dto.createdAt;
        repository._updatedAt = dto.updatedAt;
        return repository;
    }
}
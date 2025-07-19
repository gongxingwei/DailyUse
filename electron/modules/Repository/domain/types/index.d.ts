

export interface IRepository {
    id: string;
    name: string;
    path: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    relatedGoals?: string[]; // 关联的目标ID列表
}
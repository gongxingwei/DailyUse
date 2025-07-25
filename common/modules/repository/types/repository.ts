export interface IRepository {
    uuid: string;
    name: string;
    path: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    relatedGoals?: string[]; // 关联的目标ID列表
}
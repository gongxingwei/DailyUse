/// <reference types="vite/client" />
/// <reference types="./types/electron" />
import type { ITaskTemplate } from './modules/Task/domain/types/task';
import type { ITaskInstance } from './modules/Task/domain/types/task';
import type { ITaskMetaTemplate } from './modules/Task/domain/types/task';
declare global {
    type TResponse<T = any> = {
        success: boolean;
        message: string;
        data?: T;
        error?: Error;
    };
    type ITaskTemplate = import('@/modules/Task/domain/types/task').ITaskTemplate;
    type ITaskInstance = import('@/modules/Task/domain/types/task').ITaskInstance;
    type ITaskMetaTemplate = import('@/modules/Task/domain/types/task').ITaskMetaTemplate;
}


export {}
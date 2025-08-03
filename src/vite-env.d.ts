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
}


export {}
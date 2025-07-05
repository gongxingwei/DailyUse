/// <reference types="vite/client" />
import type { ITaskTemplate } from './modules/Task/domain/types/task';
import type { ITaskInstance } from './modules/Task/domain/types/task';
import type { ITaskMetaTemplate } from './modules/Task/domain/types/task';
import type { DateTime } from '@/shared/types/myDateTime';
import type { RecurrenceRule } from '@/shared/types/myDateTime';
declare global {
    type TResponse<T = any> = {
        success: boolean;
        message: string;
        data?: T;
        error?: Error;
    };
    type DateTime = import('@/shared/types/myDateTime').DateTime;
    type RecurrenceRule = import('@/shared/types/myDateTime').RecurrenceRule;
    type ITaskTemplate = import('@/modules/Task/domain/types/task').ITaskTemplate;
    type ITaskInstance = import('@/modules/Task/domain/types/task').ITaskInstance;
    type ITaskMetaTemplate = import('@/modules/Task/domain/types/task').ITaskMetaTemplate;
}


export {}
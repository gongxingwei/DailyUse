/// <reference types="vite/client" />
/// <reference types="./types/electron" />

declare global {
    type TResponse<T = any> = {
        success: boolean;
        message: string;
        data?: T;
        error?: Error;
    };
}


export {}
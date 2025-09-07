/// <reference types="vite/client" />
/// <reference types="./types/electron" />

declare global {
    type ApiResponse<T = any> = {
        success: boolean;
        message: string;
        data?: T;
        error?: Error;
    };
}


export {}

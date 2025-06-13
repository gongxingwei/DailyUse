/// <reference types="vite/client" />

declare global {
    type TResponse<T = any> = {
        success: boolean;
        message: string;
        data?: T;
    };

}


export {}
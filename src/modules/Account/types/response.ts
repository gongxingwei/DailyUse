export type TResponse = {
    success: boolean;
    message: string;
    code?: number;
    error?: string;
    data?: any;
    token?: string;
};
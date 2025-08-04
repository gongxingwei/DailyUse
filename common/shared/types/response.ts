export type TResponse<T = any> = {
    success: boolean;
    message: string;
    data?: T;
};
export interface TResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

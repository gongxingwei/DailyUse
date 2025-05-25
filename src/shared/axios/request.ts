import axios, { AxiosInstance } from "axios";
import type { TResponse } from '@/shared/types/response';
// 创建自定义的 axios 实例类型
interface CustomAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete'> {
  get<T = TResponse>(url: string, config?: any): Promise<T>;
  post<T = TResponse>(url: string, data?: any, config?: any): Promise<T>;
  put<T = TResponse>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = TResponse>(url: string, config?: any): Promise<T>;
}

export const myaxios = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:3000"
      : "http://www.bakersean.cloudns.ch",
  timeout: 10000,
}) as CustomAxiosInstance;

// 请求拦截器
myaxios.interceptors.request.use(
  (config) => {
      console.log("请求拦截器", config);
      const token = localStorage.getItem('token');
      if (token) {
          config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
myaxios.interceptors.response.use(
  (response) => {
      // 只返回业务数据部分
      return Promise.resolve(response.data);
  },
  (error) => {
    console.error("响应拦截器", error);
      if (error.response) {
          // 服务器返回错误状态码
          const { status } = error.response;
          switch (status) {
              case 401:
                  // 未授权，清除token并跳转到登录页
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                  break;
              case 403:
                  // 权限不足
                  console.error('权限不足');
                  break;
              // ... 其他状态码处理
          }
          return Promise.reject(error.response.data);
      } else if (error.request) {
          // 请求已发出但未收到响应
          return Promise.reject({
              success: false,
              message: '服务器无响应，请检查网络连接',
              data: null
          });
      } else {
          // 请求配置出错
          return Promise.reject({
              success: false,
              message: '请求配置错误',
              data: null
          });
      }
  }
);
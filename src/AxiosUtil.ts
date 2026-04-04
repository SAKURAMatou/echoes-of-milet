import axios from 'axios'

import type { AxiosInstance, AxiosRequestConfig } from 'axios'

interface CustomAxiosInstance extends AxiosInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
}
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URI,
  timeout: 5000,
}) as CustomAxiosInstance

axiosInstance.interceptors.response.use(
  (response) => {
    const status = response.status
    if (status >= 200 && status < 300) {
      // 请求成功，返回数据（可以进一步处理 response.data）
      return response.data
    } else {
      console.error(response)
      return Promise.reject(new Error(`HTTP 状态错误：${status}`))
    }
  },
  (error) => {
    console.error(error)
    return Promise.reject(error)
  },
)

export default axiosInstance

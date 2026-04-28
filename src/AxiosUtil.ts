import axios from 'axios'

import { getSiteOrigin } from '@/config/api'

import type { AxiosInstance, AxiosRequestConfig } from 'axios'

interface CustomAxiosInstance extends AxiosInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
}

function resolveBaseURL() {
  if (import.meta.env.SSR) {
    return getSiteOrigin()
  }

  return ''
}

function resolveSsrHeaders() {
  if (!import.meta.env.SSR) {
    return undefined
  }

  const siteOrigin = getSiteOrigin()

  return {
    Origin: siteOrigin,
    Referer: `${siteOrigin}/`,
  }
}

const axiosInstance = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 5000,
  headers: resolveSsrHeaders(),
}) as CustomAxiosInstance

axiosInstance.interceptors.response.use(
  (response) => {
    const status = response.status
    if (status >= 200 && status < 300) {
      return response.data
    }

    console.error(response)
    return Promise.reject(new Error(`HTTP status error: ${status}`))
  },
  (error) => {
    console.error(error)
    return Promise.reject(error)
  },
)

export default axiosInstance

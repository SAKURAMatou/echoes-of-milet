import axios from 'axios'

import { getSiteOrigin } from '@/config/api'

import type { AxiosInstance, AxiosRequestConfig } from 'axios'

interface CustomAxiosInstance extends AxiosInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
}

type DeferredResponse = {
  promise: Promise<any>
  resolve: (value: any) => void
  reject: (reason?: any) => void
}

const inflightReadRequests = new Map<string, DeferredResponse>()

function createDeferredResponse(): DeferredResponse {
  let resolve!: (value: any) => void
  let reject!: (reason?: any) => void

  const promise = new Promise<any>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'object') return String(value)
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`

  const record = value as Record<string, unknown>
  const sortedKeys = Object.keys(record).sort()
  return `{${sortedKeys.map((key) => `${key}:${stableStringify(record[key])}`).join(',')}}`
}

function headerValue(headers: unknown, name: string) {
  if (!headers) return ''
  const source = headers as any
  const lowerName = name.toLowerCase()
  if (typeof source.get === 'function') {
    return source.get(name) ?? source.get(lowerName) ?? ''
  }

  const key = Object.keys(source).find((item) => item.toLowerCase() === lowerName)
  return key ? String(source[key] ?? '') : ''
}

function buildReadDedupKey(config: AxiosRequestConfig) {
  const method = (config.method || 'get').toLowerCase()
  const languageHeaders = {
    acceptLanguage: headerValue(config.headers, 'Accept-Language'),
    miletLang: headerValue(config.headers, 'X-Milet-Lang'),
    miletRouteLang: headerValue(config.headers, 'X-Milet-Route-Lang'),
  }

  return [
    method,
    config.baseURL || '',
    config.url || '',
    stableStringify(config.params),
    stableStringify(languageHeaders),
  ].join('|')
}

function resolveDedupRequest(config: any, response: any) {
  const dedupKey = config?._requestDedupKey
  if (!dedupKey) return

  const deferred = inflightReadRequests.get(dedupKey)
  if (deferred) deferred.resolve(response)
  inflightReadRequests.delete(dedupKey)
}

function rejectDedupRequest(config: any, error: any) {
  const dedupKey = config?._requestDedupKey
  if (!dedupKey) return

  const deferred = inflightReadRequests.get(dedupKey)
  if (deferred) deferred.reject(error)
  inflightReadRequests.delete(dedupKey)
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

axiosInstance.interceptors.request.use((config) => {
  const method = (config.method || '').toLowerCase()
  const shouldDedupReadRequest = !import.meta.env.SSR && (method === 'get' || method === 'head')
  if (!shouldDedupReadRequest) return config

  const dedupKey = buildReadDedupKey(config)
  const currentRequest = inflightReadRequests.get(dedupKey)
  if (currentRequest) {
    config.adapter = () => currentRequest.promise
    return config
  }

  const deferred = createDeferredResponse()
  inflightReadRequests.set(dedupKey, deferred)
  ;(config as any)._requestDedupKey = dedupKey
  return config
})

axiosInstance.interceptors.response.use(
  (response) => {
    const status = response.status
    if (status >= 200 && status < 300) {
      resolveDedupRequest(response.config, response)
      return response.data
    }

    const error = new Error(`HTTP status error: ${status}`)
    rejectDedupRequest(response.config, error)
    console.error(response)
    return Promise.reject(error)
  },
  (error) => {
    rejectDedupRequest(error?.config, error)
    console.error(error)
    return Promise.reject(error)
  },
)

export default axiosInstance

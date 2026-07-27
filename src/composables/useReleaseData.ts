import { onBeforeUnmount, ref } from 'vue'

import axiosInstance from '@/AxiosUtil'
import { apiRoutes } from '@/config/api'
import { liveLangRequestConfig } from '@/composables/liveArchive'

import type { Work } from './releaseType'

export interface ReleaseDataOptions {
  type: 1 | 2 | 3
  elementId: string
}

export interface ReleaseQueryFilters {
  year?: string
  keyword?: string
}

export interface PreparedReleasePage {
  transactionId: string
  basePage: number
  nextPage: number
  items: Work[]
  total: number
}

export type PrepareNextPageResult =
  | { status: 'success'; batch: PreparedReleasePage }
  | { status: 'aborted' }
  | { status: 'error'; error: unknown }

export type CommitNextPageResult =
  | { status: 'committed'; addedCount: number }
  | { status: 'metadata-only'; hasMore: false }
  | { status: 'rejected'; reason: 'stale' | 'duplicate' | 'invalid-empty' }

function transactionId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function useReleaseData(options: ReleaseDataOptions) {
  const data = ref<Work[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(0)
  const hasMore = ref(true)
  const total = ref(0)
  const isInitialized = ref(false)
  const consumedTransactions = new Set<string>()

  let activeFilters: ReleaseQueryFilters = {}
  let activeTransactionId: string | null = null
  let internalController: AbortController | null = null

  const apiBaseUrl = apiRoutes.miletRelease
  const pageSize = 5

  function invalidateActiveTransaction() {
    activeTransactionId = null
    internalController?.abort()
    internalController = null
  }

  async function prepareNextPage(optionsArg: {
    signal: AbortSignal
    transactionId: string
  }): Promise<PrepareNextPageResult> {
    if (!hasMore.value && currentPage.value > 0) {
      return {
        status: 'success',
        batch: {
          transactionId: optionsArg.transactionId,
          basePage: currentPage.value,
          nextPage: currentPage.value + 1,
          items: [],
          total: total.value,
        },
      }
    }

    const basePage = currentPage.value
    const nextPage = basePage + 1
    activeTransactionId = optionsArg.transactionId
    loading.value = true
    error.value = null

    try {
      const lang = window.location.pathname.startsWith('/ja') ? 'ja' : 'zh'
      const response = await axiosInstance.get<{ data: Work[]; total: number }>(
        `${apiBaseUrl}${options.type}`,
        {
          ...liveLangRequestConfig(lang),
          signal: optionsArg.signal,
          params: {
            page: nextPage,
            pageSize,
            year: activeFilters.year || undefined,
            keyword: activeFilters.keyword || undefined,
          },
        },
      )

      if (optionsArg.signal.aborted || activeTransactionId !== optionsArg.transactionId) {
        return { status: 'aborted' }
      }

      return {
        status: 'success',
        batch: {
          transactionId: optionsArg.transactionId,
          basePage,
          nextPage,
          items: Array.isArray(response.data) ? response.data : [],
          total: Number(response.total || 0),
        },
      }
    } catch (caught) {
      if (optionsArg.signal.aborted || activeTransactionId !== optionsArg.transactionId) {
        return { status: 'aborted' }
      }
      error.value = caught instanceof Error ? caught.message : 'Failed to fetch data'
      console.error(`Failed to fetch release data for type ${options.type}:`, caught)
      return { status: 'error', error: caught }
    } finally {
      if (activeTransactionId === optionsArg.transactionId) loading.value = false
    }
  }

  function commitNextPage(
    batch: PreparedReleasePage,
    commitOptions: { beforeDataMutation: () => void },
  ): CommitNextPageResult {
    if (consumedTransactions.has(batch.transactionId)) {
      return { status: 'rejected', reason: 'duplicate' }
    }
    if (activeTransactionId !== batch.transactionId || batch.basePage !== currentPage.value) {
      return { status: 'rejected', reason: 'stale' }
    }

    if (batch.items.length === 0) {
      if (batch.total > data.value.length) {
        return { status: 'rejected', reason: 'invalid-empty' }
      }
      total.value = batch.total
      hasMore.value = false
      consumedTransactions.add(batch.transactionId)
      activeTransactionId = null
      return { status: 'metadata-only', hasMore: false }
    }

    commitOptions.beforeDataMutation()
    data.value = [...data.value, ...batch.items]
    currentPage.value = batch.nextPage
    total.value = batch.total
    hasMore.value = total.value > data.value.length
    consumedTransactions.add(batch.transactionId)
    activeTransactionId = null
    return { status: 'committed', addedCount: batch.items.length }
  }

  async function runSimpleNextPage() {
    if (loading.value || (!hasMore.value && currentPage.value > 0)) return null
    internalController?.abort()
    internalController = new AbortController()
    const id = transactionId(`release-${options.type}`)
    const result = await prepareNextPage({ signal: internalController.signal, transactionId: id })
    if (result.status !== 'success') return result
    return commitNextPage(result.batch, { beforeDataMutation: () => {} })
  }

  async function initialize() {
    if (isInitialized.value) return null
    isInitialized.value = true
    return runSimpleNextPage()
  }

  async function refresh(filters: ReleaseQueryFilters = {}) {
    invalidateActiveTransaction()
    activeFilters = {
      year: filters.year?.trim() || undefined,
      keyword: filters.keyword?.trim() || undefined,
    }
    data.value = []
    currentPage.value = 0
    total.value = 0
    hasMore.value = true
    error.value = null
    isInitialized.value = true
    return runSimpleNextPage()
  }

  onBeforeUnmount(invalidateActiveTransaction)

  return {
    data,
    loading,
    error,
    currentPage,
    hasMore,
    total,
    pageSize,
    initialize,
    prepareNextPage,
    commitNextPage,
    loadMore: runSimpleNextPage,
    retry: runSimpleNextPage,
    refresh,
    cancelPending: invalidateActiveTransaction,
  }
}

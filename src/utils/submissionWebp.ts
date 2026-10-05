import type { ConvertedPhoto } from '@/workers/submissionWebp.worker'
import type { WebpRequest } from '@/workers/submissionWebp.worker'
import {
  checkPhotoSize,
  encodeCanvasWebp,
  encodeWebpPixels,
  photoVariants,
} from './submissionWebpEncoding'

function aborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const cancel = () => {
      signal.removeEventListener('abort', cancel)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', cancel, { once: true })
    if (signal.aborted) cancel()
    promise.then(
      (value) => {
        signal.removeEventListener('abort', cancel)
        resolve(value)
      },
      (error) => {
        signal.removeEventListener('abort', cancel)
        reject(error)
      },
    )
  })
}

function workerJob<T>(job: WebpRequest, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    aborted(signal)
    let worker: Worker
    try {
      worker = new Worker(new URL('../workers/submissionWebp.worker.ts', import.meta.url), {
        type: 'module',
      })
    } catch {
      reject(new Error('WORKER_UNAVAILABLE'))
      return
    }
    const id = crypto.randomUUID()
    const dispose = () => {
      signal.removeEventListener('abort', cancel)
      worker.terminate()
    }
    const cancel = () => {
      dispose()
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const fail = () => {
      dispose()
      reject(new Error('WORKER_UNAVAILABLE'))
    }
    signal.addEventListener('abort', cancel, { once: true })
    worker.onerror = fail
    worker.onmessageerror = fail
    worker.onmessage = ({ data }) => {
      if (data.id !== id) return
      dispose()
      if (data.error) reject(new Error(data.error))
      else resolve(data.result)
    }
    try {
      const transfer =
        'pixels' in job && job.pixels.data.buffer instanceof ArrayBuffer
          ? [job.pixels.data.buffer]
          : []
      worker.postMessage({ ...job, id }, transfer)
    } catch {
      fail()
    }
  })
}

async function encodePixels(
  pixels: ImageData,
  quality: number,
  signal: AbortSignal,
): Promise<Blob> {
  aborted(signal)
  if (typeof Worker !== 'undefined') {
    try {
      return await workerJob<Blob>({ pixels, quality }, signal)
    } catch (error) {
      aborted(signal)
      if (!(error instanceof Error) || error.message !== 'WORKER_UNAVAILABLE') throw error
    }
  }
  return abortable(encodeWebpPixels(pixels, quality), signal)
}

async function canvasFallback(file: File, signal: AbortSignal): Promise<ConvertedPhoto> {
  aborted(signal)
  const url = URL.createObjectURL(file),
    image = new Image()
  try {
    image.src = url
    try {
      await abortable(image.decode(), signal)
    } catch {
      aborted(signal)
      throw new Error('IMAGE_DECODE_FAILED')
    }
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    if (image.naturalWidth * image.naturalHeight > 48_000_000)
      throw new Error('IMAGE_DIMENSIONS_TOO_LARGE')
    const blobs: Blob[] = []
    for (const variant of photoVariants) {
      aborted(signal)
      const canvas = document.createElement('canvas'),
        scale = Math.min(1, variant.side / Math.max(image.naturalWidth, image.naturalHeight))
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      try {
        const context = canvas.getContext('2d')
        if (!context) throw new Error('WEBP_UNAVAILABLE')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const blob = await abortable(
          encodeCanvasWebp(
            () =>
              new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, 'image/webp', variant.quality),
              ),
            () =>
              encodePixels(
                context.getImageData(0, 0, canvas.width, canvas.height),
                variant.quality,
                signal,
              ),
          ),
          signal,
        )
        aborted(signal)
        checkPhotoSize(blob, variant)
        blobs.push(blob)
      } finally {
        canvas.width = canvas.height = 0
      }
    }
    return { main: blobs[0]!, thumb: blobs[1]! }
  } finally {
    URL.revokeObjectURL(url)
    image.src = ''
  }
}
export async function convertSubmissionPhoto(
  file: File,
  signal: AbortSignal,
): Promise<ConvertedPhoto> {
  aborted(signal)
  const controller = new AbortController()
  const cancel = () => controller.abort()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 45000)
  signal.addEventListener('abort', cancel, { once: true })
  try {
    if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
      try {
        return await workerJob<ConvertedPhoto>({ file }, controller.signal)
      } catch (error) {
        aborted(controller.signal)
        if (
          !(error instanceof Error) ||
          !['WORKER_UNAVAILABLE', 'IMAGE_DECODE_FAILED', 'WEBP_UNAVAILABLE'].includes(error.message)
        )
          throw error
      }
    }
    return await canvasFallback(file, controller.signal)
  } catch (error) {
    if (timedOut) throw new Error('CONVERSION_TIMEOUT')
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    throw error
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', cancel)
  }
}

import type { ConvertedPhoto } from '@/workers/submissionWebp.worker'

async function canvasFallback(file: File, signal: AbortSignal): Promise<ConvertedPhoto> {
  const url = URL.createObjectURL(file),
    image = new Image()
  try {
    image.src = url
    await image.decode()
    if (signal.aborted || image.naturalWidth * image.naturalHeight > 48_000_000)
      throw new Error('CONVERSION_FAILED')
    const blobs: Blob[] = []
    for (const side of [2560, 640]) {
      const canvas = document.createElement('canvas'),
        scale = Math.min(1, side / Math.max(image.naturalWidth, image.naturalHeight))
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('CONVERSION_FAILED')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('CONVERSION_FAILED'))),
          'image/webp',
          side === 640 ? 0.75 : 0.82,
        ),
      )
      canvas.width = canvas.height = 0
      if (
        signal.aborted ||
        blob.type !== 'image/webp' ||
        blob.size > (side === 640 ? 262144 : 4194304)
      )
        throw new Error('CONVERSION_FAILED')
      blobs.push(blob)
    }
    return { main: blobs[0]!, thumb: blobs[1]! }
  } finally {
    URL.revokeObjectURL(url)
    image.src = ''
  }
}
export function convertSubmissionPhoto(file: File, signal: AbortSignal): Promise<ConvertedPhoto> {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined')
    return canvasFallback(file, signal)
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/submissionWebp.worker.ts', import.meta.url), {
      type: 'module',
    })
    const id = crypto.randomUUID()
    const dispose = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', cancel)
      worker.terminate()
    }
    const fail = () => {
      dispose()
      reject(new Error('CONVERSION_FAILED'))
    }
    const cancel = () => fail()
    const timer = setTimeout(fail, 45000)
    signal.addEventListener('abort', cancel, { once: true })
    if (signal.aborted) {
      fail()
      return
    }
    worker.onerror = fail
    worker.onmessageerror = fail
    worker.onmessage = ({ data }) => {
      if (data.id !== id) return
      dispose()
      if (data.error) reject(new Error(data.error))
      else resolve({ main: data.main, thumb: data.thumb })
    }
    worker.postMessage({ id, file })
  })
}

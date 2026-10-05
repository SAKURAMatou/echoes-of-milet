import {
  checkPhotoSize,
  encodeCanvasWebp,
  encodeWebpPixels,
  photoVariants,
} from '../utils/submissionWebpEncoding'

export type ConvertedPhoto = { main: Blob; thumb: Blob }
export type WebpRequest = { file: File } | { pixels: ImageData; quality: number }
self.onmessage = async (event: MessageEvent<WebpRequest & { id: string }>) => {
  const { id } = event.data
  let bitmap: ImageBitmap | undefined
  try {
    if ('pixels' in event.data) {
      const result = await encodeWebpPixels(event.data.pixels, event.data.quality)
      self.postMessage({ id, result })
      return
    }
    try {
      bitmap = await createImageBitmap(event.data.file, { imageOrientation: 'from-image' })
    } catch {
      throw new Error('IMAGE_DECODE_FAILED')
    }
    if (bitmap.width * bitmap.height > 48_000_000) throw new Error('IMAGE_DIMENSIONS_TOO_LARGE')
    const blobs: Blob[] = []
    for (const variant of photoVariants) {
      const scale = Math.min(1, variant.side / Math.max(bitmap.width, bitmap.height))
      const canvas = new OffscreenCanvas(
        Math.max(1, Math.round(bitmap.width * scale)),
        Math.max(1, Math.round(bitmap.height * scale)),
      )
      try {
        const context = canvas.getContext('2d')
        if (!context) throw new Error('WEBP_UNAVAILABLE')
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        const blob = await encodeCanvasWebp(
          () => canvas.convertToBlob({ type: 'image/webp', quality: variant.quality }),
          () =>
            encodeWebpPixels(
              context.getImageData(0, 0, canvas.width, canvas.height),
              variant.quality,
            ),
        )
        checkPhotoSize(blob, variant)
        blobs.push(blob)
      } finally {
        canvas.width = canvas.height = 0
      }
    }
    self.postMessage({ id, result: { main: blobs[0], thumb: blobs[1] } })
  } catch (error) {
    const message = error instanceof Error ? error.message : '',
      code = [
        'IMAGE_DECODE_FAILED',
        'IMAGE_DIMENSIONS_TOO_LARGE',
        'WEBP_MAIN_TOO_LARGE',
        'WEBP_THUMB_TOO_LARGE',
        'WEBP_UNAVAILABLE',
        'WEBP_ENCODER_LOAD_FAILED',
      ].includes(message)
        ? message
        : 'CONVERSION_FAILED'
    self.postMessage({ id, error: code })
  } finally {
    bitmap?.close()
  }
}

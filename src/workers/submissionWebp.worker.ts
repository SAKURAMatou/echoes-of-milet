export type ConvertedPhoto = { main: Blob; thumb: Blob }
self.onmessage = async (event: MessageEvent<{ id: string; file: File }>) => {
  const { id, file } = event.data
  let bitmap: ImageBitmap | undefined
  try {
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      throw new Error('IMAGE_DECODE_FAILED')
    }
    if (bitmap.width * bitmap.height > 48_000_000)
      throw new Error('IMAGE_DIMENSIONS_TOO_LARGE')
    const blobs: Blob[] = []
    for (const side of [2560, 640]) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
      const canvas = new OffscreenCanvas(
        Math.max(1, Math.round(bitmap.width * scale)),
        Math.max(1, Math.round(bitmap.height * scale)),
      )
      const context = canvas.getContext('2d')
      if (!context) throw new Error('WEBP_UNAVAILABLE')
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      let blob: Blob
      try {
        blob = await canvas.convertToBlob({
          type: 'image/webp',
          quality: side === 640 ? 0.75 : 0.82,
        })
      } catch {
        throw new Error('WEBP_UNAVAILABLE')
      }
      if (blob.type !== 'image/webp') throw new Error('WEBP_UNAVAILABLE')
      if (blob.size > (side === 640 ? 262144 : 4194304))
        throw new Error(side === 640 ? 'WEBP_THUMB_TOO_LARGE' : 'WEBP_MAIN_TOO_LARGE')
      blobs.push(blob)
    }
    self.postMessage({ id, main: blobs[0], thumb: blobs[1] })
  } catch (error) {
    const message = error instanceof Error ? error.message : '',
      code = [
        'IMAGE_DECODE_FAILED',
        'IMAGE_DIMENSIONS_TOO_LARGE',
        'WEBP_MAIN_TOO_LARGE',
        'WEBP_THUMB_TOO_LARGE',
        'WEBP_UNAVAILABLE',
      ].includes(message)
        ? message
        : 'CONVERSION_FAILED'
    self.postMessage({ id, error: code })
  } finally {
    bitmap?.close()
  }
}

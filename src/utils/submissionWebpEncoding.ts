export const photoVariants = [
  { name: 'main', side: 2560, quality: 0.82, limit: 4194304 },
  { name: 'thumb', side: 640, quality: 0.75, limit: 262144 },
] as const

export async function isWebpBlob(blob: Blob | null): Promise<boolean> {
  if (!blob || blob.type !== 'image/webp' || blob.size < 20) return false
  const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer())
  return (
    String.fromCharCode(...header.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...header.subarray(8, 12)) === 'WEBP' &&
    new DataView(header.buffer).getUint32(4, true) + 8 === blob.size
  )
}

export async function encodeWebpPixels(pixels: ImageData, quality: number): Promise<Blob> {
  let codec: typeof import('./submissionWebpWasm')
  try {
    codec = await import('./submissionWebpWasm')
  } catch {
    throw new Error('WEBP_ENCODER_LOAD_FAILED')
  }
  return codec.encode(pixels, quality)
}

// Canvas support does not imply WebP encoding support (notably on Safari).
export async function encodeCanvasWebp(
  nativeEncode: () => Promise<Blob | null>,
  fallback: () => Promise<Blob>,
): Promise<Blob> {
  let blob: Blob | null = null
  try {
    blob = await nativeEncode()
  } catch {
    // Native encoder failures can still use the client-side WASM codec.
  }
  if (await isWebpBlob(blob)) return blob!
  const encoded = await fallback()
  if (!(await isWebpBlob(encoded))) throw new Error('WEBP_UNAVAILABLE')
  return encoded
}

export function checkPhotoSize(blob: Blob, variant: (typeof photoVariants)[number]) {
  if (blob.size > variant.limit)
    throw new Error(variant.name === 'main' ? 'WEBP_MAIN_TOO_LARGE' : 'WEBP_THUMB_TOO_LARGE')
}

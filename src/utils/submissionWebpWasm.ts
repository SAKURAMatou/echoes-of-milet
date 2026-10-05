import encodeWebp, { init } from '@jsquash/webp/encode.js'
import wasmUrl from '@jsquash/webp/codec/enc/webp_enc.wasm?url'
import simdWasmUrl from '@jsquash/webp/codec/enc/webp_enc_simd.wasm?url'

let ready: Promise<unknown> | undefined
export async function encode(pixels: ImageData, quality: number): Promise<Blob> {
  if (!ready) {
    // Explicit asset URLs work in Vite dev and hashed production Worker chunks.
    ready = init({
      locateFile: (path: string) => (path.includes('_simd') ? simdWasmUrl : wasmUrl),
    }).catch(() => {
      ready = undefined
      throw new Error('WEBP_ENCODER_LOAD_FAILED')
    })
  }
  await ready
  const bytes = await encodeWebp(pixels, {
    quality: Math.round(quality * 100),
    method: 3,
    low_memory: 1,
    thread_level: 0,
  })
  return new Blob([bytes], { type: 'image/webp' })
}

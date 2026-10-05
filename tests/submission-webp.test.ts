import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { init, default as encode } from '@jsquash/webp/encode.js'
import { convertSubmissionPhoto } from '../src/utils/submissionWebp.ts'
import {
  encodeCanvasWebp,
  isWebpBlob,
  photoVariants,
  checkPhotoSize,
} from '../src/utils/submissionWebpEncoding.ts'

function webpBlob() {
  const bytes = new Uint8Array(20)
  bytes.set(new TextEncoder().encode('RIFF'))
  new DataView(bytes.buffer).setUint32(4, 12, true)
  bytes.set(new TextEncoder().encode('WEBP'), 8)
  return new Blob([bytes], { type: 'image/webp' })
}
function globalValue(t: any, key: string, value: unknown) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  t.after(() =>
    descriptor
      ? Object.defineProperty(globalThis, key, descriptor)
      : Reflect.deleteProperty(globalThis, key),
  )
}
function dom(t: any, native: Blob | null = webpBlob()) {
  const sizes: number[][] = [],
    canvases: any[] = []
  class Image {
    naturalWidth = 3000
    naturalHeight = 2000
    src = ''
    async decode() {}
  }
  globalValue(t, 'Image', Image)
  globalValue(t, 'document', {
    createElement() {
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage() {},
          getImageData: () => ({
            width: canvas.width,
            height: canvas.height,
            data: new Uint8ClampedArray(4),
          }),
        }),
        toBlob(callback: (blob: Blob | null) => void) {
          sizes.push([canvas.width, canvas.height])
          callback(native)
        },
      }
      canvases.push(canvas)
      return canvas
    },
  })
  return { sizes, canvases }
}
const file = () => new File(['test-image'], 'photo.jpg', { type: 'image/jpeg' })

test('native WebP keeps the fast path; Safari PNG output invokes the fallback', async () => {
  const native = webpBlob()
  let calls = 0
  const fallback = async () => {
    calls++
    return native
  }
  assert.equal(await encodeCanvasWebp(async () => native, fallback), native)
  assert.equal(calls, 0)
  assert.equal(
    await encodeCanvasWebp(async () => new Blob(['png'], { type: 'image/png' }), fallback),
    native,
  )
  assert.equal(calls, 1)
  await encodeCanvasWebp(async () => null, fallback)
  await encodeCanvasWebp(async () => {
    throw new Error('NotSupportedError')
  }, fallback)
  assert.equal(calls, 3)
})

test('never accepts a PNG relabelled as WebP or a malformed RIFF size', async () => {
  assert.equal(await isWebpBlob(new Blob([new Uint8Array(24)], { type: 'image/webp' })), false)
  const bytes = new Uint8Array(await webpBlob().arrayBuffer())
  bytes[4] = 0
  assert.equal(await isWebpBlob(new Blob([bytes], { type: 'image/webp' })), false)
  await assert.rejects(
    encodeCanvasWebp(
      async () => null,
      async () => new Blob(['png'], { type: 'image/png' }),
    ),
    /WEBP_UNAVAILABLE/,
  )
})

test('keeps main/thumb byte limits and reports encoder asset failure separately', async () => {
  assert.throws(
    () => checkPhotoSize(new Blob([new Uint8Array(4194305)]), photoVariants[0]),
    /WEBP_MAIN_TOO_LARGE/,
  )
  assert.throws(
    () => checkPhotoSize(new Blob([new Uint8Array(262145)]), photoVariants[1]),
    /WEBP_THUMB_TOO_LARGE/,
  )
  await assert.rejects(
    encodeCanvasWebp(
      async () => null,
      async () => {
        throw new Error('WEBP_ENCODER_LOAD_FAILED')
      },
    ),
    /WEBP_ENCODER_LOAD_FAILED/,
  )
})

test('worker decode failure retries HTML image decode and releases both resized canvases', async (t) => {
  const { sizes, canvases } = dom(t)
  let terminated = 0
  globalValue(t, 'OffscreenCanvas', class {})
  globalValue(
    t,
    'Worker',
    class {
      onmessage: any
      postMessage({ id }: any) {
        queueMicrotask(() => this.onmessage({ data: { id, error: 'IMAGE_DECODE_FAILED' } }))
      }
      terminate() {
        terminated++
      }
    },
  )
  const result = await convertSubmissionPhoto(file(), new AbortController().signal)
  assert.equal(result.main.type, 'image/webp')
  assert.deepEqual(sizes, [
    [2560, 1707],
    [640, 427],
  ])
  assert.ok(canvases.every((c) => c.width === 0 && c.height === 0))
  assert.equal(terminated, 1)
})

test('without OffscreenCanvas, PNG output sends resized pixels to the encoding worker', async (t) => {
  const { canvases } = dom(t, new Blob(['png'], { type: 'image/png' }))
  const jobs: any[] = []
  globalValue(t, 'OffscreenCanvas', undefined)
  globalValue(
    t,
    'Worker',
    class {
      onmessage: any
      postMessage(job: any) {
        jobs.push(job)
        queueMicrotask(() => this.onmessage({ data: { id: job.id, result: webpBlob() } }))
      }
      terminate() {}
    },
  )
  const result = await convertSubmissionPhoto(file(), new AbortController().signal)
  assert.equal(result.thumb.type, 'image/webp')
  assert.deepEqual(
    jobs.map((j) => [j.pixels.width, j.pixels.height, j.quality]),
    [
      [2560, 1707, 0.82],
      [640, 427, 0.75],
    ],
  )
  assert.ok(jobs.every((j) => !('file' in j)))
  assert.ok(canvases.every((c) => c.width === 0))
})

test('worker construction failure can still use native DOM canvas', async (t) => {
  dom(t)
  globalValue(t, 'OffscreenCanvas', class {})
  globalValue(
    t,
    'Worker',
    class {
      constructor() {
        throw new Error('Worker not allowed')
      }
    },
  )
  assert.equal(
    (await convertSubmissionPhoto(file(), new AbortController().signal)).main.type,
    'image/webp',
  )
})

test('oversize images are not retried via the DOM fallback', async (t) => {
  globalValue(t, 'OffscreenCanvas', class {})
  globalValue(
    t,
    'Worker',
    class {
      onmessage: any
      postMessage({ id }: any) {
        queueMicrotask(() => this.onmessage({ data: { id, error: 'IMAGE_DIMENSIONS_TOO_LARGE' } }))
      }
      terminate() {}
    },
  )
  await assert.rejects(
    convertSubmissionPhoto(file(), new AbortController().signal),
    /IMAGE_DIMENSIONS_TOO_LARGE/,
  )
})

test('cancellation terminates the worker immediately and does not start a fallback', async (t) => {
  let terminated = 0
  globalValue(t, 'OffscreenCanvas', class {})
  globalValue(
    t,
    'Worker',
    class {
      postMessage() {}
      terminate() {
        terminated++
      }
    },
  )
  const controller = new AbortController()
  const promise = convertSubmissionPhoto(file(), controller.signal)
  const check = assert.rejects(promise, { name: 'AbortError' })
  controller.abort()
  await check
  assert.equal(terminated, 1)
})

test('the 45-second deadline also covers DOM decoding; aborted input never starts work', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  globalValue(t, 'Worker', undefined)
  globalValue(
    t,
    'Image',
    class {
      src = ''
      decode() {
        return new Promise(() => {})
      }
    },
  )
  const check = assert.rejects(
    convertSubmissionPhoto(file(), new AbortController().signal),
    /CONVERSION_TIMEOUT/,
  )
  t.mock.timers.tick(45000)
  await check
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(convertSubmissionPhoto(file(), controller.signal), { name: 'AbortError' })
})

test('real libwebp WASM generates RIFF WebP from RGBA, preserving transparency', async () => {
  const wasm = await readFile(
    new URL('../node_modules/@jsquash/webp/codec/enc/webp_enc_simd.wasm', import.meta.url),
  )
  await init({ wasmBinary: wasm })
  const data = new Uint8ClampedArray(64 * 32 * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 200
    data[i + 1] = 60
    data[i + 3] = i % 8 ? 255 : 100
  }
  const bytes = await encode({ data, width: 64, height: 32 } as ImageData, {
    quality: 82,
    method: 3,
    thread_level: 0,
    low_memory: 1,
  })
  assert.ok(await isWebpBlob(new Blob([bytes], { type: 'image/webp' })))
  const chunks = new TextDecoder('latin1').decode(bytes)
  assert.ok(chunks.includes('VP8X') && chunks.includes('ALPH'))
})

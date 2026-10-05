import { convertSubmissionPhoto } from '../../src/utils/submissionWebp'
import { encodeWebpPixels, isWebpBlob } from '../../src/utils/submissionWebpEncoding'
import compatWorkerUrl from './submission-webp-compat.worker.ts?worker&url'

const output = document.querySelector<HTMLPreElement>('#results')!
const run = document.querySelector<HTMLButtonElement>('#run')!
const input = document.querySelector<HTMLInputElement>('#photo')!
const previews = document.querySelector<HTMLDivElement>('#previews')!
const NativeWorker = window.Worker
const nativeToBlob = HTMLCanvasElement.prototype.toBlob
let mode = 'native'
const previewUrls: string[] = []
function log(message: string) {
  output.textContent += message + '\n'
}
function assert(ok: boolean, message: string) {
  if (!ok) throw new Error(message)
}
function useMode(value: string) {
  mode = value
  window.Worker =
    value === 'native'
      ? NativeWorker
      : (class {
          constructor() {
            const url = new URL(compatWorkerUrl, location.href)
            url.searchParams.set('mode', mode)
            return new NativeWorker(url, { type: 'module' })
          }
        } as unknown as typeof Worker)
  HTMLCanvasElement.prototype.toBlob =
    value === 'dom'
      ? function (callback, _type, quality) {
          nativeToBlob.call(this, callback, 'image/png', quality)
        }
      : nativeToBlob
}
async function dimensions(blob: Blob) {
  const url = URL.createObjectURL(blob),
    image = new Image()
  try {
    image.src = url
    await image.decode()
    return [image.naturalWidth, image.naturalHeight]
  } finally {
    image.src = ''
    URL.revokeObjectURL(url)
  }
}
async function check(file: File, show = false) {
  const start = performance.now()
  const result = await convertSubmissionPhoto(file, new AbortController().signal)
  for (const variant of ['main', 'thumb'] as const) {
    const blob = result[variant]
    assert(await isWebpBlob(blob), '不是有效的 RIFF WebP')
    assert(blob.size <= (variant === 'main' ? 4194304 : 262144), '输出超过字节限制')
    const [width, height] = await dimensions(blob)
    assert(Math.max(width, height) <= (variant === 'main' ? 2560 : 640), '输出超过尺寸限制')
    if (file.name === 'jpeg-rotated-6') {
      assert(height > width, 'EXIF 旋转方向未保留')
      assert(width === (variant === 'main' ? 1200 : 427), 'EXIF 旋转后的宽度不正确')
    }
    log(`  ${variant}: ${width}×${height} / ${blob.size} bytes / ${blob.type}`)
    if (show) {
      const url = URL.createObjectURL(blob)
      previewUrls.push(url)
      const image = new Image()
      image.src = url
      image.alt = `${file.name} ${variant}`
      previews.append(image)
    }
  }
  log(`PASS ${mode} / ${file.name} / ${Math.round(performance.now() - start)} ms`)
}
async function fixtures() {
  const canvas = document.createElement('canvas')
  canvas.width = 1800
  canvas.height = 1200
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ed6758'
  ctx.fillRect(0, 0, 900, 800)
  ctx.fillStyle = '#549ad0'
  ctx.fillRect(900, 400, 900, 800)
  ctx.fillStyle = '#253d4a'
  ctx.font = '80px sans-serif'
  ctx.fillText('TOP LEFT', 80, 160)
  const files: File[] = []
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    let blob = await new Promise<Blob | null>((resolve) =>
      nativeToBlob.call(canvas, resolve, type, 0.9),
    )
    if (type === 'image/webp' && blob?.type !== type)
      blob = await encodeWebpPixels(ctx.getImageData(0, 0, canvas.width, canvas.height), 0.9)
    if (blob?.type !== type) throw new Error(`无法生成测试素材 ${type}`)
    files.push(new File([blob], type.split('/')[1] + '-sample', { type }))
    if (type === 'image/jpeg') {
      const bytes = new Uint8Array(await blob.arrayBuffer())
      // EXIF orientation=6 (90° clockwise), little-endian TIFF, one IFD entry.
      const exif = new Uint8Array([
        255, 225, 0, 34, 69, 120, 105, 102, 0, 0, 73, 73, 42, 0, 8, 0, 0, 0, 1, 0, 18, 1, 3, 0, 1,
        0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0,
      ])
      files.push(new File([bytes.slice(0, 2), exif, bytes.slice(2)], 'jpeg-rotated-6', { type }))
    }
  }
  canvas.width = canvas.height = 0
  return files
}
run.addEventListener('click', async () => {
  run.disabled = input.disabled = true
  output.textContent = ''
  try {
    const files = await fixtures()
    for (const value of ['native', 'worker', 'dom']) {
      useMode(value)
      for (const file of files) await check(file)
    }
    useMode('native')
    try {
      await convertSubmissionPhoto(
        new File(['broken'], 'broken.jpg', { type: 'image/jpeg' }),
        new AbortController().signal,
      )
      throw new Error('损坏图片被误接收')
    } catch (error) {
      assert(
        error instanceof Error && error.message === 'IMAGE_DECODE_FAILED',
        '损坏图片错误码不正确',
      )
      log('PASS corrupt image / IMAGE_DECODE_FAILED')
    }
    useMode('stall')
    const controller = new AbortController()
    const promise = convertSubmissionPhoto(files[0], controller.signal)
    const timer = setTimeout(() => controller.abort(), 100)
    try {
      await promise
      throw new Error('取消未生效')
    } catch (error) {
      assert(error instanceof DOMException && error.name === 'AbortError', '取消错误码不正确')
      log('PASS cancel / AbortError')
    } finally {
      clearTimeout(timer)
    }
    log('ALL CHECKS PASSED')
  } catch (error) {
    log(`FAIL ${error instanceof Error ? error.message : error}`)
  } finally {
    useMode('native')
    run.disabled = input.disabled = false
  }
})
input.addEventListener('change', async () => {
  const file = input.files?.[0]
  if (!file) return
  run.disabled = input.disabled = true
  previewUrls.splice(0).forEach((url) => URL.revokeObjectURL(url))
  previews.replaceChildren()
  try {
    useMode('native')
    await check(file, true)
  } catch (error) {
    log(`FAIL ${error instanceof Error ? error.message : error}`)
  } finally {
    run.disabled = input.disabled = false
    input.value = ''
  }
})

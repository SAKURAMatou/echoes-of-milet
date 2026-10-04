// Asset packaging only: crop the generated grid, align ground/head anchors,
// resize and encode WebP. Character drawing is supplied by the approved art.
// node scripts/pack-pilgrimage-actor.mjs <sheet.png> <idle.png> <sharp module>
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const sharp = require(process.argv[4] || 'sharp')
const size = 384
const ground = 372
const headAnchor = 132
const columns = 4
const rows = 4
const output = new URL('../public/pilgrimage/route/', import.meta.url)
await mkdir(output, { recursive: true })

async function measure(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  // Ignore detached generation specks when measuring the character bounds.
  // Keep substantial disconnected pieces too (e.g. a paw or pale leash).
  const visited = new Uint8Array(info.width * info.height)
  const components = []
  for (let start = 0; start < visited.length; start++) {
    if (visited[start] || data[start*4+3] < 128) continue
    const pixels = [start]
    visited[start] = 1
    for (let next=0; next<pixels.length; next++) {
      const at = pixels[next], x = at % info.width, y = Math.floor(at / info.width)
      for (const adjacent of [x>0 ? at-1 : -1, x<info.width-1 ? at+1 : -1, y>0 ? at-info.width : -1, y<info.height-1 ? at+info.width : -1]) {
        if (adjacent<0 || visited[adjacent] || data[adjacent*4+3]<128) continue
        visited[adjacent]=1; pixels.push(adjacent)
      }
    }
    components.push(pixels)
  }
  const largest = Math.max(...components.map(c=>c.length))
  const body = components.filter(c=>c.length>=largest*.03).flat()
  let left = info.width, top = info.height, right = 0, bottom = 0
  let skinX = 0, skinCount = 0
  for (const pixel of body) {
    const x=pixel%info.width, y=Math.floor(pixel/info.width)
    left = Math.min(left, x); right = Math.max(right, x)
    top = Math.min(top, y); bottom = Math.max(bottom, y)
  }
  for (const pixel of body) {
    const x=pixel%info.width, y=Math.floor(pixel/info.width), i=pixel*4
    if (x < left+(right-left)*.5 && y < top+(bottom-top)*.23 && data[i] > 210 && data[i+1] > 145 && data[i+2] > 105 && data[i] > data[i+1] + 10) {
      skinX += x; skinCount++
    }
  }
  if (!skinCount || right <= left) throw new Error('Missing character or face anchor')
  const faceX = skinX / skinCount
  const maxHeight = Math.min(352, (headAnchor - 8) / (faceX - left) * (bottom-top+1), (size - headAnchor - 8) / (right - faceX) * (bottom-top+1))
  return { input, left, top, right, bottom, faceX, maxHeight }
}
async function normalize({ input, left, top, right, bottom, faceX }, targetHeight) {
  const scale = targetHeight / (bottom - top + 1)
  const width = Math.round((right - left + 1) * scale)
  const height = Math.round((bottom - top + 1) * scale)
  const x = Math.round(headAnchor - (faceX - left) * scale)
  const y = ground - height
  const image = await sharp(input).extract({ left, top, width: right-left+1, height: bottom-top+1 }).resize(width, height).png().toBuffer()
  if (x < 0 || y < 0 || x + width > size) throw new Error('Frame exceeds output cell')
  const buffer = await sharp({ create: { width: size, height: size, channels: 4, background: '#00000000' } }).composite([{ input: image, left: x, top: y }]).png().toBuffer()
  return { buffer, bounds: { x, y, width, height }, faceX: headAnchor, ground }
}
const meta = await sharp(process.argv[2]).metadata()
const measurements = []
for (let index = 0; index < columns * rows; index++) {
  const col = index % columns, row = Math.floor(index / columns)
  const left = Math.round(col * meta.width / columns), top = Math.round(row * meta.height / rows)
  const width = Math.round((col+1)*meta.width/columns)-left, height = Math.round((row+1)*meta.height/rows)-top
  measurements.push(await measure(await sharp(process.argv[2]).extract({ left, top, width, height }).png().toBuffer()))
}
const idleMeasurement = await measure(process.argv[3])
const targetHeight = Math.floor(Math.min(idleMeasurement.maxHeight, ...measurements.map(f=>f.maxHeight)))
const frames = await Promise.all(measurements.map(frame=>normalize(frame,targetHeight)))
const idle = await normalize(idleMeasurement,targetHeight)
await sharp({ create: { width: size*columns, height: size*rows, channels: 4, background: '#00000000' } }).composite(frames.map((frame, i) => ({ input: frame.buffer, left: (i%columns)*size, top: Math.floor(i/columns)*size }))).webp({ quality: 90, effort: 6 }).toFile(fileURLToPath(new URL('milet-jean-walk.webp', output)))
await sharp(idle.buffer).webp({ quality: 92, effort: 6 }).toFile(fileURLToPath(new URL('milet-jean-idle.webp', output)))
await writeFile(new URL('milet-jean-motion.json', output), JSON.stringify({ version: 2, columns, rows, frameCount: columns * rows, frameWidth: size, frameHeight: size, ground, headAnchor, frames: frames.map(({ buffer, ...frame }) => frame), idle: idle.bounds }, null, 2)+'\n')
console.log(JSON.stringify({ source: [meta.width, meta.height], frames: frames.map(f=>f.bounds), idle:idle.bounds }))

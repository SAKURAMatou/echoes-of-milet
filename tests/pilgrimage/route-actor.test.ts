import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { actorFacing, actorFrame, routeActorAssets, routeClockDelta } from '../../src/components/milet/pilgrimage/pilgrimageRouteActor.ts'
import { dogFrame, createDogAnimation, routeDogConfig } from '../../src/components/milet/pilgrimage/pilgrimageRouteDog.ts'

test('whole dog poses stay within the map canvas with fixed shoulders and ground', () => {
  const sheet = JSON.parse(readFileSync(new URL('../../public/pilgrimage/route/milet-jean-motion.json', import.meta.url), 'utf8'))
  const dog = sheet.dog
  assert.equal(dog.type, 'painted-sprite')
  assert.equal(dog.frames.length, routeDogConfig.frames)
  assert.equal(dog.frameWidth, routeDogConfig.size)
  assert.equal(dog.ground + routeDogConfig.offset[1], sheet.ground)
  assert.equal(new Set(dog.frames.map(frame => frame.sourceIndex)).size, 16)
  for (const frame of dog.frames) {
    assert.ok(Math.abs(frame.actualShoulder-dog.shoulder)<=2)
    assert.equal(frame.ground, dog.ground)
    assert.equal(frame.transform,'uniform-whole-pose')
    assert.equal(frame.sourceGround,dog.ground)
    assert.ok(Math.abs(frame.bounds.bottom+1-dog.ground)<=1)
    assert.ok(frame.bounds.left>=2 && frame.bounds.right<dog.frameWidth-2)
    assert.ok(frame.bounds.right+routeDogConfig.offset[0]<routeActorAssets.size)
    assert.ok(frame.bounds.bottom+routeDogConfig.offset[1]<routeActorAssets.size)
  }
  const feet = dog.frames.map(frame => frame.forelegCenterX)
  assert.ok(Math.max(...feet)-Math.min(...feet)>8, 'forelegs must visibly change positions')
})

test('dog and human share phase across many cycles and switch to a fixed rest pose', () => {
  for (let time=0;time<100_000;time+=16.667) {
    assert.equal(dogFrame(time),actorFrame(time))
    assert.equal(dogFrame(time,1100,false),routeDogConfig.idleFrame)
  }
})

test('dog renderer copies complete artwork at a fixed scale without deforming limbs', () => {
  const image={} as HTMLImageElement
  const calls: unknown[][]=[]
  const context={drawImage:(...args: unknown[])=>calls.push(args)} as unknown as CanvasRenderingContext2D
  const dog=createDogAnimation(image)
  for(let frame=0;frame<16;frame++) dog.draw(context,frame*1100/16,1100,true)
  dog.draw(context,30_000,1100,false)
  assert.equal(calls.length,17)
  const cells=new Set(calls.slice(0,16).map(args=>`${args[1]},${args[2]}`))
  assert.equal(cells.size,16)
  for(const args of calls) {
    assert.equal(args[0],image)
    assert.deepEqual(args.slice(3),[256,256,133,128,256,256])
  }
  assert.deepEqual(calls.at(-1)?.slice(1,3),[256,512])
})

test('packed poses match the renderer and share scale and ground anchors', () => {
  const sheet = JSON.parse(readFileSync(new URL('../../public/pilgrimage/route/milet-jean-motion.json', import.meta.url), 'utf8'))
  assert.equal(sheet.frameCount, routeActorAssets.frames)
  assert.equal(sheet.frames.length, routeActorAssets.frames)
  assert.equal(sheet.columns, routeActorAssets.columns)
  assert.equal(sheet.rows * sheet.columns, sheet.frameCount)
  assert.equal(sheet.frameWidth, routeActorAssets.size)
  for (const { bounds, ground, faceX } of sheet.frames) {
    assert.equal(bounds.height, sheet.idle.height)
    assert.equal(bounds.y + bounds.height, ground)
    assert.equal(faceX, sheet.headAnchor)
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= routeActorAssets.size)
  }
})

test('frame selection loops beyond the first cycle without sampling outside the sheet', () => {
  const seen = new Set<number>()
  for (let time = 0; time < 100_000; time += 16.667) {
    const frame = actorFrame(time)
    assert.ok(frame >= 0 && frame < 16)
    seen.add(frame)
  }
  assert.equal(seen.size, 16)
  assert.equal(actorFrame(1100), 0)
  assert.equal(actorFrame(1099), 15)
  assert.equal(actorFrame(0), 0)
})

test('frame depends on elapsed time rather than display refresh rate', () => {
  for (const hz of [30, 60, 120]) {
    let elapsed = 0
    for (let tick = 0; tick < hz; tick++) elapsed += routeClockDelta((tick+1)*1000/hz, tick*1000/hz, false)
    assert.ok(Math.abs(elapsed-1000) < .001)
    assert.equal(actorFrame(elapsed), 14)
  }
})

test('background and reduced motion pause the clock, large gaps are capped', () => {
  assert.equal(routeClockDelta(30_000, 0, true), 0)
  assert.equal(routeClockDelta(30_000, 0, false), 64)
  assert.equal(routeClockDelta(10, 20, false), 0)
})

test('vertical headings retain facing without rapid left/right flicker', () => {
  assert.equal(actorFacing(89, -1), -1)
  assert.equal(actorFacing(91, 1), 1)
  assert.equal(actorFacing(180, 1), -1)
  assert.equal(actorFacing(-10, -1), 1)
})

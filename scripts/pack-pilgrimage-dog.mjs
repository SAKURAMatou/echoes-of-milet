// Package whole, painted dog poses; measure Canvas clips without altering the
// accepted human sheet. Usage: node ... <dog-sheet.png> <sharp-module-path>
import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const sharp = createRequire(import.meta.url)(process.argv[3] || 'sharp')
const output = new URL('../public/pilgrimage/route/', import.meta.url)
const source = process.argv[2]
const meta = await sharp(source).metadata()
if (!meta.hasAlpha) throw new Error('Dog poses must have true transparency')
const size=256, ground=244, shoulder=135
// Contact -> weight transfer -> rear stance -> low recovery -> contact.
const order=[0,3,15,7,14,8,10,4,5,6,2,11,12,13,1,9]
const frames=[]
const measurements=[]
for(let f=0;f<16;f++) {
  if(!order.includes(f)) continue
  const col=f%4,row=Math.floor(f/4)
  const left=Math.round(col*meta.width/4),top=Math.round(row*meta.height/4)
  const buffer=await sharp(source).extract({left,top,width:Math.round((col+1)*meta.width/4)-left,height:Math.round((row+1)*meta.height/4)-top}).png().toBuffer()
  const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  // Measure the connected dog body, not detached generation specks.
  const visited=new Uint8Array(info.width*info.height)
  let body=[]
  for(let start=0;start<visited.length;start++) {
    if(visited[start] || data[start*4+3]<180) continue
    const component=[start];visited[start]=1
    for(let next=0;next<component.length;next++) {
      const at=component[next],px=at%info.width,py=Math.floor(at/info.width)
      for(const neighbor of [px>0?at-1:-1,px<info.width-1?at+1:-1,py>0?at-info.width:-1,py<info.height-1?at+info.width:-1]) {
        if(neighbor<0 || visited[neighbor] || data[neighbor*4+3]<180) continue
        visited[neighbor]=1;component.push(neighbor)
      }
    }
    if(component.length>body.length) body=component
  }
  const bodyMask=new Uint8Array(visited.length)
  body.forEach(pixel=>{bodyMask[pixel]=1})
  let x0=info.width,y0=info.height,x1=0,y1=0,greenTop=info.height,greenLeft=info.width,greenRight=0
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
    const i=(y*info.width+x)*4
    if(!bodyMask[y*info.width+x]) continue
    x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)
    if(data[i+1]>data[i]+8 && data[i+1]>data[i+2]+5 && data[i+1]>100) {
      greenTop=Math.min(greenTop,y);greenLeft=Math.min(greenLeft,x);greenRight=Math.max(greenRight,x)
    }
  }
  if(x0<2 || x1>=info.width-2 || y0<2 || y1>=info.height-2) throw new Error(`Dog source pose ${f} touches its cell border: ${JSON.stringify({x0,y0,x1,y1,width:info.width,height:info.height})}`)
  if(greenRight<=greenLeft) throw new Error(`Missing shoulder anchor in pose ${f}`)
  measurements[f]={buffer,bounds:{x0,y0,x1,y1},shoulder:greenTop,center:(greenLeft+greenRight)/2}
}
for(const index of order) {
  const m=measurements[index]
  // Uniformly transform the WHOLE dog: keep joint angles and proportions.
  const scale=(ground-shoulder)/(m.bounds.y1+1-m.shoulder)
  const info=await sharp(m.buffer).metadata()
  const left=Math.max(0,m.bounds.x0-4),top=Math.max(0,m.bounds.y0-4)
  const cropWidth=Math.min(info.width,m.bounds.x1+5)-left,cropHeight=Math.min(info.height,m.bounds.y1+5)-top
  const width=Math.round(cropWidth*scale),height=Math.round(cropHeight*scale)
  const x=Math.round(132-(m.center-left)*scale),y=Math.round(shoulder-(m.shoulder-top)*scale)
  const image=await sharp(m.buffer).extract({left,top,width:cropWidth,height:cropHeight}).resize(width,height).png().toBuffer()
  if(x<0 || y<0 || x+width>size || y+height>size) throw new Error(`Whole pose ${index} exceeds output padding: ${JSON.stringify({x,y,width,height,center:m.center,shoulder:m.shoulder,bounds:m.bounds})}`)
  const buffer=await sharp({create:{width:size,height:size,channels:4,background:'#00000000'}}).composite([{input:image,left:x,top:y}]).png().toBuffer()
  const sourceGround=Math.round(y+(m.bounds.y1+1-top)*scale)
  const packed=buffer
  const pixels=await sharp(packed).ensureAlpha().raw().toBuffer()
  const bounds={left:size,top:size,right:0,bottom:0}
  let actualShoulder=size,pawX=0,pawCount=0
  for(let py=0;py<size;py++) for(let px=0;px<size;px++) {
    const at=(py*size+px)*4
    if(pixels[at+3]<150) continue
    bounds.left=Math.min(bounds.left,px);bounds.right=Math.max(bounds.right,px)
    bounds.top=Math.min(bounds.top,py);bounds.bottom=Math.max(bounds.bottom,py)
    if(pixels[at+1]>pixels[at]+8 && pixels[at+1]>pixels[at+2]+5 && pixels[at+1]>100) actualShoulder=Math.min(actualShoulder,py)
    if(px>140 && py>=220) {pawX+=px;pawCount++}
  }
  if(bounds.left<2 || bounds.right>=size-2 || bounds.bottom>=size-2 || Math.abs(actualShoulder-shoulder)>2) throw new Error(`Unstable or clipped output pose ${index}`)
  frames.push({buffer:packed,sourceIndex:index,ground,shoulder,actualShoulder,sourceGround,scale,transform:'uniform-whole-pose',bounds,forelegCenterX:pawX/pawCount})
}
await sharp({create:{width:size*4,height:size*4,channels:4,background:'#00000000'}}).composite(frames.map((f,i)=>({input:f.buffer,left:i%4*size,top:Math.floor(i/4)*size}))).webp({quality:92,effort:6}).toFile(fileURLToPath(new URL('jean-painted-walk.webp',output)))

const clips=[]
const hands=[]
async function humanClip(buffer) {
  const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  const points=[[0,0],[220,0],[220,190]]
  let previous=170
  let handX=0,handY=0,handCount=0
  for(let y=192;y<info.height;y+=2) {
    let edge=0
    for(let x=35;x<220;x++) {
      const i=(y*info.width+x)*4
      if(data[i+3]<180) continue
      const r=data[i],g=data[i+1],b=data[i+2]
      const clothing=Math.max(r,g,b)<130 && Math.max(r,g,b)-Math.min(r,g,b)<26 && r>=g-7
      const skin=y<226 && r>175 && g>110 && b>65 && r>g+25 && r>b+45
      if(clothing || skin) edge=Math.max(edge,x)
      if(skin && x>173 && y>=200) { handX+=x;handY+=y;handCount++ }
    }
    if(edge>0) previous=edge+3
    points.push([Math.min(220,previous),y])
  }
  points.push([0,info.height])
  return { points, hand: handCount ? [Math.round(handX/handCount),Math.round(handY/handCount)] : [187,211] }
}
for(let f=0;f<16;f++) {
  const result=await humanClip(await sharp(fileURLToPath(new URL('milet-jean-walk.webp',output))).extract({left:f%4*384,top:Math.floor(f/4)*384,width:384,height:384}).png().toBuffer())
  clips.push(result.points);hands.push(result.hand)
}
const idle=await humanClip(fileURLToPath(new URL('milet-jean-idle.webp',output)))
await writeFile(new URL('../src/components/milet/pilgrimage/pilgrimageRouteHumanClips.ts',import.meta.url),`// Generated Canvas clipping geometry. Original human pixels/poses are preserved.\nexport const humanClips = ${JSON.stringify(clips)} as const\nexport const humanHands = ${JSON.stringify(hands)} as const\nexport const idleHumanClip = ${JSON.stringify(idle.points)} as const\nexport const idleHumanHand = ${JSON.stringify(idle.hand)} as const\n`)
const actorMeta=JSON.parse(await readFile(new URL('milet-jean-motion.json',output),'utf8'))
actorMeta.dog={type:'painted-sprite',atlas:'jean-painted-walk.webp',columns:4,rows:4,frameCount:16,idleFrame:9,frameWidth:size,frameHeight:size,ground,shoulder,actorOffset:[133,128],frames:frames.map(({buffer,...f})=>f)}
await writeFile(new URL('milet-jean-motion.json',output),JSON.stringify(actorMeta,null,2)+'\n')
console.log(JSON.stringify({frames:frames.map(({buffer,...f})=>f),hands,idleHand:idle.hand}))

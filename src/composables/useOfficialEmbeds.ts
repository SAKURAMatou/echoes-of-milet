import { nextTick } from 'vue'

type EmbedWindow = Window &
  typeof globalThis & {
    twttr?: { widgets?: { load: (element?: HTMLElement | null) => void } }
    instgrm?: { Embeds?: { process: () => void } }
  }

const twitterScriptLink = 'https://platform.twitter.com/widgets.js'
const instagramScriptLink = 'https://www.instagram.com/embed.js'
let twitterScriptPromise: Promise<EmbedWindow> | null = null
let instagramScriptPromise: Promise<EmbedWindow> | null = null
const twitterHosts = new Set(['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'])
const instagramHosts = new Set(['instagram.com', 'www.instagram.com'])

function ensureTwitterScript() {
  const browserWindow = window as EmbedWindow
  if (browserWindow.twttr?.widgets) {
    return Promise.resolve(browserWindow)
  }

  if (twitterScriptPromise) {
    return twitterScriptPromise
  }

  twitterScriptPromise = new Promise<EmbedWindow>((resolve, reject) => {
    const existedScript = document.querySelector(`script[src="${twitterScriptLink}"]`)
    if (existedScript) {
      existedScript.addEventListener('load', () => resolve(browserWindow), { once: true })
      existedScript.addEventListener('error', reject, { once: true })
      return
    }

    const twitterScript = document.createElement('script')
    twitterScript.src = twitterScriptLink
    twitterScript.async = true
    twitterScript.onload = () => resolve(browserWindow)
    twitterScript.onerror = reject
    document.body.appendChild(twitterScript)
  })

  return twitterScriptPromise
}

function ensureInstagramScript() {
  const browserWindow = window as EmbedWindow
  if (browserWindow.instgrm?.Embeds) {
    return Promise.resolve(browserWindow)
  }

  if (instagramScriptPromise) {
    return instagramScriptPromise
  }

  instagramScriptPromise = new Promise<EmbedWindow>((resolve, reject) => {
    const existedScript = document.querySelector(`script[src="${instagramScriptLink}"]`)
    if (existedScript) {
      existedScript.addEventListener('load', () => resolve(browserWindow), { once: true })
      existedScript.addEventListener('error', reject, { once: true })
      return
    }

    const instagramScript = document.createElement('script')
    instagramScript.src = instagramScriptLink
    instagramScript.async = true
    instagramScript.onload = () => resolve(browserWindow)
    instagramScript.onerror = reject
    document.body.appendChild(instagramScript)
  })

  return instagramScriptPromise
}

function normalizeTwitterPostUrl(postUrl: string) {
  try {
    const url = new URL(postUrl)
    if (url.protocol !== 'https:' || !twitterHosts.has(url.hostname.toLowerCase())) return ''
    if (!/^\/milet_music\/status\/\d+\/?$/i.test(url.pathname)) return ''
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return ''
  }
}

function normalizeInstagramPostUrl(postUrl: string) {
  try {
    const url = new URL(postUrl)
    if (url.protocol !== 'https:' || !instagramHosts.has(url.hostname.toLowerCase())) return ''
    if (!/^\/(?:p|reel)\/[A-Za-z0-9_-]+\/?$/i.test(url.pathname)) return ''
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return ''
  }
}

function withInstagramEmbedParams(postUrl: string) {
  const url = new URL(postUrl)
  url.searchParams.set('utm_source', 'ig_embed')
  url.searchParams.set('utm_campaign', 'loading')
  return url.toString()
}

export function buildTwitterEmbed(postUrl: string) {
  const safePostUrl = normalizeTwitterPostUrl(postUrl)
  if (!safePostUrl) return null

  const blockquote = document.createElement('blockquote')
  blockquote.className = 'twitter-tweet'

  const paragraph = document.createElement('p')
  paragraph.lang = 'ja'
  paragraph.dir = 'ltr'
  paragraph.append('ジャンじゃん ')

  const picLink = document.createElement('a')
  picLink.href = 'https://t.co/5QFrlAwXF5'
  picLink.textContent = 'pic.twitter.com/5QFrlAwXF5'
  paragraph.append(picLink)

  const postLink = document.createElement('a')
  postLink.href = safePostUrl
  postLink.textContent = 'June 5, 2025'

  blockquote.append(paragraph, '— milet（ミレイ） (@milet_music) ', postLink)
  return blockquote
}

export function buildInstagramEmbed(postUrl: string) {
  const safePostUrl = normalizeInstagramPostUrl(postUrl)
  if (!safePostUrl) return null

  const embedUrl = withInstagramEmbedParams(safePostUrl)
  const blockquote = document.createElement('blockquote')
  blockquote.className = 'instagram-media'
  blockquote.dataset.instgrmCaptioned = ''
  blockquote.dataset.instgrmPermalink = embedUrl
  blockquote.dataset.instgrmVersion = '14'
  blockquote.setAttribute(
    'style',
    'background:#FFF;border:0;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.08);margin:0 auto;max-width:540px;min-width:326px;padding:0;width:100%;',
  )

  const link = document.createElement('a')
  link.href = embedUrl
  link.target = '_blank'
  link.rel = 'noreferrer'
  link.textContent = 'View this post on Instagram'
  blockquote.append(link)
  return blockquote
}

export async function loadTwitterEmbed(container: HTMLElement | null, postUrl?: string) {
  if (!container || !postUrl) return

  const embed = buildTwitterEmbed(postUrl)
  container.replaceChildren(...(embed ? [embed] : []))
  if (!embed) return
  await nextTick()

  try {
    const browserWindow = await ensureTwitterScript()
    browserWindow.twttr?.widgets?.load(container)
  } catch (error) {
    console.error('twitter embed load failed', error)
  }
}

export async function loadInstagramEmbed(container: HTMLElement | null, postUrl?: string) {
  if (!container || !postUrl) return

  const embed = buildInstagramEmbed(postUrl)
  container.replaceChildren(...(embed ? [embed] : []))
  if (!embed) return
  await nextTick()

  try {
    const browserWindow = await ensureInstagramScript()
    browserWindow.instgrm?.Embeds?.process()
  } catch (error) {
    console.error('instagram embed load failed', error)
  }
}

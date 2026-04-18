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

export function buildTwitterEmbed(postUrl: string) {
  return `<blockquote class="twitter-tweet">
    <p lang="ja" dir="ltr">ジャンじゃん
      <a href="https://t.co/5QFrlAwXF5">pic.twitter.com/5QFrlAwXF5</a>
    </p>&mdash; milet（ミレイ） (@milet_music)
    <a href="${postUrl}">June 5, 2025</a>
  </blockquote>`
}

export function buildInstagramEmbed(postUrl: string) {
  return `
    <blockquote
      class="instagram-media"
      data-instgrm-captioned
      data-instgrm-permalink="${postUrl}?utm_source=ig_embed&amp;utm_campaign=loading"
      data-instgrm-version="14"
      style="background:#FFF;border:0;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.08);margin:0 auto;max-width:540px;min-width:326px;padding:0;width:100%;"
    >
      <a
        href="${postUrl}?utm_source=ig_embed&amp;utm_campaign=loading"
        target="_blank"
        rel="noreferrer"
      >
        View this post on Instagram
      </a>
    </blockquote>
  `
}

export async function loadTwitterEmbed(container: HTMLElement | null, postUrl?: string) {
  if (!container || !postUrl) return

  container.innerHTML = buildTwitterEmbed(postUrl)
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

  container.innerHTML = buildInstagramEmbed(postUrl)
  await nextTick()

  try {
    const browserWindow = await ensureInstagramScript()
    browserWindow.instgrm?.Embeds?.process()
  } catch (error) {
    console.error('instagram embed load failed', error)
  }
}

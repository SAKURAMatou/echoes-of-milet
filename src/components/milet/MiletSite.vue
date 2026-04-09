<template>
  <div id="sns" class="px-4 py-1 font-semibold text-lg">
    {{ $getConfigLang('miletHomeView')['title4'] }}
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
    <div class="space-y-2">
      <div>
        <a
          href="https://www.instagram.com/milet_music"
          target="_blank"
          rel="noreferrer"
          class="flex items-center gap-2 text-xl"
        >
          <img src="@/assets/nav-instagram-4.png" class="w-[30px] h-[30px] object-contain" />
          instagram
        </a>
      </div>
      <!-- <div class="text-gray-400 text-sm p-2">
        <span>
          {{ $getConfigLang('miletsite')['tips1'] }}
        </span>
      </div> -->
      <div ref="insContainer" class="rounded-xl overflow-hidden"></div>
    </div>
    <div>
      <div>
        <a
          href="https://twitter.com/milet_music"
          target="_blank"
          rel="noreferrer"
          class="flex items-center gap-2 text-xl"
        >
          <img src="@/assets/nav-twitter-4.png" class="w-[30px] h-[30px] object-contain" />
          twitter(X)
        </a>
      </div>
      <div ref="twitterContainer" class="rounded-xl overflow-hidden"></div>
    </div>
  </div>
  <div id="website" class="px-4 py-1 font-semibold text-lg">
    🌐 {{ $getConfigLang('miletHomeView')['title3'] }}
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
    <a
      v-for="(site, index) in miletSiteData.siteList"
      :key="index"
      :href="site.link"
      :title="site.title"
      target="_blank"
      rel="noreferrer"
      class="group block max-w-[600px] mx-auto rounded-lg shadow-lg overflow-hidden border border-blue-200 hover:shadow-xl transition-shadow duration-300 bg-white"
    >
      <div class="aspect-[1.91/1] overflow-hidden">
        <img
          :src="site.oginImage"
          alt="milet logo"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div class="px-4 py-3">
        <h3 class="text-blue-800 font-semibold text-lg">{{ site.description }}</h3>
      </div>
    </a>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const insContainer = ref(null)
const twitterContainer = ref(null)

const props = defineProps({
  miletSiteData: {
    type: Object,
    default: () => ({}),
  },
})

const twScriptLink = 'https://platform.twitter.com/widgets.js'
const insScriptLink = 'https://www.instagram.com/embed.js'
const fallbackInstagramPost = 'https://www.instagram.com/p/DWgab3aCYqi/'
let twitterScriptPromise = null
let instagramScriptPromise = null

const twitterWidgets = computed(() => {
  return `<blockquote class="twitter-tweet">
    <p lang="ja" dir="ltr">ジャンじゃん 
      <a href="https://t.co/5QFrlAwXF5">pic.twitter.com/5QFrlAwXF5</a>
      </p>&mdash; milet（ミレイ） (@milet_music) 
    <a href="${props.miletSiteData.twitterPost}">June 5, 2025</a>
    </blockquote>`
})

const instagramPostUrl = computed(() => {
  return props.miletSiteData?.insPost || fallbackInstagramPost
})

const instagramWidget = computed(() => {
  return `
    <blockquote
      class="instagram-media"
      data-instgrm-captioned
      data-instgrm-permalink="${instagramPostUrl.value}?utm_source=ig_embed&amp;utm_campaign=loading"
      data-instgrm-version="14"
      style="background:#FFF;border:0;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.08);margin:0 auto;max-width:540px;min-width:326px;padding:0;width:100%;"
    >
      <a
        href="${instagramPostUrl.value}?utm_source=ig_embed&amp;utm_campaign=loading"
        target="_blank"
        rel="noreferrer"
      >
        View this post on Instagram
      </a>
    </blockquote>
  `
})

function ensureTwitterScript() {
  if (window.twttr?.widgets) {
    return Promise.resolve(window.twttr)
  }

  if (twitterScriptPromise) {
    return twitterScriptPromise
  }

  twitterScriptPromise = new Promise((resolve, reject) => {
    const existedScript = document.querySelector(`script[src="${twScriptLink}"]`)
    if (existedScript) {
      existedScript.addEventListener('load', () => resolve(window.twttr), { once: true })
      existedScript.addEventListener('error', reject, { once: true })
      return
    }

    const twitterScript = document.createElement('script')
    twitterScript.src = twScriptLink
    twitterScript.async = true
    twitterScript.onload = () => resolve(window.twttr)
    twitterScript.onerror = reject
    document.body.appendChild(twitterScript)
  })

  return twitterScriptPromise
}

function ensureInstagramScript() {
  if (window.instgrm?.Embeds) {
    return Promise.resolve(window.instgrm)
  }

  if (instagramScriptPromise) {
    return instagramScriptPromise
  }

  instagramScriptPromise = new Promise((resolve, reject) => {
    const existedScript = document.querySelector(`script[src="${insScriptLink}"]`)
    if (existedScript) {
      existedScript.addEventListener('load', () => resolve(window.instgrm), { once: true })
      existedScript.addEventListener('error', reject, { once: true })
      return
    }

    const insScript = document.createElement('script')
    insScript.src = insScriptLink
    insScript.async = true
    insScript.onload = () => resolve(window.instgrm)
    insScript.onerror = reject
    document.body.appendChild(insScript)
  })

  return instagramScriptPromise
}

async function loadTwitterEmbed() {
  if (!twitterContainer.value || !props.miletSiteData?.twitterPost) return

  twitterContainer.value.innerHTML = twitterWidgets.value
  await nextTick()

  try {
    const api = await ensureTwitterScript()
    api?.widgets?.load(twitterContainer.value)
  } catch (error) {
    console.error('twitter embed load failed', error)
  }
}

async function loadInstagramEmbed() {
  if (!insContainer.value) return

  insContainer.value.innerHTML = instagramWidget.value
  await nextTick()

  try {
    const api = await ensureInstagramScript()
    api?.Embeds?.process()
  } catch (error) {
    console.error('instagram embed load failed', error)
  }
}

async function initializeEmbeds() {
  await nextTick()
  loadTwitterEmbed()
  loadInstagramEmbed()
}

onMounted(() => {
  initializeEmbeds()
})

watch(
  () => [props.miletSiteData?.twitterPost, props.miletSiteData?.insPost],
  () => {
    initializeEmbeds()
  },
)
</script>

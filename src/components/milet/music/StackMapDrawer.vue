<template>
  <div v-if="open" class="fixed inset-0 z-[500]">
    <div class="absolute inset-0 bg-slate-950/32 backdrop-blur-[2px]" @click="emit('close')" />

    <div
      class="absolute inset-x-0 bottom-0 rounded-t-3xl border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,249,255,0.94))] p-5 shadow-2xl"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="text-xs font-medium uppercase tracking-[0.18em] text-[#317f8d]/80">
            {{ pageText.stackMap.kicker }}
          </div>
          <div
            class="release-drawer-title mt-2 flex items-center gap-3 font-serif text-[1.3rem] leading-none text-[#143d63]"
          >
            <span>{{ pageText.page.archiveTitle }}</span>
          </div>
        </div>
        <button
          class="shrink-0 rounded-lg border border-slate-200 bg-white/82 px-3 py-1.5 text-sm text-[#143d63] transition hover:bg-sky-50"
          @click="emit('close')"
        >
          {{ pageText.stackMap.close }}
        </button>
      </div>

      <nav
        class="release-drawer-nav relative mt-5 grid gap-[1.05rem]"
        :aria-label="pageText.stackMap.desc"
      >
        <a
          v-for="chapter in chapters"
          :key="chapter.key"
          :href="`#${chapter.anchorId}`"
          class="relative grid w-full grid-cols-[1.45rem_minmax(0,1fr)_auto] items-center gap-3 py-0.5 text-left"
          @click="onChapterAnchorClick($event, chapter.anchorId)"
        >
          <span
            class="relative z-[1] flex h-[0.78rem] w-[0.78rem] justify-self-center rounded-full border border-[#317f8d] bg-white/90"
          >
            <span class="m-auto block h-[0.34rem] w-[0.34rem] rounded-full bg-[#317f8d]"></span>
          </span>
          <span class="min-w-0">
            <span class="block text-base font-semibold text-[#143d63]">{{ chapter.title }}</span>
            <span class="mt-0.5 block text-xs text-slate-500">{{ chapter.subtitle }}</span>
          </span>
          <span class="font-montserrat text-[0.86rem] tabular-nums text-slate-600/80">
            {{ chapter.countLabel }}
          </span>
        </a>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, computed } from 'vue'
import { RELEASE_PAGE_TEXT } from '@/composables/lang/ReleaseMetaData'
import { usePageAnchorScroll } from '@/composables/usePageAnchorScroll'

const { appContext } = getCurrentInstance()!
const global = appContext.config.globalProperties
const { scrollToPageAnchor } = usePageAnchorScroll()

const pageText = computed(() => {
  const lang = global.$lang?.lang === 'jp' ? 'jp' : 'zh'
  return RELEASE_PAGE_TEXT[lang]
})

type Chapter = {
  key: string
  title: string
  subtitle: string
  countLabel: string
  anchorId: string
}

defineProps<{ open: boolean; chapters: Chapter[] }>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

function onChapterAnchorClick(event: MouseEvent, anchorId: string) {
  event.preventDefault()
  emit('close')

  window.setTimeout(() => {
    scrollToPageAnchor(anchorId)
  }, 0)
}
</script>

<style scoped>
.release-drawer-title::after {
  content: '';
  height: 1px;
  width: min(9rem, 36vw);
  background: linear-gradient(90deg, rgba(184, 148, 68, 0.82), rgba(184, 148, 68, 0.16));
}

.release-drawer-nav::before {
  content: '';
  position: absolute;
  bottom: 0.7rem;
  left: 0.725rem;
  top: 0.7rem;
  width: 1px;
  background: rgba(100, 116, 139, 0.34);
}
</style>

<template>
  <section
    class="rounded-lg border border-[#86bde6]/26 bg-[#061827]/78 p-5 shadow-[0_28px_90px_-64px_rgba(3,19,34,0.95)]"
  >
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
      <div>
        <h2
          class="inline-flex items-center gap-2 font-['Montserrat','sans-serif'] text-sm font-semibold uppercase tracking-[0.18em] text-[#d9b77c]"
        >
          <svg
            class="size-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18V5l10-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="16" cy="16" r="3" />
            <path d="M9 9l10-2" />
          </svg>
          Setlist
        </h2>
        <p v-if="subtitle" class="mt-1 text-sm text-[#b8c8d5]">{{ subtitle }}</p>
      </div>
      <p v-if="isPublished" class="text-xs text-[#b8c8d5]">
        {{ lang === 'ja' ? '曲目をクリックして楽曲情報へ' : '点击曲目查看歌曲详情' }}
      </p>
    </div>

    <div v-if="isPublished && segments.length" class="mt-5 grid gap-6">
      <div v-for="segment in segments" :key="segment.key">
        <div class="mb-3 flex items-center gap-3 text-[#d9b77c]">
          <span class="h-px flex-1 bg-[#d9b77c]/22"></span>
          <span
            class="font-['Montserrat','sans-serif'] text-xs font-semibold uppercase tracking-[0.16em]"
          >
            {{ sectionLabel(segment.section) }}
          </span>
          <span class="h-px flex-1 bg-[#d9b77c]/22"></span>
        </div>

        <ol class="grid gap-0 md:grid-cols-2 md:gap-x-8">
          <li
            v-for="item in segment.items"
            :key="item.itemKey"
            class="group grid min-h-11 grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 py-2.5 text-sm"
          >
            <span class="font-['Montserrat','sans-serif'] text-xs font-semibold text-[#d9b77c]">
              {{ item.sortNo ? String(item.sortNo).padStart(2, '0') : 'EN' }}
            </span>
            <button
              type="button"
              class="min-w-0 text-left text-[#f3eadf] transition enabled:hover:text-[#9fd4ff] disabled:cursor-default"
              :disabled="!hasLiveTrackDetail(item)"
              @click="$emit('select-track', item)"
            >
              <span class="block truncate">{{ item.displayTitle }}</span>
              <span
                v-if="item.changed"
                class="ml-2 rounded border border-[#d9b77c]/35 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#d9b77c]"
              >
                changed
              </span>
              <span v-if="item.notes" class="mt-0.5 block truncate text-xs text-[#91a9ba]">
                {{ item.notes }}
              </span>
            </button>
            <span class="font-['Montserrat','sans-serif'] text-xs text-[#91a9ba]">
              {{ item.duration || '›' }}
            </span>
          </li>
        </ol>
      </div>
    </div>

    <div v-else class="mt-5 rounded border border-dashed border-white/16 p-6 text-center">
      <p class="text-sm leading-7 text-[#b8c8d5]">
        {{ emptyMessage || defaultSetlistEmptyMessage(setlistState, lang) }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import {
  defaultSetlistEmptyMessage,
  hasLiveTrackDetail,
  sectionLabel,
  type LiveLang,
  type LiveSetlistState,
  type LiveSetlistItem,
  type LiveSetlistSegment,
} from '@/composables/liveArchive'

const props = withDefaults(
  defineProps<{
    segments: LiveSetlistSegment[]
    subtitle?: string
    lang: LiveLang
    setlistState?: LiveSetlistState
    emptyMessage?: string
  }>(),
  {
    setlistState: 'published',
    emptyMessage: '',
  },
)

const isPublished = computed(() => props.setlistState === 'published')

defineEmits<{
  'select-track': [item: LiveSetlistItem]
}>()
</script>

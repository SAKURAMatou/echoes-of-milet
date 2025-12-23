<template>
  <aside class="max-w-[310px]">
    <div class="pl-11 pr-6 py-6">
      <div class="text-xs tracking-[.18em] text-slate-500/80 mb-3 select-none">MENU</div>

      <nav aria-label="Primary" class="flex flex-col gap-4">
        <div v-for="item in menu" :key="item.key" class="group">
          <!-- Sticker -->
          <!-- :href="$router.resolve({ name: item.routerName }).href" -->
          <router-link
            :to="{ name: item.routerName }"
            role="button"
            class="relative block select-none rounded-2xl border bg-white/85 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            :exact-active-class="`${getColor(item.color).wash} ${getColor(item.color).focus} is-exact-active`"
            :aria-current="isActiveRoute(item) ? 'page' : false"
            :class="[getColor(item.color).stroke, 'clip-sticker']"
          >
            <!-- left dot -->
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border border-slate-200 bg-white"
              aria-hidden="true"
            >
              <span
                class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                :class="getColor(item.color).dot"
              />
            </span>

            <div class="pl-12 pr-4 py-3">
              <div class="relative inline-flex items-baseline gap-2">
                <span
                  class="font-['Montserrat','sans-serif'] text-[14px] font-medium text-[#546e7a] uppercase"
                >
                  {{ item.label }}
                </span>

                <!-- active “tape underline” -->
                <span
                  v-if="isActiveRoute(item)"
                  class="absolute -bottom-2 left-0 h-[3px] w-[calc(100%+18px)] rounded-full"
                  :class="getColor(item.color).underline"
                  aria-hidden="true"
                />
              </div>

              <span class="block mt-1.5 text-xs text-slate-500/80 font-['Montserrat','sans-serif']">
                {{ item.sub || '— explore' }}
              </span>
            </div>

            <!-- tiny corner fold for personality -->
            <span
              class="pointer-events-none absolute -right-1 -top-1 h-7 w-7 rotate-3 rounded-bl-2xl rounded-tr-2xl border border-slate-200 bg-white/70"
              aria-hidden="true"
            />
          </router-link>

          <!-- Submenu chips -->
          <div
            v-if="isActiveRoute(item) && item.children?.length"
            class="mt-3 flex flex-wrap gap-2 pl-2 font-['Montserrat','sans-serif']"
            :aria-label="`${item.label} submenu`"
          >
            <a
              v-for="ch in item.children"
              :key="ch.key"
              :href="ch.href || '#'"
              class="font-['Montserrat','sans-serif'] inline-flex h-7 items-center rounded-full border bg-white/90 px-3 text-xs text-slate-700 shadow-[0_1px_0_rgba(255,255,255,.7)_inset] transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              :class="[getColor(item.color).chip, getColor(item.color).focus]"
            >
              {{ ch.label }}
            </a>
          </div>
        </div>
      </nav>

      <!-- Optional: active hint -->
      <div class="mt-6 text-xs text-slate-500/70">
        当前：<span class="text-slate-700">{{ activeItem?.label }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

type MenuItem = {
  key: string
  label: string
  sub?: string
  // Tailwind color tokens (base)
  color: 'pink' | 'green' | 'teal' | 'amber' | 'sky' | 'violet'
  routerName?: string
  children?: { key: string; label: string; href?: string }[]
}

const menu: MenuItem[] = [
  {
    key: 'home',
    label: 'HOME',
    sub: '— welcome page',
    color: 'sky',
    routerName: 'home',
  },
  {
    key: 'milet',
    label: 'milet',
    sub: '— about milet',
    color: 'pink',
    routerName: 'milet',
    children: [
      { key: 'introduction', label: 'introduction', href: '#introduction' },
      { key: 'gallery', label: 'gallery', href: '#gallery' },
      { key: 'website', label: 'Official website', href: '#website' },
      { key: 'sns', label: 'Official SNS', href: '#sns' },
    ],
  },
  {
    key: 'gallery',
    label: 'GALLERY',
    sub: '— visual stories',
    color: 'teal',
    routerName: 'miletPicAlbum',
  },
]

/**
 * Tailwind is static-analysis based; to keep classes safelisted without config,
 * we map to explicit class strings.
 */
const colorMap = {
  pink: {
    stroke: 'border-pink-300',
    wash: 'bg-pink-50',
    dot: 'bg-pink-300',
    underline: 'bg-pink-300',
    chip: 'border-pink-200 hover:bg-pink-50',
    focus: 'focus-visible:ring-pink-200',
  },
  green: {
    stroke: 'border-green-300',
    wash: 'bg-green-50',
    dot: 'bg-green-300',
    underline: 'bg-green-300',
    chip: 'border-green-200 hover:bg-green-50',
    focus: 'focus-visible:ring-green-200',
  },
  teal: {
    stroke: 'border-teal-300',
    wash: 'bg-teal-50',
    dot: 'bg-teal-300',
    underline: 'bg-teal-300',
    chip: 'border-teal-200 hover:bg-teal-50',
    focus: 'focus-visible:ring-teal-200',
  },
  amber: {
    stroke: 'border-amber-300',
    wash: 'bg-amber-50',
    dot: 'bg-amber-300',
    underline: 'bg-amber-300',
    chip: 'border-amber-200 hover:bg-amber-50',
    focus: 'focus-visible:ring-amber-200',
  },
  sky: {
    stroke: 'border-sky-300',
    wash: 'bg-sky-50',
    dot: 'bg-sky-300',
    underline: 'bg-sky-300',
    chip: 'border-sky-200 hover:bg-sky-50',
    focus: 'focus-visible:ring-sky-200',
  },
  violet: {
    stroke: 'border-violet-300',
    wash: 'bg-violet-50',
    dot: 'bg-violet-300',
    underline: 'bg-violet-300',
    chip: 'border-violet-200 hover:bg-violet-50',
    focus: 'focus-visible:ring-violet-200',
  },
} as const

const getColor = (c: MenuItem['color']) => colorMap[c]

const route = useRoute()

function isActiveRoute(item: MenuItem) {
  return route.name === item.routerName
}

const activeItem = computed(() => menu.find((m) => m.routerName === route.name))
</script>

<style scoped>
/* “贴纸”不规则轮廓：与之前 mock 的感觉接近 */
.clip-sticker {
  clip-path: polygon(3% 12%, 96% 2%, 100% 86%, 0% 100%);
}
</style>

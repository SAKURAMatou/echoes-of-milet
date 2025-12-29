<template>
  <div>
    <div class="text-xs tracking-[.18em] text-slate-500/80 mb-3 select-none">MENU</div>

    <nav aria-label="Primary" class="flex flex-col gap-4">
      <transition-group
        tag="nav"
        aria-label="Primary"
        class="flex flex-col gap-4"
        name="menu-stagger"
        appear
      >
        <div
          v-for="(item, index) in menu"
          :key="item.key"
          class="group"
          :style="{ '--d': `${index * 120}ms` }"
        >
          <!-- Sticker -->

          <router-link
            :to="{ name: item.routerName }"
            class="menu-link relative block focus-visible:outline-none"
            :aria-current="isActiveRoute(item) ? 'page' : false"
            :class="{ 'is-active': isActiveRoute(item) }"
            @click="onMenuItemClick"
          >
            <!-- hover:-translate-y-0.5 -->
            <StickerSVG
              :path="BOTTOM_WIDE_STATIONERY_PATH"
              :active="isActiveRoute(item)"
              class="select-none transition"
              :style="{
                '--sticker-bg': getBgColor(item.color),
                '--sticker-border': getBorderColor(item.color),
              }"
            >
              <!-- 原有内容基本不动 -->
              <div class="pl-12 pr-4 py-3">
                <!-- 左侧圆点 -->
                <span
                  class="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border border-slate-200 bg-white"
                >
                  <span
                    class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    :class="getColor(item.color).dot"
                  />
                </span>

                <div class="relative inline-flex items-baseline gap-2">
                  <span
                    class="font-['Montserrat','sans-serif'] text-[14px] font-medium text-[#546e7a] uppercase"
                  >
                    {{ item.label }}
                  </span>

                  <!-- active underline -->
                  <span
                    v-if="isActiveRoute(item)"
                    class="absolute -bottom-2 left-0 h-[3px] w-[calc(100%+18px)] rounded-full"
                    :class="getColor(item.color).underline"
                  />
                </div>

                <span class="block mt-2 text-xs text-slate-500/80 font-['Montserrat','sans-serif']">
                  {{ item.sub || '— explore' }}
                </span>
              </div>
            </StickerSVG>
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
      </transition-group>
    </nav>

    <!-- Optional: active hint -->
    <div class="mt-6 text-xs text-slate-500/70">
      CURRENT：<span class="text-slate-700">{{ activeItem?.label }}</span>
    </div>
    <div class="flex items-center mt-6 relative">
      <LanguageSelect />
    </div>
  </div>
</template>
<script setup lang="ts">
import StickerSVG from './StickerSVG.vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import LanguageSelect from '@/components/LanguageSelect.vue'
type MenuItem = {
  key: string
  label: string
  sub?: string
  // Tailwind color tokens (base)
  color: 'pink' | 'green' | 'teal' | 'amber' | 'sky' | 'violet'
  routerName?: string
  children?: { key: string; label: string; href?: string }[]
}

const BOTTOM_WIDE_STATIONERY_PATH = `
    M316,12
  Q312,8 306,10
  L16,12
  Q10,14 12,20
  L14,78
  Q16,84 26,82
  L310,84
  Q318,82 316,74
  Z
`

// const PATHS = [
//   CHARACTER_STATIONERY_PATH, // 主入口
//   STATIONERY_CUT_PATH, // 次入口
//   BOTTOM_WIDE_STATIONERY_PATH, // 底部宽贴纸
// ]
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
    key: 'timeline',
    label: 'TIMELINE',
    sub: '— milet history',
    color: 'amber',
    routerName: 'miletTimeLine',
  },
  {
    key: 'gallery',
    label: 'GALLERY',
    sub: '— visual stories',
    color: 'teal',
    routerName: 'miletPicAlbum',
  },
]

function getBgColor(color: MenuItem['color']) {
  return {
    pink: '#fdf2f8',
    teal: '#f0fdfa',
    sky: '#f0f9ff',
    green: '#f0fdf4',
    amber: '#fffbeb',
    violet: '#f5f3ff',
  }[color]
}

function getBorderColor(color: MenuItem['color']) {
  return {
    pink: '#f9a8d4',
    teal: '#5eead4',
    sky: '#7dd3fc',
    green: '#86efac',
    amber: '#fcd34d',
    violet: '#c4b5fd',
  }[color]
}

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
const emit = defineEmits(['closeMenuItem'])

function onMenuItemClick() {
  emit('closeMenuItem')
}
</script>
<style scoped>
.menu-link:hover {
  transform: translateY(-0.7px);
}

.menu-link:hover path {
  stroke-opacity: 0.7;
}
.menu-link.is-active {
  transform: translateY(1px);
}
.menu-link.is-active path {
  filter: drop-shadow(0 0.5px 1px rgba(0, 0, 0, 0.12));
}
.menu-link.is-active path {
  stroke-opacity: 0.35;
  stroke-width: 1;
}
.menu-link.is-active {
  --sticker-bg: var(--sticker-bg-active);
}

.menu-stagger-enter-active,
.menu-stagger-appear-active {
  transition:
    transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 420ms ease;
  transition-delay: var(--d);
}

.menu-stagger-enter-from,
.menu-stagger-appear-from {
  opacity: 0;
  transform: translateX(-18px);
}

.menu-stagger-enter-to,
.menu-stagger-appear-to {
  opacity: 1;
  transform: translateX(0);
}

/* 可选：让离开也顺滑（如果菜单会变动/切换） */
.menu-stagger-leave-active {
  transition:
    transform 220ms ease,
    opacity 220ms ease;
}
.menu-stagger-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 可选：避免 group 在过渡期间撑开导致抖动 */
.menu-stagger-move {
  transition: transform 260ms ease;
}
</style>

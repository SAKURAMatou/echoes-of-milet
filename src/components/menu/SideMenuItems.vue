<template>
  <div>
    <div class="mb-5 md:hidden">
      <LanguageSelect variant="menu" @beforeNavigate="onLanguageNavigate" />
    </div>

    <div class="flex justify-around items-center text-xs">
      <div class="tracking-[.18em] text-slate-500/80 mb-3 select-none">MENU</div>
      <div class="mb-3 text-slate-500/70 select-none">
        CURRENT: <span class="text-slate-700">{{ activeItem?.label }}</span>
      </div>
    </div>

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
        :style="{ '--d': `${Math.min(index, 5) * 30}ms` }"
        >
          <!-- Sticker -->

          <router-link
            v-if="item.shown"
            :to="buildMenuRoute(item)"
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
                  {{ item.sub || 'explore' }}
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
              @click="onSubmenuClick($event, ch.href)"
            >
              {{ ch.label }}
            </a>
          </div>
        </div>
      </transition-group>
    </nav>

    <!-- Optional: active hint -->
  </div>
</template>
<script setup lang="ts">
import StickerSVG from './StickerSVG.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LanguageSelect from '@/components/LanguageSelect.vue'
import type { MenuItem } from '@/composables/SideMenueData'
import { colorMap, getMenu } from '@/composables/SideMenueData'
import { usePageAnchorScroll } from '@/composables/usePageAnchorScroll'
import { withLangParam } from '@/composables/useLangRoute'

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
//   CHARACTER_STATIONERY_PATH, // 涓诲叆鍙?
//   STATIONERY_CUT_PATH, // 娆″叆鍙?
//   BOTTOM_WIDE_STATIONERY_PATH, // 搴曢儴瀹借创绾?
// ]

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

const getColor = (c: MenuItem['color']) => colorMap[c]

const route = useRoute()
const { scrollToPageAnchor } = usePageAnchorScroll()
const menu = computed(() => getMenu())

function isActiveRoute(item: MenuItem) {
  return route.name === item.routerName || item.activeRouteNames?.includes(String(route.name)) === true
}

function buildMenuRoute(item: MenuItem) {
  const routerName = item.routerName
  if (!routerName) {
    return '#'
  }

  return withLangParam(
    { name: routerName, params: item.routeParams || {} },
    String(route.params.lang || 'zh'),
  )
}

const activeItem = computed(() => menu.value.find(isActiveRoute))
const emit = defineEmits(['closeMenuItem'])

function onMenuItemClick() {
  emit('closeMenuItem')
}

function onLanguageNavigate() {
  emit('closeMenuItem')
}

function onSubmenuClick(event: MouseEvent, href?: string) {
  if (!href?.startsWith('#') || href.length <= 1) {
    emit('closeMenuItem')
    return
  }

  event.preventDefault()
  emit('closeMenuItem')

  window.setTimeout(() => {
    scrollToPageAnchor(href)
  }, 0)
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
    transform var(--echo-duration-route) var(--echo-ease-out),
    opacity var(--echo-duration-route) var(--echo-ease-out);
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

/* 鍙€夛細璁╃寮€涔熼『婊戯紙濡傛灉鑿滃崟浼氬彉鍔?鍒囨崲锛?*/
.menu-stagger-leave-active {
  transition:
    transform 220ms ease,
    opacity 220ms ease;
}
.menu-stagger-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 鍙€夛細閬垮厤 group 鍦ㄨ繃娓℃湡闂存拺寮€瀵艰嚧鎶栧姩 */
.menu-stagger-move {
  transition: transform 260ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .menu-stagger-enter-active,
  .menu-stagger-appear-active,
  .menu-stagger-leave-active,
  .menu-stagger-move { transition: none; transition-delay: 0ms !important; }
  .menu-stagger-enter-from,
  .menu-stagger-appear-from,
  .menu-stagger-leave-to { opacity: 1; transform: none; }
}
</style>

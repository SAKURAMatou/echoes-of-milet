<template>
  <div class="pet-quick-menu pointer-events-none absolute inset-0" :aria-hidden="!open">
    <nav v-if="open" :id="menuId" :aria-label="text.menuLabel" class="absolute inset-0">
      <TransitionGroup tag="ul" name="pet-orbit" appear class="absolute inset-0">
        <li
          v-for="(entry, index) in positionedEntries"
          :key="entry.routeName"
          class="pet-quick-menu__item pointer-events-auto absolute"
          :style="entry.style"
        >
          <router-link
            :to="entry.to"
            class="pet-quick-menu__link group flex h-full w-full items-center gap-2 rounded-full border bg-white/90 px-3 text-left shadow-[0_16px_36px_-18px_rgba(15,23,42,0.75)] backdrop-blur-xl transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_40px_-18px_rgba(15,23,42,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            :class="[entry.colorClasses, isCurrent(entry.routeName) && entry.activeClasses]"
            :title="entry.hint"
            :aria-label="entry.hint ? `${entry.label} — ${entry.hint}` : entry.label"
            :aria-current="isCurrent(entry.routeName) ? 'page' : undefined"
            @click="emit('navigate')"
          >
            <span
              class="pet-quick-menu__index grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.62rem] font-semibold tracking-[0.04em]"
              :class="entry.badgeClasses"
              aria-hidden="true"
            >
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <span class="min-w-0 flex-1 truncate text-xs font-semibold tracking-[0.04em]">
              {{ entry.label }}
            </span>
          </router-link>
        </li>
      </TransitionGroup>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { useRoute } from 'vue-router'

import { PET_QUICK_MENU_ROUTES } from '@/config/pet'
import type { PetQuickMenuText } from '@/composables/lang/pet'
import {
  resolvePetRadialMenuLayout,
  type PetEdgeInsets,
  type PetViewportBox,
} from '@/composables/pet/petGeometryCore'
import type { PetUrlLang } from '@/composables/pet/petTypes'
import { withLangParam } from '@/composables/useLangRoute'

const props = defineProps<{
  open: boolean
  menuId: string
  text: PetQuickMenuText
  lang: PetUrlLang
  petX: number
  petY: number
  petSize: number
  viewport: PetViewportBox
  safeInsets: PetEdgeInsets
  isMobile: boolean
}>()

const emit = defineEmits<{ navigate: [] }>()
const route = useRoute()

const colorMap = {
  amber: {
    link: 'border-amber-200/90 text-amber-950 focus-visible:ring-amber-300',
    active: 'border-amber-400 bg-amber-50/95',
    badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200/80',
  },
  violet: {
    link: 'border-violet-200/90 text-violet-950 focus-visible:ring-violet-300',
    active: 'border-violet-400 bg-violet-50/95',
    badge: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200/80',
  },
  sky: {
    link: 'border-sky-200/90 text-sky-950 focus-visible:ring-sky-300',
    active: 'border-sky-400 bg-sky-50/95',
    badge: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200/80',
  },
} as const

const itemWidth = computed(() => (props.isMobile ? 132 : 144))
const itemHeight = computed(() => (props.isMobile ? 42 : 46))
const extraItemCount = computed(() => Math.max(0, PET_QUICK_MENU_ROUTES.length - 3))
const radius = computed(() => {
  const base = props.isMobile
    ? Math.max(186, props.petSize * 1.55)
    : Math.max(218, props.petSize * 1.35)
  return base + extraItemCount.value * (props.isMobile ? 36 : 42)
})
const spreadDegrees = computed(() =>
  Math.min(150, (props.isMobile ? 90 : 96) + extraItemCount.value * 18),
)

const menuEntries = computed(() =>
  PET_QUICK_MENU_ROUTES.map((meta) => {
    const textItem = props.text.items[meta.key]
    const colors = colorMap[meta.color]
    return {
      routeName: meta.routeName,
      label: textItem.label,
      hint: textItem.hint,
      to: withLangParam({ name: meta.routeName }, props.lang),
      colorClasses: colors.link,
      activeClasses: colors.active,
      badgeClasses: colors.badge,
    }
  }),
)

const positionedEntries = computed(() => {
  const positions = resolvePetRadialMenuLayout({
    viewport: props.viewport,
    safeInsets: props.safeInsets,
    petX: props.petX,
    petY: props.petY,
    petSize: props.petSize,
    itemWidth: itemWidth.value,
    itemHeight: itemHeight.value,
    itemCount: menuEntries.value.length,
    radius: radius.value,
    spreadDegrees: spreadDegrees.value,
  })

  return menuEntries.value.map((entry, index) => {
    const position = positions[index]
    const style = {
      left: `${position.left}px`,
      top: `${position.top}px`,
      width: `${itemWidth.value}px`,
      height: `${itemHeight.value}px`,
      '--pet-menu-origin-x': `${position.originX}px`,
      '--pet-menu-origin-y': `${position.originY}px`,
      '--pet-menu-delay': `${index * 34}ms`,
    } as CSSProperties
    return { ...entry, style }
  })
})

function isCurrent(routeName: string) {
  return route.name === routeName
}
</script>

<style scoped>
.pet-quick-menu__item {
  z-index: 1;
}

.pet-quick-menu__link {
  transform-origin: center;
}

.pet-quick-menu__index {
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.85);
}

.pet-orbit-enter-active,
.pet-orbit-leave-active {
  transition:
    opacity 220ms ease,
    transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
  transition-delay: var(--pet-menu-delay);
}

.pet-orbit-enter-from,
.pet-orbit-leave-to {
  opacity: 0;
  transform: translate3d(
      var(--pet-menu-origin-x),
      var(--pet-menu-origin-y),
      0
    )
    scale(0.62);
}

.pet-orbit-enter-to,
.pet-orbit-leave-from {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .pet-orbit-enter-active,
  .pet-orbit-leave-active {
    transition: opacity 100ms linear;
    transition-delay: 0ms;
  }

  .pet-orbit-enter-from,
  .pet-orbit-leave-to {
    transform: none;
  }
}
</style>

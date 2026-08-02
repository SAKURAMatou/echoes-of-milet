<template>
  <div
    ref="menuWrapperLang"
    class="relative font-['Montserrat','sans-serif']"
    :class="isMenuVariant ? 'w-full' : 'inline-flex md:fixed md:right-4 md:top-4 md:z-50'"
  >
    <button
      :id="buttonId"
      type="button"
      class="group flex items-center justify-between gap-2 rounded-full border border-white/70 bg-white/85 text-slate-700 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.9),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/70"
      :class="isMenuVariant ? 'h-11 w-full px-4' : 'h-11 px-3.5 md:w-[132px]'"
      :title="toggleLabel"
      :aria-label="toggleLabel"
      aria-haspopup="menu"
      :aria-expanded="showLangSelect"
      :aria-controls="menuId"
      @click="toggleMenu"
      @keydown="onButtonKeydown"
    >
      <span class="flex min-w-0 items-center gap-2">
        <span
          class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-50 text-[15px] shadow-[inset_0_0_0_1px_rgba(14,165,233,0.18)]"
          aria-hidden="true"
        >
          {{ currentOption.icon }}
        </span>
        <span class="flex min-w-0 flex-col items-start leading-none">
          <span class="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Language
          </span>
          <span class="mt-1 truncate text-[13px] font-medium text-slate-700">
            {{ currentOption.shortLabel }}
          </span>
        </span>
      </span>

      <svg
        class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:text-sky-500"
        :class="{ 'rotate-180': showLangSelect }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <transition name="lang-slide-fade">
      <div
        v-if="showLangSelect"
        :id="menuId"
        class="absolute z-50 mt-2 rounded-2xl border border-white/75 bg-white/95 p-1.5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.9),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl"
        :class="
          isMenuVariant
            ? 'left-0 top-full w-full'
            : 'right-0 top-full w-44'
        "
        ref="menuRef"
        role="menu"
        aria-label="Language"
        @keydown="onMenuKeydown"
      >
        <button
          v-for="(option, index) in languageOptions"
          :key="option.value"
          type="button"
          class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/70"
          :class="
            $lang.lang === option.value
              ? 'bg-sky-50 text-sky-900 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.16)]'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          "
          role="menuitemradio"
          :aria-checked="$lang.lang === option.value"
          :tabindex="activeIndex === index ? 0 : -1"
          :data-lang-index="index"
          @click="selectLang(option.value)"
          @focus="activeIndex = index"
        >
          <span class="flex items-center gap-2">
            <span
              class="grid h-7 w-7 place-items-center rounded-full border border-sky-100 bg-sky-50 text-[10px] font-bold tracking-wide text-sky-800"
              aria-hidden="true"
            >{{ option.icon }}</span>
            <span class="font-medium">{{ option.label }}</span>
          </span>
          <span
            class="h-2 w-2 rounded-full transition"
            :class="$lang.lang === option.value ? 'bg-sky-400' : 'bg-transparent'"
            aria-hidden="true"
          />
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toUrlLang } from '@/composables/useLangRoute'
import { useSiteInteraction } from '@/composables/site-interaction'

const props = defineProps({
  variant: {
    type: String,
    default: 'floating',
  },
})
const emit = defineEmits<{
  beforeNavigate: []
}>()

const languageOptions: Array<{
  value: SupportedLang
  label: string
  shortLabel: string
  icon: string
}> = [
  {
    value: 'zh',
    label: '中文',
    shortLabel: '中文',
    icon: 'ZH',
  },
  {
    value: 'jp',
    label: '日本語',
    shortLabel: '日本語',
    icon: 'JA',
  },
]

const instance = getCurrentInstance()
if (!instance) throw new Error('LanguageSelect must be used inside a Vue app')
const { appContext } = instance
const global = appContext.config.globalProperties
const showLangSelect = ref(false)
const menuWrapperLang = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const route = useRoute()
const router = useRouter()
const interaction = useSiteInteraction()
const uid = useId()
const buttonId = `lang-toggle-${uid}`
const menuId = `lang-menu-${uid}`

const isMenuVariant = computed(() => props.variant === 'menu')
const currentOption = computed(
  () => languageOptions.find((option) => option.value === global.$lang.lang) || languageOptions[0],
)
const toggleLabel = computed(() =>
  global.$lang.lang === 'jp' ? '表示言語を切り替える' : '切换显示语言',
)

function optionButtons() {
  return Array.from(menuRef.value?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') || [])
}

async function openMenu(index = languageOptions.findIndex((item) => item.value === global.$lang.lang)) {
  activeIndex.value = Math.max(0, index)
  showLangSelect.value = true
  await nextTick()
  optionButtons()[activeIndex.value]?.focus()
}

function closeMenu(restoreFocus = true) {
  showLangSelect.value = false
  if (restoreFocus) {
    document.getElementById(buttonId)?.focus({ preventScroll: true })
  }
}

function toggleMenu() {
  if (showLangSelect.value) closeMenu(false)
  else void openMenu()
}

function moveActive(nextIndex: number) {
  activeIndex.value = (nextIndex + languageOptions.length) % languageOptions.length
  optionButtons()[activeIndex.value]?.focus()
}

function onButtonKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    void openMenu(event.key === 'ArrowDown' ? 0 : languageOptions.length - 1)
  }
}

function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closeMenu()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(activeIndex.value + 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(activeIndex.value - 1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    moveActive(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    moveActive(languageOptions.length - 1)
  } else if (event.key === 'Tab') {
    showLangSelect.value = false
  }
}

const selectLang = async (lang: SupportedLang) => {
  showLangSelect.value = false
  emit('beforeNavigate')
  await nextTick()
  await nextTick()
  global.$toggleLang(lang)

  if (!route.name) {
    await router.replace(`/${toUrlLang(lang)}`)
    return
  }

  await router.replace({
    name: route.name,
    params: {
      ...route.params,
      lang: toUrlLang(lang),
    },
    query: route.query,
    hash: route.hash,
  })
  interaction.announce(lang === 'jp' ? '表示言語を日本語に切り替えました' : '显示语言已切换为中文')
}

const clickOutside = (event: MouseEvent) => {
  if (menuWrapperLang.value && !menuWrapperLang.value.contains(event.target as Node)) {
    showLangSelect.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', clickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', clickOutside)
})
</script>

<style scoped>
.lang-slide-fade-enter-active,
.lang-slide-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.lang-slide-fade-enter-from,
.lang-slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

<template>
  <div
    ref="menuWrapperLang"
    class="relative font-['Montserrat','sans-serif']"
    :class="isMenuVariant ? 'w-full' : 'inline-flex md:fixed md:right-4 md:top-4 md:z-50'"
  >
    <button
      id="lang-toggle"
      type="button"
      class="group flex items-center justify-between gap-2 rounded-full border border-white/70 bg-white/85 text-slate-700 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.9),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/70"
      :class="isMenuVariant ? 'h-11 w-full px-4' : 'h-11 px-3.5 md:w-[132px]'"
      title="切换语言"
      aria-haspopup="listbox"
      :aria-expanded="showLangSelect"
      @click="showLangSelect = !showLangSelect"
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
        id="lang-menu"
        class="absolute z-50 mt-2 rounded-2xl border border-white/75 bg-white/95 p-1.5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.9),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl"
        :class="
          isMenuVariant
            ? 'left-0 top-full w-full'
            : 'right-0 top-full w-44'
        "
        role="listbox"
        aria-label="Language"
      >
        <button
          v-for="option in languageOptions"
          :key="option.value"
          type="button"
          class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/70"
          :class="
            $lang.lang === option.value
              ? 'bg-sky-50 text-sky-900 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.16)]'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          "
          role="option"
          :aria-selected="$lang.lang === option.value"
          @click="selectLang(option.value)"
        >
          <span class="flex items-center gap-2">
            <span aria-hidden="true">{{ option.icon }}</span>
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

<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toUrlLang } from '@/composables/useLangRoute'

const props = defineProps({
  variant: {
    type: String,
    default: 'floating',
  },
})

const languageOptions = [
  {
    value: 'zh',
    label: '中文',
    shortLabel: '中文',
    icon: '🇨🇳',
  },
  {
    value: 'jp',
    label: '日本語',
    shortLabel: '日本語',
    icon: '🇯🇵',
  },
]

const { appContext } = getCurrentInstance()
const global = appContext.config.globalProperties
const showLangSelect = ref(false)
const menuWrapperLang = ref(null)
const route = useRoute()
const router = useRouter()

const isMenuVariant = computed(() => props.variant === 'menu')
const currentOption = computed(
  () => languageOptions.find((option) => option.value === global.$lang.lang) || languageOptions[0],
)

const selectLang = async (lang) => {
  showLangSelect.value = false
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
}

const clickOutside = (event) => {
  if (menuWrapperLang.value && !menuWrapperLang.value.contains(event.target)) {
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

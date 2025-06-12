<template>
  <div ref="menuWrapperLang">
    <button
      id="lang-toggle"
      class="px-3 py-2 bg-white rounded-full flex items-center justify-center md:fixed md:top-4 md:right-4 md:border md:border-blue-200 md:text-blue-800 md:shadow-md z-50 hover:scale-105"
      title="切换语言"
      @click="showLangSelect = !showLangSelect"
    >
      <span class="md:hidden font-semibold"> 🌐Language </span>
      <span class="max-md:hidden"> 🌐 </span>
      <svg
        class="w-4 h-4 ml-2 transition-transform"
        id="arrow-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <transition name="lang-slide-fade">
      <div
        id="lang-menu"
        v-if="showLangSelect"
        class="md:fixed md:top-16 md:right-4 max-md:absolute max-md:top-6 max-md:translate-x-10 bg-white border border-blue-100 mt-2 rounded-xl shadow-lg z-50 p-2 w-[120px] transition-all duration-300 ease-in-out"
      >
        <ul class="text-blue-800 divide-y divide-blue-50 text-sm">
          <button
            class="block w-full text-left px-4 py-2 hover:bg-blue-50 rounded"
            :class="$lang.lang === 'zh' ? 'bg-[#00BFA6]' : ''"
            @click="selectLang('zh')"
          >
            🇨🇳 中文
          </button>
          <button
            class="block w-full text-left px-4 py-2 hover:bg-blue-50 rounded"
            :class="$lang.lang === 'jp' ? 'bg-[#00BFA6]' : ''"
            @click="selectLang('jp')"
          >
            🇯🇵 日本語
          </button>
        </ul>
      </div>
    </transition>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'

const { appContext } = getCurrentInstance()
const global = appContext.config.globalProperties
const showLangSelect = ref(false)
const selectLang = (lang) => {
  showLangSelect.value = false
  //TODO 文字内容切换
  global.$setLang(lang)
}

const menuWrapperLang = ref(null)

const clickOutside = (e) => {
  if (menuWrapperLang.value && !menuWrapperLang.value.contains(e.target)) {
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
  transition: all 0.3s ease;
}
.lang-slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.lang-slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

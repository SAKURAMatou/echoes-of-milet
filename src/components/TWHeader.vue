<template>
  <!-- header -->

  <!--  class="bg-gradient-to-r from-[#2C75D1] to-[#599DFF] text-white py-4 px-6 fixed top-0 left-0 right-0 z-50 shadow-[0_2px_8px_rgba(0,0,0,0.1)] 
    max-md:px-4 before:content-['']" -->
  <header
    class="fixed top-0 left-0 right-0 w-full z-50 py-2 px-[4%] flex justify-between items-center max-md:px-4 bg-gradient-to-r from-[rgba(225,245,254,0.98)] to-[rgba(255,255,255,0.9)] border-b border-[rgba(255,255,255,0.8)] shadow-[0_4px_20px_rgba(137,207,240,0.15)]"
  >
    <div class="w-full flex justify-between items-center mx-auto">
      <div class="max-md:w-full flex items-center justify-center">
        <router-link :to="homeLink" class="flex gap-1 items-center">
          <div class="logo">
            Echoes
            <span class="italic text-[#5dade2] mx-[6px] text-[28px]">of</span>
            milet
          </div>
        </router-link>
      </div>

      <button
        ref="menuButtonRef"
        v-if="showHanbor"
        type="button"
        class="echo-focus md:hidden flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white px-2 py-2 text-[#546e7a] transition-colors hover:border-sky-200 hover:bg-white/80"
        @click="toggleMenu"
        :aria-label="menuOpen ? closeLabel : openLabel"
        :aria-expanded="menuOpen"
        aria-controls="mobile-site-menu"
      >
        <div class="relative w-6 h-6">
          <!-- 汉堡菜单图标 -->
          <svg
            class="absolute w-6 h-6 transition-all duration-300 ease-in-out"
            :class="menuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>

          <!-- 关闭图标 -->
          <svg
            class="absolute w-6 h-6 transition-all duration-300 ease-in-out"
            :class="menuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { withLangParam } from '@/composables/useLangRoute'

const route = useRoute()
const menuButtonRef = ref<HTMLButtonElement | null>(null)

const emit = defineEmits(['openMenu', 'closeMenu'])

const toggleMenu = () => {
  emit(props.menuOpen ? 'closeMenu' : 'openMenu')
}
const closeMenu = () => {
  emit('closeMenu')
}
const focusMenuButton = () => menuButtonRef.value?.focus({ preventScroll: true })

const homeLink = computed(() => withLangParam({ name: 'home' }, String(route.params.lang || 'zh')))
const openLabel = computed(() => (String(route.params.lang) === 'ja' ? 'メニューを開く' : '打开菜单'))
const closeLabel = computed(() => (String(route.params.lang) === 'ja' ? 'メニューを閉じる' : '关闭菜单'))
defineExpose({
  closeMenu,
  focusMenuButton,
})
const props = defineProps({ showHanbor: Boolean, menuOpen: Boolean })
</script>

<style scoped>
.logo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 32px; /* 稍微调大一点 */
  font-weight: 600;
  color: #1a2c50; /* 深海军蓝 */
  letter-spacing: 1px;
  cursor: pointer;
  display: flex;
  align-items: center;
}
</style>

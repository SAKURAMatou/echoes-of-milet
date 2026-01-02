<template>
  <Header
    :showHanbor="true"
    ref="headerRef"
    @openMenu="menuOpen = true"
    @closeMenu="menuOpen = false"
  />
  <!-- 背景图片透明化div -->
  <div
    class="fixed inset-0 min-h-screen bg-[url(/background/bg-milet-2.webp)] bg-cover bg-left opacity-25 pointer-events-none"
  ></div>

  <div class="relative">
    <!-- 整体容器：页面居中布局 -->
    <div class="flex">
      <!-- 左侧菜单栏 -->
      <SideMenuLeft :menuOpen="menuOpen" @closeMenu="menuClick" />

      <!-- 右侧内容区域：70%宽度 -->
      <div class="w-[58%] max-md:w-full pt-20">
        <LanguageSelect class="max-md:hidden" />

        <main
          class="min-h-screen bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)] bg-cover bg-center rounded-xl shadow pt-6 mx-4"
        >
          <router-view />
        </main>

        <!-- <Footer /> -->
        <div class="pt-4"></div>
        <div class="fixed bottom-4 right-4 z-50">
          <TWUpToTop />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/TWHeader.vue'
import TWUpToTop from '@/components//TWUpToTop.vue'
import SideMenuLeft from '@/components/menu/SideMenuLeft.vue'

import LanguageSelect from '@/components/LanguageSelect.vue'

import { ref } from 'vue'
const showLangSelect = ref(false)
const menuOpen = ref(false)
const headerRef = ref(null)

const menuClick = () => {
  menuOpen.value = false
  headerRef.value.closeMenu()
}
const selectLang = (lang) => {
  // console.log(lang)
  showLangSelect.value = !showLangSelect.value
  //TODO 文字内容切换
}
</script>

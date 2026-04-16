<template>
  <div class="min-h-screen md:h-screen md:overflow-hidden">
    <Header
      :showHanbor="true"
      ref="headerRef"
      @openMenu="menuOpen = true"
      @closeMenu="menuOpen = false"
    />
    <!-- 背景图片透明化div -->
    <div
      class="fixed inset-0 min-h-screen bg-[url(/background/bg-milet-home-pre.webp)] bg-cover bg-left opacity-25 pointer-events-none"
    ></div>
    <LanguageSelect class="max-md:hidden" />
    <div class="relative md:h-full">
      <!-- 整体容器：页面居中布局 -->
      <div class="flex w-full pt-18 md:h-full md:box-border md:gap-6 lg:gap-8 xl:gap-10">
        <!-- 左侧菜单栏 -->
        <SideMenuLeft :menuOpen="menuOpen" @closeMenu="menuClick" />

        <!-- 右侧内容区域：占据剩余区域，保证滚动条在页面最右侧 -->
        <div
          data-page-scroll-container
          class="flex-1 min-w-0 md:min-h-0 md:overflow-y-auto md:pr-14 lg:pr-20 xl:pr-28 2xl:pr-36"
        >
          <main
            class="w-full md:max-w-[700px] lg:max-w-[760px] xl:max-w-[820px] 2xl:max-w-[900px] bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)] bg-cover bg-center rounded-xl shadow pt-1"
          >
            <router-view />
          </main>

          <!-- <Footer /> -->
          <!-- <div class="pt-4"></div> -->
        </div>
      </div>
    </div>
    <div class="fixed bottom-4 right-4 z-50">
      <TWUpToTop />
    </div>
  </div>
</template>

<script setup lang="ts">
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

<template>
  <div class="min-h-screen w-full max-w-[100vw] overflow-x-hidden md:h-screen md:overflow-hidden">
    <Header
      :showHanbor="true"
      ref="headerRef"
      @openMenu="menuOpen = true"
      @closeMenu="menuOpen = false"
    />
    <!-- 背景图片透明化div -->
    <div
      class="fixed inset-0 min-h-screen bg-[url(/background/bg-milet-home-pre.webp)] bg-cover pointer-events-none bg-[position:8%_50%] opacity-45"
    ></div>
    <LanguageSelect class="max-md:hidden" />
    <div class="relative w-full max-w-[100vw] overflow-x-hidden md:h-full">
      <!-- 整体容器：页面居中布局 -->
      <div
        class="flex w-full max-w-full overflow-x-hidden pt-18 md:h-full md:box-border md:gap-6 lg:gap-8 xl:gap-10"
      >
        <!-- 左侧菜单栏 -->
        <SideMenuLeft :menuOpen="menuOpen" @closeMenu="menuClick" />

        <!-- 右侧内容区域：占据剩余区域，保证滚动条在页面最右侧 -->
        <div
          data-page-scroll-container
          class="min-w-0 flex-1 overflow-x-hidden md:min-h-0 md:overflow-y-auto"
        >
          <div class="mx-auto w-full max-w-[1500px] overflow-x-hidden md:px-8 lg:px-12 xl:px-16">
            <main
              class="w-full max-w-full overflow-x-hidden rounded-lg border border-white/60 bg-white/60 shadow-[0_24px_90px_-46px_rgba(31,41,55,0.8)] backdrop-blur-xl md:max-w-[700px] lg:max-w-[760px] xl:max-w-[820px] 2xl:max-w-[900px] 3xl:ml-10"
            >
              <router-view />
            </main>
          </div>
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

const menuOpen = ref(false)
const headerRef = ref(null)

const menuClick = () => {
  menuOpen.value = false
  headerRef.value.closeMenu()
}
</script>

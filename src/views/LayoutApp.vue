<template>
  <div
    data-page-layout-root
    class="min-h-screen w-full max-w-[100vw] overflow-x-clip md:h-dvh md:min-h-0 md:overflow-hidden"
  >
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
    <div class="relative w-full max-w-[100vw] overflow-x-clip md:h-full md:overflow-x-hidden">
      <!-- 整体容器：页面居中布局 -->
      <div
        class="flex w-full max-w-full overflow-x-clip pt-16 md:h-full md:box-border md:pt-[4.5rem] md:overflow-x-hidden md:gap-6 lg:gap-8 xl:gap-10"
      >
        <!-- 左侧菜单栏 -->
        <SideMenuLeft :menuOpen="menuOpen" @closeMenu="menuClick" />

        <!-- 右侧内容区域：占据剩余区域，保证滚动条在页面最右侧 -->
        <div
          data-page-scroll-container
          class="min-w-0 flex-1 scroll-pt-6 overflow-x-clip overscroll-y-contain [scrollbar-gutter:stable] md:min-h-0 md:scroll-pt-12 md:overflow-x-hidden md:overflow-y-auto"
        >
          <div
            class="mx-auto flex w-full max-w-[1500px] justify-start"
            :class="
              route.meta.widePage
                ? 'md:pl-4 md:pr-8 lg:pl-6 lg:pr-12 xl:pl-8 xl:pr-16 2xl:pl-10 2xl:pr-24'
                : 'md:pl-6 lg:pl-10 xl:pl-14'
            "
          >
            <main
              class="w-full max-w-full rounded-lg border border-white/70 bg-white/78 shadow-[18px_24px_70px_-52px_rgba(31,41,55,0.55)]"
              :class="
                route.meta.widePage
                  ? 'md:max-w-[calc(100vw-380px)] lg:max-w-[calc(100vw-460px)] xl:max-w-[1120px] 2xl:max-w-[1200px]'
                  : 'md:max-w-[700px] lg:max-w-[760px] xl:max-w-[820px] 2xl:max-w-[900px]'
              "
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
import { useRoute } from 'vue-router'

const menuOpen = ref(false)
const headerRef = ref(null)
const route = useRoute()

const menuClick = () => {
  menuOpen.value = false
  headerRef.value.closeMenu()
}
</script>

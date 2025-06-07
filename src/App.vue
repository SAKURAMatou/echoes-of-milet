<template>
  <div class="relative min-h-screen">
    <!-- 背景图片透明化div -->
    <div
      class="fixed inset-0 min-h-screen bg-[url(/background/bg-milet-2.jpg)] bg-cover bg-left opacity-25"
    ></div>
    <Header />

    <!-- 内容容器 -->
    <div class="absolute top-20 inset-0 t justify-center">
      <!--url('@/assets/clean-gray-paper.png')-->
      <main
        class="min-h-screen md:max-w-[50%] mx-auto bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)] bg-cover bg-center rounded-xl shadow"
      >
        <router-view />
      </main>

      <Footer />
      <div class="fixed bottom-4 right-4 z-50">
        <TWUpToTop />
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/TWHeader.vue'
import Footer from '@/components/TWFooter.vue'
import TWUpToTop from '@/components//TWUpToTop.vue'
</script>

<template>
  <div class="relative min-h-screen">
    <!-- 背景图片透明化div -->
    <div
      class="fixed inset-0 min-h-screen bg-[url(/background/bg-milet-2.jpg)] bg-cover bg-left opacity-25"
    ></div>
    <Header />
    <!-- 语言选择 -->

    <!-- <button
      class="fixed top-4 right-4 bg-gradient-to-r from-pink-100 to-yellow-100 border border-pink-200 text-blue-900 px-4 py-2 rounded-xl shadow hover:scale-105 transition z-50"
    >
      🌐 Language
    </button> -->

    <LanguageSelect />

    <!-- 内容容器 -->
    <div class="absolute top-20 inset-0 justify-center">
      <!--url('@/assets/clean-gray-paper.png')-->
      <main
        class="min-h-screen md:max-w-[50%] mx-auto bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)] bg-cover bg-center rounded-xl shadow pt-6"
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

import LanguageSelect from '@/components/LanguageSelect.vue'

import { ref } from 'vue'
const showLangSelect = ref(false)

const selectLang = (lang) => {
  console.log(lang)
  showLangSelect.value = !showLangSelect.value
  //TODO 文字内容切换
}
</script>

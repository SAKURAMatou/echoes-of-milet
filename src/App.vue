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
    <button
      class="max-md:hidden fixed top-4 right-4 bg-white border border-blue-200 text-blue-800 px-3 py-2 rounded-full shadow-md hover:bg-blue-100 transition z-50"
      title="切换语言"
      @click="showLangSelect = !showLangSelect"
    >
      🌐
    </button>
    <div
      v-if="showLangSelect"
      class="fixed top-16 right-4 bg-white border border-blue-200 rounded-xl shadow-lg z-50 p-2"
    >
      <button
        class="block w-full text-left px-4 py-2 hover:bg-blue-50 rounded"
        @click="selectLang('zh')"
      >
        🇨🇳 中文
      </button>
      <button
        class="block w-full text-left px-4 py-2 hover:bg-blue-50 rounded"
        @click="selectLang('ja')"
      >
        🇯🇵 日本語
      </button>
      <button
        class="block w-full text-left px-4 py-2 hover:bg-blue-50 rounded"
        @click="selectLang('en')"
      >
        🇺🇸 English
      </button>
    </div>

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

import { ref } from 'vue'
const showLangSelect = ref(false)

const selectLang = (lang) => {
  console.log(lang)
  showLangSelect.value = !showLangSelect.value
  //TODO 文字内容切换
}
</script>

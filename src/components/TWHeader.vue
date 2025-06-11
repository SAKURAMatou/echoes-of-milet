<template>
  <!-- header -->

  <header
    class="bg-[#2C75D1] text-white py-4 mx-auto fixed top-0 left-0 right-0 z-50 shadow-[0_2px_8px_rgba(0,0,0,0.1)] max-md:px-4"
  >
    <div class="md:max-w-[50%] w-full flex justify-between items-center mx-auto">
      <div>
        <router-link :to="{ name: 'home' }" class="flex gap-1 items-center">
          <div class="h-6 flex items-center justify-center">
            <img src="@/assets/logo.png" alt="Logo" class="object-cover w-16 h-16" />
          </div>
          <h1 class="text-3xl font-bold">dml's notes</h1>
        </router-link>
      </div>

      <button
        class="md:hidden flex items-center px-3 py-2 border rounded text-white border-white"
        @click="isMenuOpen = !isMenuOpen"
        aria-label="Toggle menu"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <nav class="max-md:hidden">
        <ul class="flex gap-6">
          <li>
            <router-link
              :to="{ name: 'home' }"
              class="h-8 rounded-full px-3 text-current flex items-center justify-center cursor-pointer font-medium hover:bg-[#1C3E60] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              >Home</router-link
            >
          </li>
          <li>
            <router-link
              :to="{ name: 'blog' }"
              class="h-8 rounded-full px-3 text-current flex items-center justify-center cursor-pointer font-medium hover:bg-[#1C3E60] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]'"
              >blog</router-link
            >
          </li>
          <li>
            <router-link
              :to="{ name: 'milet' }"
              class="h-8 rounded-full px-3 text-current flex items-center justify-center cursor-pointer font-medium hover:bg-[#1C3E60] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              >milet</router-link
            >
          </li>
        </ul>
      </nav>
    </div>
  </header>
  <!-- 移动端弹出菜单 -->
  <transition name="slide-down">
    <nav
      v-if="isMenuOpen"
      class="md:hidden fixed bg-[#2C75D1] px-4 pb-4 pt-2 left-0 right-0 z-[999]"
    >
      <div class="relative">
        <div class="absolute top-2 right-2">
          <button @click="isMenuOpen = false" class="text-white">X</button>
        </div>
        <ul class="flex flex-col gap-4 pt-6">
          <li class="flex items-center justify-center">
            <router-link
              :to="{ name: 'home' }"
              class="h-10 rounded-full px-3 text-current font-medium hover:bg-[#1C3E60] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              @click="isMenuOpen = false"
              >Home</router-link
            >
          </li>
          <li class="flex items-center justify-center">
            <router-link
              :to="{ name: 'blog' }"
              class="h-10 rounded-full px-3 text-current font-medium hover:bg-[#1C3E60] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              @click="isMenuOpen = false"
              >blog</router-link
            >
          </li>
          <li class="flex items-center justify-center">
            <router-link
              :to="{ name: 'milet' }"
              class="h-10 rounded-full px-3 text-current font-medium hover:bg-[#1C3E60] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              @click="isMenuOpen = false"
              >milet</router-link
            >
          </li>
          <li class="flex justify-center items-center">
            <button
              class="px-3 py-2 rounded-full"
              title="切换语言"
              @click="showLangSelect = !showLangSelect"
            >
              🌐language
            </button>
          </li>
        </ul>
      </div>
    </nav>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isMenuOpen = ref(false)

function handleResize() {
  if (window.innerWidth >= 768) {
    isMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>

<template>
  <!-- header -->

  <header
    class="bg-gradient-to-r from-[#2C75D1] to-[#599DFF] text-white py-4 px-6 fixed top-0 left-0 right-0 z-50 shadow-[0_2px_8px_rgba(0,0,0,0.1)] max-md:px-4 before:content-['']"
  >
    <div class="md:max-w-[50%] w-full flex justify-between items-center mx-auto">
      <div class="relative">
        <router-link :to="{ name: 'home' }" class="flex gap-1 items-center">
          <div class="h-6 flex items-center justify-center">
            <img src="@/assets/logo.png" alt="Logo" class="object-cover w-16 h-16" />
          </div>
          <h1 class="text-3xl font-bold">dml's notes</h1>
        </router-link>
        <!-- 添加bate提醒 -->
        <span
          class="absolute top-0 right-0 bg-purple-300 text-white text-xs font-bold px-2 py-1 rounded-full -rotate-4"
          style="transform: translate(50%, -50%)"
        >
          BETA
        </span>
      </div>

      <button
        class="md:hidden flex items-center px-3 py-2 border rounded text-white border-white"
        @click="isMenuOpen = !isMenuOpen"
        aria-label="Toggle menu"
      >
        <!-- 汉堡图标 -->
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <!-- pc版菜单 -->
      <nav class="max-md:hidden">
        <ul class="flex gap-6">
          <li>
            <div
              class="menue-other hidden relative rounded-full hover:bg-[#336FCC] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
            >
              <input
                type="text"
                class="rounded-full h-10 px-5 pr-10 text-sm focus:outline-none transition-all duration-300 ease-in-out w-12 focus:w-64 focus:bg-[#336FCC] focus:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
                placeholder="Search..."
                v-model="searchContent"
                onfocus="this.classList.remove('w-12'); this.classList.add('w-64');"
                onblur="if(this.value === '') { this.classList.remove('w-64'); this.classList.add('w-12'); }"
                @keyup.enter="searchEvent"
              />
              <button
                type="submit"
                class="absolute right-0 top-0 mt-3 mr-4"
                @click.prevent="searchEvent"
              >
                <svg
                  class="h-4 w-4 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"
                  ></path>
                </svg>
              </button>
            </div>
          </li>
          <li>
            <router-link
              :to="{ name: 'home' }"
              class="menue-other h-8 rounded-full px-3 text-current flex items-center justify-center cursor-pointer font-medium hover:bg-[#336FCC] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              >Home</router-link
            >
          </li>
          <li>
            <router-link
              :to="{ name: 'blog' }"
              class="menue-other h-8 rounded-full px-3 text-current flex items-center justify-center cursor-pointer font-medium hover:bg-[#336FCC] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]'"
              >blog</router-link
            >
          </li>
          <li>
            <a
              href="https://miles-dml.org"
              target="_blank"
              rel="noopener noreferrer"
              class="h-8 rounded-full px-3 text-current flex items-center justify-center cursor-pointer font-medium hover:bg-[#336FCC] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)] milet-button"
              >milet</a
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
      class="md:hidden fixed w-full top-16 bg-white rounded-xl border border-blue-100 shadow-lg p-6 text-blue-800 z-40 transition-all duration-300"
    >
      <div class="relative">
        <!-- <div class="absolute top-2 right-2">
          <button @click="isMenuOpen = false" class="">X</button>
        </div> -->
        <ul class="flex flex-col gap-4 pt-6">
          <li v-if="check" class="flex items-center justify-center menue-other">
            <router-link
              :to="{ name: 'home' }"
              class="h-10 rounded-full px-3 text-current font-medium hover:bg-[#336FCC] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              @click="isMenuOpen = false"
              >Home</router-link
            >
          </li>
          <li v-if="check" class="flex items-center justify-center menue-other">
            <router-link
              :to="{ name: 'blog' }"
              class="h-10 rounded-full px-3 text-current font-medium hover:bg-[#336FCC] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              @click="isMenuOpen = false"
              >blog</router-link
            >
          </li>
          <li class="flex items-center justify-center">
            <a
              href="https://miles-dml.org"
              target="_blank"
              rel="noopener noreferrer"
              class="h-10 rounded-full px-3 text-current font-medium hover:bg-[#336FCC] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)] milet-button"
              @click="isMenuOpen = false"
              >milet</a
            >
          </li>
          <!-- 语言切换按钮 -->
          <li class="flex justify-center items-center relative">
            <LanguageSelect />
          </li>
        </ul>
      </div>
    </nav>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import LanguageSelect from '@/components/LanguageSelect.vue'
import eventBus from '@/plugins/event-bus'

const isMenuOpen = ref(false)
const searchContent = ref(null)
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

const router = useRouter()
const check = ref(true)
function handleRouteChange(from, to) {
  //进页面时候
  if (to.name.includes('milet')) {
    const elements = document.querySelectorAll('.menue-other')

    elements.forEach((element) => {
      element.style.display = 'none'
      check.value = false
    })
    const elements1 = document.querySelectorAll('.milet-button')
    elements1.forEach((element) => {
      element.setAttribute('disabled', 'true')
      element.style.pointerEvents = 'none'
      element.style.opacity = '0.5'
    })
  }
  //同一个页面不跳转
  if (from.name && to.name && from.name === to.name) {
    return false
  }
  if (from.name && from.name.includes('milet') && to.name.includes('milet')) {
    return false
  }
  if (from.name && from.name.includes('milet') && to.name.includes('home')) {
    return false
  }

  return true
}

// router.beforeEach((to, from, next) => {
//   if (handleRouteChange(from, to)) {
//     next()
//   }
// })

// const emit = defineEmits(['onSearch'])
const searchEvent = () => {
  if (!searchContent.value) {
    return
  }
  console.log(searchContent.value)
  // emit('onSearch', searchContent.value)
  eventBus.emit('search', '关键词abc')
}
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

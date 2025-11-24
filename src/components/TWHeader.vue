<template>
  <!-- header -->

  <!--  class="bg-gradient-to-r from-[#2C75D1] to-[#599DFF] text-white py-4 px-6 fixed top-0 left-0 right-0 z-50 shadow-[0_2px_8px_rgba(0,0,0,0.1)] 
    max-md:px-4 before:content-['']" -->
  <header
    class="fixed top-0 left-0 right-0 w-full z-50 py-2 px-[8%] flex justify-between items-center max-md:px-4 bg-gradient-to-r from-[rgba(225,245,254,0.98)] to-[rgba(255,255,255,0.9)] border-b border-[rgba(255,255,255,0.8)] shadow-[0_4px_20px_rgba(137,207,240,0.15)]"
  >
    <div class="w-full flex justify-between items-center mx-auto">
      <div class="max-md:w-full flex items-center justify-center">
        <router-link :to="{ name: 'home' }" class="flex gap-1 items-center">
          <div class="logo">
            Echoes
            <span class="italic text-[#5dade2] mx-[6px] text-[28px]">of</span>
            milet
          </div>
        </router-link>
      </div>

      <button
        class="md:hidden flex items-center px-3 py-2 border rounded text-[#546e7a] border-white"
        @click="isMenuOpen = !isMenuOpen"
        aria-label="Toggle menu"
      >
        <div class="relative w-6 h-6">
          <!-- 汉堡菜单图标 -->
          <svg
            class="absolute w-6 h-6 transition-all duration-300 ease-in-out"
            :class="isMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'"
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
            :class="isMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
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
              class="menue-other group relative font-['Montserrat','sans-serif'] text-[14px] font-medium text-[#546e7a] uppercase tracking-[1.5px] transition-colors duration-300 hover:text-[#1a2c50]"
              >Home
              <span
                class="absolute left-0 -bottom-[6px] h-[2px] w-0 bg-[#1a2c50] transition-all duration-300 group-hover:w-full"
              ></span
            ></router-link>
          </li>

          <li>
            <!-- 新标签页跳转
            target="_blank"
              rel="noopener noreferrer" -->
            <router-link
              :to="{ name: 'milet' }"
              class="menue-other group relative font-['Montserrat','sans-serif'] text-[14px] font-medium text-[#546e7a] tracking-[1.5px] transition-colors duration-300 hover:text-[#1a2c50]"
              >milet
              <span
                class="absolute left-0 -bottom-[6px] h-[2px] w-0 bg-[#1a2c50] transition-all duration-300 group-hover:w-full"
              ></span>
            </router-link>
          </li>
          <li>
            <router-link
              :to="{ name: 'miletPicAlbum' }"
              class="menue-other group relative font-['Montserrat','sans-serif'] text-[14px] font-medium text-[#546e7a] uppercase tracking-[1.5px] transition-colors duration-300 hover:text-[#1a2c50]"
              >gallery
              <span
                class="absolute left-0 -bottom-[6px] h-[2px] w-0 bg-[#1a2c50] transition-all duration-300 group-hover:w-full"
              ></span>
            </router-link>
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
          <li class="flex items-center justify-center menue-other">
            <router-link
              :to="{ name: 'home' }"
              @click="isMenuOpen = false"
              class="menue-other group relative font-['Montserrat','sans-serif'] text-[14px] font-medium text-[#546e7a] uppercase tracking-[1.5px] transition-colors duration-300 hover:text-[#1a2c50]"
              >Home
              <span
                class="absolute left-0 -bottom-[6px] h-[2px] w-0 bg-[#1a2c50] transition-all duration-300 group-hover:w-full"
              ></span
            ></router-link>
          </li>

          <li class="flex items-center justify-center">
            <router-link
              :to="{ name: 'milet' }"
              @click="isMenuOpen = false"
              class="menue-other group relative font-['Montserrat','sans-serif'] text-[14px] font-medium text-[#546e7a] tracking-[1.5px] transition-colors duration-300 hover:text-[#1a2c50]"
              >milet
              <span
                class="absolute left-0 -bottom-[6px] h-[2px] w-0 bg-[#1a2c50] transition-all duration-300 group-hover:w-full"
              ></span
            ></router-link>
          </li>
          <li class="flex items-center justify-center menue-other">
            <router-link
              :to="{ name: 'miletPicAlbum' }"
              class="menue-other group relative font-['Montserrat','sans-serif'] text-[14px] font-medium text-[#546e7a] uppercase tracking-[1.5px] transition-colors duration-300 hover:text-[#1a2c50]"
              @click="isMenuOpen = false"
              >gallery
              <span
                class="absolute left-0 -bottom-[6px] h-[2px] w-0 bg-[#1a2c50] transition-all duration-300 group-hover:w-full"
              ></span
            ></router-link>
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
//   // if (handleRouteChange(from, to)) {
//   //   next()
//   // }
//   next()
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

.router-link-exact-active span {
  width: 100%;
}
</style>

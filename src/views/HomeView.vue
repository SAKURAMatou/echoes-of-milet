<template>
  <!-- bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow -->
  <div class="min-h-screen p-5">
    <div class="max-w-xl mx-auto pt-16 px-6 space-y-6 text-[#1B1F3B]">
      <div
        class="max-w-3xl mx-auto bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-6 rounded-xl shadow-md relative"
        id="tips"
      >
        <div class="flex items-center mb-3">
          <svg class="w-6 h-6 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12h2V8H9v4zm0 4h2v-2H9v2zm1-14a9 9 0 100 18 9 9 0 000-18z" />
          </svg>
          <h2 class="text-lg font-bold">{{ $getConfigLang('homeview')['announcement'] }}</h2>
        </div>
        <p class="leading-relaxed">
          {{ $getConfigLang('homeview')['announcement1'] }}
          <span class="font-semibold text-yellow-600">
            {{ $getConfigLang('homeview')['announcement2'] }}</span
          >
          {{ $getConfigLang('homeview')['announcement3'] }}
        </p>
      </div>

      <div id="introduce-myself" class="space-y-4 text-base leading-relaxed max-w-3xl p-6">
        <p
          v-for="(txt, index) in contentLanguaged"
          :key="index"
          :class="[
            'my-6',
            currentParagraph > index ? 'no-caret full-width' : '',
            currentParagraph === index ? 'typewriter typing' : '',
            currentParagraph <= index ? 'hidden' : '',
          ]"
          @animationend="handleTypingEnd(index)"
        >
          {{ txt }}
        </p>
      </div>

      <div id="button-container" class="flex justify-center space-x-4 mt-6 hidden">
        <button
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          @click="$router.push({ name: 'blog' })"
        >
          to blog
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance, computed } from 'vue'
const { appContext } = getCurrentInstance()
const global = appContext.config.globalProperties

const contentLanguaged = computed(() => global.$getConfigLang('homeview')['contents'])

const currentParagraph = ref(0)

onMounted(() => {
  currentParagraph.value = 0
})

const handleTypingEnd = (index) => {
  if (index === currentParagraph.value && index < contentLanguaged.value.length) {
    currentParagraph.value++
  }
  if (index === contentLanguaged.value.length - 1) {
    const bt = document.getElementById('button-container')
    if (bt) {
      bt.classList.remove('hidden')
    }
  }
}
</script>
<style scoped>
@keyframes typing {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}
@keyframes blink-caret {
  0%,
  100% {
    border-color: transparent;
  }
  50% {
    border-color: black;
  }
}

.typewriter {
  overflow: hidden;
  white-space: nowrap;
  display: inline-block;
  width: 40ch; /* 固定宽度，防止跳动，可根据内容调整 */
  min-height: 1.5em;
  border-right: 2px solid black;
}

.typing {
  animation:
    typing 2.5s steps(40, end),
    blink-caret 0.75s step-end infinite;
  animation-fill-mode: forwards;
}
.no-caret {
  border-right: none !important;
  animation: none !important;
}
.full-width {
  width: 100% !important;
}
</style>

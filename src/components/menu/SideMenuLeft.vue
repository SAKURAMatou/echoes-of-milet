<template>
  <aside class="max-md:hidden w-[310px] pl-5 lg:pl-6 h-full overflow-hidden">
    <div
      class="scrollbar-none h-full overflow-y-auto rounded-xl border border-white/40 bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)] backdrop-blur-xl"
    >
      <SideMenuItems class="pl-6 pr-6 py-6" />
    </div>
  </aside>

  <teleport v-if="isClient && menuOpen" to="body">
    <div class="fixed inset-0 z-40 md:hidden" @click="emit('closeMenu')">
      <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"></div>
    </div>

    <aside
      class="md:hidden fixed left-0 top-0 z-50 h-dvh w-[310px]"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile menu"
    >
      <div
        class="scrollbar-none h-full overflow-y-auto border-r border-white/30 bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)] backdrop-blur-xl"
      >
        <SideMenuItems class="pl-6 pr-6 py-6" @closeMenuItem="emit('closeMenu')" />
      </div>
    </aside>
  </teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import SideMenuItems from './SideMenuItems.vue'

defineProps({
  menuOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['closeMenu'])
const isClient = ref(false)

onMounted(() => {
  isClient.value = true
})
</script>

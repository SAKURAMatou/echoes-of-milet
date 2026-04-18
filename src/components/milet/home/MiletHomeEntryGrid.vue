<template>
  <section id="entry" class="mt-16 grid gap-3 sm:grid-cols-2 lg:hidden">
    <RouterLink
      v-for="entry in entries"
      :key="entry.id"
      :to="entry.to"
      class="rounded-lg border border-white/70 bg-white/75 p-5"
    >
      <h3 class="font-serif text-2xl text-[#26313a]">{{ entry.title }}</h3>
      <p class="mt-2 text-sm text-[#60707a]">{{ entry.body }}</p>
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { MiletHomeEntryViewItem } from './types'

defineProps<{
  entries: MiletHomeEntryViewItem[]
}>()
</script>

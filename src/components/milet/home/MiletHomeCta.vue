<template>
  <section
    id="cta"
    class="mt-16 scroll-mt-24 rounded-lg border border-[#bddbd5] bg-[#eef8f4]/80 px-6 py-10 text-center"
  >
    <p class="font-serif text-3xl leading-tight text-[#26313a]">{{ title }}</p>
    <RouterLink
      :to="to"
      class="mt-7 inline-flex min-h-12 items-center rounded-lg bg-[#317f8d] px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#23313d]"
    >
      {{ buttonLabel }}
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

defineProps<{
  title: string
  buttonLabel: string
  to: RouteLocationRaw
}>()
</script>

<template>
  <div class="flex flex-wrap items-baseline gap-x-4 gap-y-2">
    <div class="section-kicker">{{ kicker }}</div>
    <h2 class="font-serif text-3xl text-[#26313a]">{{ title }}</h2>
    <p class="text-sm leading-6 text-[#60707a]">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  kicker: string
  title: string
  subtitle: string
}>()
</script>

<style scoped>
.section-kicker {
  color: #317f8d;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}
</style>

<template>
  <img v-lazy="src" :alt="alt" class="preview-image object-contain rounded-lg" />
</template>

<script setup>
defineProps({
  src: String,
  alt: {
    type: String,
    default: '',
  },
})
</script>

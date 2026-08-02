<template>
  <p class="sr-only" aria-live="polite" aria-atomic="true">
    <span :key="interaction.state.announcementId">{{ interaction.state.announcement }}</span>
  </p>
</template>

<script setup lang="ts">
import { useSiteInteraction } from '@/composables/site-interaction'
const interaction = useSiteInteraction()
</script>

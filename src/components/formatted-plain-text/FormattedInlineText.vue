<script setup lang="ts">
import type { FormattedInlineToken } from './parser'

defineProps<{
  tokens: FormattedInlineToken[]
}>()
</script>

<template>
  <template v-for="(token, index) in tokens" :key="index">
    <template v-if="token.type === 'text'">{{ token.content }}</template>
    <strong v-else-if="token.type === 'strong'" class="font-semibold text-inherit">
      {{ token.content }}
    </strong>
    <em v-else-if="token.type === 'emphasis'">{{ token.content }}</em>
    <strong v-else class="font-semibold text-inherit">
      <em>{{ token.content }}</em>
    </strong>
  </template>
</template>

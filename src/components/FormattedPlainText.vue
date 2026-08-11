<template>
  <div class="space-y-3">
    <template v-for="(block, index) in blocks" :key="index">
      <p
        v-if="block.type === 'paragraph'"
        class="whitespace-pre-line break-words"
      >
        <FormattedInlineText :tokens="block.content" />
      </p>
      <FormattedTextList v-else :block="block" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import FormattedInlineText from './formatted-plain-text/FormattedInlineText.vue'
import FormattedTextList from './formatted-plain-text/FormattedTextList.vue'
import { parseFormattedText } from './formatted-plain-text/parser'

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  restrictedMarkdown: {
    type: Boolean,
    default: false,
  },
})

const blocks = computed(() =>
  parseFormattedText(props.text, {
    restrictedMarkdown: props.restrictedMarkdown,
  }),
)
</script>

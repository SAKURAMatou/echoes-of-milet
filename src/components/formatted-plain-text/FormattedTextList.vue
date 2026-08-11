<script setup lang="ts">
import { computed } from 'vue'

import FormattedInlineText from './FormattedInlineText.vue'
import type { FormattedListBlock } from './parser'

defineOptions({
  name: 'FormattedTextList',
})

const props = withDefaults(
  defineProps<{
    block: FormattedListBlock
    depth?: number
  }>(),
  {
    depth: 0,
  },
)

const tag = computed(() => (props.block.type === 'unordered-list' ? 'ul' : 'ol'))
const listClass = computed(() => [
  props.block.type === 'unordered-list' ? 'list-disc' : 'list-decimal',
  props.depth > 0 ? 'mt-1 space-y-1 pl-5' : 'space-y-1 pl-5',
])
</script>

<template>
  <component :is="tag" :class="listClass">
    <li
      v-for="(item, itemIndex) in block.items"
      :key="itemIndex"
      class="whitespace-pre-line break-words"
    >
      <FormattedInlineText :tokens="item.content" />
      <FormattedTextList
        v-for="(childList, childIndex) in item.childLists"
        :key="childIndex"
        :block="childList"
        :depth="depth + 1"
      />
    </li>
  </component>
</template>

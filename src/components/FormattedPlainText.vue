<template>
  <div class="space-y-3">
    <template v-for="(block, index) in blocks" :key="index">
      <p
        v-if="block.type === 'paragraph'"
        class="whitespace-pre-line break-words"
      >
        {{ block.content }}
      </p>
      <ul
        v-else-if="block.type === 'unordered-list'"
        class="list-disc space-y-1 pl-5"
      >
        <li
          v-for="(item, itemIndex) in block.items"
          :key="itemIndex"
          class="whitespace-pre-line break-words"
        >
          {{ item }}
        </li>
      </ul>
      <ol
        v-else
        class="list-decimal space-y-1 pl-5"
      >
        <li
          v-for="(item, itemIndex) in block.items"
          :key="itemIndex"
          class="whitespace-pre-line break-words"
        >
          {{ item }}
        </li>
      </ol>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ParagraphBlock = {
  type: 'paragraph'
  content: string
}

type ListBlock = {
  type: 'unordered-list' | 'ordered-list'
  items: string[]
}

type TextBlock = ParagraphBlock | ListBlock

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
})

const unorderedListPattern = /^[-*•]\s+(.*)$/
const orderedListPattern = /^\d+[.)]\s+(.*)$/

const blocks = computed<TextBlock[]>(() => {
  const normalized = props.text.replace(/\r\n?/g, '\n').trim()
  if (!normalized) return []

  const lines = normalized.split('\n')
  const result: TextBlock[] = []
  let paragraphLines: string[] = []
  let listType: ListBlock['type'] | null = null
  let listItems: string[] = []

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    result.push({
      type: 'paragraph',
      content: paragraphLines.join('\n').trim(),
    })
    paragraphLines = []
  }

  const flushList = () => {
    if (!listType || listItems.length === 0) return
    result.push({
      type: listType,
      items: [...listItems],
    })
    listType = null
    listItems = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      continue
    }

    const unorderedMatch = trimmed.match(unorderedListPattern)
    const orderedMatch = trimmed.match(orderedListPattern)

    if (unorderedMatch) {
      flushParagraph()
      if (listType !== 'unordered-list') {
        flushList()
        listType = 'unordered-list'
      }
      listItems.push(unorderedMatch[1].trim())
      continue
    }

    if (orderedMatch) {
      flushParagraph()
      if (listType !== 'ordered-list') {
        flushList()
        listType = 'ordered-list'
      }
      listItems.push(orderedMatch[1].trim())
      continue
    }

    if (listType && /^[ \t]+/.test(rawLine) && listItems.length > 0) {
      listItems[listItems.length - 1] += `\n${trimmed}`
      continue
    }

    flushList()
    paragraphLines.push(trimmed)
  }

  flushParagraph()
  flushList()

  return result
})
</script>

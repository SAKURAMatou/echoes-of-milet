<template>
  <nav v-if="items.length" class="article-toc" aria-label="Article contents">
    <div class="article-toc__title">{{ title }}</div>
    <a
      v-for="item in items"
      :key="`${item.id}-${item.order}`"
      class="article-toc__link"
      :class="`article-toc__link--h${item.level}`"
      :href="`#${item.id}`"
    >
      {{ item.text }}
    </a>
  </nav>
</template>

<script setup lang="ts">
import type { ArticleTocItem } from '@/composables/articleType'

withDefaults(
  defineProps<{
    items: ArticleTocItem[]
    title?: string
  }>(),
  {
    title: 'Contents',
  },
)
</script>

<style scoped>
.article-toc {
  position: sticky;
  top: 5.5rem;
  max-height: calc(100vh - 7rem);
  overflow: auto;
  border-left: 1px solid rgba(125, 160, 176, 0.26);
  padding-left: 1rem;
}

.article-toc__title {
  margin-bottom: 0.75rem;
  color: #317f8d;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.article-toc__link {
  display: block;
  border-left: 2px solid transparent;
  padding: 0.32rem 0.4rem;
  color: #5b6c78;
  font-size: 0.82rem;
  line-height: 1.45;
  text-decoration: none;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background-color 0.15s ease;
}

.article-toc__link:hover {
  border-left-color: #317f8d;
  background: rgba(236, 248, 251, 0.78);
  color: #143d63;
}

.article-toc__link--h2 {
  padding-left: 0.9rem;
}

.article-toc__link--h3 {
  padding-left: 1.35rem;
}

.article-toc__link--h4 {
  padding-left: 1.8rem;
  font-size: 0.78rem;
}
</style>

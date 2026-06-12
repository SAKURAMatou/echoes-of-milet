<template>
  <nav
    v-if="items.length"
    class="article-toc"
    :class="`article-toc--${variant}`"
    aria-label="Article contents"
  >
    <div class="article-toc__title">{{ title }}</div>
    <a
      v-for="item in items"
      :key="`${item.id}-${item.order}`"
      class="article-toc__link"
      :class="`article-toc__link--h${item.level}`"
      :href="`#${item.id}`"
      @click="handleClick($event, item)"
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
    variant?: 'side' | 'mobile'
  }>(),
  {
    title: 'Contents',
    variant: 'side',
  },
)

function handleClick(event: MouseEvent, item: ArticleTocItem) {
  event.preventDefault()

  if (import.meta.env.SSR) return

  const target = document.getElementById(item.id)

  if (!target) return

  target.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${item.id}`)
}
</script>

<style scoped>
nav.article-toc {
  overflow: auto;
  border: 1px solid rgba(171, 209, 223, 0.72);
  border-radius: 8px;
  padding: 1rem 0.75rem 1rem 1rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(240, 249, 255, 0.72)),
    radial-gradient(circle at 100% 0, rgba(186, 230, 253, 0.35), transparent 8rem);
  box-shadow: 0 18px 44px -36px rgba(20, 61, 99, 0.55);
  backdrop-filter: blur(16px);
  scrollbar-width: thin;
  scrollbar-color: rgba(49, 127, 141, 0.36) transparent;
}

nav.article-toc--side {
  position: sticky;
  top: 5rem;
  max-height: calc(100svh - 6.25rem);
}

nav.article-toc--mobile {
  max-height: min(56svh, 25rem);
  border: 0;
  padding: 0.75rem;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

nav.article-toc::before {
  display: block;
  width: 2.75rem;
  height: 2px;
  margin-bottom: 0.85rem;
  border-radius: 999px;
  background: linear-gradient(90deg, #317f8d, rgba(186, 230, 253, 0.2));
  content: "";
}

.article-toc .article-toc__title {
  margin-bottom: 0.75rem;
  color: #143d63;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.article-toc .article-toc__link {
  display: block;
  border-left: 2px solid rgba(49, 127, 141, 0.18);
  border-radius: 0 6px 6px 0;
  padding: 0.38rem 0.55rem;
  color: #5b6c78;
  font-size: 0.82rem;
  line-height: 1.45;
  text-decoration: none;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background-color 0.15s ease;
}

.article-toc .article-toc__link:hover {
  border-left-color: #317f8d;
  background: rgba(236, 248, 251, 0.9);
  color: #143d63;
}

.article-toc .article-toc__link--h1 {
  font-weight: 650;
}

.article-toc .article-toc__link--h2 {
  padding-left: 0.9rem;
}

.article-toc .article-toc__link--h3 {
  padding-left: 1.35rem;
}

.article-toc .article-toc__link--h4 {
  padding-left: 1.8rem;
  font-size: 0.78rem;
}
</style>

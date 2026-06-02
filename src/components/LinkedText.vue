<template>
  <component :is="tag">
    <template
      v-for="(segment, index) in segments"
      :key="`${segment.type}-${index}-${segment.text}`"
    >
      <template v-if="segment.type === 'text'">{{ segment.text }}</template>
      <RouterLink
        v-else-if="isRouteLink(segment.link)"
        :to="segment.link.to"
        :class="[linkClass, segment.link.class]"
        :aria-label="segment.link.ariaLabel"
      >
        {{ segment.text }}
      </RouterLink>
      <a
        v-else
        :href="segment.link.href"
        :target="getLinkTarget(segment.link)"
        :rel="getLinkRel(segment.link)"
        :class="[linkClass, segment.link.class]"
        :aria-label="segment.link.ariaLabel"
      >
        {{ segment.text }}
      </a>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

type TextLinkBase = {
  text: string
  target?: string
  rel?: string
  ariaLabel?: string
  class?: HTMLAttributes['class']
  match?: 'all' | 'first'
  caseSensitive?: boolean
}

export type LinkedTextLink =
  | (TextLinkBase & {
      href: string
      to?: never
    })
  | (TextLinkBase & {
      to: RouteLocationRaw
      href?: never
    })

type TextSegment =
  | {
      type: 'text'
      text: string
    }
  | {
      type: 'link'
      text: string
      link: LinkedTextLink
    }

const props = withDefaults(
  defineProps<{
    text?: string
    links?: LinkedTextLink[]
    tag?: string
    linkClass?: HTMLAttributes['class']
    openExternalInNewTab?: boolean
    externalTarget?: string
    externalRel?: string
  }>(),
  {
    text: '',
    links: () => [],
    tag: 'span',
    linkClass:
      'font-medium text-sky-700 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-900',
    openExternalInNewTab: true,
    externalTarget: '_blank',
    externalRel: 'noreferrer',
  },
)

const segments = computed<TextSegment[]>(() => {
  const text = props.text || ''
  const links = props.links.filter((link) => link.text && (link.href || link.to))
  if (!text || links.length === 0) {
    return text ? [{ type: 'text', text }] : []
  }

  const matchedCount = new Map<LinkedTextLink, number>()
  const result: TextSegment[] = []
  let buffer = ''
  let cursor = 0

  const flushText = () => {
    if (!buffer) return
    result.push({ type: 'text', text: buffer })
    buffer = ''
  }

  while (cursor < text.length) {
    const link = findLinkAt(text, cursor, links, matchedCount)

    if (link) {
      flushText()
      result.push({
        type: 'link',
        text: text.slice(cursor, cursor + link.text.length),
        link,
      })
      matchedCount.set(link, (matchedCount.get(link) || 0) + 1)
      cursor += link.text.length
      continue
    }

    buffer += text[cursor]
    cursor += 1
  }

  flushText()
  return result
})

function findLinkAt(
  text: string,
  cursor: number,
  links: LinkedTextLink[],
  matchedCount: Map<LinkedTextLink, number>,
) {
  let matchedLink: LinkedTextLink | null = null

  for (const link of links) {
    if (link.match === 'first' && matchedCount.has(link)) {
      continue
    }

    if (!isMatchAt(text, cursor, link)) {
      continue
    }

    if (!matchedLink || link.text.length > matchedLink.text.length) {
      matchedLink = link
    }
  }

  return matchedLink
}

function isMatchAt(text: string, cursor: number, link: LinkedTextLink) {
  const source = text.slice(cursor, cursor + link.text.length)
  if (source.length !== link.text.length) return false

  if (link.caseSensitive) {
    return source === link.text
  }

  return source.toLocaleLowerCase() === link.text.toLocaleLowerCase()
}

function isRouteLink(
  link: LinkedTextLink,
): link is Extract<LinkedTextLink, { to: RouteLocationRaw }> {
  return Boolean(link.to)
}

function getLinkTarget(link: LinkedTextLink) {
  if ('to' in link) return undefined
  if (link.target) return link.target
  return props.openExternalInNewTab && isExternalHref(link.href) ? props.externalTarget : undefined
}

function getLinkRel(link: LinkedTextLink) {
  if ('to' in link) return undefined
  const target = getLinkTarget(link)
  return link.rel || (target === '_blank' ? props.externalRel : undefined)
}

function isExternalHref(href: string) {
  return /^(https?:)?\/\//i.test(href)
}
</script>

# LinkedText 文本链接渲染组件

`LinkedText` 用于在一段普通文本中，把指定文字渲染成可点击链接。组件不会使用 `v-html`，而是把文本切成普通文本片段、`<a>` 和 `RouterLink` 片段，适合渲染来自文案配置的数据。

组件位置：

```txt
src/components/LinkedText.vue
```

## 基础用法

```vue
<template>
  <LinkedText
    text="官方网站请参考：milet.jp"
    :links="[
      {
        text: 'milet.jp',
        href: 'https://milet.jp/',
      },
    ]"
  />
</template>

<script setup lang="ts">
import LinkedText from '@/components/LinkedText.vue'
</script>
```

渲染结果中，`milet.jp` 会变成链接，其余文字保持普通文本。

## 一段文字内多个链接

`links` 可以传多个配置，组件会从左到右扫描文本，并把所有匹配到的文字渲染为链接。

```vue
<LinkedText
  text="可以查看 milet.jp，也可以访问 miles DML。"
  :links="[
    {
      text: 'milet.jp',
      href: 'https://milet.jp/',
    },
    {
      text: 'miles DML',
      href: 'https://www.instagram.com/dml_4016/',
    },
  ]"
/>
```

默认同一个 `text` 在段落里出现多次时，每一次都会变成链接。

## 外链

使用 `href` 配置普通链接。

```vue
<LinkedText
  text="官方站点：milet.jp"
  :links="[
    {
      text: 'milet.jp',
      href: 'https://milet.jp/',
    },
  ]"
/>
```

当 `href` 是 `http://`、`https://` 或 `//` 开头时，组件默认会把它当作站外链接处理：

- 自动加 `target="_blank"`
- 自动加 `rel="noreferrer"`

如果需要覆盖默认行为，可以在链接项里显式传入：

```vue
<LinkedText
  text="官方站点：milet.jp"
  :links="[
    {
      text: 'milet.jp',
      href: 'https://milet.jp/',
      target: '_self',
      rel: 'noopener',
    },
  ]"
/>
```

也可以在组件层关闭外链默认新标签：

```vue
<LinkedText
  text="官方站点：milet.jp"
  :links="[{ text: 'milet.jp', href: 'https://milet.jp/' }]"
  :open-external-in-new-tab="false"
/>
```

## 站内路由

使用 `to` 配置 Vue Router 跳转。`to` 的写法与 `RouterLink` 一致。

```vue
<LinkedText
  text="继续查看时间线页面。"
  :links="[
    {
      text: '时间线页面',
      to: { name: 'miletTimeLine' },
    },
  ]"
/>
```

带语言参数的路由可以配合项目里的 `withLangParam` 使用：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import LinkedText from '@/components/LinkedText.vue'
import { withLangParam } from '@/composables/useLangRoute'

const route = useRoute()
const currentLang = computed(() => String(route.params.lang || 'zh'))

const links = computed(() => [
  {
    text: '时间线',
    to: withLangParam({ name: 'miletTimeLine' }, currentLang.value),
  },
])
</script>

<template>
  <LinkedText text="可以继续查看时间线。" :links="links" />
</template>
```

## 锚点和站内相对链接

站内相对路径、锚点也可以用 `href`：

```vue
<LinkedText
  text="跳到反馈表单。"
  :links="[
    {
      text: '反馈表单',
      href: '#about-feedback',
    },
  ]"
/>
```

这类链接不会被自动加 `target="_blank"`。

## 匹配规则

默认规则：

- 不区分大小写。
- 同一链接文字出现多次时全部匹配。
- 多个链接从左到右匹配。
- 如果多个链接在同一位置都能匹配，优先使用文字更长的配置，避免短词抢占长词。

只匹配第一次：

```vue
<LinkedText
  text="milet 的音乐，以及 milet 的现场。"
  :links="[
    {
      text: 'milet',
      href: 'https://milet.jp/',
      match: 'first',
    },
  ]"
/>
```

区分大小写：

```vue
<LinkedText
  text="Echoes 和 echoes 是不同写法。"
  :links="[
    {
      text: 'Echoes',
      href: '/zh/milet/about',
      caseSensitive: true,
    },
  ]"
/>
```

## 自定义样式

默认链接样式为：

```txt
font-medium text-sky-700 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-900
```

可以通过 `link-class` 覆盖全部链接的基础样式：

```vue
<LinkedText
  text="查看 milet.jp。"
  :links="[{ text: 'milet.jp', href: 'https://milet.jp/' }]"
  link-class="font-semibold text-teal-700 underline underline-offset-4"
/>
```

也可以给单个链接追加样式：

```vue
<LinkedText
  text="查看 milet.jp 和 miles DML。"
  :links="[
    {
      text: 'milet.jp',
      href: 'https://milet.jp/',
    },
    {
      text: 'miles DML',
      href: 'https://www.instagram.com/dml_4016/',
      class: 'text-pink-700 decoration-pink-300',
    },
  ]"
/>
```

最终 class 会由 `linkClass` 和单条链接的 `class` 合并。

## 修改外层标签

默认外层标签是 `span`。如果需要直接渲染成段落，可以使用 `tag`：

```vue
<LinkedText
  tag="p"
  text="官方网站请参考：milet.jp"
  :links="[{ text: 'milet.jp', href: 'https://milet.jp/' }]"
/>
```

如果父级已经是 `<p>` 或其他行内语境，保持默认 `span` 更稳妥。

## Props

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | `''` | 要渲染的完整文本 |
| `links` | `LinkedTextLink[]` | `[]` | 链接配置数组 |
| `tag` | `string` | `'span'` | 外层标签 |
| `linkClass` | `HTMLAttributes['class']` | 默认 sky underline 样式 | 所有链接的基础样式 |
| `openExternalInNewTab` | `boolean` | `true` | 外链是否默认新标签打开 |
| `externalTarget` | `string` | `'_blank'` | 外链默认 target |
| `externalRel` | `string` | `'noreferrer'` | 外链默认 rel |

## Link 配置

外链或普通 `href`：

```ts
{
  text: string
  href: string
  target?: string
  rel?: string
  ariaLabel?: string
  class?: HTMLAttributes['class']
  match?: 'all' | 'first'
  caseSensitive?: boolean
}
```

站内 RouterLink：

```ts
{
  text: string
  to: RouteLocationRaw
  ariaLabel?: string
  class?: HTMLAttributes['class']
  match?: 'all' | 'first'
  caseSensitive?: boolean
}
```

`href` 和 `to` 二选一。站内路由优先使用 `to`，普通 URL、锚点和相对路径使用 `href`。

## About 页面中的数据写法

`AboutMeView` 目前兼容旧写法：

```ts
{
  text: '官方网站请参考：',
  linkLabel: 'milet.jp',
  linkUrl: 'https://milet.jp/',
}
```

如果以后同一段需要多个链接，推荐改成新写法：

```ts
{
  text: '官方网站请参考 milet.jp，也可以查看 miles DML。2026 年 5 月开始有更多伙伴加入维护。',
  links: [
    {
      text: 'milet.jp',
      href: 'https://milet.jp/',
    },
    {
      text: 'miles DML',
      href: 'https://www.instagram.com/dml_4016/',
    },
  ],
}
```

这样不用把一段文字拆成 `text + linkLabel + linkSuffix`，后续维护多链接会更清楚。

## 注意事项

- `text` 必须是段落里真实存在的文字，否则不会生成链接。
- 避免配置互相重叠的链接文字；如果必须重叠，把更长、更具体的文字也配置进去，组件会优先匹配更长的项。
- 组件负责文本片段和链接渲染，不负责 Markdown、HTML 或富文本解析。
- 不要把未信任的 HTML 当作 `text` 传入并期待它被解析；组件会按普通文本输出。

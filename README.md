# my-blog

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

https://www.transparenttextures.com/

纹理背景图片网站

# 项目内容

主页-home

博客-blog

milet

|——图片分享



# 配色

| 用途           | 颜色值                 | 说明                        |
| -------------- | ---------------------- | --------------------------- |
| 主色           | `#2C75D1`              | 活力蓝，醒目不刺眼          |
| 主色 hover     | `#187bcd`<br />#1C3E60 | 深蓝一点，按钮/链接悬浮状态 |
| 强调色（次主） | `#00BFA6`              | 青绿色，有自然清新感        |
| 背景主色       | `#F5F9FF`              | 柔和灰白，干净，不压主图    |
| 顶部文字色     | `#ffffff`              | header 中的文字配白色最佳   |
| 正文文字色     | `#1f3a5f`              | 深蓝灰，柔和不刺眼          |
| 标题强调色     | `#FF9F45`              | 柑橘橙色，用于强调/按钮跳色 |



# 主页-home

1，简介，页面加载结束添加了打字机效果展示文字

2，blog跳转按钮

3，语言切换（后续添加）

# 博客列表

标签列表，pc竖向在数据列表左侧，手机横向在数据列表上边

数据列表，每条记录，pc时左侧图片右侧概要，手机时上边图片，下边概要

分页控件，数据列表下方底部固定，pc时暂时多个分页icon，手机时只展示当前页/总页数



# milethome

不定数card展示内容

timeline展示milet，活动时间线

milet图集跳转按钮

官方网站连接

## 图片列表

图片懒加载：vue3-lazyload

图排的lightbox查看大图photoswipe



# 配色选择

| 背景色类名      | 字体色类名        | 推荐场景             |
| --------------- | ----------------- | -------------------- |
| `bg-pink-200`   | `text-pink-900`   | 甜美回忆、温馨记录   |
| `bg-blue-200`   | `text-blue-900`   | 清新记录、学业进展   |
| `bg-green-200`  | `text-green-900`  | 日常生活、成长轨迹   |
| `bg-purple-200` | `text-purple-900` | 梦幻、感性类故事     |
| `bg-orange-200` | `text-orange-900` | 搞笑、热血、冲动行为 |
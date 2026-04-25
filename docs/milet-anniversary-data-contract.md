# milet Anniversary Data Contract

This document defines the anniversary module data shape for the frontend and backend.

## Rendering Choice

Use `SSR` for `/:lang/milet/anniversary`.

Reasons:

1. The menu target depends on the current month.
2. Anniversary month should open the current anniversary record directly.
3. Other months should open `Anniversary Archive` first, then let the user choose a year.
4. The page should have complete first-paint content for sharing and crawling.

`SSG` is still suitable for frozen explicit archives such as `/zh/milet/anniversary/2026`, but the entry route has time-based behavior, so SSR is the safer default.

## Route Model

- archive entry: `/:lang/milet/anniversary`
- explicit anniversary year: `/:lang/milet/anniversary/:year`

Menu label is always `ANNIVERSARY`.

Menu behavior:

- anniversary month: link to `/:lang/milet/anniversary/:latestYear`
- other months: link to `/:lang/milet/anniversary`

## Suggested API

### Latest/archive payload

`GET /api/milet/anniversary`

Returns current menu/archive state, available years, and the latest record used by the archive entry.

### Specific year payload

`GET /api/milet/anniversary/:year`

Returns one anniversary record.

## Response Shape

Language blocks live at the record content boundary. Avoid putting `{ zh, ja }` inside every text field.

```json
{
  "debutDate": "2019-03-06",
  "debutMonth": 3,
  "latestYear": 2026,
  "isAnniversaryMonth": false,
  "menu": {
    "label": "ANNIVERSARY",
    "sub": "- Open anniversary archive",
    "targetYear": null
  },
  "recordYears": [2026, 2025, 2024],
  "record": {
    "year": 2026,
    "anniversaryNo": 7,
    "zh": {
      "title": "Happy Anniversary, milet",
      "lead": "今年也有很多新的回声抵达。新的歌，舞台上的光，还有每个月等来的 milet の日。",
      "giftNote": "这一页，是一个 miles 小小的祝福。",
      "archiveTitle": "Anniversary Archive",
      "archiveLead": "按年份回看每一次周年记录，把祝福、活动、发布物和 milet の日 的照片慢慢存下来。",
      "chapters": [
        { "id": "greeting", "eyebrow": "greeting", "title": "先把祝福放在最前面" },
        { "id": "year", "eyebrow": "year notes", "title": "这一年也很热闹" },
        { "id": "songs", "eyebrow": "songs", "title": "抵达的作品" },
        { "id": "photos", "eyebrow": "milet day", "title": "十二次 milet の日" }
      ],
      "timeline": [
        {
          "id": "live",
          "date": "2025 spring",
          "label": "stage light",
          "title": "舞台上的光又被记住了一次",
          "body": "不是为了数清发生了多少事，只是想再看一遍那些让人心动的瞬间。"
        }
      ],
      "releases": [
        {
          "id": "hanataba",
          "date": "2025.04",
          "type": "single",
          "title": "hanataba",
          "cover": "/static/milet/img/hanataba.webp",
          "note": "像把某个明亮的季节轻轻留了下来。"
        }
      ],
      "photos": [
        {
          "id": "jan",
          "month": "JAN",
          "image": "/static/milet/img/milet-day-jan.webp",
          "alt": "一月 milet の日 精选照片",
          "caption": "新一年开始的第一封信。",
          "final": {
            "x": "9%",
            "y": "29%",
            "w": "15%",
            "r": "-7deg",
            "mx": "7%",
            "my": "23%",
            "mw": "26%",
            "mr": "-7deg"
          }
        }
      ]
    },
    "ja": {
      "title": "Happy Anniversary, milet",
      "lead": "今年もたくさんの新しい響きが届きました。",
      "giftNote": "このページは、ひとりの miles からの小さなお祝いです。",
      "archiveTitle": "Anniversary Archive",
      "archiveLead": "年ごとに記念ページを振り返る archive です。",
      "chapters": [
        { "id": "greeting", "eyebrow": "greeting", "title": "まずは、お祝いの言葉から" }
      ],
      "timeline": [
        {
          "id": "live",
          "date": "2025 spring",
          "label": "stage light",
          "title": "ステージの光が、またひとつ記憶になった",
          "body": "心が動いた瞬間をもう一度見つめるために。"
        }
      ],
      "releases": [
        {
          "id": "hanataba",
          "date": "2025.04",
          "type": "single",
          "title": "hanataba",
          "cover": "/static/milet/img/hanataba.webp",
          "note": "明るい季節をそっと残してくれたような一曲。"
        }
      ],
      "photos": [
        {
          "id": "jan",
          "month": "JAN",
          "image": "/static/milet/img/milet-day-jan.webp",
          "alt": "1月 milet の日 selected photo",
          "caption": "新しい一年の最初の手紙。",
          "final": {
            "x": "9%",
            "y": "29%",
            "w": "15%",
            "r": "-7deg",
            "mx": "7%",
            "my": "23%",
            "mw": "26%",
            "mr": "-7deg"
          }
        }
      ]
    }
  }
}
```

## Field Notes

- `debutDate`: canonical debut date.
- `debutMonth`: month used for menu switching.
- `latestYear`: latest available anniversary record.
- `isAnniversaryMonth`: backend-derived flag for the current request.
- `menu.label`: always `ANNIVERSARY`.
- `menu.targetYear`: latest year during anniversary month, otherwise `null`.
- `recordYears`: descending archive years.
- `record.zh` / `record.ja`: complete localized content blocks.

The frontend currently expects 4 chapters in this order: `greeting`, `year`, `songs`, `photos`.

Recommended item counts:

- `timeline`: 3-6 items.
- `releases`: 3-5 items.
- `photos`: 12 items for the current milet-day film animation.

## Photo Final Position Ranges

`final` controls the assembled photo layout. Values are CSS strings.

Desktop fields:

- `x`: `6%` to `78%`
- `y`: `8%` to `78%`
- `w`: `12%` to `18%`
- `r`: `-10deg` to `10deg`

Mobile fields:

- `mx`: `5%` to `72%`
- `my`: `12%` to `84%`
- `mw`: `22%` to `28%`
- `mr`: `-10deg` to `10deg`

Placement rules:

- Keep `x + w <= 96` on desktop.
- Keep `mx + mw <= 96` on mobile.
- Avoid placing all photos on a strict grid. Use staggered `x/y` and rotation to keep the final constellation distinct.
- For important faces, avoid the center copy area: desktop roughly `38%-62%` x `34%-62%`; mobile roughly `32%-68%` x `34%-70%`.
- If a photo is visually busy, use a smaller width and a lighter rotation.

## Current Frontend Mapping

The bundled config implementation lives in:

- [src/composables/miletAnniversary.ts](/D:/CODE/front/tailwindCSS/echoes%20of%20milet/src/composables/miletAnniversary.ts)

When the backend is ready, replace the bundled `records` map with API data using this shape.

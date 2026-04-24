# milet Anniversary Data Contract

This document defines the data shape for the anniversary module so the frontend and backend can converge on one structure.

## Why SSR

The anniversary route should use `SSR`.

Reasons:

1. The menu entry changes by month:
   - anniversary month: `ANNIVERSARY`
   - other months: `ANNIVERSARY ARCHIVE`
2. The default record year depends on the current date.
3. The page should be crawlable and shareable with complete first paint content.
4. Future anniversary records will likely come from backend data rather than bundled frontend config.

`SSG` would work only for frozen archive pages, but the current route behavior depends on time and latest available record selection. `SSR` is the better default.

## Route Model

- latest route: `/:lang/milet/anniversary`
- explicit archive year: `/:lang/milet/anniversary/:year`

Examples:

- `/zh/milet/anniversary`
- `/zh/milet/anniversary/2026`
- `/ja/milet/anniversary/2025`

## Suggested API

### 1. Latest anniversary payload

`GET /api/milet/anniversary`

Purpose:

- return the latest available anniversary record
- return menu/archive state derived by the backend clock if needed

### 2. Specific anniversary year payload

`GET /api/milet/anniversary/:year`

Purpose:

- return a specific anniversary archive record

## Response Shape

```json
{
  "debutDate": "2019-03-06",
  "debutMonth": 3,
  "latestYear": 2026,
  "isAnniversaryMonth": false,
  "menu": {
    "label": "ANNIVERSARY ARCHIVE",
    "sub": "- Archive 2026 and previous years",
    "targetYear": 2026
  },
  "recordYears": [2026, 2025, 2024],
  "record": {
    "year": 2026,
    "anniversaryNo": 7,
    "mode": "archive",
    "title": {
      "zh": "Happy Anniversary, milet",
      "ja": "Happy Anniversary, milet"
    },
    "lead": {
      "zh": "今年也有很多新的回声抵达。新的歌，舞台上的光，还有每个月等来的 milet の日。",
      "ja": "今年もたくさんの新しい響きが届きました。新しい歌、ステージの光、そして毎月待っていた milet の日。"
    },
    "giftNote": {
      "zh": "这一页，是一个 miles 小小的祝福。",
      "ja": "このページは、ひとりの miles からの小さなお祝いです。"
    },
    "archiveTitle": {
      "zh": "Anniversary Archive",
      "ja": "Anniversary Archive"
    },
    "archiveLead": {
      "zh": "按年份回看每一次周年记录，把祝福、活动、发布物和 milet の日 的照片慢慢存下来。",
      "ja": "年ごとに記念ページを振り返りながら、お祝い、活動、作品、milet の日の写真を少しずつ残していく archive です。"
    },
    "chapters": [
      {
        "id": "greeting",
        "eyebrow": "greeting",
        "title": { "zh": "先把祝福放在最前面", "ja": "まずは、お祝いの言葉から" }
      },
      {
        "id": "year",
        "eyebrow": "year notes",
        "title": { "zh": "这一年也很热闹", "ja": "この一年もにぎやかでした" }
      },
      {
        "id": "songs",
        "eyebrow": "songs",
        "title": { "zh": "抵达的作品", "ja": "届いた作品たち" }
      },
      {
        "id": "photos",
        "eyebrow": "milet day",
        "title": { "zh": "十二次 milet の日", "ja": "12回の milet の日" }
      }
    ],
    "timeline": [
      {
        "id": "live",
        "date": "2025 spring",
        "label": { "zh": "stage light", "ja": "stage light" },
        "title": { "zh": "舞台上的光又被记住了一次", "ja": "ステージの光が、またひとつ記憶になった" },
        "body": { "zh": "不是为了数清发生了多少事，只是想再看一遍那些让人心动的瞬间。", "ja": "出来事を数えるためではなく、心が動いた瞬間をもう一度見つめるために。" }
      }
    ],
    "releases": [
      {
        "id": "hanataba",
        "date": "2025.04",
        "type": "single",
        "title": "hanataba",
        "cover": "/static/milet/img/...",
        "note": {
          "zh": "像把某个明亮的季节轻轻留了下来。",
          "ja": "明るい季節をそっと残してくれたような一曲。"
        }
      }
    ],
    "photos": [
      {
        "id": "jan",
        "month": "JAN",
        "image": "/static/milet/img/...",
        "alt": {
          "zh": "一月 milet の日 精选照片",
          "ja": "1月 milet の日 selected photo"
        },
        "caption": {
          "zh": "新一年开始的第一封信。",
          "ja": "新しい一年の最初の手紙。"
        },
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
```

## Field Notes

### top-level

- `debutDate`: canonical debut date
- `debutMonth`: used for anniversary-month switching logic
- `latestYear`: latest available record year
- `isAnniversaryMonth`: whether the current month is the celebration month
- `menu`: menu presentation for the current request context
- `recordYears`: available archive years for future archive navigation
- `record`: current record payload

### record

- `year`: archive year, used in route `/milet/anniversary/:year`
- `anniversaryNo`: human-facing anniversary number
- `mode`: `"live"` or `"archive"` is recommended for server output
- `title`, `lead`, `giftNote`, `archiveTitle`, `archiveLead`: multilingual copy

### chapters

Frontend currently expects 4 chapter entries in order:

1. `greeting`
2. `year`
3. `songs`
4. `photos`

### timeline

- 3-6 items is ideal
- keep each `body` short enough for one screen

### releases

- 3-5 items is ideal
- `cover` should be directly renderable by the frontend

### photos

- exactly 12 items is preferred for the current animation
- `final` stores desktop/mobile end positions for the custom assembled layout

## Current Frontend Mapping

The current frontend config implementation lives in:

- [src/composables/miletAnniversary.ts](/D:/CODE/front/tailwindCSS/echoes%20of%20milet/src/composables/miletAnniversary.ts)

Once the backend is ready, the frontend can replace the bundled `records` map with API data using the same shape.

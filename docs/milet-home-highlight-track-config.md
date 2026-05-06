# milet home highlight track modal config

`/milet` home page can open the existing release track detail modal from a highlight item.
Configure the item under `homeV2.highlights`.

## Recommended config

Use `kind: "music"` and provide `trackShowId`. `trackShowId` must be the track `showId`
from the release module track data, not the work or album id.

```json
{
  "id": "final-call-highlight",
  "kind": "music",
  "variant": "softCard",
  "badge": {
    "zh": "music selected",
    "ja": "music selected"
  },
  "title": {
    "zh": "Final Call",
    "ja": "Final Call"
  },
  "description": {
    "zh": "把这首歌作为 highlight 入口展示。",
    "ja": "この曲を highlight の入口として表示します。"
  },
  "actionLabel": {
    "zh": "打开歌曲详情",
    "ja": "曲の詳細を見る"
  },
  "trackShowId": "TRACK_SHOW_ID_HERE",
  "trackTitle": {
    "zh": "Final Call",
    "ja": "Final Call"
  },
  "priority": 20
}
```

## Field behavior

- `kind`: set to `"music"` to make the card open the track detail modal.
- `trackShowId`: preferred. The page uses it to request the release track detail endpoint.
- `trackTitle`: optional but recommended. It is used as the initial title before detail data returns.
- `title`: still controls the highlight card title.
- `route` / `href`: not needed for music highlights. If no track can be found, `route` is only used as a fallback.

## Fallback matching

If `trackShowId` is missing, the page tries to match a track from the release list by
`trackTitle`, `title`, and title parts split by `/` or `|`. This is less stable because spacing
and punctuation differences can prevent a match.

Use `trackShowId` for production configuration.

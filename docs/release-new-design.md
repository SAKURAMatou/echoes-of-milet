# Release New Design

## Scope

This redesign only changes the release content rendered inside the existing `LayoutApp` main content area.

The following surfaces stay unchanged:

- Global header (`src/components/TWHeader.vue`)
- Left side menu (`src/components/menu/SideMenuLeft.vue`, `SideMenuItems.vue`)
- Layout shell sizing, scroll container, background image, and route structure

The release route should opt into the existing wide content mode (`route.meta.widePage`) used by the pilgrimage page. This widens only the current route's main content panel through `LayoutApp`; it does not change the header, side menu, or global shell.

The release page should feel like a fan archive / music shelf while still matching the current Echoes of milet visual language: pale blue-white glass, watercolor stage light, refined stationery details, serif display titles, compact rounded corners, and restrained metadata.

## Information Architecture

The right content area is structured as:

1. Archive intro
   - Large `Releases` title
   - Short localized lead text
   - Subtle watercolor / live-stage / waveform treatment
   - Small in-panel archive map with section counts
   - Optional view toggle between list and shelf modes

2. Release chapters
   - Albums
   - EP / Singles
   - Live BD / DVD

3. Chapter pagination
   - Each chapter loads independently.
   - Pagination is not numeric.
   - The UI uses archive language: current count / total count plus a localized "load more" control.

## Data Loading

Keep the existing data contract:

- `useReleaseData({ type: 1 })` for Albums
- `useReleaseData({ type: 2 })` for EP / Singles
- `useReleaseData({ type: 3 })` for Live BD / DVD
- `pageSize = 5`
- `loadMore()` appends the next batch to the current chapter

The composable should expose the total count so the UI can render `5 / 23 archived` style progress.

Expected loading behavior:

- The first page of a chapter is requested when that chapter enters the viewport.
- Loading more appends rows and keeps the scroll position stable.
- Loading, empty, error, and completed states are localized per chapter.

## Interaction Design

### Archive Map

The archive map lives inside the release content panel, not in the global layout. It is a lightweight page index:

- Shows chapter label and loaded / total counts.
- Clicking a chapter scrolls to that chapter.
- The currently visible chapter can be highlighted if the implementation can do so without adding fragile scroll logic.

### List And Shelf View

Default view: `list`.

List view is optimized for metadata and tracks:

- The first item in each chapter appears as a feature card.
- Remaining items appear as compact release rows.
- Rows can be expanded to inspect editions and track previews.

Shelf view is optimized for cover browsing:

- Shows covers in a responsive grid.
- Clicking an item expands/selects the release detail within the same page.
- It is acceptable for the first implementation to keep the same data interactions while changing only density and card layout.

### Featured Release

The first release in a loaded chapter is rendered as a feature card with:

- Active edition cover
- Release title and artist
- Date ticket strip
- Release type
- Physical / streaming state
- Edition count
- Track count
- Edition selector
- Track preview

Changing the active edition must update:

- Displayed cover image
- Displayed edition name
- Track preview
- Track count

If a release has no editions, fall back to `work.coverUrl` and empty track state.

### Compact Release Rows

Rows show:

- Active edition cover thumbnail
- Title and artist
- Release date
- Release type
- Distribution state
- Edition count
- Track count
- First few tracks

Rows support expand / collapse:

- Click the row action to expand details.
- Expanded rows show the same edition selector behavior as featured cards.
- Only one expanded row per chapter is preferred to control page height.

### Track Detail

Track clicks keep the current behavior:

- If lyric/listen data is missing, request detail data.
- Open `TrackModal` after detail resolution.

## Pagination Design

Each chapter footer contains:

- Progress text: loaded count / total count
- Main control: load next batch
- Optional helper label: next batch size
- Completed state: all items archived
- Retry state on error

Example UI meaning:

- `5 / 23 archived`
- `Load more albums`
- `Next 5 releases`
- `All albums archived`

This maps directly to the existing append-based pagination and avoids a traditional numbered pagination component.

## Multilingual Design

All new visible text must be sourced from `src/composables/lang/ReleaseMetaData.ts` or another release-specific language module.

Do not hard-code new Chinese, Japanese, or English user-facing labels in Vue templates.

Required text groups:

- Page intro
- View toggle labels
- Archive map labels
- Chapter titles and subtitles
- Release card metadata labels
- Edition selector labels
- Track preview labels
- Pagination labels
- Loading, empty, error, retry, and complete states
- Accessibility labels for expand/collapse and view switching

The implementation must handle both language keys currently used in the project:

- `zh`
- `jp`

## Responsive Behavior

Desktop:

- Preserve current outer shell.
- Release content uses the wide-page max-width already provided by `LayoutApp`.
- Feature cards use a cover + metadata + track-preview layout.
- Archive map can sit in the intro area or as a right-aligned in-panel block.
- The release intro uses a right-side background image treatment inside the content panel, masked into the blue-white stage-light atmosphere.

Mobile:

- Header and mobile menu stay unchanged.
- Release intro becomes compact.
- Feature card stacks vertically.
- Track preview starts short and can expand.
- Chapter pagination is full width.
- Archive map can collapse into a small chapter jump button / drawer if needed.

## Implementation Files

Expected primary files:

- `src/views/milet/ReleasesPage.vue`
- `src/components/milet/music/ReleaseSection.vue`
- `src/components/milet/music/WorkStack.vue`
- `src/components/milet/music/WorkCard.vue`
- `src/components/milet/music/EditionCarousel.vue`
- `src/components/milet/music/StackMapDrawer.vue`
- `src/composables/useReleaseData.ts`
- `src/composables/lang/ReleaseMetaData.ts`

Implementation can add small release-specific components if that keeps the page readable, but should not alter the global shell.

## Acceptance Criteria

- Header and left menu visual structure are unchanged.
- Release content area matches the new fan archive direction.
- Each chapter still lazy-loads independently.
- Load-more appends data and uses localized archive pagination UI.
- Edition switching updates the visible cover and track preview.
- New text is localized through release language config.
- Track modal behavior remains functional.
- Desktop and mobile layouts have no text overlap or horizontal overflow.
- Type check and production build pass.

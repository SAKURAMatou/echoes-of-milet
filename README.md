# Echoes of milet

## Local development

Install dependencies:

```sh
npm install
```

Client-side local development:

```sh
npm run dev
```

Use this for daily component and route development with Vite HMR.

## Local SSR verification

Before deployment, verify SSR/SSG locally with the built client/server bundles:

```sh
npm run verify:ssr:local
```

This command will:

- build the client bundle, server bundle, and SSG pages
- start a local Node preview server against `dist/client` and `dist/server`
- serve SSG routes from prerendered files and SSR routes from the built server entry
- proxy `/api/*` requests to the local backend for data verification

Default local preview settings are defined in [`api-proxy.config.json`](/D:/CODE/front/tailwindCSS/echoes%20of%20milet/api-proxy.config.json):

- `origins.development.backend`
- `origins.development.site`

Open `http://127.0.0.1:5173` after the command is ready.

## Cloudflare Pages deployment

Build command:

```sh
npm run build:ssr
```

Build output directory:

```text
dist/client
```

Functions directory:

```text
functions
```

Production URLs are also defined in [`api-proxy.config.json`](/D:/CODE/front/tailwindCSS/echoes%20of%20milet/api-proxy.config.json):

- `origins.production.backend`
- `origins.production.site`

Current runtime environment variable:

```env
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

Route behavior:

- `/` uses SSG
- `/milet/about` uses SSG
- `/milet` uses SSR
- `/milet/anniversary` uses SSR
- `/milet/timeline` uses CSR
- `/milet/galleryList` uses CSR
- `/milet/release` uses CSR

Anniversary module notes:

- `/:lang/milet/anniversary/:year?` supports the current record plus year-based archives
- menu entry is always `ANNIVERSARY`
- during the anniversary month, the menu links directly to the current year record
- outside the anniversary month, `/:lang/milet/anniversary` opens an archive year list first, then `/:lang/milet/anniversary/:year` opens the chosen record
- the frontend data contract for the anniversary backend is documented in [`docs/milet-anniversary-data-contract.md`](/D:/CODE/front/tailwindCSS/echoes%20of%20milet/docs/milet-anniversary-data-contract.md)

## Notes

- `dist/client/__ssr-template.html` is kept as the runtime template for SSR responses.
- `functions/[[path]].ts` handles both dynamic SSR and `/api/*` proxying on Cloudflare Pages.
- The SSR runtime path is now unified around `src/server/render.ts` and Cloudflare Pages Functions.
- Frontend API paths, static asset paths, and proxy upstream origins are all sourced from `api-proxy.config.json`.

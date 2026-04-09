# Echoes of milet

## Local development

Install dependencies:

```sh
npm install
```

Fast local SSR development with the Node server:

```sh
npm run dev:ssr
```

This mode keeps Vite HMR for `src/**` changes and auto-restarts the local SSR server when `server.ts`, `.env`, `.env.development`, or `vite.config.js` changes.

## Local production-style checks

Preview the built app with the local Node SSR server:

```sh
npm run preview:ssr
```

Preview the built app against the local backend to avoid production CORS during local verification:

```sh
npm run preview:ssr:local
```

## Cloudflare Pages local preview

This project now includes a Pages Functions entry at [`functions/[[path]].ts`](./functions/[[path]].ts).

Preview the Cloudflare Pages runtime locally after a production build:

```sh
npm run preview:pages:local
```

Default local Pages preview settings:

- `API_ORIGIN=http://localhost:8787`
- `PUBLIC_SITE_ORIGIN=http://localhost:8788`

If you want to simulate production instead, set real environment variables first and run:

```sh
npm run preview:pages
```

Note: `preview:pages*` uses `npx wrangler`. If Wrangler is not already available in your environment, `npx` will prompt to download it.

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

Recommended Cloudflare Pages environment variables:

```env
VITE_BASE_API_URI=https://your-api-domain
VITE_PUBLIC_SITE_ORIGIN=https://your-frontend-domain
API_ORIGIN=https://your-api-domain
PUBLIC_SITE_ORIGIN=https://your-frontend-domain
```

Route behavior:

- `/` uses SSG
- `/milet/about` uses SSG
- `/milet` uses SSR
- `/milet/timeline` uses CSR
- `/milet/galleryList` uses CSR
- `/milet/release` uses CSR

## Notes

- `dist/client/__ssr-template.html` is kept as the runtime template for SSR responses.
- `functions/[[path]].ts` handles both dynamic SSR and `/api/*` proxying on Cloudflare Pages.
- `server.ts` is only for local Node-based testing and is not used in Cloudflare production.
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_API_URI?: string
  readonly VITE_BASE_IMG_URL?: string
  readonly VITE_PUBLIC_SITE_ORIGIN?: string
  readonly VITE_TURNSTILE_SITE_KEY?: string
  readonly VITE_URL_API_ABOUT_FEEDBACK?: string
  readonly VITE_URL_API_MILET_GALLERY?: string
  readonly VITE_URL_API_MILET_HOME?: string
  readonly VITE_URL_API_MILET_PICLIST?: string
  readonly VITE_URL_API_MILET_RELEASE?: string
  readonly VITE_URL_API_MILET_RELEASE_DETAIL?: string
  readonly VITE_URL_API_MILET_TIMELINE_ALL?: string
  readonly VITE_URL_STATIC_MILET_I?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'vue-demi'

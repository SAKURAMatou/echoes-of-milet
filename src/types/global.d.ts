declare global {
  type SupportedLang = 'zh' | 'jp'
  type LangConfig = Record<SupportedLang, Record<string, object>>
}

export {}

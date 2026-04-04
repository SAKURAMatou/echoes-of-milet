import { reactive } from 'vue'
import { langConfig } from '@/composables/lang'

interface LangState {
  lang: SupportedLang
}
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $getConfigLang: (key: string) => object | string
    $lang: LangState
    $toggleLang: (key: SupportedLang) => void
  }
}

export default {
  install(app: import('vue').App) {
    const langState = reactive<LangState>({
      lang: getInitialLang(),
    })

    const selectedList = ['zh', 'jp'] as SupportedLang[]

    //获取初始语言设置，默认中文
    function getInitialLang() {
      const saved = localStorage.getItem('lang') as SupportedLang | null
      if (saved && selectedList.includes(saved)) return saved
      const browserLang = navigator.language.toLowerCase()
      if (browserLang.includes('zh')) {
        return 'zh'
      } else if (browserLang.includes('ja') || browserLang.includes('jp')) {
        return 'jp'
      } else {
        return 'zh'
      }
    }

    /**
     * 获取配置的语言
     * @param {*} key
     * @returns
     */
    function getConfigLang(key: string) {
      return langConfig[langState.lang]?.[key] || key
    }
    /**
     * 保存语言设置
     * @param {*} lang
     */
    function setLang(lang: SupportedLang) {
      if (!selectedList.includes(lang)) {
        return
      }
      langState.lang = lang
      localStorage.setItem('lang', lang)
    }
    /**
     * 语言切换事件
     */
    function toggleLang(key: SupportedLang) {
      setLang(key)
    }
    // 挂载到全局
    app.config.globalProperties.$getConfigLang = getConfigLang
    app.config.globalProperties.$lang = langState

    app.config.globalProperties.$toggleLang = toggleLang
  },
}

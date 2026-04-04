import './assets/main.css'

import { createApp } from 'vue'
import VueLazyLoad from 'vue3-lazyload'

import App from './App.vue'
import loadingImg from './assets/loading.gif'
import langPlugin from './plugins/LangPlugin'
import router from './router'

const app = createApp(App)

app.use(router)
app.use(VueLazyLoad, {
  loading: loadingImg,
  error: './assets/default_images_list.svg',
})
app.use(langPlugin)

app.mount('#app')

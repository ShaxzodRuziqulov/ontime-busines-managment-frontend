import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

import { registerSW } from 'virtual:pwa-register'

registerSW({
    immediate: true,
})

const savedTheme = localStorage.getItem('ontime-theme')
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
document.documentElement.classList.toggle('dark', savedTheme ? savedTheme === 'dark' : prefersDark)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

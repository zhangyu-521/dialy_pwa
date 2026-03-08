import { createApp } from 'vue'
import App from './App.vue'
import './assets/style.css'

// 注册 Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 使用相对路径，支持子目录部署
    const swPath = import.meta.env.BASE_URL + 'sw.js'
    navigator.serviceWorker.register(swPath)
      .then(registration => {
        console.log('SW registered:', registration.scope)
      })
      .catch(error => {
        console.log('SW registration failed:', error)
      })
  })
}

createApp(App).mount('#app')

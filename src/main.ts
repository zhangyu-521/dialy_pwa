import { createApp } from 'vue'
import App from './App.vue'
import './assets/style.css'

// 注册 Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration.scope)
      })
      .catch(error => {
        console.log('SW registration failed:', error)
      })
  })
}

createApp(App).mount('#app')

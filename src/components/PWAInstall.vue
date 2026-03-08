<template>
  <!-- PWA 安装提示 -->
  <div v-if="showInstallPrompt" class="pwa-install-prompt">
    <div class="pwa-install-content">
      <div class="pwa-install-icon">
        <img src="/icon-192x192.png" alt="日记本" width="48" height="48" />
      </div>
      <div class="pwa-install-text">
        <h3>安装日记本</h3>
        <p>添加到主屏幕，离线也能使用</p>
      </div>
    </div>
    <div class="pwa-install-actions">
      <button class="btn-dismiss" @click="dismiss">稍后再说</button>
      <button class="btn-install" @click="install">安装</button>
    </div>
  </div>

  <!-- iOS 安装指引 -->
  <div v-if="showIOSGuide" class="ios-guide" @click="showIOSGuide = false">
    <div class="ios-guide-content" @click.stop>
      <h3>在 iPhone/iPad 上安装</h3>
      <ol>
        <li>点击 Safari 底部的 <strong>分享</strong> 按钮 <span class="icon">⎋</span></li>
        <li>向上滑动，找到并点击 <strong>添加到主屏幕</strong></li>
        <li>点击右上角的 <strong>添加</strong></li>
      </ol>
      <button class="btn-close" @click="showIOSGuide = false">知道了</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// PWA 安装提示
const showInstallPrompt = ref(false)
const showIOSGuide = ref(false)
let deferredPrompt: any = null

onMounted(() => {
  // 检查是否已经安装
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone 
    || document.referrer.includes('android-app://')
  
  if (isStandalone) {
    return // 已安装，不显示提示
  }

  // 检查是否是 iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  
  if (isIOS) {
    // iOS 需要手动安装，显示指引
    const hasShownIOSGuide = localStorage.getItem('pwa-ios-guide-shown')
    if (!hasShownIOSGuide) {
      setTimeout(() => {
        showIOSGuide.value = true
        localStorage.setItem('pwa-ios-guide-shown', 'true')
      }, 2000)
    }
    return
  }

  // Android/桌面端：监听 beforeinstallprompt 事件
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    
    // 检查是否已经拒绝过
    const hasDismissed = localStorage.getItem('pwa-install-dismissed')
    const dismissedTime = hasDismissed ? parseInt(hasDismissed) : 0
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    
    if (!hasDismissed || Date.now() - dismissedTime > oneWeek) {
      showInstallPrompt.value = true
    }
  })

  // 监听安装完成
  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false
    deferredPrompt = null
    localStorage.removeItem('pwa-install-dismissed')
  })
})

async function install() {
  if (!deferredPrompt) {
    showInstallPrompt.value = false
    return
  }
  
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  
  if (outcome === 'accepted') {
    console.log('PWA installed')
  }
  
  deferredPrompt = null
  showInstallPrompt.value = false
}

function dismiss() {
  showInstallPrompt.value = false
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
}
</script>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-width: 360px;
  width: 90%;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.pwa-install-content {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.pwa-install-icon img {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pwa-install-text h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.pwa-install-text p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.pwa-install-actions {
  display: flex;
  gap: 10px;
}

.pwa-install-actions button {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-dismiss {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-dismiss:hover {
  background: #e5e7eb;
}

.btn-install {
  background: #6366f1;
  color: white;
}

.btn-install:hover {
  background: #4f46e5;
}

/* iOS 安装指引 */
.ios-guide {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.ios-guide-content {
  background: white;
  border-radius: 20px;
  padding: 24px;
  max-width: 340px;
  width: 100%;
  animation: scaleIn 0.2s ease;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.ios-guide-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
  text-align: center;
}

.ios-guide-content ol {
  margin: 0 0 20px 0;
  padding-left: 20px;
  color: #374151;
  font-size: 14px;
  line-height: 1.8;
}

.ios-guide-content li {
  margin-bottom: 8px;
}

.icon {
  font-size: 16px;
}

.btn-close {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: #6366f1;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn-close:hover {
  background: #4f46e5;
}
</style>

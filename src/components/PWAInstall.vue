<template>
  <!-- Android/Chrome PWA 安装提示 -->
  <div v-if="showInstallPrompt" class="pwa-install-prompt">
    <div class="pwa-install-content">
      <img src="/icon-192x192.png" alt="日记本" class="pwa-icon" />
      <div class="pwa-text">
        <h3>安装日记本到手机</h3>
        <p>添加到主屏幕，离线也能写日记</p>
      </div>
    </div>
    <div class="pwa-actions">
      <button class="btn-later" @click="dismiss">稍后再说</button>
      <button class="btn-install" @click="install">立即安装</button>
    </div>
  </div>

  <!-- iOS Safari 安装指引 -->
  <div v-if="showIOSGuide" class="ios-guide-mask" @click="showIOSGuide = false">
    <div class="ios-guide" @click.stop>
      <div class="ios-guide-arrow"></div>
      <div class="ios-guide-content">
        <h3>📱 安装到主屏幕</h3>
        <ol>
          <li>点击 Safari 底部的 <span class="share-icon">⎋</span> 分享按钮</li>
          <li>向上滑动，点击「添加到主屏幕」</li>
          <li>点击右上角「添加」完成</li>
        </ol>
        <button class="btn-got-it" @click="showIOSGuide = false">我知道了</button>
      </div>
    </div>
  </div>

  <!-- 底部固定提示条（iOS） -->
  <div v-if="showIOSBottomTip" class="ios-bottom-tip" @click="showIOSGuide = true">
    <img src="/icon-192x192.png" alt="" class="tip-icon" />
    <span>点击安装日记本到主屏幕</span>
    <span class="arrow">›</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showInstallPrompt = ref(false)
const showIOSGuide = ref(false)
const showIOSBottomTip = ref(false)
let deferredPrompt: any = null

onMounted(() => {
  // 检测是否已安装
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone === true
  
  if (isStandalone) {
    return // 已安装，不显示提示
  }

  // 检测平台
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  const isAndroid = /Android/.test(navigator.userAgent)
  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge|Edg/.test(navigator.userAgent)

  if (isIOS) {
    // iOS 显示底部提示条
    const hasShown = localStorage.getItem('pwa-ios-tip-shown')
    if (!hasShown) {
      setTimeout(() => {
        showIOSBottomTip.value = true
      }, 3000)
    }
    return
  }

  // Android Chrome 监听安装事件
  if (isAndroid && isChrome) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      
      // 检查是否之前拒绝过
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const oneWeek = 7 * 24 * 60 * 60 * 1000
      
      if (!dismissed || Date.now() - parseInt(dismissed) > oneWeek) {
        setTimeout(() => {
          showInstallPrompt.value = true
        }, 5000) // 5秒后显示
      }
    })

    window.addEventListener('appinstalled', () => {
      showInstallPrompt.value = false
      showIOSBottomTip.value = false
      deferredPrompt = null
      localStorage.removeItem('pwa-install-dismissed')
    })
  }
})

async function install() {
  if (!deferredPrompt) {
    // 可能是 iOS 或其他浏览器
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS) {
      showIOSGuide.value = true
    }
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
  showIOSBottomTip.value = false
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  localStorage.setItem('pwa-ios-tip-shown', 'true')
}
</script>

<style scoped>
/* Android 安装提示 */
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
  max-width: 90%;
  width: 360px;
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

.pwa-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pwa-text h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.pwa-text p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.pwa-actions {
  display: flex;
  gap: 10px;
}

.pwa-actions button {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-later {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-later:hover {
  background: #e5e7eb;
}

.btn-install {
  background: #6366f1;
  color: white;
}

.btn-install:hover {
  background: #4f46e5;
}

/* iOS 底部提示条 */
.ios-bottom-tip {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  color: white;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 1000;
  animation: slideUpBar 0.3s ease;
  cursor: pointer;
}

@keyframes slideUpBar {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.ios-bottom-tip .tip-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.ios-bottom-tip span {
  font-size: 15px;
  font-weight: 500;
}

.ios-bottom-tip .arrow {
  font-size: 20px;
  margin-left: 4px;
}

/* iOS 安装指引弹窗 */
.ios-guide-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 60px;
  z-index: 1001;
}

.ios-guide {
  background: white;
  border-radius: 20px;
  padding: 24px;
  max-width: 320px;
  width: 90%;
  position: relative;
  animation: scaleIn 0.2s ease;
}

.ios-guide-arrow {
  position: absolute;
  top: -10px;
  right: 40px;
  width: 20px;
  height: 20px;
  background: white;
  transform: rotate(45deg);
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
  font-size: 15px;
  line-height: 2;
}

.ios-guide-content li {
  margin-bottom: 8px;
}

.share-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #007AFF;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  margin: 0 4px;
}

.btn-got-it {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: #6366f1;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.btn-got-it:hover {
  background: #4f46e5;
}
</style>

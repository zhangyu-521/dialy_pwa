<template>
  <div class="app">
    <transition name="fade" mode="out-in">
      <!-- 列表视图 -->
      <DiaryList
        v-if="currentView === 'list'"
        :diaries="diaries"
        @new="startNewDiary"
        @view="viewDiary"
        @delete="deleteDiary"
        @import="handleImport"
      />
      
      <!-- 编辑器视图 -->
      <Editor
        v-else-if="currentView === 'editor'"
        :diary="editingDiary"
        @back="backToList"
        @save="saveDiary"
      />
    </transition>

    <!-- Toast 提示 -->
    <transition name="toast">
      <div v-if="toast.visible" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { db, type Diary } from './utils/db'
import { imageStore } from './utils/imageStore'
import DiaryList from './components/DiaryList.vue'
import Editor from './components/Editor.vue'

type ViewType = 'list' | 'editor'

const currentView = ref<ViewType>('list')
const diaries = ref<Diary[]>([])
const editingDiary = ref<Diary | null>(null)

const toast = ref({
  visible: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// 初始化数据库并加载日记
onMounted(async () => {
  try {
    await db.init()
    await imageStore.init()
    await loadDiaries()
  } catch (error) {
    showToast('数据库初始化失败', 'error')
    console.error('Database init error:', error)
  }
})

async function loadDiaries() {
  try {
    diaries.value = await db.getAll()
  } catch (error) {
    showToast('加载日记失败', 'error')
    console.error('Load diaries error:', error)
  }
}

function startNewDiary() {
  editingDiary.value = null
  currentView.value = 'editor'
}

function viewDiary(diary: Diary) {
  editingDiary.value = diary
  currentView.value = 'editor'
}

function backToList() {
  currentView.value = 'list'
  editingDiary.value = null
}

async function saveDiary(diaryData: { 
  id?: string; 
  title: string; 
  content: string; 
  tags: string[];
  images: string[];
  createdAt?: number 
}) {
  try {
    await db.save({
      id: diaryData.id || generateId(),
      title: diaryData.title,
      content: diaryData.content,
      tags: diaryData.tags,
      images: diaryData.images,
      createdAt: diaryData.createdAt
    })
    
    await loadDiaries()
    backToList()
    showToast('保存成功', 'success')
  } catch (error) {
    showToast('保存失败', 'error')
    console.error('Save diary error:', error)
  }
}

async function deleteDiary(id: string) {
  try {
    // 先删除关联的图片
    await imageStore.deleteImagesByDiary(id)
    // 再删除日记
    await db.delete(id)
    await loadDiaries()
    showToast('删除成功', 'success')
  } catch (error) {
    showToast('删除失败', 'error')
    console.error('Delete diary error:', error)
  }
}

// 处理导入的日记
async function handleImport(importedDiaries: Diary[]) {
  try {
    for (const diary of importedDiaries) {
      await db.save(diary)
    }
    await loadDiaries()
    showToast(`成功导入 ${importedDiaries.length} 篇日记`, 'success')
  } catch (error) {
    showToast('导入保存失败', 'error')
    console.error('Import save error:', error)
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { visible: true, message, type }
  setTimeout(() => {
    toast.value.visible = false
  }, 2500)
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f9fafb;
}

.app {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  background: #fff;
}

@media (min-width: 769px) {
  .app {
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.08);
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Toast 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Toast 样式 */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.success {
  background: #10b981;
  color: white;
}

.toast.error {
  background: #ef4444;
  color: white;
}
</style>

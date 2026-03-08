<template>
  <div class="list-container">
    <!-- 顶部栏 -->
    <div class="header">
      <div class="header-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        <h1>我的日记</h1>
      </div>
      <div class="header-actions">
        <button class="btn-data" @click="showDataMenu = !showDataMenu" title="数据管理">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
          </svg>
          备份
        </button>
        <button class="btn-new" @click="$emit('new')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 4v16m8-8H4"/>
          </svg>
          新建
        </button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索日记..."
        class="search-input"
      />
      <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- 标签筛选 -->
    <div v-if="allTags.length > 0" class="tag-filter">
      <button
        :class="['tag-btn', { active: selectedTag === null }]"
        @click="selectedTag = null"
      >
        全部
      </button>
      <button
        v-for="tag in allTags"
        :key="tag"
        :class="['tag-btn', { active: selectedTag === tag }]"
        @click="selectedTag = selectedTag === tag ? null : tag"
      >
        #{{ tag }}
      </button>
    </div>

    <!-- 日记列表 -->
    <div class="diary-list" v-if="filteredDiaries.length > 0">
      <div
        v-for="diary in filteredDiaries"
        :key="diary.id"
        class="diary-card"
        @click="$emit('view', diary)"
      >
        <div class="card-header">
          <h3 class="card-title">{{ diary.title || '无标题' }}</h3>
          <span class="card-date">{{ formatDate(diary.createdAt) }}</span>
        </div>
        <p v-if="diary.content" class="card-preview">{{ getPreview(diary.content) }}</p>
        
        <!-- 图片预览 -->
        <div v-if="diary.images && diary.images.length > 0" class="card-images">
          <div class="image-count">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            {{ diary.images.length }} 张图片
          </div>
        </div>
        
        <div v-if="diary.tags.length > 0" class="card-tags">
          <span v-for="tag in diary.tags.slice(0, 3)" :key="tag" class="card-tag">
            #{{ tag }}
          </span>
          <span v-if="diary.tags.length > 3" class="card-tag-more">
            +{{ diary.tags.length - 3 }}
          </span>
        </div>
        <button class="delete-btn" @click.stop="confirmDelete(diary)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <p class="empty-title">
        {{ searchQuery || selectedTag ? '没有找到相关日记' : '还没有日记' }}
      </p>
      <p class="empty-desc">
        {{ searchQuery || selectedTag ? '尝试其他关键词或标签' : '点击右上角按钮开始记录你的第一篇日记' }}
      </p>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal" @click.stop>
        <h3>确认删除</h3>
        <p>确定要删除这篇日记吗？此操作无法撤销。</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDeleteConfirm = false">取消</button>
          <button class="btn-danger" @click="doDelete">删除</button>
        </div>
      </div>
    </div>

    <!-- 数据管理菜单 -->
    <div v-if="showDataMenu" class="modal-overlay" @click="showDataMenu = false">
      <div class="modal data-menu" @click.stop>
        <h3>数据管理</h3>
        <div class="data-menu-options">
          <button class="menu-item" @click="handleExport">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <div class="menu-item-text">
              <span class="menu-item-title">导出所有日记</span>
              <span class="menu-item-desc">备份为 JSON 文件，包含所有日记和图片</span>
            </div>
          </button>
          
          <button class="menu-item" @click="triggerImport">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div class="menu-item-text">
              <span class="menu-item-title">导入日记</span>
              <span class="menu-item-desc">从备份文件恢复日记数据</span>
            </div>
          </button>
          <input
            ref="importInput"
            type="file"
            accept=".json,.zip"
            style="display: none"
            @change="handleImport"
          />
        </div>
        <button class="btn-secondary" @click="showDataMenu = false">关闭</button>
      </div>
    </div>

    <!-- 导出预览对话框 -->
    <div v-if="showExportPreview" class="modal-overlay" @click="showExportPreview = false">
      <div class="modal" @click.stop>
        <h3>导出预览</h3>
        <div class="export-info">
          <div class="info-row">
            <span class="info-label">日记数量</span>
            <span class="info-value">{{ exportPreview?.diaryCount }} 篇</span>
          </div>
          <div class="info-row">
            <span class="info-label">图片数量</span>
            <span class="info-value">{{ exportPreview?.imageCount }} 张</span>
          </div>
          <div class="info-row">
            <span class="info-label">预估大小</span>
            <span class="info-value">{{ exportPreview?.sizeFormatted }}</span>
          </div>
        </div>
        
        <!-- 导出格式选择 -->
        <div class="export-format">
          <p class="format-title">选择导出格式：</p>
          <div class="format-options">
            <label :class="['format-option', { active: exportFormat === 'zip' }]">
              <input type="radio" v-model="exportFormat" value="zip" />
              <span class="format-name">ZIP 格式（推荐）</span>
              <span class="format-desc">体积小，适合图片多的日记</span>
            </label>
            <label :class="['format-option', { active: exportFormat === 'json' }]">
              <input type="radio" v-model="exportFormat" value="json" />
              <span class="format-name">JSON 格式</span>
              <span class="format-desc">单文件，适合纯文字日记</span>
            </label>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showExportPreview = false">取消</button>
          <button class="btn-primary" @click="confirmExport">确认导出</button>
        </div>
      </div>
    </div>

    <!-- 导入结果对话框 -->
    <div v-if="showImportResult" class="modal-overlay" @click="showImportResult = false">
      <div class="modal" @click.stop>
        <h3>{{ importResult?.success ? '导入成功' : '导入完成' }}</h3>
        <div class="import-info">
          <div class="info-row">
            <span class="info-label">成功导入</span>
            <span class="info-value success">{{ importResult?.importedDiaries }} 篇日记</span>
          </div>
          <div class="info-row">
            <span class="info-label">导入图片</span>
            <span class="info-value">{{ importResult?.importedImages }} 张</span>
          </div>
          <div v-if="importResult?.skippedDiaries" class="info-row">
            <span class="info-label">跳过重复</span>
            <span class="info-value warning">{{ importResult?.skippedDiaries }} 篇</span>
          </div>
          <div v-if="importResult?.errors.length" class="import-errors">
            <p class="error-title">错误信息：</p>
            <ul>
              <li v-for="(error, idx) in importResult?.errors" :key="idx">{{ error }}</li>
            </ul>
          </div>
        </div>
        <button class="btn-primary" @click="showImportResult = false">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Diary } from '../utils/db'
import { exportAllData, exportToFile, importFromFile, getExportPreview, type ImportResult, type ExportFormat } from '../utils/exportImport'

interface Props {
  diaries: Diary[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  new: []
  view: [diary: Diary]
  delete: [id: string]
  import: [diaries: Diary[]]
}>()

const searchQuery = ref('')
const selectedTag = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const diaryToDelete = ref<Diary | null>(null)

// 数据管理相关
const showDataMenu = ref(false)
const showExportPreview = ref(false)
const showImportResult = ref(false)
const exportPreview = ref<ReturnType<typeof getExportPreview> | null>(null)
const importResult = ref<ImportResult | null>(null)
const importInput = ref<HTMLInputElement>()
const exportDataCache = ref<any>(null)
const exportFormat = ref<ExportFormat>('zip')

// 从所有日记中提取标签
const allTags = computed(() => {
  const tagSet = new Set<string>()
  props.diaries.forEach(diary => {
    diary.tags.forEach(tag => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
})

// 筛选后的日记
const filteredDiaries = computed(() => {
  let result = props.diaries

  // 按标签筛选
  if (selectedTag.value) {
    result = result.filter(d => d.tags.includes(selectedTag.value!))
  }

  // 按搜索词筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(d =>
      d.title.toLowerCase().includes(query) ||
      d.content.toLowerCase().includes(query) ||
      d.tags.some(t => t.toLowerCase().includes(query))
    )
  }

  return result
})

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  
  // 今天 - 显示时间
  if (date.toDateString() === now.toDateString()) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 今年内 - 显示月日
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
  
  // 往年 - 显示年月日
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function getPreview(content: string): string {
  // 移除 Markdown 标记
  const plain = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    .replace(/`{3}[\s\S]*?`{3}/g, '[代码块]')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[图片]')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/>\s?/g, '')
    .replace(/-\s|\*\s|\d+\.\s/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  
  return plain.slice(0, 100) + (plain.length > 100 ? '...' : '')
}

function confirmDelete(diary: Diary) {
  diaryToDelete.value = diary
  showDeleteConfirm.value = true
}

function doDelete() {
  if (diaryToDelete.value) {
    emit('delete', diaryToDelete.value.id)
    showDeleteConfirm.value = false
    diaryToDelete.value = null
  }
}

// ========== 导入导出功能 ==========

async function handleExport() {
  if (props.diaries.length === 0) {
    alert('没有日记可导出')
    showDataMenu.value = false
    return
  }
  
  // 默认使用 ZIP 格式预览
  const result = await exportAllData(props.diaries, { format: 'zip' })
  exportDataCache.value = result
  exportPreview.value = getExportPreview(result.data)
  showDataMenu.value = false
  showExportPreview.value = true
}

async function confirmExport() {
  await exportToFile(props.diaries, exportFormat.value)
  showExportPreview.value = false
  exportDataCache.value = null
}

function triggerImport() {
  importInput.value?.click()
  showDataMenu.value = false
}

async function handleImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  const result = await importFromFile(file, props.diaries, {
    duplicateStrategy: 'skip',
    importImages: true
  })
  
  // 类型断言，因为 importFromFile 返回的结果包含 importedData
  const fullResult = result as ImportResult & { importedData?: Diary[] }
  
  if (fullResult.importedData && fullResult.importedData.length > 0) {
    emit('import', fullResult.importedData)
  }
  
  importResult.value = result
  showImportResult.value = true
  
  // 清空 input，允许重复选择相同文件
  target.value = ''
}
</script>

<style scoped>
.list-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f9fafb;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title svg {
  width: 28px;
  height: 28px;
  color: #6366f1;
}

.header-title h1 {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.btn-new {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  background: #6366f1;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-new:hover {
  background: #4f46e5;
  transform: translateY(-1px);
}

.btn-new svg {
  width: 18px;
  height: 18px;
}

.search-bar {
  position: relative;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.search-icon {
  position: absolute;
  left: 26px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 42px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  background: #f9fafb;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #6366f1;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.clear-btn {
  position: absolute;
  right: 26px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  cursor: pointer;
}

.clear-btn svg {
  width: 12px;
  height: 12px;
}

.tag-filter {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  scrollbar-width: none;
}

.tag-filter::-webkit-scrollbar {
  display: none;
}

.tag-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #fff;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tag-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.tag-btn.active {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

.diary-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diary-card {
  position: relative;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.diary-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  padding-right: 32px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
}

.card-date {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.card-preview {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-images {
  margin-bottom: 10px;
}

.image-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
}

.image-count svg {
  width: 16px;
  height: 16px;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.card-tag {
  padding: 3px 10px;
  background: #eef2ff;
  color: #6366f1;
  border-radius: 12px;
  font-size: 12px;
}

.card-tag-more {
  padding: 3px 10px;
  background: #f3f4f6;
  color: #9ca3af;
  border-radius: 12px;
  font-size: 12px;
}

.delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #d1d5db;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.diary-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.delete-btn svg {
  width: 16px;
  height: 16px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
  color: #d1d5db;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #9ca3af;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  max-width: 360px;
  width: 100%;
  text-align: center;
}

.modal h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.modal p {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-actions button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

/* 数据管理按钮 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-data {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-data:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #f5f5ff;
}

.btn-data svg {
  width: 18px;
  height: 18px;
}

/* 数据管理菜单 */

.data-menu {
  max-width: 400px;
}

.data-menu-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.menu-item:hover {
  border-color: #6366f1;
  background: #f9fafb;
}

.menu-item svg {
  width: 24px;
  height: 24px;
  color: #6366f1;
  flex-shrink: 0;
}

.menu-item-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.menu-item-desc {
  font-size: 13px;
  color: #6b7280;
}

/* 导出预览 */
.export-info,
.import-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
  text-align: left;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #6b7280;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.info-value.success {
  color: #10b981;
}

.info-value.warning {
  color: #f59e0b;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover {
  background: #4f46e5;
}

/* 导出格式选择 */
.export-format {
  margin: 20px 0;
  text-align: left;
}

.format-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.format-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.format-option {
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.format-option:hover {
  border-color: #c7d2fe;
}

.format-option.active {
  border-color: #6366f1;
  background: #f5f5ff;
}

.format-option input {
  display: none;
}

.format-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.format-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

/* 导入错误 */
.import-errors {
  margin-top: 16px;
  padding: 12px;
  background: #fef2f2;
  border-radius: 8px;
  text-align: left;
}

.error-title {
  font-size: 13px;
  font-weight: 600;
  color: #ef4444;
  margin-bottom: 8px;
}

.import-errors ul {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: #dc2626;
}

.import-errors li {
  margin-bottom: 4px;
}
</style>

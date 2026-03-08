<template>
  <div class="editor-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="btn-icon" @click="$emit('back')" title="返回">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <span class="editor-title">{{ isEditing ? '编辑日记' : '新建日记' }}</span>
      </div>
      <div class="toolbar-right">
        <button class="btn-icon" @click="showTagInput = !showTagInput" title="添加标签">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
          </svg>
        </button>
        <button class="btn-icon" @click="triggerImageUpload" title="添加图片">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <button class="btn-icon" @click="triggerCamera" title="拍照">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          style="display: none"
          @change="handleFileSelect"
        />
        <input
          ref="cameraInput"
          type="file"
          accept="image/*"
          capture="environment"
          style="display: none"
          @change="handleFileSelect"
        />
        <button class="btn-primary" @click="save" :disabled="!canSave">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 13l4 4L19 7"/>
          </svg>
          保存
        </button>
      </div>
    </div>

    <!-- 标签输入 -->
    <transition name="slide">
      <div v-if="showTagInput" class="tag-section">
        <div class="tag-input-wrapper">
          <input
            v-model="tagInput"
            type="text"
            placeholder="输入标签，按回车添加（如：工作、旅行）"
            class="tag-input"
            @keydown.enter.prevent="addTag"
          />
          <button class="btn-small" @click="addTag">添加</button>
        </div>
        <div class="tag-list">
          <span v-for="tag in tags" :key="tag" class="tag">
            #{{ tag }}
            <button class="tag-remove" @click="removeTag(tag)">×</button>
          </span>
        </div>
      </div>
    </transition>

    <!-- 标签展示（只读模式） -->
    <div v-if="tags.length > 0 && !showTagInput" class="tag-display">
      <span v-for="tag in tags" :key="tag" class="tag-readonly">#{{ tag }}</span>
    </div>

    <!-- 图片展示区域 -->
    <div v-if="images.length > 0" class="image-gallery">
      <div v-for="(img, index) in images" :key="img.id" class="image-item">
        <img :src="img.url" :alt="`图片 ${index + 1}`" @click="previewImage(img.url)" />
        <button class="image-remove" @click="removeImage(index)" title="删除图片">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-body">
      <input
        v-model="title"
        type="text"
        placeholder="标题"
        class="title-input"
      />
      <textarea
        v-model="content"
        placeholder="开始写日记...（支持粘贴图片）"
        class="content-input"
        ref="contentRef"
        @paste="handlePaste"
      ></textarea>
    </div>

    <!-- 底部信息 -->
    <div class="editor-footer">
      <span v-if="diary?.createdAt">
        创建于 {{ formatDate(diary.createdAt) }}
      </span>
      <span v-if="wordCount > 0">{{ wordCount }} 字</span>
      <span v-if="images.length > 0">{{ images.length }} 张图片</span>
    </div>

    <!-- 图片预览模态框 -->
    <div v-if="previewUrl" class="image-preview-modal" @click="previewUrl = null">
      <img :src="previewUrl" @click.stop />
      <button class="preview-close" @click="previewUrl = null">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import type { Diary } from '../utils/db'
import { imageStore } from '../utils/imageStore'

interface Props {
  diary?: Diary | null
}

interface ImageItem {
  id: string
  url: string
  isNew?: boolean // 标记是否为新添加的（未保存到数据库）
}

const props = defineProps<Props>()
const emit = defineEmits<{
  back: []
  save: [diary: { id?: string; title: string; content: string; tags: string[]; images: string[]; createdAt?: number }]
}>()

const title = ref('')
const content = ref('')
const tags = ref<string[]>([])
const images = ref<ImageItem[]>([])
const tagInput = ref('')
const showTagInput = ref(false)
const contentRef = ref<HTMLTextAreaElement>()
const fileInput = ref<HTMLInputElement>()
const cameraInput = ref<HTMLInputElement>()
const previewUrl = ref<string | null>(null)
const deletedImageIds = ref<string[]>([]) // 记录被删除的图片 ID

const isEditing = computed(() => !!props.diary)
const canSave = computed(() => title.value.trim() || content.value.trim() || images.value.length > 0)
const wordCount = computed(() => content.value.trim().length)

onMounted(async () => {
  if (props.diary) {
    title.value = props.diary.title
    content.value = props.diary.content
    tags.value = [...props.diary.tags]
    
    // 加载已有图片
    if (props.diary.images && props.diary.images.length > 0) {
      const loadedImages: ImageItem[] = []
      for (const imageId of props.diary.images) {
        const url = await imageStore.getImage(imageId)
        if (url) {
          loadedImages.push({ id: imageId, url })
        }
      }
      images.value = loadedImages
    }
  }
  nextTick(() => {
    contentRef.value?.focus()
  })
})

onUnmounted(() => {
  // 清理新添加但未保存的图片 URL
  images.value.forEach(img => {
    if (img.isNew && img.url.startsWith('blob:')) {
      URL.revokeObjectURL(img.url)
    }
  })
})

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag)
  }
  tagInput.value = ''
}

function removeTag(tag: string) {
  tags.value = tags.value.filter(t => t !== tag)
}

// 触发文件选择
function triggerImageUpload() {
  fileInput.value?.click()
}

// 触发相机拍照
function triggerCamera() {
  cameraInput.value?.click()
}

// 处理文件选择
async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  await addImagesFromFiles(Array.from(files))
  
  // 清空 input，允许重复选择相同文件
  target.value = ''
}

// 处理粘贴
async function handlePaste(event: ClipboardEvent) {
  const items = event.clipboardData?.items
  if (!items) return

  const imageFiles: File[] = []
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        imageFiles.push(file)
      }
    }
  }

  if (imageFiles.length > 0) {
    event.preventDefault()
    await addImagesFromFiles(imageFiles)
  }
}

// 从文件添加图片
async function addImagesFromFiles(files: File[]) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    
    // 创建本地预览 URL
    const localUrl = URL.createObjectURL(file)
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    images.value.push({
      id: tempId,
      url: localUrl,
      isNew: true
    })
  }
}

// 删除图片
function removeImage(index: number) {
  const img = images.value[index]
  
  // 如果是已保存的图片，记录 ID 以便后续删除
  if (!img.isNew && !img.id.startsWith('temp_')) {
    deletedImageIds.value.push(img.id)
  }
  
  // 释放临时 URL
  if (img.isNew && img.url.startsWith('blob:')) {
    URL.revokeObjectURL(img.url)
  }
  
  images.value.splice(index, 1)
}

// 预览图片
function previewImage(url: string) {
  previewUrl.value = url
}

// 保存日记
async function save() {
  if (!canSave.value) return
  
  const diaryId = props.diary?.id || generateId()
  const savedImageIds: string[] = []
  
  // 保存新图片到数据库
  for (const img of images.value) {
    if (img.isNew && img.id.startsWith('temp_')) {
      // 获取 blob 数据
      const response = await fetch(img.url)
      const blob = await response.blob()
      
      // 保存到 imageStore
      const imageId = await imageStore.saveImage(diaryId, blob)
      savedImageIds.push(imageId)
      
      // 释放临时 URL
      URL.revokeObjectURL(img.url)
    } else {
      // 已存在的图片
      savedImageIds.push(img.id)
    }
  }
  
  // 删除被移除的图片
  for (const imageId of deletedImageIds.value) {
    await imageStore.deleteImage(imageId)
  }
  
  emit('save', {
    id: diaryId,
    title: title.value.trim(),
    content: content.value,
    tags: [...tags.value],
    images: savedImageIds,
    createdAt: props.diary?.createdAt
  })
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.editor-title {
  font-weight: 600;
  color: #374151;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
  color: #374151;
}

.btn-icon svg {
  width: 20px;
  height: 20px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #6366f1;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary svg {
  width: 16px;
  height: 16px;
}

.tag-section {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tag-input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.tag-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.tag-input:focus {
  border-color: #6366f1;
  ring: 2px solid #e0e7ff;
}

.btn-small {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: #6366f1;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 20px;
  font-size: 13px;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: rgba(67, 56, 202, 0.2);
  color: #4338ca;
  font-size: 12px;
  cursor: pointer;
  line-height: 1;
}

.tag-remove:hover {
  background: rgba(67, 56, 202, 0.3);
}

.tag-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tag-readonly {
  padding: 4px 12px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 20px;
  font-size: 13px;
}

/* 图片画廊 */
.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  max-height: 150px;
  overflow-y: auto;
}

.image-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
}

.image-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .image-remove {
  opacity: 1;
}

.image-remove:hover {
  background: rgba(239, 68, 68, 0.9);
}

.image-remove svg {
  width: 14px;
  height: 14px;
}

.editor-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.title-input {
  padding: 20px 16px 12px;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  outline: none;
  background: transparent;
}

.title-input::placeholder {
  color: #9ca3af;
}

.content-input {
  flex: 1;
  padding: 16px;
  border: none;
  resize: none;
  font-size: 16px;
  line-height: 1.8;
  color: #374151;
  outline: none;
  background: transparent;
}

.content-input::placeholder {
  color: #9ca3af;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #9ca3af;
}

/* 图片预览模态框 */
.image-preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: zoom-out;
}

.image-preview-modal img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
}

.preview-close {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.preview-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.preview-close svg {
  width: 20px;
  height: 20px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

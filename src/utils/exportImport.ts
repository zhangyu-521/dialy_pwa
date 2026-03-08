/**
 * 日记导入导出工具
 * 
 * 支持两种导出格式：
 * 1. JSON 格式 - 小数据量，快速导出
 * 2. ZIP 格式 - 大数据量，包含独立图片文件
 * 
 * 数据格式规范 (版本 1.0.0):
 * {
 *   version: "1.0.0",
 *   exportAt: timestamp,
 *   app: "daily-diary",
 *   format: "json" | "zip",
 *   
 *   data: {
 *     diaries: [{
 *       id: string,
 *       title: string,
 *       content: string,
 *       tags: string[],
 *       images: string[],      // 图片文件名（ZIP格式）或ID（JSON格式）
 *       createdAt: number,
 *       updatedAt: number
 *     }]
 *   },
 *   
 *   meta: {
 *     totalDiaries: number,
 *     totalImages: number,
 *     totalSize: number
 *   }
 * }
 */

import type { Diary } from './db'
import { imageStore } from './imageStore'
import JSZip from 'jszip'

// 当前数据格式版本
const DATA_VERSION = '1.0.0'
const APP_NAME = 'daily-diary'

// 导出格式类型
export type ExportFormat = 'json' | 'zip'

// 导出数据结构
export interface ExportData {
  version: string
  exportAt: number
  app: string
  format: ExportFormat
  data: {
    diaries: Diary[]
  }
  meta: {
    totalDiaries: number
    totalImages: number
    totalSize: number
  }
}

// 导入结果
export interface ImportResult {
  success: boolean
  importedDiaries: number
  importedImages: number
  skippedDiaries: number
  errors: string[]
}

// 导入选项
export interface ImportOptions {
  duplicateStrategy: 'skip' | 'overwrite' | 'rename'
  importImages: boolean
}

// 导出选项
export interface ExportOptions {
  format: ExportFormat
}

/**
 * 将 Blob 转换为 Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 将 Base64 转换为 Blob
 */
function base64ToBlob(base64: string, type: string): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type })
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * 导出所有日记数据（JSON 格式）
 * 适合：小数据量，快速导出
 */
export async function exportAsJSON(diaries: Diary[]): Promise<{ data: ExportData; blob: Blob }> {
  const imagesBase64: Record<string, { data: string; type: string; diaryId: string }> = {}
  let totalImageSize = 0
  
  // 收集所有图片（Base64）
  for (const diary of diaries) {
    if (diary.images && diary.images.length > 0) {
      for (const imageId of diary.images) {
        try {
          const imageUrl = await imageStore.getImage(imageId)
          if (imageUrl && !imagesBase64[imageId]) {
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            const base64Data = await blobToBase64(blob)
            
            imagesBase64[imageId] = {
              data: base64Data,
              type: blob.type,
              diaryId: diary.id
            }
            totalImageSize += blob.size
          }
        } catch (error) {
          console.error(`Failed to export image ${imageId}:`, error)
        }
      }
    }
  }
  
  const exportData: ExportData = {
    version: DATA_VERSION,
    exportAt: Date.now(),
    app: APP_NAME,
    format: 'json',
    data: {
      diaries: diaries.map(d => ({ ...d }))
    },
    meta: {
      totalDiaries: diaries.length,
      totalImages: Object.keys(imagesBase64).length,
      totalSize: 0
    }
  }
  
  // 将图片数据嵌入到 JSON 中
  const fullData = {
    ...exportData,
    images: imagesBase64
  }
  
  const jsonString = JSON.stringify(fullData)
  const blob = new Blob([jsonString], { type: 'application/json' })
  exportData.meta.totalSize = blob.size
  
  return { data: exportData, blob }
}

/**
 * 导出所有日记数据（ZIP 格式）
 * 适合：大数据量，图片多，体积小
 */
export async function exportAsZIP(diaries: Diary[]): Promise<{ data: ExportData; blob: Blob }> {
  const zip = new JSZip()
  const imagesFolder = zip.folder('images')
  const imageNameMap = new Map<string, string>() // id -> filename
  let totalImageSize = 0
  
  // 收集并添加图片到 ZIP
  for (const diary of diaries) {
    if (diary.images && diary.images.length > 0) {
      for (let i = 0; i < diary.images.length; i++) {
        const imageId = diary.images[i]
        
        // 避免重复添加同一张图片
        if (imageNameMap.has(imageId)) {
          continue
        }
        
        try {
          const imageUrl = await imageStore.getImage(imageId)
          if (imageUrl) {
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            
            // 生成文件名：diaryId_index.ext
            const ext = blob.type.split('/')[1] || 'jpg'
            const filename = `${diary.id}_${i}.${ext}`
            
            imagesFolder?.file(filename, blob)
            imageNameMap.set(imageId, filename)
            totalImageSize += blob.size
          }
        } catch (error) {
          console.error(`Failed to export image ${imageId}:`, error)
        }
      }
    }
  }
  
  // 更新日记中的图片引用为文件名
  const diariesForExport = diaries.map(diary => ({
    ...diary,
    images: diary.images.map(id => imageNameMap.get(id) || id)
  }))
  
  const exportData: ExportData = {
    version: DATA_VERSION,
    exportAt: Date.now(),
    app: APP_NAME,
    format: 'zip',
    data: {
      diaries: diariesForExport
    },
    meta: {
      totalDiaries: diaries.length,
      totalImages: imageNameMap.size,
      totalSize: 0
    }
  }
  
  // 添加数据文件
  zip.file('data.json', JSON.stringify(exportData, null, 2))
  
  // 添加 README
  zip.file('README.txt', `日记备份文件
生成时间：${new Date().toLocaleString('zh-CN')}
日记数量：${diaries.length} 篇
图片数量：${imageNameMap.size} 张

文件说明：
- data.json: 日记数据（包含标题、内容、标签等）
- images/: 图片文件夹
- 导入时请使用此 ZIP 文件，不要解压后单独导入
`)
  
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  exportData.meta.totalSize = zipBlob.size
  
  return { data: exportData, blob: zipBlob }
}

/**
 * 导出所有日记（自动选择格式或指定格式）
 */
export async function exportAllData(
  diaries: Diary[],
  options: ExportOptions = { format: 'zip' }
): Promise<{ data: ExportData; blob: Blob; filename: string }> {
  const date = new Date().toISOString().split('T')[0]
  
  if (options.format === 'json') {
    const { data, blob } = await exportAsJSON(diaries)
    return { data, blob, filename: `diary-backup-${date}.json` }
  } else {
    const { data, blob } = await exportAsZIP(diaries)
    return { data, blob, filename: `diary-backup-${date}.zip` }
  }
}

/**
 * 导出到文件并下载
 */
export async function exportToFile(diaries: Diary[], format: ExportFormat = 'zip'): Promise<void> {
  const { blob, filename } = await exportAllData(diaries, { format })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 从文件导入数据
 */
export async function importFromFile(
  file: File,
  existingDiaries: Diary[],
  options: ImportOptions = {
    duplicateStrategy: 'skip',
    importImages: true
  }
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    importedDiaries: 0,
    importedImages: 0,
    skippedDiaries: 0,
    errors: []
  }
  
  try {
    if (file.name.toLowerCase().endsWith('.zip')) {
      // 导入 ZIP 文件
      return await importFromZIP(file, existingDiaries, options)
    } else if (file.name.toLowerCase().endsWith('.json')) {
      // 导入 JSON 文件
      return await importFromJSON(file, existingDiaries, options)
    } else {
      result.errors.push('不支持的文件格式，请使用 .json 或 .zip 文件')
      return result
    }
  } catch (error) {
    result.errors.push(`导入失败: ${error}`)
    return result
  }
}

/**
 * 从 JSON 文件导入
 */
async function importFromJSON(
  file: File,
  existingDiaries: Diary[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    importedDiaries: 0,
    importedImages: 0,
    skippedDiaries: 0,
    errors: []
  }
  
  const text = await file.text()
  const data = JSON.parse(text)
  
  if (!validateImportData(data, result.errors)) {
    return result
  }
  
  const existingIds = new Set(existingDiaries.map(d => d.id))
  const diariesToImport: Diary[] = []
  
  for (const diary of data.data.diaries) {
    let diaryId = diary.id || generateId()
    
    // 检查重复
    let shouldSkip = false
    if (existingIds.has(diaryId)) {
      switch (options.duplicateStrategy) {
        case 'skip':
          result.skippedDiaries++
          shouldSkip = true
          break
        case 'overwrite':
          break
        case 'rename':
          diaryId = generateId()
          break
      }
    }
    
    if (shouldSkip) {
      continue
    }
    
    const normalizedDiary: Diary = {
      id: diaryId,
      title: diary.title || '',
      content: diary.content || '',
      tags: Array.isArray(diary.tags) ? diary.tags : [],
      images: [], // 先为空，后面填充
      createdAt: diary.createdAt || Date.now(),
      updatedAt: diary.updatedAt || Date.now()
    }
    
    // 处理图片（Base64）
    const originalImages = Array.isArray(diary.images) ? diary.images : []
    if (options.importImages && data.images && originalImages.length > 0) {
      const newImageIds: string[] = []
      
      for (const imageId of originalImages) {
        const imgData = data.images[imageId]
        if (imgData) {
          try {
            const blob = base64ToBlob(imgData.data, imgData.type)
            const newImageId = await imageStore.saveImage(diaryId, blob)
            newImageIds.push(newImageId)
            result.importedImages++
          } catch (error) {
            result.errors.push(`图片导入失败 ${imageId}: ${error}`)
          }
        }
      }
      
      normalizedDiary.images = newImageIds
    }
    
    diariesToImport.push(normalizedDiary)
  }
  
  result.importedDiaries = diariesToImport.length
  result.success = true
  
  return {
    ...result,
    importedData: diariesToImport
  } as ImportResult & { importedData: Diary[] }
}

/**
 * 从 ZIP 文件导入
 */
async function importFromZIP(
  file: File,
  existingDiaries: Diary[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    importedDiaries: 0,
    importedImages: 0,
    skippedDiaries: 0,
    errors: []
  }
  
  const zip = await JSZip.loadAsync(file)
  
  // 读取数据文件
  const dataFile = zip.file('data.json')
  if (!dataFile) {
    result.errors.push('ZIP 文件中缺少 data.json')
    return result
  }
  
  const dataText = await dataFile.async('text')
  const data = JSON.parse(dataText)
  
  if (!validateImportData(data, result.errors)) {
    return result
  }
  
  const existingIds = new Set(existingDiaries.map(d => d.id))
  const diariesToImport: Diary[] = []
  
  for (const diary of data.data.diaries) {
    let diaryId = diary.id || generateId()
    
    // 检查重复
    let shouldSkip = false
    if (existingIds.has(diaryId)) {
      switch (options.duplicateStrategy) {
        case 'skip':
          result.skippedDiaries++
          shouldSkip = true
          break
        case 'overwrite':
          break
        case 'rename':
          diaryId = generateId()
          break
      }
    }
    
    if (shouldSkip) {
      continue
    }
    
    const normalizedDiary: Diary = {
      id: diaryId,
      title: diary.title || '',
      content: diary.content || '',
      tags: Array.isArray(diary.tags) ? diary.tags : [],
      images: [], // 先为空，后面填充
      createdAt: diary.createdAt || Date.now(),
      updatedAt: diary.updatedAt || Date.now()
    }
    
    // 处理图片（从 ZIP 中提取）
    const originalImages = Array.isArray(diary.images) ? diary.images : []
    if (options.importImages && originalImages.length > 0) {
      const newImageIds: string[] = []
      
      for (const imageFilename of originalImages) {
        const imageFile = zip.file(`images/${imageFilename}`)
        if (imageFile) {
          try {
            const blob = await imageFile.async('blob')
            const newImageId = await imageStore.saveImage(diaryId, blob)
            newImageIds.push(newImageId)
            result.importedImages++
          } catch (error) {
            result.errors.push(`图片导入失败 ${imageFilename}: ${error}`)
          }
        } else {
          result.errors.push(`ZIP 中找不到图片: images/${imageFilename}`)
        }
      }
      
      normalizedDiary.images = newImageIds
    }
    
    diariesToImport.push(normalizedDiary)
  }
  
  result.importedDiaries = diariesToImport.length
  result.success = true
  
  return {
    ...result,
    importedData: diariesToImport
  } as ImportResult & { importedData: Diary[] }
}

/**
 * 验证导入数据格式
 */
function validateImportData(data: any, errors: string[]): boolean {
  if (!data || typeof data !== 'object') {
    errors.push('无效的数据格式')
    return false
  }
  
  if (!data.version) {
    errors.push('缺少版本号字段')
    return false
  }
  
  const majorVersion = data.version.split('.')[0]
  const currentMajor = DATA_VERSION.split('.')[0]
  
  if (majorVersion !== currentMajor) {
    errors.push(`版本不兼容: 文件 v${data.version}, 应用 v${DATA_VERSION}`)
    return false
  }
  
  if (!data.data || !Array.isArray(data.data.diaries)) {
    errors.push('缺少日记数据')
    return false
  }
  
  return true
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 获取导出数据预览信息
 */
export function getExportPreview(data: ExportData): {
  diaryCount: number
  imageCount: number
  sizeFormatted: string
  dateFormatted: string
  format: ExportFormat
} {
  return {
    diaryCount: data.meta.totalDiaries,
    imageCount: data.meta.totalImages,
    sizeFormatted: formatFileSize(data.meta.totalSize),
    dateFormatted: new Date(data.exportAt).toLocaleString('zh-CN'),
    format: data.format
  }
}

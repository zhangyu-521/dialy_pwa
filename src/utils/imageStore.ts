/**
 * 图片存储类
 * 使用 IndexedDB 单独存储图片 Blob（与日记数据分开）
 */

const DB_NAME = 'DiaryImagesDB'
const DB_VERSION = 1
const STORE_NAME = 'images'

export interface DiaryImage {
  id: string
  diaryId: string
  blob: Blob
  url: string // Object URL for display
  type: string
  size: number
  createdAt: number
}

class ImageDatabase {
  private db: IDBDatabase | null = null
  private urlCache = new Map<string, string>()

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('diaryId', 'diaryId', { unique: false })
        }
      }
    })
  }

  private getStore(mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized')
    const transaction = this.db.transaction(STORE_NAME, mode)
    return transaction.objectStore(STORE_NAME)
  }

  /**
   * 保存图片
   */
  async saveImage(diaryId: string, file: File | Blob): Promise<string> {
    const id = `${diaryId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite')
      const imageData = {
        id,
        diaryId,
        blob: file,
        type: file instanceof File ? file.type : 'image/png',
        size: file.size,
        createdAt: Date.now()
      }
      
      const request = store.put(imageData)
      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取图片并创建 Object URL
   */
  async getImage(id: string): Promise<string | null> {
    // 检查缓存
    if (this.urlCache.has(id)) {
      return this.urlCache.get(id)!
    }

    return new Promise((resolve, reject) => {
      const store = this.getStore('readonly')
      const request = store.get(id)

      request.onsuccess = () => {
        const result = request.result
        if (result) {
          const url = URL.createObjectURL(result.blob)
          this.urlCache.set(id, url)
          resolve(url)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取日记的所有图片
   */
  async getImagesByDiary(diaryId: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readonly')
      const index = store.index('diaryId')
      const request = index.getAll(diaryId)

      request.onsuccess = async () => {
        const results = request.result
        const imageIds: string[] = []
        
        for (const item of results) {
          imageIds.push(item.id)
          // 预创建 URL
          if (!this.urlCache.has(item.id)) {
            const url = URL.createObjectURL(item.blob)
            this.urlCache.set(item.id, url)
          }
        }
        
        resolve(imageIds)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除单张图片
   */
  async deleteImage(id: string): Promise<void> {
    // 释放 URL
    if (this.urlCache.has(id)) {
      URL.revokeObjectURL(this.urlCache.get(id)!)
      this.urlCache.delete(id)
    }

    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite')
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除日记的所有图片
   */
  async deleteImagesByDiary(diaryId: string): Promise<void> {
    const imageIds = await this.getImagesByDiary(diaryId)
    
    for (const id of imageIds) {
      await this.deleteImage(id)
    }
  }

  /**
   * 获取图片信息（不包含 blob）
   */
  async getImageInfo(id: string): Promise<{ id: string; diaryId: string; type: string; size: number; createdAt: number } | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readonly')
      const request = store.get(id)

      request.onsuccess = () => {
        const result = request.result
        if (result) {
          resolve({
            id: result.id,
            diaryId: result.diaryId,
            type: result.type,
            size: result.size,
            createdAt: result.createdAt
          })
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 清理所有缓存的 URL
   */
  clearCache(): void {
    for (const url of this.urlCache.values()) {
      URL.revokeObjectURL(url)
    }
    this.urlCache.clear()
  }
}

export const imageStore = new ImageDatabase()

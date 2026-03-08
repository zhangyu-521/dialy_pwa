/**
 * IndexedDB 数据库操作类
 * 用于本地存储日记数据
 */

const DB_NAME = 'DailyDiaryDB'
const DB_VERSION = 1
const STORE_NAME = 'diaries'

export interface Diary {
  id: string
  title: string
  content: string
  tags: string[]
  images: string[] // 图片 ID 列表
  createdAt: number
  updatedAt: number
}

class DiaryDatabase {
  private db: IDBDatabase | null = null

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
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true })
        }
      }
    })
  }

  private getStore(mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized')
    const transaction = this.db.transaction(STORE_NAME, mode)
    return transaction.objectStore(STORE_NAME)
  }

  async getAll(): Promise<Diary[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readonly')
      const request = store.index('createdAt').openCursor(null, 'prev')
      const diaries: Diary[] = []

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          diaries.push(cursor.value)
          cursor.continue()
        } else {
          resolve(diaries)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getById(id: string): Promise<Diary | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readonly')
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async save(diary: Omit<Diary, 'createdAt' | 'updatedAt'> & { createdAt?: number }): Promise<Diary> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite')
      const now = Date.now()
      
      // 将数据转换为纯 JavaScript 对象（解除 Vue 响应式代理）
      const diaryToSave: Diary = {
        id: diary.id,
        title: String(diary.title || ''),
        content: String(diary.content || ''),
        tags: Array.isArray(diary.tags) ? [...diary.tags] : [],
        images: Array.isArray(diary.images) ? [...diary.images] : [],
        createdAt: diary.createdAt || now,
        updatedAt: now
      }
      
      const request = store.put(diaryToSave)

      request.onsuccess = () => resolve(diaryToSave)
      request.onerror = () => reject(request.error)
    })
  }

  async delete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite')
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async search(query: string): Promise<Diary[]> {
    const all = await this.getAll()
    const lowerQuery = query.toLowerCase()
    return all.filter(diary => 
      diary.title.toLowerCase().includes(lowerQuery) ||
      diary.content.toLowerCase().includes(lowerQuery) ||
      diary.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  async getByTag(tag: string): Promise<Diary[]> {
    const all = await this.getAll()
    return all.filter(diary => diary.tags.includes(tag))
  }

  async getAllTags(): Promise<string[]> {
    const all = await this.getAll()
    const tagSet = new Set<string>()
    all.forEach(diary => {
      diary.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }
}

export const db = new DiaryDatabase()

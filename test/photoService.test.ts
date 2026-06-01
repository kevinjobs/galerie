import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PhotoService } from '../prisma/lib/photoService'
import { db } from '../prisma/lib/db'

vi.mock('../prisma/lib/db', () => {
  const mockDb = {
    photo: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  }
  return { db: mockDb }
})

describe('PhotoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getByUid', () => {
    it('存在返回照片', async () => {
      ;(db.photo.findUnique as any).mockResolvedValue({ uid: 'photo-uid', title: 'Test' })
      const result = await PhotoService.getByUid('photo-uid')
      expect(result?.uid).toBe('photo-uid')
    })

    it('不存在返回 null', async () => {
      ;(db.photo.findUnique as any).mockResolvedValue(null)
      const result = await PhotoService.getByUid('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('deleteByUid', () => {
    it('腾讯云图片不删文件', async () => {
      ;(db.photo.findUnique as any).mockResolvedValue({ uid: 'photo-uid', src: 'tencent:bucket/photo.jpg' })
      ;(db.photo.delete as any).mockResolvedValue(undefined)
      await PhotoService.deleteByUid('photo-uid')
      expect(db.photo.delete).toHaveBeenCalledWith({ where: { uid: 'photo-uid' } })
    })
  })

  describe('add', () => {
    it('创建照片', async () => {
      ;(db.photo.create as any).mockResolvedValue({ uid: 'photo-uid', title: 'Test' })
      const result = await PhotoService.add({ title: 'Test', src: 'local:test.jpg' })
      expect(result.uid).toBe('photo-uid')
    })
  })

  describe('updateByUid', () => {
    it('更新照片', async () => {
      ;(db.photo.update as any).mockResolvedValue({ uid: 'photo-uid', title: 'Updated' })
      const result = await PhotoService.updateByUid('photo-uid', { title: 'Updated', src: 'test.jpg' })
      expect(result.title).toBe('Updated')
    })
  })

  describe('getAll', () => {
    it('返回列表', async () => {
      ;(db.photo.count as any).mockResolvedValue(1)
      ;(db.photo.findMany as any).mockResolvedValue([{ id: 1, uid: 'photo-1', title: 'Photo 1' }])
      const result = await PhotoService.getAll({})
      expect(result.lists).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })
})

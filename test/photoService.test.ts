import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PhotoService } from '../prisma/lib/photoService'

const mockDb = vi.hoisted(() => ({
  photo: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
}))

vi.mock('@/prisma/lib/db', () => ({
  db: mockDb,
}))

import { db } from '@/prisma/lib/db'

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

    it('本地图片删除时调用 db.delete', async () => {
      ;(db.photo.findUnique as any).mockResolvedValue({ uid: 'photo-uid', src: 'local:test.jpg' })
      ;(db.photo.delete as any).mockResolvedValue(undefined)
      await PhotoService.deleteByUid('photo-uid')
      expect(db.photo.delete).toHaveBeenCalledWith({ where: { uid: 'photo-uid' } })
    })

    it('照片不存在时仍调用 delete（Prisma 会抛错）', async () => {
      ;(db.photo.findUnique as any).mockResolvedValue(null)
      ;(db.photo.delete as any).mockRejectedValue(new Error('Photo not found'))
      await expect(PhotoService.deleteByUid('nonexistent')).rejects.toThrow('Photo not found')
    })
  })

  describe('add', () => {
    it('创建照片', async () => {
      ;(db.photo.create as any).mockResolvedValue({ uid: 'photo-uid', title: 'Test' })
      const result = await PhotoService.add({ title: 'Test', src: 'local:test.jpg' })
      expect(result.uid).toBe('photo-uid')
    })

    it('创建照片包含所有可选字段', async () => {
      const input = {
        title: 'Test',
        src: 'tencent:bucket/photo.jpg',
        description: 'A test photo',
        location: 'Beijing',
        shootTime: new Date('2024-01-01'),
        isPublic: true,
        isSelected: true,
        author: 'John Doe',
      }
      ;(db.photo.create as any).mockResolvedValue({ uid: 'photo-uid', ...input })
      const result = await PhotoService.add(input)
      expect(result.uid).toBe('photo-uid')
      expect(db.photo.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ isPublic: true, isSelected: true }),
      }))
    })

    it('默认 type 不为 avatar', async () => {
      ;(db.photo.create as any).mockResolvedValue({ uid: 'photo-uid', title: 'Test', type: 'photo' })
      const result = await PhotoService.add({ title: 'Test', src: 'local:test.jpg' })
      expect(result.type).toBe('photo')
    })
  })

  describe('updateByUid', () => {
    it('更新照片', async () => {
      ;(db.photo.update as any).mockResolvedValue({ uid: 'photo-uid', title: 'Updated' })
      const result = await PhotoService.updateByUid('photo-uid', { title: 'Updated', src: 'test.jpg' })
      expect(result.title).toBe('Updated')
    })

    it('照片不存在时抛错', async () => {
      ;(db.photo.update as any).mockRejectedValue(new Error('Not found'))
      await expect(PhotoService.updateByUid('nonexistent', { title: 'Test' })).rejects.toThrow('Not found')
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

    it('按 isPublic 筛选照片', async () => {
      ;(db.photo.count as any).mockResolvedValue(1)
      ;(db.photo.findMany as any).mockResolvedValue([{ id: 1, uid: 'photo-1', title: 'Public Photo', isPublic: true }])
      await PhotoService.getAll({ isPublic: true })
      expect(db.photo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isPublic: true, type: { not: 'avatar' } }),
        })
      )
    })

    it('按 isSelected 筛选照片', async () => {
      ;(db.photo.count as any).mockResolvedValue(5)
      ;(db.photo.findMany as any).mockResolvedValue([{ id: 1, uid: 'photo-1', isSelected: true }])
      await PhotoService.getAll({ isSelected: true })
      expect(db.photo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isSelected: true }),
        })
      )
    })

    it('自定义 offset 和 limit', async () => {
      ;(db.photo.count as any).mockResolvedValue(100)
      ;(db.photo.findMany as any).mockResolvedValue([{ id: 1 }])
      await PhotoService.getAll({ offset: 10, limit: 20 })
      expect(db.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        })
      )
    })

    it('自定义 orderBy 和 order', async () => {
      ;(db.photo.count as any).mockResolvedValue(100)
      ;(db.photo.findMany as any).mockResolvedValue([{ id: 1 }])
      await PhotoService.getAll({ orderBy: 'title', order: 'asc' })
      expect(db.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'asc' },
        })
      )
    })

    it('不安全的 orderBy 被替换为默认 shootTime', async () => {
      ;(db.photo.count as any).mockResolvedValue(100)
      ;(db.photo.findMany as any).mockResolvedValue([{ id: 1 }])
      await PhotoService.getAll({ orderBy: 'unsafe_field', order: 'desc' })
      expect(db.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { shootTime: 'desc' },
        })
      )
    })

    it('不安全的 order 被替换为默认 desc', async () => {
      ;(db.photo.count as any).mockResolvedValue(100)
      ;(db.photo.findMany as any).mockResolvedValue([{ id: 1 }])
      await PhotoService.getAll({ orderBy: 'title', order: 'unsafe' })
      expect(db.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'desc' },
        })
      )
    })

    it('order=random 时随机抽样', async () => {
      ;(db.photo.count as any).mockResolvedValue(100)
      ;(db.photo.findMany as any).mockResolvedValue([{ id: 1 }, { id: 2 }])
      const result = await PhotoService.getAll({ order: 'random', limit: 10 })
      expect(result.lists).toHaveLength(2)
      expect(result.total).toBe(100)
      // 应该使用随机 offset
      const callArg = (db.photo.findMany as any).mock.calls[0][0]
      expect(callArg.skip).toBeGreaterThanOrEqual(0)
      expect(callArg.skip).toBeLessThanOrEqual(90) // count - limit + 1
      expect(callArg.orderBy).toEqual({ id: 'asc' })
    })

    it('order=random 且 count < limit 时 skip=0', async () => {
      ;(db.photo.count as any).mockResolvedValue(5)
      ;(db.photo.findMany as any).mockResolvedValue([{ id: 1 }])
      await PhotoService.getAll({ order: 'random', limit: 10 })
      const callArg = (db.photo.findMany as any).mock.calls[0][0]
      expect(callArg.skip).toBe(0)
    })

    it('type=avatar 的照片被排除', async () => {
      ;(db.photo.count as any).mockResolvedValue(10)
      ;(db.photo.findMany as any).mockResolvedValue([])
      await PhotoService.getAll({})
      expect(db.photo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: { not: 'avatar' } }),
        })
      )
    })
  })
})

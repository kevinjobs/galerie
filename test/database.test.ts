import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserService } from '../prisma/lib/userService'
import { PhotoService } from '../prisma/lib/photoService'

// Mock the database
vi.mock('../prisma/lib/db', () => {
  const mockDb = {
    user: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    photo: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    verifyCode: {
      findFirst: vi.fn(),
    },
  }
  return { db: mockDb }
})

vi.mock('fs/promises', () => ({
  access: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
}))

describe('Database Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('UserService', () => {
    describe('hashPassword', () => {
      it('应该成功哈希密码', async () => {
        const hashed = await UserService.hashPassword('testpassword')
        expect(typeof hashed).toBe('string')
        expect(hashed.includes(':')).toBe(true)
      })
    })

    describe('verifyPassword', () => {
      it('应该正确验证密码', async () => {
        const password = 'testpassword'
        const hashed = await UserService.hashPassword(password)
        const isValid = await UserService.verifyPassword(password, hashed)
        expect(isValid).toBe(true)
      })

      it('应该返回 false 对于错误密码', async () => {
        const password = 'testpassword'
        const hashed = await UserService.hashPassword(password)
        const isValid = await UserService.verifyPassword('wrongpassword', hashed)
        expect(isValid).toBe(false)
      })
    })

    describe('add', () => {
      it('应该创建用户', async () => {
        const mockUser = {
          id: 1,
          uid: 'test-uid',
          name: 'testuser',
          nickname: 'Test User',
          email: 'test@example.com',
          password: 'hashedpassword',
          permissions: ['photo.create', 'photo.get'],
          setting: null,
        }

        const { db } = await import('../prisma/lib/db')
          ; (db.user.create as any).mockResolvedValue(mockUser)

        const result = await UserService.add({
          name: 'testuser',
          email: 'test@example.com',
          password: 'testpassword',
        })

        expect(result).toBeDefined()
        expect(result.uid).toBe('test-uid')
        expect(result.name).toBe('testuser')
        expect('password' in result).toBe(false) // 密码不应返回
      })
    })

    describe('getUserByEmail', () => {
      it('应该通过邮箱找到用户', async () => {
        const mockUser = {
          id: 1,
          uid: 'test-uid',
          name: 'testuser',
          nickname: 'Test User',
          email: 'test@example.com',
          password: 'hashedpassword',
          permissions: null,
          setting: null,
        }

        const { db } = await import('../prisma/lib/db')
          ; (db.user.findUnique as any).mockResolvedValue(mockUser)

        const result = await UserService.getUserByEmail('test@example.com')
        expect(result).toBeDefined()
        expect(result?.email).toBe('test@example.com')
      })

      it('应该返回 null 当用户不存在时', async () => {
        const { db } = await import('../prisma/lib/db')
          ; (db.user.findUnique as any).mockResolvedValue(null)

        const result = await UserService.getUserByEmail('nonexistent@example.com')
        expect(result).toBeNull()
      })
    })

    describe('checkVerifyCode', () => {
      it('应该验证验证码', async () => {
        const { db } = await import('../prisma/lib/db')
          ; (db.verifyCode.findFirst as any).mockResolvedValue({ id: 1 })

        const isValid = await UserService.checkVerifyCode('test@example.com', '123456')
        expect(isValid).toBe(true)
      })

      it('应该返回 false 当验证码无效时', async () => {
        const { db } = await import('../prisma/lib/db')
          ; (db.verifyCode.findFirst as any).mockResolvedValue(null)

        const isValid = await UserService.checkVerifyCode('test@example.com', 'wrongcode')
        expect(isValid).toBe(false)
      })
    })
  })

  describe('PhotoService', () => {
    describe('add', () => {
      it('应该创建照片', async () => {
        const mockPhoto = {
          id: 1,
          uid: 'test-photo-uid',
          title: 'Test Photo',
          src: 'tencent:photo.jpg',
          description: 'A test photo',
          location: null,
          shootTime: new Date(),
          createTime: new Date(),
          updateTime: null,
          exif: null,
          author: null,
          isPublic: false,
          isSelected: false,
        }

        const { db } = await import('../prisma/lib/db')
          ; (db.photo.create as any).mockResolvedValue(mockPhoto)

        const result = await PhotoService.add({
          title: 'Test Photo',
          src: 'tencent:photo.jpg',
          description: 'A test photo',
        })

        expect(result).toBeDefined()
        expect(result.title).toBe('Test Photo')
      })
    })

    describe('getAll', () => {
      it('应该获取照片列表', async () => {
        const mockPhotos = [
          { id: 1, uid: 'photo1', title: 'Photo 1', src: 'photo1.jpg' },
          { id: 2, uid: 'photo2', title: 'Photo 2', src: 'photo2.jpg' },
        ]

        const { db } = await import('../prisma/lib/db')
          ; (db.photo.count as any).mockResolvedValue(2)
          ; (db.photo.findMany as any).mockResolvedValue(mockPhotos)

        const result = await PhotoService.getAll({
          offset: 0,
          limit: 10,
          orderBy: 'shootTime',
          order: 'desc',
        })

        expect(result.lists).toHaveLength(2)
        expect(result.total).toBe(2)
      })

      it('应该按 isPublic 筛选照片', async () => {
        const mockPhotos = [
          { id: 1, uid: 'photo1', title: 'Public Photo', src: 'photo1.jpg', isPublic: true },
        ]

        const { db } = await import('../prisma/lib/db')
          ; (db.photo.count as any).mockResolvedValue(1)
          ; (db.photo.findMany as any).mockResolvedValue(mockPhotos)

        const result = await PhotoService.getAll({
          isPublic: true,
        })

        expect(result.lists).toHaveLength(1)
        expect(db.photo.count).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ isPublic: true }),
          })
        )
      })
    })

    describe('updateByUid', () => {
      it('应该更新照片', async () => {
        const mockUpdatedPhoto = {
          id: 1,
          uid: 'photo-uid',
          title: 'Updated Photo',
          src: 'photo.jpg',
          description: 'Updated description',
          location: null,
          shootTime: new Date(),
          createTime: new Date(),
          updateTime: new Date(),
          exif: null,
          author: null,
          isPublic: true,
          isSelected: true,
        }

        const { db } = await import('../prisma/lib/db')
          ; (db.photo.update as any).mockResolvedValue(mockUpdatedPhoto)

        const result = await PhotoService.updateByUid('photo-uid', {
          title: 'Updated Photo',
          src: 'photo.jpg',
          description: 'Updated description',
          isPublic: true,
          isSelected: true,
        })

        expect(result?.title).toBe('Updated Photo')
        expect(result?.isPublic).toBe(true)
      })

      it('应该抛出错误当照片不存在时', async () => {
        const { db } = await import('../prisma/lib/db')
          ; (db.photo.update as any).mockRejectedValue(new Error('Not found'))

        await expect(
          PhotoService.updateByUid('nonexistent-uid', { title: 'Test', src: 'test.jpg' })
        ).rejects.toThrow('Photo not found')
      })
    })
  })
})

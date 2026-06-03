import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserService } from '../prisma/lib/userService'

// Use vi.hoisted to define mock before vi.mock is hoisted
const mockDb = vi.hoisted(() => ({
  user: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
}))

vi.mock('@/prisma/lib/db', () => ({
  db: mockDb,
}))

import { db } from '@/prisma/lib/db'

// Mock crypto at module level
vi.mock('crypto', () => {
  const cryptoMock = {
    randomBytes: (size: number) => {
      const buffer = Buffer.alloc(size)
      buffer.fill('test')
      return buffer
    },
    scrypt: (password: string, salt: string, keylen: number, callback: any) => {
      const derivedKey = Buffer.from('derivedkey', 'hex')
      callback(null, derivedKey)
    },
  }
  return { default: cryptoMock, ...cryptoMock }
})

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('deleteByUid', () => {
    it('成功删除用户', async () => {
      ;(db.user.delete as any).mockResolvedValue(undefined)

      await UserService.deleteByUid('user-uid')

      expect(db.user.delete).toHaveBeenCalledWith({ where: { uid: 'user-uid' } })
    })

    it('用户不存在时 Prisma 抛错', async () => {
      ;(db.user.delete as any).mockRejectedValue(new Error('User not found'))

      await expect(UserService.deleteByUid('nonexistent')).rejects.toThrow('User not found')
    })
  })

  describe('getUserByUid', () => {
    it('存在返回用户（不含密码）', async () => {
      const mockUser = {
        id: 1,
        uid: 'user-uid',
        name: 'testuser',
        email: 'test@example.com',
        nickname: 'Test User',
        password: 'hashedpassword',
        permissions: ['photo.get'],
        setting: null,
        avatar: null,
      }
      ;(db.user.findUnique as any).mockResolvedValue(mockUser)

      const result = await UserService.getUserByUid('user-uid')

      expect(result).toBeDefined()
      expect(result?.uid).toBe('user-uid')
      expect(result?.name).toBe('testuser')
      expect(result?.password).toBeUndefined()
    })

    it('不存在返回 null', async () => {
      ;(db.user.findUnique as any).mockResolvedValue(null)

      const result = await UserService.getUserByUid('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('getUserByName', () => {
    it('存在返回用户（不含密码）', async () => {
      const mockUser = {
        id: 1,
        uid: 'user-uid',
        name: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      }
      ;(db.user.findUnique as any).mockResolvedValue(mockUser)

      const result = await UserService.getUserByName('testuser')

      expect(result).toBeDefined()
      expect(result?.name).toBe('testuser')
      expect(result?.password).toBeUndefined()
    })

    it('不存在返回 null', async () => {
      ;(db.user.findUnique as any).mockResolvedValue(null)

      const result = await UserService.getUserByName('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('getAll', () => {
    it('返回所有用户（不含密码）', async () => {
      const mockUsers = [
        { id: 1, uid: 'user-1', name: 'user1', email: 'user1@example.com', password: 'hash1' },
        { id: 2, uid: 'user-2', name: 'user2', email: 'user2@example.com', password: 'hash2' },
      ]
      ;(db.user.findMany as any).mockResolvedValue(mockUsers)

      const result = await UserService.getAll()

      expect(result).toHaveLength(2)
      expect(result[0].password).toBeUndefined()
      expect(result[1].password).toBeUndefined()
    })
  })

  describe('update', () => {
    it('成功更新用户', async () => {
      const mockUpdatedUser = {
        id: 1,
        uid: 'user-uid',
        name: 'testuser',
        email: 'test@example.com',
        nickname: 'Updated Nickname',
        password: 'oldhash',
        permissions: ['photo.get'],
      }
      ;(db.user.update as any).mockResolvedValue(mockUpdatedUser)

      const result = await UserService.update('user-uid', { nickname: 'Updated Nickname' })

      expect(result.nickname).toBe('Updated Nickname')
      expect(result.password).toBeUndefined()
      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { uid: 'user-uid' },
          data: { nickname: 'Updated Nickname' },
        })
      )
    })

    it('密码更新时重新哈希', async () => {
      const mockUpdatedUser = {
        id: 1,
        uid: 'user-uid',
        name: 'testuser',
        email: 'test@example.com',
        password: 'newhash',
      }
      ;(db.user.update as any).mockResolvedValue(mockUpdatedUser)

      const result = await UserService.update('user-uid', { password: 'newpassword' })

      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: expect.any(String), // Should be hashed
          }),
        })
      )
    })

    it('不传密码时不覆盖', async () => {
      const mockUpdatedUser = {
        id: 1,
        uid: 'user-uid',
        name: 'testuser',
        email: 'test@example.com',
        password: 'oldhash',
      }
      ;(db.user.update as any).mockResolvedValue(mockUpdatedUser)

      await UserService.update('user-uid', { nickname: 'New Nickname' })

      const callArg = (db.user.update as any).mock.calls[0][0]
      expect(callArg.data).not.toHaveProperty('password')
    })
  })
})

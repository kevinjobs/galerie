import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiTokenService, ApiTokenCreateInput } from '../prisma/lib/apiTokenService'
import { db } from '../prisma/lib/db'

// Mock the database
vi.mock('../prisma/lib/db', () => {
  const mockUpdate = vi.fn(() => Promise.resolve(undefined))
  const mockDb = {
    apiToken: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: mockUpdate,
    },
  }
  return { db: mockDb }
})

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

describe('ApiTokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('成功创建 token', async () => {
      const mockApiToken = {
        uid: 'token-uid',
        name: 'Test Token',
        expiresAt: null,
      }

      ;(db.apiToken.create as any).mockResolvedValue(mockApiToken)

      const input: ApiTokenCreateInput = {
        name: 'Test Token',
        permissions: ['photo.upload'],
        userPermissions: ['photo.upload', 'photo.get'],
        userId: 1,
      }

      const result = await ApiTokenService.create(input)

      expect(result.token).toBeDefined()
      expect(result.uid).toBe('token-uid')
      expect(result.name).toBe('Test Token')
      expect(db.apiToken.create).toHaveBeenCalled()
    })

    it('敏感权限拒绝', async () => {
      const input: ApiTokenCreateInput = {
        name: 'Test Token',
        permissions: ['user.get'],
        userPermissions: ['user.get', 'photo.get'],
        userId: 1,
      }

      await expect(ApiTokenService.create(input)).rejects.toThrow('仅限 JWT 使用')
    })

    it('超出用户权限拒绝', async () => {
      const input: ApiTokenCreateInput = {
        name: 'Test Token',
        permissions: ['photo.delete'],
        userPermissions: ['photo.get'],
        userId: 1,
      }

      await expect(ApiTokenService.create(input)).rejects.toThrow('超出了当前用户的权限范围')
    })

    it('expiresAt 为 null 时永不过期', async () => {
      const mockApiToken = { uid: 'token-uid', name: 'Test', expiresAt: null }
      ;(db.apiToken.create as any).mockResolvedValue(mockApiToken)

      const input: ApiTokenCreateInput = {
        name: 'Test',
        permissions: ['photo.get'],
        expiresAt: null,
        userPermissions: ['photo.get'],
        userId: 1,
      }

      const result = await ApiTokenService.create(input)
      expect(result.expiresAt).toBeNull()
    })

    it('expiresAt 正确设置', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const mockApiToken = { uid: 'token-uid', name: 'Test', expiresAt: futureDate }
      ;(db.apiToken.create as any).mockResolvedValue(mockApiToken)

      const input: ApiTokenCreateInput = {
        name: 'Test',
        permissions: ['photo.get'],
        expiresAt: futureDate,
        userPermissions: ['photo.get'],
        userId: 1,
      }

      const result = await ApiTokenService.create(input)
      expect(result.expiresAt).toEqual(futureDate)
    })
  })

  describe('getAllByUser', () => {
    it('返回用户所有 token', async () => {
      const mockTokens = [
        {
          uid: 'token-1',
          name: 'Token 1',
          permissions: ['photo.upload'],
          expiresAt: null,
          createdAt: new Date('2024-01-01'),
          lastUsedAt: null,
        },
        {
          uid: 'token-2',
          name: 'Token 2',
          permissions: ['photo.get'],
          expiresAt: new Date('2025-01-01'),
          createdAt: new Date('2024-06-01'),
          lastUsedAt: new Date('2024-12-01'),
        },
      ]

      ;(db.apiToken.findMany as any).mockResolvedValue(mockTokens)

      const result = await ApiTokenService.getAllByUser(1)

      expect(result).toHaveLength(2)
      expect(result[0].uid).toBe('token-1')
      expect(result[0].name).toBe('Token 1')
      expect(result[0].permissions).toEqual(['photo.upload'])
      expect(result[0].expiresAt).toBeNull()
    })

    it('按创建时间倒序', async () => {
      const mockTokens = [
        { uid: 'token-2', name: 'Token 2', permissions: [], expiresAt: null, createdAt: new Date('2024-06-01'), lastUsedAt: null },
        { uid: 'token-1', name: 'Token 1', permissions: [], expiresAt: null, createdAt: new Date('2024-01-01'), lastUsedAt: null },
      ]

      ;(db.apiToken.findMany as any).mockResolvedValue(mockTokens)

      await ApiTokenService.getAllByUser(1)

      const callArg = (db.apiToken.findMany as any).mock.calls[0][0]
      expect(callArg.orderBy).toEqual({ createdAt: 'desc' })
    })

    it('空列表返回空数组', async () => {
      ;(db.apiToken.findMany as any).mockResolvedValue([])

      const result = await ApiTokenService.getAllByUser(1)
      expect(result).toEqual([])
    })

    it('不包含 tokenHash', async () => {
      const mockTokens = [{ uid: 'token-1', name: 'Test', permissions: [], expiresAt: null, createdAt: new Date(), lastUsedAt: null }]
      ;(db.apiToken.findMany as any).mockResolvedValue(mockTokens)

      const result = await ApiTokenService.getAllByUser(1)
      expect(result[0]).not.toHaveProperty('tokenHash')
    })
  })

  describe('deleteByUid', () => {
    it('成功删除', async () => {
      const mockToken = { uid: 'token-1', userId: 1 }
      ;(db.apiToken.findUnique as any).mockResolvedValue(mockToken)
      ;(db.apiToken.delete as any).mockResolvedValue(undefined)

      await ApiTokenService.deleteByUid('token-1', 1)

      expect(db.apiToken.delete).toHaveBeenCalledWith({ where: { uid: 'token-1' } })
    })

    it('非所有者拒绝', async () => {
      const mockToken = { uid: 'token-1', userId: 999 }
      ;(db.apiToken.findUnique as any).mockResolvedValue(mockToken)

      await expect(ApiTokenService.deleteByUid('token-1', 1)).rejects.toThrow('unauthorized')
    })

    it('不存在拒绝', async () => {
      ;(db.apiToken.findUnique as any).mockResolvedValue(null)

      await expect(ApiTokenService.deleteByUid('nonexistent', 1)).rejects.toThrow('not found')
    })
  })

  describe('checkPermission', () => {
    it('有效 token 通过', async () => {
      const mockApiToken = {
        uid: 'token-1',
        tokenHash: 'hash123',
        permissions: ['photo.upload'],
        expiresAt: null,
      }
      ;(db.apiToken.findUnique as any).mockResolvedValue(mockApiToken)

      const result = await ApiTokenService.checkPermission('valid-token', 'photo.upload')
      expect(result).toBe(true)
    })

    it('过期 token 拒绝', async () => {
      const pastDate = new Date(Date.now() - 1000)
      const mockApiToken = {
        uid: 'token-1',
        tokenHash: 'hash123',
        permissions: ['photo.upload'],
        expiresAt: pastDate,
      }
      ;(db.apiToken.findUnique as any).mockResolvedValue(mockApiToken)

      const result = await ApiTokenService.checkPermission('valid-token', 'photo.upload')
      expect(result).toBe(false)
    })

    it('无权限拒绝', async () => {
      const mockApiToken = {
        uid: 'token-1',
        tokenHash: 'hash123',
        permissions: ['photo.get'],
        expiresAt: null,
      }
      ;(db.apiToken.findUnique as any).mockResolvedValue(mockApiToken)

      const result = await ApiTokenService.checkPermission('valid-token', 'photo.upload')
      expect(result).toBe(false)
    })

    it('敏感权限拒绝', async () => {
      const result = await ApiTokenService.checkPermission('any-token', 'user.get')
      expect(result).toBe(false)
    })

    it('token 不存在拒绝', async () => {
      ;(db.apiToken.findUnique as any).mockResolvedValue(null)

      const result = await ApiTokenService.checkPermission('invalid-token', 'photo.get')
      expect(result).toBe(false)
    })

    it('更新 lastUsedAt', async () => {
      const mockApiToken = {
        uid: 'token-1',
        tokenHash: 'hash123',
        permissions: ['photo.upload'],
        expiresAt: null,
      }
      ;(db.apiToken.findUnique as any).mockResolvedValue(mockApiToken)
      // The update mock should return a promise for .catch() compatibility
      ;(db.apiToken.update as any).mockImplementation(() => Promise.resolve(undefined))

      await ApiTokenService.checkPermission('valid-token', 'photo.upload')

      expect(db.apiToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { uid: 'token-1' },
          data: { lastUsedAt: expect.any(Date) },
        })
      )
    })
  })

  describe('getUserFromApiToken', () => {
    it('有效 token 返回用户信息', async () => {
      const mockApiToken = {
        uid: 'token-1',
        tokenHash: 'hash123',
        permissions: ['photo.upload'],
        expiresAt: null,
        user: {
          id: 1,
          uid: 'user-uid',
          name: 'testuser',
          email: 'test@example.com',
        },
      }
      ;(db.apiToken.findUnique as any).mockResolvedValue(mockApiToken)

      const result = await ApiTokenService.getUserFromApiToken('valid-token')

      expect(result).toBeDefined()
      expect(result?.id).toBe(1)
      expect(result?.uid).toBe('user-uid')
      expect(result?.name).toBe('testuser')
      expect(result?.permissions).toContain('photo.upload')
    })

    it('过期 token 返回 null', async () => {
      const pastDate = new Date(Date.now() - 1000)
      const mockApiToken = {
        uid: 'token-1',
        tokenHash: 'hash123',
        permissions: ['photo.upload'],
        expiresAt: pastDate,
        user: { id: 1, uid: 'user-uid', name: 'testuser', email: 'test@example.com' },
      }
      ;(db.apiToken.findUnique as any).mockResolvedValue(mockApiToken)

      const result = await ApiTokenService.getUserFromApiToken('valid-token')
      expect(result).toBeNull()
    })

    it('不存在返回 null', async () => {
      ;(db.apiToken.findUnique as any).mockResolvedValue(null)

      const result = await ApiTokenService.getUserFromApiToken('invalid-token')
      expect(result).toBeNull()
    })
  })
})

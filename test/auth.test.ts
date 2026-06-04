import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as jwt from 'jsonwebtoken'
import { AuthTool, UserInfo, JWT_ONLY_PERMISSIONS } from '../prisma/lib/auth'
import { PermissionError } from '../prisma/lib/errors'

// Mock crypto at module level (before import of auth.ts)
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
    randomInt: (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min,
  }
  return { default: cryptoMock, ...cryptoMock }
})

// Mock apiTokenService to prevent dynamic require errors in AuthTool
vi.mock('../prisma/lib/apiTokenService', () => ({
  ApiTokenService: {
    checkPermission: vi.fn().mockResolvedValue(false),
    getUserFromApiToken: vi.fn().mockResolvedValue(null),
  },
}))

describe('AuthTool', () => {
  const originalEnv = process.env.JWT_SECRET

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env.JWT_SECRET = originalEnv
  })

  describe('sign', () => {
    it('应该生成有效的 JWT', () => {
      const payload: UserInfo = {
        id: 1,
        uid: 'test-uid',
        name: 'testuser',
        email: 'test@example.com',
        role: 'contributor',
        isSuperuser: false,
        permissions: ['photo.get'],
      }
      const token = AuthTool.sign(payload)

      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)
    })

    it('生成的 JWT 应该使用 HS256 算法', () => {
      const payload = { id: 1, uid: 'test', name: 'test', email: 'test@test.com' }
      const token = AuthTool.sign(payload)

      const decoded = jwt.decode(token, { complete: true })
      expect(decoded).toBeDefined()
      expect((decoded as any).header.alg).toBe('HS256')
    })

    it('生成的 JWT 有效期应该是 7 天', () => {
      const payload = { id: 1, uid: 'test', name: 'test', email: 'test@test.com' }
      const token = AuthTool.sign(payload)
      const decoded = jwt.decode(token) as any

      const now = Math.floor(Date.now() / 1000)
      const expiresIn = decoded.exp - decoded.iat
      expect(expiresIn).toBe(7 * 24 * 60 * 60)
    })
  })

  describe('verify', () => {
    it('应该验证有效的 token 并返回 UserInfo', () => {
      const payload: UserInfo = {
        id: 1,
        uid: 'test-uid',
        name: 'testuser',
        email: 'test@example.com',
        role: 'contributor',
        isSuperuser: false,
        permissions: ['photo.get', 'photo.create'],
      }
      const token = AuthTool.sign(payload)
      const result = AuthTool.verify(token)

      expect(result.id).toBe(1)
      expect(result.uid).toBe('test-uid')
      expect(result.name).toBe('testuser')
      expect(result.email).toBe('test@example.com')
      expect(result.permissions).toContain('photo.get')
    })

    it('无效的 token 应该抛出 PermissionError', () => {
      expect(() => AuthTool.verify('invalid-token')).toThrow(PermissionError)
      expect(() => AuthTool.verify('invalid-token')).toThrow('无效的 Token')
    })
  })

  describe('decode', () => {
    it('应该解码有效的 token', () => {
      const payload: UserInfo = {
        id: 1,
        uid: 'test-uid',
        name: 'testuser',
        email: 'test@example.com',
        role: 'contributor',
        isSuperuser: false,
        permissions: ['photo.get'],
      }
      const token = AuthTool.sign(payload)
      const result = AuthTool.decode(token)

      expect(result).toBeDefined()
      expect(result?.id).toBe(1)
      expect(result?.uid).toBe('test-uid')
    })

    it('无效的 token 应该返回 null', () => {
      const result = AuthTool.decode('invalid-token')
      expect(result).toBeNull()
    })
  })

  describe('checkPermission', () => {
    it('JWT 路径：有权限时通过', async () => {
      const payload: UserInfo = {
        id: 1,
        uid: 'test',
        name: 'test',
        email: 'test@test.com',
        role: 'contributor',
        isSuperuser: false,
        permissions: ['photo.get'],
      }
      const token = AuthTool.sign(payload)
      const bearer = `Bearer ${token}`

      await expect(AuthTool.checkPermission(bearer, 'photo.get')).resolves.toBeUndefined()
    })

    it('JWT 路径：无权限时抛出 PermissionError', async () => {
      const payload: UserInfo = {
        id: 1,
        uid: 'test',
        name: 'test',
        email: 'test@test.com',
        role: 'viewer',
        isSuperuser: false,
        permissions: ['photo.get'],
      }
      const token = AuthTool.sign(payload)
      const bearer = `Bearer ${token}`

      await expect(AuthTool.checkPermission(bearer, 'photo.create')).rejects.toThrow(PermissionError)
    })

    it('无 token 时抛出 PermissionError', async () => {
      await expect(AuthTool.checkPermission(null, 'photo.get')).rejects.toThrow(PermissionError)
      await expect(AuthTool.checkPermission(null, 'photo.get')).rejects.toThrow('No Token Provided')
    })

    it('Bearer 前缀会被正确解析', async () => {
      const payload: UserInfo = {
        id: 1,
        uid: 'test',
        name: 'test',
        email: 'test@test.com',
        role: 'contributor',
        isSuperuser: false,
        permissions: ['photo.get'],
      }
      const token = AuthTool.sign(payload)

      await expect(AuthTool.checkPermission(`Bearer ${token}`, 'photo.get')).resolves.toBeUndefined()
      await expect(AuthTool.checkPermission(`bearer ${token}`, 'photo.get')).resolves.toBeUndefined()
    })
  })

  describe('getUserFromBearer', () => {
    it('JWT 返回用户信息', async () => {
      const payload: UserInfo = {
        id: 1,
        uid: 'test-uid',
        name: 'testuser',
        email: 'test@example.com',
        role: 'contributor',
        isSuperuser: false,
        permissions: ['photo.get'],
      }
      const token = AuthTool.sign(payload)
      const bearer = `Bearer ${token}`

      const result = await AuthTool.getUserFromBearer(bearer)

      expect(result).toBeDefined()
      expect(result?.id).toBe(1)
      expect(result?.uid).toBe('test-uid')
      expect(result?.permissions).toContain('photo.get')
    })

    it('无效 token 返回 null', async () => {
      const result = await AuthTool.getUserFromBearer('Bearer invalid-token')
      expect(result).toBeNull()
    })

    it('无 token 返回 null', async () => {
      const result = await AuthTool.getUserFromBearer(null)
      expect(result).toBeNull()
    })
  })

  describe('JWT_ONLY_PERMISSIONS', () => {
    it('包含所有敏感权限', () => {
      expect(JWT_ONLY_PERMISSIONS).toContain('user.get')
      expect(JWT_ONLY_PERMISSIONS).toContain('user.create')
      expect(JWT_ONLY_PERMISSIONS).toContain('user.update')
      expect(JWT_ONLY_PERMISSIONS).toContain('user.delete')
    })

    it('只包含 4 个权限', () => {
      expect(JWT_ONLY_PERMISSIONS).toHaveLength(4)
    })
  })

  describe('generateCode', () => {
    it('生成 6 位字符串', () => {
      const code = AuthTool.generateCode()
      expect(typeof code).toBe('string')
      expect(code.length).toBe(6)
    })

    it('所有字符都是数字', () => {
      const code = AuthTool.generateCode()
      expect(/^\d{6}$/.test(code)).toBe(true)
    })

    it('多次调用生成不同代码', () => {
      const codes = new Set()
      for (let i = 0; i < 100; i++) {
        codes.add(AuthTool.generateCode())
      }
      expect(codes.size).toBeGreaterThan(50)
    })
  })
})

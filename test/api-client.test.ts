import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './msw'
import {
  createPhoto,
  getPhotoLists,
  getPhotoByUid,
  updatePhoto,
  deletePhotoByUid,
  uploadPhoto,
  getAddress,
  getCosUploadInfo,
  getUserLists,
  updateUser,
  createUser,
  deleteUserByUid,
  registerUser,
  sendVerifyCode,
  signToken,
  changePassword,
  verifyToken,
  createApiToken,
  getApiTokens,
  deleteApiToken,
} from '../app/api'

beforeEach(() => {
  vi.clearAllMocks()
})

const success = (data: any) => HttpResponse.json(data, { status: 200 })
const failure = (error: string, status = 418) =>
  HttpResponse.json({ error }, { status })

// Track expected requests and their responses
interface Expectation {
  url: string
  method: string
  response: ReturnType<typeof success | typeof failure>
}

describe('API Client Functions', () => {
  describe('createPhoto', () => {
    it('成功创建照片', async () => {
      server.use(
        http.post('/api/photo', () => success({ uid: 'new-photo', title: 'Test' }))
      )
      const result = await createPhoto({
        title: 'Test', src: 'local:test.jpg', isPublic: false, isSelected: false,
      })
      expect(result.uid).toBe('new-photo')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.post('/api/photo', () => failure('Title already exists'))
      )
      await expect(createPhoto({ title: 'Test', src: 'local:test.jpg', isPublic: false, isSelected: false }))
        .rejects.toThrow('添加图片失败')
    })
  })

  describe('getPhotoLists', () => {
    it('正确构造查询参数', async () => {
      let capturedUrl = ''
      server.use(
        http.get('/api/photo/lists', ({ request }) => {
          capturedUrl = request.url
          return success({ lists: [], total: 0, offset: 0, limit: 10 })
        })
      )

      await getPhotoLists({ offset: 0, limit: 20, orderBy: 'title', order: 'asc', isPublic: true, isSelected: false })

      expect(capturedUrl).toContain('offset=0')
      expect(capturedUrl).toContain('limit=20')
      expect(capturedUrl).toContain('orderBy=title')
      expect(capturedUrl).toContain('order=asc')
      expect(capturedUrl).toContain('isPublic=true')
      expect(capturedUrl).toContain('isSelected=false')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.get('/api/photo/lists', () => failure('Database error'))
      )
      await expect(getPhotoLists()).rejects.toThrow('获取图片列表失败')
    })
  })

  describe('getPhotoByUid', () => {
    it('成功获取照片', async () => {
      server.use(
        http.get('/api/photo', () => success({ uid: 'photo-123', title: 'Test' }))
      )
      const result = await getPhotoByUid('photo-123')
      expect(result.uid).toBe('photo-123')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.get('/api/photo', () => failure('Photo not found'))
      )
      await expect(getPhotoByUid('nonexistent')).rejects.toThrow('获取图片失败')
    })
  })

  describe('updatePhoto', () => {
    it('成功更新照片', async () => {
      server.use(
        http.put('/api/photo', () => success({ uid: 'photo-123', title: 'Updated' }))
      )
      const result = await updatePhoto('photo-123', { title: 'Updated', isPublic: true })
      expect(result.title).toBe('Updated')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.put('/api/photo', () => failure('Photo not found'))
      )
      await expect(updatePhoto('nonexistent', { title: 'Test' })).rejects.toThrow('更新图片失败')
    })
  })

  describe('deletePhotoByUid', () => {
    it('成功删除照片', async () => {
      server.use(
        http.delete('/api/photo', () => HttpResponse.json({}))
      )
      await deletePhotoByUid('photo-123')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.delete('/api/photo', () => failure('Photo not found'))
      )
      await expect(deletePhotoByUid('nonexistent')).rejects.toThrow('删除图片失败')
    })
  })

  describe('uploadPhoto', () => {
    it('FormData 正确构造', async () => {
      let capturedHeaders: any = null
      server.use(
        http.post('/api/photo/upload', async ({ request }) => {
          capturedHeaders = request.headers
          return success({ src: 'local:uploaded.jpg' })
        })
      )

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await uploadPhoto(file)

      expect(result.src).toBe('local:uploaded.jpg')
      expect(capturedHeaders.get('authorization')).toBeDefined()
    })

    it('错误响应抛出', async () => {
      server.use(
        http.post('/api/photo/upload', () => failure('Upload failed'))
      )
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      await expect(uploadPhoto(file)).rejects.toThrow('上传图片失败')
    })
  })

  describe('getAddress', () => {
    it('调用后端 geocode API', async () => {
      let capturedUrl = ''
      server.use(
        http.get('/api/geocode', ({ request }) => {
          capturedUrl = request.url
          return success({
            regeocode: {
              formatted_address: '北京市朝阳区',
              addressComponent: { city: '北京市', province: '北京市' },
            },
          })
        })
      )

      const result = await getAddress('116.397428', '39.90923')
      expect(result.regeocode.formatted_address).toBe('北京市朝阳区')
      expect(capturedUrl).toContain('longitude=')
      expect(capturedUrl).toContain('latitude=')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.get('/api/geocode', () =>
          HttpResponse.json({ error: '地址解析失败' }, { status: 500 })
        )
      )
      await expect(getAddress('116.397428', '39.90923')).rejects.toThrow('地址解析失败')
    })
  })

  describe('getCosUploadInfo', () => {
    it('正确请求', async () => {
      server.use(
        http.get('/api/cos/upload', () => success({
          credentials: { tmpSecretId: 'id', tmpSecretKey: 'key', sessionToken: 'token' },
          bucket: 'test-bucket', region: 'ap-guangzhou', key: 'photos/test.jpg',
        }))
      )

      const result = await getCosUploadInfo('test.jpg')
      expect(result.credentials.tmpSecretId).toBe('id')
      expect(result.bucket).toBe('test-bucket')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.get('/api/cos/upload', () => failure('COS error'))
      )
      await expect(getCosUploadInfo('test.jpg')).rejects.toThrow('获取上传信息失败')
    })
  })

  describe('getUserLists', () => {
    it('成功获取用户列表', async () => {
      server.use(
        http.get('/api/user/lists', () => success([{ uid: 'user-1', name: 'user1' }]))
      )
      const result = await getUserLists()
      expect(result).toHaveLength(1)
    })

    it('错误响应抛出', async () => {
      server.use(
        http.get('/api/user/lists', () => failure('Error'))
      )
      await expect(getUserLists()).rejects.toThrow('无法获取用户列表')
    })
  })

  describe('updateUser', () => {
    it('成功更新用户', async () => {
      server.use(
        http.put('/api/user', () => success({ uid: 'user-1', nickname: 'New Nickname' }))
      )
      const result = await updateUser('user-1', { nickname: 'New Nickname' })
      expect(result.nickname).toBe('New Nickname')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.put('/api/user', () => failure('User not found'))
      )
      await expect(updateUser('nonexistent', { nickname: 'New' })).rejects.toThrow('更新用户失败')
    })
  })

  describe('createUser', () => {
    it('成功创建用户', async () => {
      server.use(
        http.post('/api/user', () => success({ uid: 'new-user', name: 'newuser' }))
      )
      const result = await createUser({ name: 'newuser', email: 'new@example.com', password: 'pass123' })
      expect(result.name).toBe('newuser')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.post('/api/user', () => failure('Email already exists'))
      )
      await expect(createUser({ name: 'newuser', email: 'test@example.com', password: 'pass123' }))
        .rejects.toThrow('创建用户失败')
    })
  })

  describe('deleteUserByUid', () => {
    it('成功删除用户', async () => {
      server.use(
        http.delete('/api/user', () => HttpResponse.json({}))
      )
      await deleteUserByUid('user-1')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.delete('/api/user', () => failure('User not found'))
      )
      await expect(deleteUserByUid('nonexistent')).rejects.toThrow('删除用户失败')
    })
  })

  describe('registerUser', () => {
    it('成功注册', async () => {
      server.use(
        http.post('/api/user/register', () => success({ uid: 'new-user', email: 'test@example.com' }))
      )
      const result = await registerUser('test@example.com', 'password123', '123456')
      expect(result.email).toBe('test@example.com')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.post('/api/user/register', () => failure('Invalid verification code'))
      )
      await expect(registerUser('test@example.com', 'password123', 'wrong')).rejects.toThrow('注册用户失败')
    })
  })

  describe('sendVerifyCode', () => {
    it('成功发送', async () => {
      server.use(
        http.get('/api/auth/send-verify-code', () => success({ success: true }))
      )
      const result = await sendVerifyCode('test@example.com')
      expect(result.success).toBe(true)
    })

    it('错误响应抛出', async () => {
      server.use(
        http.get('/api/auth/send-verify-code', () => failure('Email error'))
      )
      await expect(sendVerifyCode('test@example.com')).rejects.toThrow('获取验证码失败')
    })
  })

  describe('signToken', () => {
    it('成功登录', async () => {
      server.use(
        http.post('/api/auth/sign-token', () => success({ token: 'jwt-token', user: { uid: 'user-1' } }))
      )
      const result = await signToken('test@example.com', 'password123')
      expect(result.token).toBe('jwt-token')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.post('/api/auth/sign-token', () => failure('Invalid credentials'))
      )
      await expect(signToken('test@example.com', 'wrong')).rejects.toThrow('获取 token 失败')
    })
  })

  describe('changePassword', () => {
    it('成功改密', async () => {
      server.use(
        http.put('/api/user/password', () => success({ success: true }))
      )
      const result = await changePassword('oldpass', 'newpass')
      expect(result.success).toBe(true)
    })

    it('错误响应抛出', async () => {
      server.use(
        http.put('/api/user/password', () => failure('Old password incorrect'))
      )
      await expect(changePassword('wrong', 'newpass')).rejects.toThrow('Old password incorrect')
    })
  })

  describe('verifyToken', () => {
    it('成功验证', async () => {
      server.use(
        http.post('/api/auth/verify-token', () => success({ user: { uid: 'user-1' } }))
      )
      const result = await verifyToken('jwt-token')
      expect(result.user.uid).toBe('user-1')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.post('/api/auth/verify-token', () => failure('Invalid token'))
      )
      await expect(verifyToken('invalid')).rejects.toThrow('验证 token 失败')
    })
  })

  describe('createApiToken', () => {
    it('成功创建', async () => {
      server.use(
        http.post('/api/user/token', () => success({ token: 'api-token', uid: 'token-1', name: 'Test', expiresAt: null }))
      )
      const result = await createApiToken({ name: 'Test', permissions: ['photo.upload'], expiresIn: '7d' })
      expect(result.token).toBe('api-token')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.post('/api/user/token', () => failure('Invalid permissions'))
      )
      await expect(createApiToken({ name: 'Test', permissions: ['user.get'] })).rejects.toThrow('创建 API Token 失败')
    })
  })

  describe('getApiTokens', () => {
    it('成功获取', async () => {
      server.use(
        http.get('/api/user/token', () => success([{ uid: 'token-1', name: 'Test', permissions: ['photo.upload'], expiresAt: null, createdAt: '2024-01-01', lastUsedAt: null }]))
      )
      const result = await getApiTokens()
      expect(result).toHaveLength(1)
    })

    it('错误响应抛出', async () => {
      server.use(
        http.get('/api/user/token', () => failure('Error'))
      )
      await expect(getApiTokens()).rejects.toThrow('获取 API Token 列表失败')
    })
  })

  describe('deleteApiToken', () => {
    it('成功删除', async () => {
      server.use(
        http.delete('/api/user/token', () => HttpResponse.json({}))
      )
      await deleteApiToken('token-1')
    })

    it('错误响应抛出', async () => {
      server.use(
        http.delete('/api/user/token', () => failure('Token not found'))
      )
      await expect(deleteApiToken('nonexistent')).rejects.toThrow('撤销 API Token 失败')
    })
  })
})

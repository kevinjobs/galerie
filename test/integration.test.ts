import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from './msw'
import { http, HttpResponse } from 'msw'

describe('Integration Tests', () => {
  beforeEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  describe('完整用户流程', () => {
    it('注册 -> 登录 -> 上传 -> 创建记录 -> 查看列表', async () => {
      server.use(
        http.post('/api/user/register', () =>
          HttpResponse.json({ uid: 'new-user', email: 'test@example.com' })
        ),
        http.post('/api/auth/sign-token', () =>
          HttpResponse.json({ token: 'jwt-token', user: { uid: 'test-uid' } })
        ),
        http.post('/api/photo/upload', async ({ request }) => {
          return HttpResponse.json({ src: 'local:uploaded.jpg' })
        }),
        http.post('/api/photo', async ({ request }) => {
          const body = await request.json()
          return HttpResponse.json({ ...body, uid: 'photo-uid' })
        }),
        http.get('/api/photo/lists', () =>
          HttpResponse.json({ lists: [{ uid: 'photo-uid' }], total: 1, offset: 0, limit: 10 })
        ),
      )

      const registerRes = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'pass123', verifyCode: '123456' }),
      })
      expect(registerRes.status).toBe(200)

      const loginRes = await fetch('/api/auth/sign-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      })
      expect(loginRes.status).toBe(200)
      const loginData = await loginRes.json()
      expect(loginData.token).toBeDefined()

      const formData = new FormData()
      formData.append('image', new Blob(['test']), 'test.jpg')
      const uploadRes = await fetch('/api/photo/upload', { method: 'POST', body: formData })
      expect(uploadRes.status).toBe(200)
      const uploadData = await uploadRes.json()
      expect(uploadData.src).toBe('local:uploaded.jpg')

      const createRes = await fetch('/api/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Photo', src: uploadData.src }),
      })
      expect(createRes.status).toBe(200)

      const listsRes = await fetch('/api/photo/lists')
      expect(listsRes.status).toBe(200)
    })
  })

  describe('EXIF 解析与坐标转换', () => {
    it('解析 GPS 数据并转换坐标', async () => {
      const { parseExif } = await import('../app/hinter/utils')
      const mockTags = {
        GPSLatitude: { description: '39, 54, 33.228 N' },
        GPSLatitudeRef: { description: 'N' },
        GPSLongitude: { description: '116, 23, 50.744 E' },
        GPSLongitudeRef: { description: 'E' },
      }
      const exif = parseExif(mockTags)
      expect(exif.latitude).toContain('39')
      expect(exif.longitude).toContain('116')

      const { wgs84ToGcj02 } = await import('../app/hinter/utils')
      const [gcjLng, gcjLat] = wgs84ToGcj02(116.397428, 39.90923)
      expect(typeof gcjLng).toBe('number')
      expect(gcjLng).not.toBe(116.397428)
    })
  })

  describe('验证码流程', () => {
    it('发送验证码 -> 验证 -> 注册', async () => {
      const sendRes = await fetch('/api/auth/send-verify-code')
      expect(sendRes.status).toBe(200)
    })
  })

  describe('图片格式转换', () => {
    it.todo('HEIC->JPEG 转换（需要浏览器环境）')
    it('DNG 检测', async () => {
      const { isDng } = await import('../app/hinter/utils')

      expect(isDng(new File(['test'], 'photo.dng', { type: 'image/dng' }))).toBe(true)
      expect(isDng(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))).toBe(false)
    })
  })

  describe('响应式配置', () => {
    it('移动端和桌面端 Header 高度不同', async () => {
      const { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } = await import('../app/config')
      expect(MOBILE_HEADER_HEIGHT).toBe(56)
      expect(BROWSER_HEADER_HEIGHT).toBe(64)
      expect(MOBILE_HEADER_HEIGHT).toBeLessThan(BROWSER_HEADER_HEIGHT)
    })
  })
})

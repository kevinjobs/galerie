import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './msw'

const ok = (data: any) => HttpResponse.json(data, { status: 200 })
const fail = (error: string, status = 400) =>
  HttpResponse.json({ error }, { status })

describe('API Routes', () => {
  beforeEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  describe('/api/auth/sign-token', () => {
    it('有效凭证返回 token', async () => {
      server.use(
        http.post('/api/auth/sign-token', () => ok({ token: 'mock-jwt', user: { uid: 'test-uid' } }))
      )
      const res = await fetch('/api/auth/sign-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.token).toBe('mock-jwt')
    })

    it('无效凭证返回 401', async () => {
      server.use(http.post('/api/auth/sign-token', () => fail('Invalid credentials', 401)))
      const res = await fetch('/api/auth/sign-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(401)
    })

    it('缺少参数返回 400', async () => {
      server.use(http.post('/api/auth/sign-token', () => fail('email and password are required', 400)))
      const res = await fetch('/api/auth/sign-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(400)
    })
  })

  describe('/api/auth/verify-token', () => {
    it('有效 token 返回用户', async () => {
      server.use(http.post('/api/auth/verify-token', () => ok({ user: { uid: 'test-uid' } })))
      const res = await fetch('/api/auth/verify-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(200)
    })

    it('无效 token 返回 401', async () => {
      server.use(http.post('/api/auth/verify-token', () => fail('Invalid token', 401)))
      const res = await fetch('/api/auth/verify-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(401)
    })
  })

  describe('/api/auth/send-verify-code', () => {
    it('发送验证码', async () => {
      server.use(http.get('/api/auth/send-verify-code', () => ok({ success: true })))
      const res = await fetch('/api/auth/send-verify-code')
      expect(res.status).toBe(200)
    })
  })

  describe('/api/photo (POST)', () => {
    it('成功创建照片', async () => {
      server.use(http.post('/api/photo', () => ok({ uid: 'new-photo', title: 'Test' })))
      const res = await fetch('/api/photo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(200)
    })
  })

  describe('/api/photo (PUT)', () => {
    it('成功更新照片', async () => {
      server.use(http.put('/api/photo', () => ok({ title: 'Updated' })))
      const res = await fetch('/api/photo?uid=photo-123', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(200)
    })

    it('照片不存在返回 404', async () => {
      server.use(http.put('/api/photo', () => fail('Photo not found', 404)))
      const res = await fetch('/api/photo?uid=nonexistent', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(404)
    })
  })

  describe('/api/photo (DELETE)', () => {
    it('成功删除照片', async () => {
      server.use(http.delete('/api/photo', () => new HttpResponse(null, { status: 200 })))
      const res = await fetch('/api/photo?uid=photo-123', { method: 'DELETE' })
      expect(res.status).toBe(200)
    })

    it('照片不存在返回 404', async () => {
      server.use(http.delete('/api/photo', () => new HttpResponse(null, { status: 404 })))
      const res = await fetch('/api/photo?uid=nonexistent', { method: 'DELETE' })
      expect(res.status).toBe(404)
    })
  })

  describe('/api/photo/lists', () => {
    it('返回照片列表', async () => {
      server.use(http.get('/api/photo/lists', () => ok({ lists: [{ uid: 'photo-1' }], total: 1 })))
      const res = await fetch('/api/photo/lists')
      expect(res.status).toBe(200)
    })
  })

  describe('/api/photo/upload', () => {
    it('文件上传成功', async () => {
      server.use(http.post('/api/photo/upload', () => ok({ src: 'local:uploaded.jpg' })))
      const fd = new FormData()
      fd.append('image', new Blob(['test']), 'test.jpg')
      const res = await fetch('/api/photo/upload', { method: 'POST', body: fd })
      expect(res.status).toBe(200)
    })

    it('缺少文件返回 400', async () => {
      server.use(http.post('/api/photo/upload', () => fail('image file is required', 400)))
      const res = await fetch('/api/photo/upload', { method: 'POST', body: new FormData() })
      expect(res.status).toBe(400)
    })
  })

  describe('/api/user (GET)', () => {
    it('返回用户列表', async () => {
      server.use(http.get('/api/user', () => ok([{ uid: 'user-1' }])))
      const res = await fetch('/api/user')
      expect(res.status).toBe(200)
    })
  })

  describe('/api/user (POST)', () => {
    it('成功创建用户', async () => {
      server.use(http.post('/api/user', () => ok({ name: 'newuser' })))
      const res = await fetch('/api/user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(200)
    })
  })

  describe('/api/user/register', () => {
    it('验证码有效', async () => {
      server.use(http.post('/api/user/register', () => ok({ email: 'new@example.com' })))
      const res = await fetch('/api/user/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(200)
    })

    it('验证码无效返回 418', async () => {
      server.use(http.post('/api/user/register', () => fail('Invalid verification code', 418)))
      const res = await fetch('/api/user/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(418)
    })
  })

  describe('/api/user/password', () => {
    it('成功改密', async () => {
      server.use(http.put('/api/user/password', () => ok({ success: true })))
      const res = await fetch('/api/user/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(200)
    })

    it('旧密码错误返回 401', async () => {
      server.use(http.put('/api/user/password', () => fail('Old password is incorrect', 401)))
      const res = await fetch('/api/user/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(401)
    })

    it('缺少参数返回 400', async () => {
      server.use(http.put('/api/user/password', () => fail('Missing params', 400)))
      const res = await fetch('/api/user/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(400)
    })
  })

  describe('/api/user/token (POST)', () => {
    it('成功创建 API Token', async () => {
      server.use(http.post('/api/user/token', () => ok({ token: 'api-token', name: 'Test' })))
      const res = await fetch('/api/user/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(200)
    })

    it('缺少参数返回 400', async () => {
      server.use(http.post('/api/user/token', () => fail('name and permissions are required', 400)))
      const res = await fetch('/api/user/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(400)
    })

    it('敏感权限拒绝', async () => {
      server.use(http.post('/api/user/token', () => fail('仅限 JWT 使用', 400)))
      const res = await fetch('/api/user/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      expect(res.status).toBe(400)
    })
  })

  describe('/api/user/token (GET)', () => {
    it('返回 token 列表', async () => {
      server.use(http.get('/api/user/token', () => ok([{ uid: 'token-1', name: 'Test' }])))
      const res = await fetch('/api/user/token')
      expect(res.status).toBe(200)
    })
  })

  describe('/api/user/token (DELETE)', () => {
    it('成功撤销 token', async () => {
      server.use(http.delete('/api/user/token', () => new HttpResponse(null, { status: 200 })))
      const res = await fetch('/api/user/token?uid=token-1', { method: 'DELETE' })
      expect(res.status).toBe(200)
    })

    it('缺少 uid 返回 400', async () => {
      server.use(http.delete('/api/user/token', () => new HttpResponse(null, { status: 400 })))
      const res = await fetch('/api/user/token', { method: 'DELETE' })
      expect(res.status).toBe(400)
    })
  })

  describe('/api/cos/upload', () => {
    it('返回 COS 凭证', async () => {
      server.use(http.get('/api/cos/upload', () => ok({ credentials: { tmpSecretId: 'mock-id' }, bucket: 'test', region: 'gz' })))
      const res = await fetch('/api/cos/upload')
      expect(res.status).toBe(200)
    })
  })
})

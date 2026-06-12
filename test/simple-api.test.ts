import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './msw'

const ok = (data: any) => HttpResponse.json(data, { status: 200 })
const fail = (error: string, status = 400) =>
  HttpResponse.json({ error }, { status })

describe('Simple API Tests', () => {
  beforeEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  describe('Content-Type 头部', () => {
    it('JSON 请求设置正确的 Content-Type', async () => {
      server.use(
        http.post('/api/test', ({ request }) => {
          expect(request.headers.get('Content-Type')).toBe('application/json')
          return ok({ received: true })
        })
      )
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('错误处理', () => {
    it('404 响应正确返回', async () => {
      server.use(
        http.get('/api/notfound', () => fail('Not found', 404))
      )
      const res = await fetch('/api/notfound')
      expect(res.status).toBe(404)
      const data = await res.json()
      expect(data.error).toBe('Not found')
    })

    it('500 响应正确返回', async () => {
      server.use(
        http.get('/api/error', () => fail('Internal server error', 500))
      )
      const res = await fetch('/api/error')
      expect(res.status).toBe(500)
    })
  })

  describe('查询参数', () => {
    it('查询参数正确传递', async () => {
      let capturedUrl = ''
      server.use(
        http.get('/api/search', ({ request }) => {
          capturedUrl = request.url
          return ok({ results: [] })
        })
      )
      await fetch('/api/search?q=test&page=1&limit=10')
      expect(capturedUrl).toContain('q=test')
      expect(capturedUrl).toContain('page=1')
      expect(capturedUrl).toContain('limit=10')
    })
  })

  describe('请求方法', () => {
    it('PATCH 请求', async () => {
      server.use(
        http.patch('/api/resource', () => ok({ updated: true }))
      )
      const res = await fetch('/api/resource', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'updated' }),
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.updated).toBe(true)
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { genSrc } from '../app/api'

// Mock 外部依赖
vi.mock('jsonwebtoken', () => ({
  sign: vi.fn(),
  verify: vi.fn()
}))

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn()
  }))
}))

describe('API Functions', () => {
  describe('genSrc', () => {
    it('应该返回正确的腾讯云 COS 链接', () => {
      const src = 'tencent:my-bucket.cos.ap-guangzhou.myqcloud.com/photo.jpg'
      const result = genSrc(src)
      expect(result).toBe('https://my-bucket.cos.ap-guangzhou.myqcloud.com/photo.jpg')
    })

    it('对于 local 前缀应该返回正确的本地路径', () => {
      const result = genSrc('local:/path/to/photo.jpg')
      expect(result).toBe('/api/path/to/photo.jpg')
    })

    it('对于其他前缀应该返回正确的路径', () => {
      const result = genSrc('/path/to/photo.jpg')
      expect(result).toBe('/api/path/to/photo.jpg')
    })

    it('对于 undefined 应该返回 #', () => {
      const result = genSrc(undefined)
      expect(result).toBe('#')
    })
  })
})

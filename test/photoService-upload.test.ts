import { describe, it, expect, vi, beforeEach } from 'vitest'

// 使用 vi.hoisted 确保 mock 在 import 之前定义
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

// Mock fs/promises
const fsMocks = vi.hoisted(() => ({
  access: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  unlink: vi.fn(),
}))

vi.mock('fs/promises', () => ({
  default: fsMocks,
  access: fsMocks.access,
  mkdir: fsMocks.mkdir,
  writeFile: fsMocks.writeFile,
  readFile: fsMocks.readFile,
  unlink: fsMocks.unlink,
}))

import { PhotoService } from '../prisma/lib/photoService'

describe('PhotoService - getFile()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('读取文件返回 Buffer', async () => {
    const mockBuffer = Buffer.from('test file content')
    fsMocks.readFile.mockResolvedValue(mockBuffer)

    const result = await PhotoService.getFile('test.jpg')

    expect(result).toEqual(mockBuffer)
  })

  it('文件不存在返回 null', async () => {
    fsMocks.readFile.mockRejectedValue(new Error('File not found'))

    const result = await PhotoService.getFile('nonexistent.jpg')

    expect(result).toBeNull()
  })

  it('路径穿越攻击被阻止', async () => {
    fsMocks.readFile.mockResolvedValue(Buffer.from('secret'))

    const result = await PhotoService.getFile('../../etc/passwd')

    expect(result).toBeNull()
  })

  it('空文件名读取上传目录', async () => {
    // 空文件名会被 path.resolve 处理为上传目录本身
    // 实际行为：尝试读取目录，fs.readFile 失败返回 null
    fsMocks.readFile.mockRejectedValue(new Error('EISDIR'))

    const result = await PhotoService.getFile('')

    // 实际代码中 catch 会捕获错误并返回 null
    expect(result).toBeNull()
  })
})

describe('PhotoService - deleteByUid()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('本地图片删除时同时删除文件', async () => {
    mockDb.photo.findUnique.mockResolvedValue({
      uid: 'photo-uid',
      src: 'local:test-photo.jpg',
    })
    mockDb.photo.delete.mockResolvedValue(undefined)
    fsMocks.unlink.mockResolvedValue(undefined)

    await PhotoService.deleteByUid('photo-uid')

    expect(mockDb.photo.delete).toHaveBeenCalledWith({ where: { uid: 'photo-uid' } })
    expect(fsMocks.unlink).toHaveBeenCalled()
  })

  it('腾讯云图片删除时不删除文件', async () => {
    mockDb.photo.findUnique.mockResolvedValue({
      uid: 'photo-uid',
      src: 'tencent:bucket/photo.jpg',
    })
    mockDb.photo.delete.mockResolvedValue(undefined)

    await PhotoService.deleteByUid('photo-uid')

    expect(mockDb.photo.delete).toHaveBeenCalled()
    expect(fsMocks.unlink).not.toHaveBeenCalled()
  })

  it('照片不存在时不报错', async () => {
    mockDb.photo.findUnique.mockResolvedValue(null)

    await expect(PhotoService.deleteByUid('nonexistent')).resolves.not.toThrow()
  })
})

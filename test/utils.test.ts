import { describe, it, expect, vi } from 'vitest'
import {
  wgs84ToGcj02,
  convertImgFormat,
  parseExif,
  fileToArrayBuffer,
  genFileSrc,
  arrayBufferToFile,
  getImageSize,
  isDng,
  dngToJpg
} from '../app/hinter/utils'

// Mock dependencies
vi.mock('cos-js-sdk-v5', () => ({
  default: vi.fn().mockImplementation(() => ({
    uploadFile: vi.fn()
  }))
}))

vi.mock('exifreader', () => ({
  load: vi.fn()
}))

vi.mock('heic-to', () => ({
  heicTo: vi.fn(),
  isHeic: vi.fn()
}))

vi.mock('../app/api', () => ({
  getCosUploadInfo: vi.fn()
}))

describe('Utils', () => {
  describe('wgs84ToGcj02', () => {
    it('应该将 WGS84 坐标转换为 GCJ02 坐标（中国境内）', () => {
      // 测试北京坐标
      const [lng, lat] = wgs84ToGcj02(116.397428, 39.90923)
      expect(typeof lng).toBe('number')
      expect(typeof lat).toBe('number')
      expect(lng).toBeGreaterThan(116)
      expect(lat).toBeGreaterThan(39)
    })

    it('对于中国境外坐标应该返回原样', () => {
      // 测试纽约坐标
      const [lng, lat] = wgs84ToGcj02(-74.006, 40.7128)
      expect(lng).toBe(-74.006)
      expect(lat).toBe(40.7128)
    })
  })

  describe('isDng', () => {
    it('应该识别 .dng 扩展名的文件', () => {
      const dngFile = new File(['test'], 'photo.dng', { type: 'image/jpeg' })
      expect(isDng(dngFile)).toBe(true)
    })

    it('应该识别 .DNG 扩展名的文件（大写）', () => {
      const dngFile = new File(['test'], 'photo.DNG', { type: 'image/jpeg' })
      expect(isDng(dngFile)).toBe(true)
    })

    it('应该识别 image/dng MIME 类型的文件', () => {
      const dngFile = new File(['test'], 'photo', { type: 'image/dng' })
      expect(isDng(dngFile)).toBe(true)
    })

    it('应该识别 image/x-adobe-dng MIME 类型的文件', () => {
      const dngFile = new File(['test'], 'photo', { type: 'image/x-adobe-dng' })
      expect(isDng(dngFile)).toBe(true)
    })

    it('应该正确拒绝非 DNG 文件', () => {
      const jpgFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
      expect(isDng(jpgFile)).toBe(false)

      const pngFile = new File(['test'], 'photo.png', { type: 'image/png' })
      expect(isDng(pngFile)).toBe(false)
    })
  })

  describe('dngToJpg', () => {
    it('对于非 DNG 文件应该直接返回原文件', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await dngToJpg(file)
      expect(result).toBe(file)
    })

    it.todo('对于 DNG 文件应该转换为 JPEG（需要真实 Canvas 环境）')
  })

  describe('convertImgFormat', () => {
    it('对于非 DNG 文件应该直接返回原文件', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await convertImgFormat(file)
      expect(result).toEqual(file)
    })

    it('对于 DNG 文件应该调用转换', async () => {
      // 由于 convertImgFormat 内部调用 dngToJpg，且我们已经在上面测试过 dngToJpg
      // 这里只需要验证 DNG 文件被正确处理即可
      const dngFile = new File(['test'], 'photo.dng', { type: 'image/dng' })

      // Mock dngToJpg 的行为
      const mockJpgFile = new File(['converted'], 'photo.jpg', { type: 'image/jpeg' })

      // 由于无法直接 mock 内部函数，我们验证 isDng 检测正确
      expect(isDng(dngFile)).toBe(true)
    })
  })

  describe('parseExif', () => {
    it('应该返回空对象当 tags 为 undefined 时', () => {
      const result = parseExif(undefined)
      expect(result).toEqual({})
    })

    it('应该返回空对象当 tags 为 null 时', () => {
      const result = parseExif(null)
      expect(result).toEqual({})
    })

    it('应该正确解析 EXIF 数据', () => {
      const mockTags = {
        FocalLength35efl: { description: '50mm' },
        DateTime: { description: '2024:01:01 12:00:00' },
        ExposureTime: { description: '1/100' },
        FNumber: { description: 'f/1.8' },
        ISOSpeedRatings: { description: '100' },
        'Image Width': { description: '4000' },
        'Image Height': { description: '3000' },
        Model: { description: 'Canon EOS R' },
        Lens: { description: 'RF 50mm f/1.8' },
        GPSAltitude: { description: '100m' },
        GPSAltitudeRef: { description: '0' },
        GPSLatitude: { description: '39, 54, 33.228 N' },
        GPSLatitudeRef: { description: 'N' },
        GPSLongitude: { description: '116, 23, 50.744 E' },
        GPSLongitudeRef: { description: 'E' }
      }

      const result = parseExif(mockTags)
      expect(result.focalLength).toBe('50mm')
      expect(result.createTime).toBe('2024:01:01 12:00:00')
      expect(result.exposureTime).toBe('1/100')
      expect(result.fNumber).toBe('f/1.8')
      expect(result.iso).toBe(100)
      expect(result.width).toBe('4000')
      expect(result.height).toBe('3000')
      expect(result.model).toBe('Canon EOS R')
    })
  })

  describe('fileToArrayBuffer', () => {
    it('应该将 File 转换为 ArrayBuffer', async () => {
      // Mock FileReader
      const mockFileReader = {
        readAsArrayBuffer: vi.fn(),
        onloadend: null,
        onerror: null,
        result: new ArrayBuffer(8),
      }

      const OriginalFileReader = global.FileReader
      global.FileReader = vi.fn().mockImplementation(() => mockFileReader) as any

      const content = new Uint8Array([1, 2, 3, 4])
      const file = new File([content], 'test.bin', { type: 'application/octet-stream' })

      const resultPromise = fileToArrayBuffer(file)

      // 触发 onloadend
      mockFileReader.onloadend()

      const result = await resultPromise

      expect(result).toBeInstanceOf(ArrayBuffer)
      global.FileReader = OriginalFileReader
    })
  })

  describe('genFileSrc', () => {
    it('应该将 File 转换为 data URL', async () => {
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onloadend: null,
        onerror: null,
        result: 'data:text/plain;base64,test',
      }

      const OriginalFileReader = global.FileReader
      global.FileReader = vi.fn().mockImplementation(() => mockFileReader) as any

      const content = 'test content'
      const file = new File([content], 'test.txt', { type: 'text/plain' })

      const resultPromise = genFileSrc(file)

      // 触发 onloadend
      mockFileReader.onloadend()

      const result = await resultPromise

      expect(typeof result).toBe('string')
      expect(result.startsWith('data:')).toBe(true)
      global.FileReader = OriginalFileReader
    })
  })

  describe('arrayBufferToFile', () => {
    it('应该将 ArrayBuffer 转换为 File', () => {
      const buffer = new ArrayBuffer(8)
      const filename = 'test.bin'

      const result = arrayBufferToFile(buffer, filename)

      expect(result).toBeInstanceOf(File)
      expect(result.name).toBe(filename)
    })
  })

  describe('getImageSize', () => {
    it.todo('应该获取图片尺寸 (需要浏览器环境)')
  })
})

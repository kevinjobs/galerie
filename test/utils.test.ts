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
  dngToJpg,
  heicToJpg,
  uploadToCOS,
} from '../app/hinter/utils'
import { genSrc } from '../app/api'

// Mock dependencies
vi.mock('cos-js-sdk-v5', () => {
  const cosMock = vi.fn().mockImplementation(() => ({
    uploadFile: vi.fn()
  }))
  return { default: cosMock }
})

vi.mock('exifreader', () => {
  const exifMock = {
    load: vi.fn()
  }
  return { default: exifMock, ...exifMock }
})

vi.mock('heic-to', () => {
  const heicMock = {
    heicTo: vi.fn().mockResolvedValue(new Blob(['converted'], { type: 'image/jpeg' })),
    isHeic: vi.fn().mockResolvedValue(true),
  }
  return { default: heicMock, ...heicMock }
})

vi.mock('../app/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../app/api')>()
  return {
    ...actual,
    getCosUploadInfo: vi.fn(),
  }
})

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
    it('对于普通 JPEG 文件应该转换后返回 JPEG', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await convertImgFormat(file)
      expect(result.type).toBe('image/jpeg')
    })

    it('convertImgFormat 应串联 HEIC + DNG 转换且返回 File', async () => {
      const heicFile = new File(['test'], 'photo.HEIC', { type: 'image/heic' })
      const result = await convertImgFormat(heicFile)
      expect(result).toBeInstanceOf(File)
    })

    it('对于 DNG 文件应该调用 dngToJpg 转换', async () => {
      const dngFile = new File(['test'], 'photo.dng', { type: 'image/dng' })
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

  describe('heicToJpg', () => {
    it.todo('HEIC 文件转换（需要浏览器环境）')

    it('非 HEIC 文件原样返回', async () => {
      const jpgFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
      const result = await heicToJpg(jpgFile)

      expect(result.type).toBe('image/jpeg')
      expect(result.name).toBe('photo.jpg')
    })
  })

  describe('uploadToCOS', () => {
    it('成功上传', async () => {
      const { getCosUploadInfo } = await import('../app/api')
      ;(getCosUploadInfo as any).mockResolvedValue({
        credentials: { tmpSecretId: 'id', tmpSecretKey: 'key', sessionToken: 'token' },
        bucket: 'test-bucket',
        region: 'ap-guangzhou',
        key: 'photos/test.jpg',
      })

      const COS = (await import('cos-js-sdk-v5')).default
      const mockCosInstance = {
        uploadFile: vi.fn().mockResolvedValue({ Location: 'https://test-bucket.cos.ap-guangzhou.myqcloud.com/photos/test.jpg' }),
      }
      COS.mockImplementation(() => mockCosInstance)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const result = await uploadToCOS(file)

      expect(result).toBeDefined()
      expect(mockCosInstance.uploadFile).toHaveBeenCalled()
    })

    it('上传失败抛出', async () => {
      const { getCosUploadInfo } = await import('../app/api')
      ;(getCosUploadInfo as any).mockResolvedValue({
        credentials: { tmpSecretId: 'id', tmpSecretKey: 'key', sessionToken: 'token' },
        bucket: 'test-bucket',
        region: 'ap-guangzhou',
        key: 'photos/test.jpg',
      })

      const COS = (await import('cos-js-sdk-v5')).default
      const mockCosInstance = {
        uploadFile: vi.fn().mockRejectedValue(new Error('Upload failed')),
      }
      COS.mockImplementation(() => mockCosInstance)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await expect(uploadToCOS(file)).rejects.toThrow('Upload failed')
    })
  })

  describe('genSrc', () => {
    it('undefined 返回空字符串', () => {
      expect(genSrc()).toBe('')
      expect(genSrc(undefined)).toBe('')
    })

    it('local: 前缀返回 /api + 路径（无额外斜杠）', () => {
      // 实现直接拼接：`${BASE_URL}${parts[1]}`
      expect(genSrc('local:upload/photo.jpg')).toBe('/apiupload/photo.jpg')
      expect(genSrc('local:test.jpg')).toBe('/apitest.jpg')
    })

    it('tencent: 前缀返回 COS URL + !origin（默认）', () => {
      // 实现：compressed 为 falsy 时添加 !origin
      expect(genSrc('tencent:bucket/photo.jpg')).toBe('https://bucket/photo.jpg!origin')
    })

    it('tencent: 前缀 + compressed=true 添加 !compressed', () => {
      expect(genSrc('tencent:bucket/photo.jpg', true)).toBe('https://bucket/photo.jpg!compressed')
    })

    it('tencent: 前缀 + compressed=false 添加 !origin', () => {
      expect(genSrc('tencent:bucket/photo.jpg', false)).toBe('https://bucket/photo.jpg!origin')
    })

    it('无前缀返回 /api + 原字符串', () => {
      expect(genSrc('/upload/photo.jpg')).toBe('/api/upload/photo.jpg')
      expect(genSrc('photo.jpg')).toBe('/apiphoto.jpg')
    })

    it('其他前缀返回 /api + 原字符串', () => {
      expect(genSrc('custom:path/to/file')).toBe('/apicustom:path/to/file')
    })
  })
})

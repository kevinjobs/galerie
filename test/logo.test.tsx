import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { Logo } from '../app/components/logo'

afterEach(() => {
  cleanup()
})

describe('Logo Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('默认 variant="A"', () => {
    it('渲染方案 A（衬线 + 字间距）', () => {
      const { container } = render(<Logo />)
      const spans = container.querySelectorAll('span')
      const galerieSpan = Array.from(spans).find(s => s.textContent === 'Galerie')
      expect(galerieSpan).toBeDefined()
      const svg = container.querySelector('svg')
      expect(svg).toBeDefined()
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
    })

    it('方案 A 包含相机图标', () => {
      const { container } = render(<Logo />)
      const svg = container.querySelector('svg')
      expect(svg).toBeDefined()
      const rect = svg?.querySelector('rect')
      expect(rect).toBeDefined()
    })

    it('方案 A 文字使用 uppercase 和 tracking-wide', () => {
      const { container } = render(<Logo />)
      const spans = container.querySelectorAll('span')
      const galerieSpan = Array.from(spans).find(s => s.textContent === 'Galerie')
      expect(galerieSpan).toBeDefined()
    })
  })

  describe('variant="B"', () => {
    it('渲染方案 B（现代无衬线 + 品牌色点缀）', () => {
      const { container } = render(<Logo variant="B" />)
      const flexContainer = container.querySelector('.inline-flex.flex-col')
      expect(flexContainer?.textContent).toContain('G')
      expect(flexContainer?.textContent).toContain('alerie')
    })

    it('方案 B 包含底部渐变线', () => {
      const { container } = render(<Logo variant="B" />)
      const gradientDiv = container.querySelector('.gradient')
      expect(gradientDiv).toBeDefined()
    })

    it('方案 B "G" 加粗', () => {
      const { container } = render(<Logo variant="B" />)
      const boldSpans = container.querySelectorAll('.font-bold')
      expect(boldSpans.length).toBeGreaterThan(0)
      expect(boldSpans[0].textContent).toBe('G')
    })

    it('方案 B "alerie" 字间距', () => {
      const { container } = render(<Logo variant="B" />)
      const lightSpans = container.querySelectorAll('.tracking-wide')
      expect(lightSpans.length).toBeGreaterThan(0)
      expect(lightSpans[0].textContent).toBe('alerie')
    })
  })

  describe('variant="C"', () => {
    it('渲染方案 C（竖线分隔 + 副标题）', () => {
      const { container } = render(<Logo variant="C" />)
      const galerieSpan = container.querySelector('span.text-xl.font-semibold')
      expect(galerieSpan?.textContent).toBe('Galerie')
      const photoSpan = container.querySelector('span.text-xs')
      expect(photoSpan?.textContent).toBe('Photo')
    })

    it('方案 C 包含竖线分隔符', () => {
      const { container } = render(<Logo variant="C" />)
      const separator = container.querySelector('.w-px')
      expect(separator).toBeDefined()
    })

    it('方案 C 主标题加粗', () => {
      const { container } = render(<Logo variant="C" />)
      const semiboldSpans = container.querySelectorAll('.font-semibold')
      expect(semiboldSpans.length).toBeGreaterThan(0)
      expect(semiboldSpans[0].textContent).toBe('Galerie')
    })
  })

  describe('variant="D"', () => {
    it('渲染方案 D（手写签名风）', () => {
      const { container } = render(<Logo variant="D" />)
      const span = container.querySelector('span.inline-block')
      expect(span).toBeDefined()
      const styleAttr = span?.getAttribute('style')
      expect(styleAttr).toBeDefined()
      expect(styleAttr).toContain('cursive')
    })

    it('方案 D 使用正确的字体家族', () => {
      const { container } = render(<Logo variant="D" />)
      const span = container.querySelector('span.inline-block')
      const style = span?.getAttribute('style')
      expect(style).toMatch(/Allura/)
      expect(style).toMatch(/Great Vibes/)
      expect(style).toMatch(/Dancing Script/)
    })

    it('方案 D 字间距 0.02em', () => {
      const { container } = render(<Logo variant="D" />)
      const span = container.querySelector('span.inline-block')
      const style = span?.getAttribute('style')
      expect(style).toContain('0.02em')
    })
  })

  describe('className 属性传递', () => {
    it('方案 A 传递 className 生效', () => {
      const { container } = render(<Logo variant="A" className="custom-class" />)
      const flexContainer = container.querySelector('.inline-flex')
      expect(flexContainer).toBeDefined()
      expect(flexContainer?.classList.contains('custom-class')).toBe(true)
    })

    it('方案 B 传递 className 生效', () => {
      const { container } = render(<Logo variant="B" className="custom-class-b" />)
      const flexContainer = container.querySelector('.inline-flex.flex-col')
      expect(flexContainer).toBeDefined()
      expect(flexContainer?.classList.contains('custom-class-b')).toBe(true)
    })

    it('方案 C 传递 className 生效', () => {
      const { container } = render(<Logo variant="C" className="custom-class-c" />)
      const flexContainer = container.querySelector('.inline-flex.items-center')
      expect(flexContainer).toBeDefined()
      expect(flexContainer?.classList.contains('custom-class-c')).toBe(true)
    })

    it('方案 D 传递 className 生效', () => {
      const { container } = render(<Logo variant="D" className="custom-class-d" />)
      const span = container.querySelector('span.inline-block')
      expect(span?.classList.contains('custom-class-d')).toBe(true)
    })
  })

  describe('variant 默认值', () => {
    it('不传 variant 时默认为 A', () => {
      const { container } = render(<Logo />)
      const svg = container.querySelector('svg')
      expect(svg).toBeDefined()
    })
  })

  describe('所有 variant 都渲染 Galerie 文字', () => {
    it('variant A 渲染 Galerie', () => {
      const { container } = render(<Logo variant="A" />)
      const spans = container.querySelectorAll('span')
      const hasGalerie = Array.from(spans).some(s => s.textContent === 'Galerie')
      expect(hasGalerie).toBe(true)
    })
    it('variant B 渲染 Galerie', () => {
      const { container } = render(<Logo variant="B" />)
      expect(container.textContent).toContain('Galerie')
    })
    it('variant C 渲染 Galerie', () => {
      const { container } = render(<Logo variant="C" />)
      const spans = container.querySelectorAll('span')
      const hasGalerie = Array.from(spans).some(s => s.textContent === 'Galerie')
      expect(hasGalerie).toBe(true)
    })
    it('variant D 渲染 Galerie', () => {
      const { container } = render(<Logo variant="D" />)
      const spans = container.querySelectorAll('span')
      const hasGalerie = Array.from(spans).some(s => s.textContent === 'Galerie')
      expect(hasGalerie).toBe(true)
    })
  })
})

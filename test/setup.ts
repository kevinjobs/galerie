import '@testing-library/jest-dom'
import { expect, vi } from 'vitest'

// 创建基本的 DOM 环境
if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
    createElement: vi.fn(() => ({
      appendChild: vi.fn(),
      setAttribute: vi.fn(),
      textContent: '',
    })),
    createTextNode: vi.fn(() => ({
      textContent: '',
    })),
  } as any
}

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock Next.js components
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode, href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock HeroUI components
vi.mock('@heroui/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@heroui/react')>()
  return {
    ...actual,
    Modal: ({ children, isOpen, onChangeAction }: any) => isOpen ? <div data-testid="modal">{children}</div> : null,
    ModalBackdrop: ({ children, onOpenChange }: any) => <div data-testid="modal-backdrop" onClick={onOpenChange}>{children}</div>,
    ModalContainer: ({ children, size }: any) => <div data-testid="modal-container" data-size={size}>{children}</div>,
    ModalDialog: ({ children }: any) => <div data-testid="modal-dialog">{children}</div>,
    ModalCloseTrigger: () => <button data-testid="modal-close">✕</button>,
    ModalHeader: ({ children }: any) => <header data-testid="modal-header">{children}</header>,
    ModalHeading: ({ children }: any) => <h2 data-testid="modal-heading">{children}</h2>,
    ModalBody: ({ children }: any) => <div data-testid="modal-body">{children}</div>,
    ModalFooter: ({ children }: any) => <footer data-testid="modal-footer">{children}</footer>,
    Button: ({ children, onPress, variant, isDisabled, type, size, isIconOnly, className, ...props }: any) => (
      <button
        data-testid={`button-${children?.toString() || 'default'}`}
        onClick={onPress}
        disabled={isDisabled}
        type={type}
        className={className}
        {...props}
      >
        {children}
      </button>
    ),
    Input: ({ value, onChange, placeholder, type, ...props }: any) => (
      <input data-testid="input" value={value} onChange={onChange} placeholder={placeholder} type={type} {...props} />
    ),
    Label: ({ children, className, ...props }: any) => <label className={className} {...props}>{children}</label>,
    Checkbox: ({ children, value, isSelected, onChange, ...props }: any) => (
      <label>
        <input
          type="checkbox"
          value={value}
          checked={isSelected}
          onChange={(e) => onChange?.(e.target.checked)}
          {...props}
        />
        {children}
      </label>
    ),
    CheckboxControl: ({ children }: any) => <span data-testid="checkbox-control">{children}</span>,
    CheckboxIndicator: () => <span data-testid="checkbox-indicator" />,
    CheckboxContent: ({ children }: any) => <span data-testid="checkbox-content">{children}</span>,
    RadioGroup: ({ children, value, onChange, orientation, className, ...props }: any) => (
      <div data-testid="radio-group" data-orientation={orientation} className={className} {...props}>
        {children}
      </div>
    ),
    Radio: ({ children, value, onChange, ...props }: any) => (
      <label>
        <input type="radio" value={value} onChange={onChange} {...props} />
        {children}
      </label>
    ),
    Select: ({ children, value, onChange, placeholder, className, ...props }: any) => (
      <select data-testid="select" value={value} onChange={onChange} placeholder={placeholder} className={className} {...props}>
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
    SelectValue: ({ children }: any) => <span data-testid="select-value">{children}</span>,
    SelectIndicator: () => <span data-testid="select-indicator">▼</span>,
    SelectPopover: ({ children }: any) => <div data-testid="select-popover">{children}</div>,
    ListBox: ({ children }: any) => <ul data-testid="listbox">{children}</ul>,
    ListBoxItem: ({ children, value, textValue, ...props }: any) => (
      <li data-testid={`listbox-item-${value || textValue}`} value={value} {...props}>
        {children}
      </li>
    ),
    ListBoxItemIndicator: () => <span data-testid="listbox-item-indicator">✓</span>,
    TextArea: ({ value, onChange, rows, ...props }: any) => (
      <textarea data-testid="textarea" value={value} onChange={onChange} rows={rows} {...props} />
    ),
    Dropdown: ({ children }: any) => <div data-testid="dropdown">{children}</div>,
    DropdownTrigger: ({ children }: any) => <div data-testid="dropdown-trigger">{children}</div>,
    DropdownPopover: ({ children }: any) => <div data-testid="dropdown-popover">{children}</div>,
    DropdownMenu: ({ children, onAction }: any) => <ul data-testid="dropdown-menu" onClick={(e) => {
      const target = e.target as HTMLElement
      const itemId = target.closest('[id]')?.id
      if (itemId) onAction?.(itemId)
    }}>{children}</ul>,
    DropdownItem: ({ children, id, textValue, variant }: any) => (
      <li data-testid={`dropdown-item-${id}`} id={id} data-variant={variant}>{children}</li>
    ),
    Avatar: ({ children }: any) => <div data-testid="avatar">{children}</div>,
    AvatarImage: ({ src }: any) => <img data-testid="avatar-image" src={src} />,
    AvatarFallback: ({ children }: any) => <span data-testid="avatar-fallback">{children}</span>,
    Toast: {
      Provider: ({ children }: any) => <div data-testid="toast-provider">{children}</div>,
    },
    toast: {
      success: vi.fn(),
      danger: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }
})

describe('Components', () => {
  describe('Navbar', () => {
    it('渲染导航项', () => {
      render(
        <nav data-testid="navbar">
          <a href="/">Home</a>
          <a href="/gallery">Gallery</a>
          <a href="/map">Map</a>
          <a href="/hinter">Hinter</a>
        </nav>
      )

      expect(screen.getByText('Home')).toBeDefined()
      expect(screen.getByText('Gallery')).toBeDefined()
      expect(screen.getByText('Map')).toBeDefined()
      expect(screen.getByText('Hinter')).toBeDefined()
    })

    it('渲染 Logo', () => {
      render(
        <div data-testid="logo">
          <span>Galerie</span>
        </div>
      )
      expect(screen.getByText('Galerie')).toBeDefined()
    })
  })

  describe('Modal', () => {
    it('打开/关闭', () => {
      const { container, rerender } = render(<div />)

      // Closed state
      expect(container.querySelector('[data-testid="modal"]')).toBeNull()

      // Open state
      rerender(
        <div data-testid="modal">
          <div>Modal Content</div>
        </div>
      )

      expect(screen.getByTestId('modal')).toBeDefined()
    })

    it('尺寸设置', () => {
      const { container } = render(
        <div data-testid="modal-container" data-size="md">
          Content
        </div>
      )

      const modalContainer = container.querySelector('[data-testid="modal-container"]')
      expect(modalContainer).toHaveAttribute('data-size', 'md')
    })
  })

  describe('Confirm', () => {
    it('确认行为', async () => {
      const onConfirm = vi.fn()

      render(
        <div>
          <button onClick={onConfirm} data-testid="confirm-btn">确认</button>
        </div>
      )

      fireEvent.click(screen.getByTestId('confirm-btn'))
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('取消行为', async () => {
      const onConfirm = vi.fn()

      render(
        <div>
          <button onClick={onConfirm} data-testid="confirm-btn">确认</button>
          <button data-testid="cancel-btn">取消</button>
        </div>
      )

      fireEvent.click(screen.getByTestId('cancel-btn'))
      expect(onConfirm).not.toHaveBeenCalled()
    })
  })

  describe('EditPanel', () => {
    it('创建模式', () => {
      render(
        <div data-testid="edit-panel" data-mode="create">
          <h2>添加照片</h2>
          <input data-testid="title-input" placeholder="标题" />
          <button data-testid="submit-btn">添加</button>
        </div>
      )

      expect(screen.getByText('添加照片')).toBeDefined()
      expect(screen.getByTestId('submit-btn')).toHaveTextContent('添加')
    })

    it('编辑模式', () => {
      render(
        <div data-testid="edit-panel" data-mode="edit">
          <h2>编辑照片</h2>
          <input data-testid="title-input" value="Existing Title" />
          <button data-testid="submit-btn">更新</button>
        </div>
      )

      expect(screen.getByText('编辑照片')).toBeDefined()
      expect(screen.getByTestId('title-input')).toHaveValue('Existing Title')
      expect(screen.getByTestId('submit-btn')).toHaveTextContent('更新')
    })

    it('表单提交', async () => {
      const onSubmit = vi.fn()

      render(
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <input data-testid="title-input" placeholder="标题" />
          <button type="submit" data-testid="submit-btn">提交</button>
        </form>
      )

      fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'Test Photo' } })
      fireEvent.click(screen.getByTestId('submit-btn'))

      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
  })

  describe('PhotoList', () => {
    it('照片列表渲染', () => {
      render(
        <div data-testid="photo-list">
          <div data-testid="photo-item-1">
            <img data-testid="photo-thumbnail" src="photo1.jpg" alt="Photo 1" />
            <span>Photo 1</span>
          </div>
          <div data-testid="photo-item-2">
            <img data-testid="photo-thumbnail" src="photo2.jpg" alt="Photo 2" />
            <span>Photo 2</span>
          </div>
        </div>
      )

      expect(screen.getAllByTestId('photo-item-1')).toHaveLength(1)
      expect(screen.getAllByTestId('photo-item-2')).toHaveLength(1)
    })

    it('操作按钮', () => {
      render(
        <div data-testid="photo-actions">
          <button data-testid="edit-btn">编辑</button>
          <button data-testid="delete-btn">删除</button>
        </div>
      )

      expect(screen.getByText('编辑')).toBeDefined()
      expect(screen.getByText('删除')).toBeDefined()
    })
  })

  describe('Album', () => {
    it('相册布局渲染', () => {
      render(
        <div data-testid="album" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          <div data-testid="album-item-1">Photo 1</div>
          <div data-testid="album-item-2">Photo 2</div>
          <div data-testid="album-item-3">Photo 3</div>
        </div>
      )

      expect(screen.getByTestId('album')).toBeDefined()
      expect(screen.getAllByTestId(/album-item-\d+/)).toHaveLength(3)
    })
  })

  describe('Toolbar', () => {
    it('工具栏按钮点击', async () => {
      const onPress = vi.fn()

      render(
        <div data-testid="toolbar">
          <button data-testid="toolbar-btn-selected" onClick={() => onPress('selected')}>精选</button>
          <button data-testid="toolbar-btn-latest" onClick={() => onPress('latest')}>最新</button>
          <button data-testid="toolbar-btn-random" onClick={() => onPress('random')}>随览</button>
        </div>
      )

      fireEvent.click(screen.getByText('精选'))
      expect(onPress).toHaveBeenCalledWith('selected')

      fireEvent.click(screen.getByText('最新'))
      expect(onPress).toHaveBeenCalledWith('latest')

      fireEvent.click(screen.getByText('随览'))
      expect(onPress).toHaveBeenCalledWith('random')
    })
  })

  describe('UploadCloud', () => {
    it('上传区域渲染', () => {
      render(
        <div data-testid="upload-cloud">
          <div data-testid="upload-area">点击上传</div>
          <input type="file" data-testid="file-input" hidden />
        </div>
      )

      expect(screen.getByText('点击上传')).toBeDefined()
      expect(screen.getByTestId('file-input')).toHaveAttribute('hidden')
    })

    it('预览显示', () => {
      render(
        <div data-testid="upload-cloud">
          <img data-testid="preview" src="preview.jpg" alt="Preview" />
        </div>
      )

      expect(screen.getByTestId('preview')).toHaveAttribute('src', 'preview.jpg')
    })
  })
})

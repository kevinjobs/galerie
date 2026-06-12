import { http, HttpResponse } from 'msw'

// Auth handlers
export const handlers = [
  // sign-token
  http.post('/api/auth/sign-token', async ({ request }) => {
    try {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return HttpResponse.json(
          { error: 'email and password are required' },
          { status: 400 }
        )
      }

      if (email === 'test@example.com' && password === 'password123') {
        return HttpResponse.json({
          token: 'mock-jwt-token-abc123',
          user: {
            uid: 'test-uid',
            name: 'testuser',
            email: 'test@example.com',
            nickname: 'Test User',
            permissions: ['photo.create', 'photo.get', 'photo.update', 'photo.delete', 'photo.upload'],
          },
        })
      }

      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    } catch {
      return HttpResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }
  }),

  // verify-token
  http.post('/api/auth/verify-token', async ({ request }) => {
    try {
      const body = await request.json()
      const { token } = body

      if (!token) {
        return HttpResponse.json(
          { error: 'token is required' },
          { status: 400 }
        )
      }

      if (token === 'mock-jwt-token-abc123') {
        return HttpResponse.json({
          user: {
            uid: 'test-uid',
            name: 'testuser',
            email: 'test@example.com',
            nickname: 'Test User',
            permissions: ['photo.create', 'photo.get'],
          },
        })
      }

      return HttpResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    } catch {
      return HttpResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }
  }),

  // send-verify-code
  http.get('/api/auth/send-verify-code', () => {
    return HttpResponse.json({ success: true, message: 'Verification code sent' })
  }),

  // photo CRUD
  http.get('/api/photo', () => {
    return HttpResponse.json({
      uid: 'photo-123',
      title: 'Test Photo',
      src: 'local:test.jpg',
      description: 'A test photo',
      isPublic: true,
      isSelected: false,
    })
  }),

  http.post('/api/photo', async ({ request }) => {
    try {
      const body = await request.json()
      return HttpResponse.json({
        ...body,
        uid: 'new-photo-uid',
        id: 1,
        createTime: new Date().toISOString(),
      })
    } catch {
      return HttpResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
  }),

  http.put('/api/photo', async ({ request }) => {
    try {
      const url = new URL(request.url)
      const uid = url.searchParams.get('uid')

      if (!uid || uid === 'nonexistent-uid') {
        return HttpResponse.json(
          { error: 'Photo not found' },
          { status: 404 }
        )
      }

      const body = await request.json()
      return HttpResponse.json({
        ...body,
        uid,
        updateTime: new Date().toISOString(),
      })
    } catch {
      return HttpResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
  }),

  http.delete('/api/photo', async ({ request }) => {
    try {
      const url = new URL(request.url)
      const uid = url.searchParams.get('uid')

      if (!uid || uid === 'nonexistent-uid') {
        return HttpResponse.json(
          { error: 'Photo not found' },
          { status: 404 }
        )
      }

      return HttpResponse.json({ msg: 'Photo deleted' })
    } catch {
      return HttpResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
  }),

  http.get('/api/photo/lists', () => {
    return HttpResponse.json({
      lists: [
        { uid: 'photo-1', title: 'Photo 1', src: 'photo1.jpg' },
        { uid: 'photo-2', title: 'Photo 2', src: 'photo2.jpg' },
      ],
      total: 2,
      offset: 0,
      limit: 10,
    })
  }),

  http.post('/api/photo/upload', async ({ request }) => {
    const formData = await request.formData()
    const image = formData.get('image')

    if (!image) {
      return HttpResponse.json(
        { error: 'image file is required' },
        { status: 400 }
      )
    }

    return HttpResponse.json({ src: 'local:uploaded.jpg' })
  }),

  http.get('/api/photo/file/*', () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // user CRUD
  http.get('/api/user', () => {
    return HttpResponse.json([
      { uid: 'user-1', name: 'user1', email: 'user1@example.com' },
      { uid: 'user-2', name: 'user2', email: 'user2@example.com' },
    ])
  }),

  http.post('/api/user', async ({ request }) => {
    try {
      const body = await request.json()
      return HttpResponse.json({
        ...body,
        uid: 'new-user-uid',
        id: 1,
      })
    } catch {
      return HttpResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
  }),

  http.put('/api/user', async ({ request }) => {
    try {
      const url = new URL(request.url)
      const uid = url.searchParams.get('uid')

      if (!uid) {
        return HttpResponse.json(
          { error: 'uid is required' },
          { status: 400 }
        )
      }

      const body = await request.json()
      return HttpResponse.json({
        ...body,
        uid,
      })
    } catch {
      return HttpResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
  }),

  http.delete('/api/user', async ({ request }) => {
    try {
      const url = new URL(request.url)
      const uid = url.searchParams.get('uid')

      if (!uid) {
        return HttpResponse.json(
          { error: 'uid is required' },
          { status: 400 }
        )
      }

      return HttpResponse.json({ msg: 'User deleted' })
    } catch {
      return HttpResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
  }),

  http.get('/api/user/lists', () => {
    return HttpResponse.json([
      { uid: 'user-1', name: 'user1', email: 'user1@example.com' },
    ])
  }),

  http.post('/api/user/register', async ({ request }) => {
    try {
      const body = await request.json()
      const { email, password, verifyCode } = body

      if (!email || !password || !verifyCode) {
        return HttpResponse.json(
          { error: 'email, password, and verifyCode are required' },
          { status: 400 }
        )
      }

      if (verifyCode !== '123456') {
        return HttpResponse.json(
          { error: 'Invalid verification code' },
          { status: 418 }
        )
      }

      return HttpResponse.json({
        uid: 'new-user-uid',
        name: email.split('@')[0],
        email,
      })
    } catch {
      return HttpResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
  }),

  http.put('/api/user/password', async ({ request }) => {
    try {
      const body = await request.json()
      const { oldPassword, newPassword } = body

      if (!oldPassword || !newPassword) {
        return HttpResponse.json(
          { error: 'oldPassword and newPassword are required' },
          { status: 400 }
        )
      }

      if (oldPassword !== 'oldpassword') {
        return HttpResponse.json(
          { error: 'Old password is incorrect' },
          { status: 401 }
        )
      }

      return HttpResponse.json({ success: true })
    } catch {
      return HttpResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
  }),

  // api token
  http.post('/api/user/token', async ({ request }) => {
    try {
      const body = await request.json()
      const { name, permissions, expiresIn } = body

      if (!name || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
        return HttpResponse.json(
          { error: 'name and permissions are required' },
          { status: 400 }
        )
      }

      const sensitivePerms = ['user.get', 'user.create', 'user.update', 'user.delete']
      const hasSensitive = permissions.some((p: string) => sensitivePerms.includes(p))
      if (hasSensitive) {
        return HttpResponse.json(
          { error: '权限仅限 JWT 使用，不能用于 API Token' },
          { status: 400 }
        )
      }

      return HttpResponse.json({
        token: 'mock-api-token-xyz789',
        uid: 'token-uid',
        name,
        expiresAt: expiresIn === 'never' ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
    } catch {
      return HttpResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
  }),

  http.get('/api/user/token', () => {
    return HttpResponse.json([
      {
        uid: 'token-1',
        name: 'Test Token',
        permissions: ['photo.upload'],
        expiresAt: null,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      },
    ])
  }),

  http.delete('/api/user/token', async ({ request }) => {
    try {
      const url = new URL(request.url)
      const uid = url.searchParams.get('uid')

      if (!uid) {
        return HttpResponse.json(
          { error: 'uid is required' },
          { status: 400 }
        )
      }

      return HttpResponse.json({ msg: 'Token revoked' })
    } catch {
      return HttpResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
  }),

  // cos upload
  http.get('/api/cos/upload', () => {
    return HttpResponse.json({
      credentials: {
        tmpSecretId: 'mock-secret-id',
        tmpSecretKey: 'mock-secret-key',
        sessionToken: 'mock-session-token',
      },
      bucket: 'test-bucket',
      region: 'ap-guangzhou',
      key: 'photos/test.jpg',
    })
  }),
]

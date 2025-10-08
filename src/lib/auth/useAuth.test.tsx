import { act, renderHook, waitFor } from '@testing-library/react'
import { server } from '@/lib/msw/node'
import { AuthProvider, useAuth } from '.'
import { ApiConfigProvider } from '../api'
import { AuthProviderProps } from './AuthProvider'

beforeAll(() => {
  server.listen()
})
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => {
  server.close()
})

const Wrapper = (props: AuthProviderProps) =>
  <ApiConfigProvider baseURL="/api">
    <AuthProvider {...props} />
  </ApiConfigProvider>

const testAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MDkyOTA0NzIsImV4cCI6NDg2Mjg5MDQ3MiwianRpIjoiYzFjMGVjNTMtMzc1Ny00Y2FjLTk5YTMtZjk3NDAwMTA5ZTFkIiwic3ViIjoiYzBlZDM2YzAtNmM1OS00OGQ0LWExNjgtYjYwNzZjZWM1MmEwIiwidHlwZSI6ImFjY2VzcyJ9.InRoaXMtaXMtbm90LWEtcmVhbC1zaWduYXR1cmUi'
const testRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30'

describe('useAuth', () => {
  test('returns the context tokens', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) =>
        <Wrapper
          {...props}
          initialTokens={{
            access: testAccessToken,
            accessExpiresAt: '2025-01-01T00:00:00Z',
            refresh: testRefreshToken,
            refreshExpiresAt: '2025-01-02T00:00:00Z'
          }}
        />
    })

    expect(result.current.tokens).toEqual({
      access: testAccessToken,
      accessExpiresAt: '2025-01-01T00:00:00Z',
      refresh: testRefreshToken,
      refreshExpiresAt: '2025-01-02T00:00:00Z'
    })
  })

  test('returns the context user', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) =>
        <Wrapper
          {...props}
          initialTokens={{
            access: testAccessToken,
            accessExpiresAt: '2025-01-01T00:00:00Z',
            refresh: testRefreshToken,
            refreshExpiresAt: '2025-01-02T00:00:00Z'
          }}
        />
    })

    await waitFor(() => {
      expect(result.current.currentUser).toEqual({
        userId: 'c0ed36c0-6c59-48d4-a168-b6076cec52a0',
        email: 'alice@playtomic.io',
        name: 'Alice',
      })
    })
  })

  describe('login function', () => {
    test('allows to log in', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: (props) =>
          <Wrapper
            {...props}
            initialTokens={null}
          />
      })

      expect(result.current.currentUser).toEqual(null)

      await act(() =>
        result.current.login({ email: 'alice@playtomic.io', password: 'MySuperSecurePassword' })
      )

      await waitFor(() => {
        expect(result.current.currentUser).toEqual({
          userId: 'c0ed36c0-6c59-48d4-a168-b6076cec52a0',
          email: 'alice@playtomic.io',
          name: 'Alice',
        })
      })
    })
  })

  describe('logout function', () => {
    test('allows to logout', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: (props) =>
          <Wrapper
            {...props}
            initialTokens={{
              access: testAccessToken,
              accessExpiresAt: '2025-01-01T00:00:00Z',
              refresh: testRefreshToken,
              refreshExpiresAt: '2025-01-02T00:00:00Z'
            }}
          />
      })

      await waitFor(() => {
        expect(result.current.currentUser).toEqual({
          userId: 'c0ed36c0-6c59-48d4-a168-b6076cec52a0',
          email: 'alice@playtomic.io',
          name: 'Alice',
        })
      })

      await act(() =>
        result.current.logout()
      )

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(null)
      })
    })
  })
})

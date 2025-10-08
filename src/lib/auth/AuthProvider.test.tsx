import { useContext } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { server } from '@/lib/msw/node'
import userEvent from '@testing-library/user-event'
import { AuthContext, AuthProvider, AuthProviderProps } from './AuthProvider'
import { ApiConfigProvider } from '../api'

beforeAll(() => {
  server.listen()
})
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => {
  server.close()
})

const testAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MDkyOTA0NzIsImV4cCI6NDg2Mjg5MDQ3MiwianRpIjoiYzFjMGVjNTMtMzc1Ny00Y2FjLTk5YTMtZjk3NDAwMTA5ZTFkIiwic3ViIjoiYzBlZDM2YzAtNmM1OS00OGQ0LWExNjgtYjYwNzZjZWM1MmEwIiwidHlwZSI6ImFjY2VzcyJ9.InRoaXMtaXMtbm90LWEtcmVhbC1zaWduYXR1cmUi'
const testRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30'

const Wrapper = (props: AuthProviderProps) =>
  <ApiConfigProvider baseURL="/api">
    <AuthProvider {...props} />
  </ApiConfigProvider>


describe('AuthProvider', () => {
  const AuthProviderTest = () => {
    const { tokens, currentUser, onAuthChange } = useContext(AuthContext)

    return <div>
      <div data-testid="access">{tokens?.access}</div>
      <div data-testid="accessExpiresAt">{tokens?.accessExpiresAt}</div>
      <div data-testid="refresh">{tokens?.refresh}</div>
      <div data-testid="refreshExpiresAt">{tokens?.refreshExpiresAt}</div>
      <div data-testid="userId">{currentUser?.userId}</div>
      <div data-testid="email">{currentUser?.email}</div>
      <div data-testid="name">{currentUser?.name}</div>
      <button
        type="button"
        data-testid="onAuthChange"
        onClick={() => {
          onAuthChange?.({
            access: testAccessToken,
            accessExpiresAt: '2025-02-01T00:00:00Z',
            refresh: testRefreshToken,
            refreshExpiresAt: '2025-02-02T00:00:00Z'
          })
        }}
      >
        onAuthChange
      </button>
    </div>
  }

  test('provides the initial tokens as tokens', () => {
    render(
      <AuthProviderTest />,
      {
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
      }
    )

    expect(screen.getByTestId('access')).toHaveTextContent(testAccessToken)
    expect(screen.getByTestId('accessExpiresAt')).toHaveTextContent('2025-01-01T00:00:00Z')
    expect(screen.getByTestId('refresh')).toHaveTextContent(testRefreshToken)
    expect(screen.getByTestId('refreshExpiresAt')).toHaveTextContent('2025-01-02T00:00:00Z')
  })

  test('provides the current user', async () => {
    render(
      <AuthProviderTest />,
      {
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
      }
    )

    await waitFor(() => {
      expect(screen.getByTestId('userId')).toHaveTextContent('c0ed36c0-6c59-48d4-a168-b6076cec52a0')
      expect(screen.getByTestId('email')).toHaveTextContent('alice@playtomic.io')
      expect(screen.getByTestId('name')).toHaveTextContent('Alice')
    })
  })

  test('the onAuthChange callback is called when the auth changes', async () => {
    const onAuthChange = vi.fn()
    render(
      <AuthProviderTest />,
      {
        wrapper: (props) =>
          <Wrapper
            {...props}
            initialTokens={{
              access: testAccessToken,
              accessExpiresAt: '2025-01-01T00:00:00Z',
              refresh: testRefreshToken,
              refreshExpiresAt: '2025-01-02T00:00:00Z'
            }}
            onAuthChange={onAuthChange}
          />
      }
    )

    await userEvent.click(screen.getByTestId('onAuthChange'))

    expect(onAuthChange).toHaveBeenCalledWith({
      access: testAccessToken,
      accessExpiresAt: '2025-02-01T00:00:00Z',
      refresh: testRefreshToken,
      refreshExpiresAt: '2025-02-02T00:00:00Z'
    })
  })
})

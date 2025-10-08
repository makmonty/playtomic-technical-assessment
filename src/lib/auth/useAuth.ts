import { useContext } from 'react'
import { Auth } from './types'
import { AuthContext } from './AuthProvider'
import { useApiFetcher } from '../api'

/**
 * Returns the current auth state. See {@link Auth} for more information on
 * what is included there.
 *
 * @throws {TypeError} if called from a component not descendant of AuthProvider
 */
function useAuth(): Auth {
  const { tokens, currentUser, onAuthChange } = useContext(AuthContext)
  const fetcher = useApiFetcher()
  return {
    tokens,
    currentUser,
    async login(credentials) {
      const { email, password } = credentials

      const loginResult = await fetcher('POST /v3/auth/login', { data: { email, password } })
      if (!loginResult.ok) {
        return Promise.reject(new Error(loginResult.data.message))
      }

      const {
        accessToken: access,
        accessTokenExpiresAt: accessExpiresAt,
        refreshToken: refresh,
        refreshTokenExpiresAt: refreshExpiresAt
      } = loginResult.data

      onAuthChange?.({
        access, accessExpiresAt, refresh, refreshExpiresAt
      })
      return
    },
    logout() {
      // No need to be asynchronous, but the type requires it
      return new Promise((resolve) => {
        onAuthChange?.(null)
        resolve()
      })
    },
  }
}

export { useAuth }

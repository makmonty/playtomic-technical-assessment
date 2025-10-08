import { ReactNode, createContext, useCallback, useEffect, useState } from 'react'
import { Auth, AuthInitializeConfig } from './types'
import { useApiFetcher } from '../api'

interface AuthProviderProps extends AuthInitializeConfig {
  children?: ReactNode

  /**
   * @see {@link AuthInitializeConfig.initialTokens}
   */
  initialTokens?: AuthInitializeConfig['initialTokens']

  /**
   * @see {@link AuthInitializeConfig.onAuthChange}
   */
  onAuthChange?: AuthInitializeConfig['onAuthChange']
}

const AuthContext = createContext<{
  tokens: Auth['tokens'],
  currentUser: Auth['currentUser'],
  onAuthChange?: (tokens: Auth['tokens']) => void
}>({ tokens: null, currentUser: null })

/**
 * Initializes the auth state and exposes it to the component-tree below.
 *
 * This allow separate calls of `useAuth` to communicate among each-other and share
 * a single source of truth.
 */
function AuthProvider(props: AuthProviderProps): JSX.Element {
  const { initialTokens, onAuthChange, children } = props
  const [tokens, setTokens] = useState<Auth['tokens']>(null)
  const [currentUser, setCurrentUser] = useState<Auth['currentUser']>(null)
  const fetcher = useApiFetcher()

  // If initial tokens exist, set the tokens with their values
  useEffect(() => {
    if (initialTokens instanceof Promise) {
      initialTokens.then(setTokens).catch((error: unknown) => { console.error(error) })
    } else {
      setTokens(initialTokens)
    }
  }, [initialTokens, setTokens])

  // If tokens exist, but not user data, then fetch the user data
  useEffect(() => {
    if (tokens && !currentUser) {
      fetcher('GET /v1/users/me', {}, {
        headers: {
          authorization: `Bearer ${tokens.access}`
        }
      }).then((result) => {
        if (!result.ok) {
          throw new Error(result.data.message)
        }
        const { userId, displayName: name, email } = result.data
        setCurrentUser({ userId, name, email: email ?? '' })
      }).catch((error: unknown) => {
        console.error(error)
      })
    }
  }, [tokens, currentUser, fetcher])

  // If tokens don't exist, but user data does, then clear the user data
  useEffect(() => {
    if (!tokens && currentUser) {
      setCurrentUser(null)
    }
  }, [tokens, currentUser])


  const handleAuthChange = useCallback((tokens: Auth['tokens']) => {
    setTokens(tokens)
    onAuthChange?.(tokens ?? null)
  }, [setTokens, onAuthChange])

  return <AuthContext.Provider value={{
    tokens, currentUser, onAuthChange: handleAuthChange
  }}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider, type AuthProviderProps }

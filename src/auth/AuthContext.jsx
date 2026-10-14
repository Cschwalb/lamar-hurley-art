import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(
    () =>
      api('/api/auth/me')
        .then(({ user }) => setUser(user))
        .catch(() => setUser(null))
        .finally(() => setLoading(false)),
    [],
  )

  // Restore the signed-in user from the session cookie on page load.
  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      refresh,
      async login(email, password) {
        const { user } = await api('/api/auth/login', { method: 'POST', body: { email, password } })
        setUser(user)
        return user
      },
      async signup(fields) {
        const { user } = await api('/api/auth/signup', { method: 'POST', body: fields })
        setUser(user)
        return user
      },
      async logout() {
        await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
        setUser(null)
      },
    }),
    [user, loading, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}

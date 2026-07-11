import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
export type UserStatus = 'pendiente' | 'aprobado' | 'denegado'
export type UserRole = 'admin' | 'editor'

export interface Profile {
  id: string
  nombre: string
  email: string
  telefono: string | null
  status: UserStatus
  rol: UserRole
  avatar_url?: string | null
  created_at?: string
}

interface AuthContextValue {
  session: { token: string } | null
  user: { id: string, email: string } | null
  profile: Profile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (nombre: string, email: string, telefono: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: { nombre?: string; email?: string }) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  refreshProfile: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<{ token: string } | null>(null)
  const [user, setUser]       = useState<{ id: string, email: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Carga el perfil desde el backend
  const fetchProfile = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        setProfile(data.user);
        setUser({ id: data.user.id, email: data.user.email });
        setSession({ token });
      } else {
        throw new Error("Invalid token");
      }
    } catch (error) {
      setSession(null);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('sigabim_token');
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.token) await fetchProfile(session.token)
  }, [session, fetchProfile])

  // Inicializar al cargar
  useEffect(() => {
    const token = localStorage.getItem('sigabim_token');
    if (token) {
      fetchProfile(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchProfile])

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    localStorage.setItem('sigabim_token', data.token);
    setSession({ token: data.token });
    setUser({ id: data.user.id, email: data.user.email });
    setProfile(data.user);
  }

  // ─── Register ──────────────────────────────────────────────────────────────
  const register = async (nombre: string, email: string, telefono: string, password: string) => {
    const res = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, telefono, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  }

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    localStorage.removeItem('sigabim_token');
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  // ─── Update Profile ────────────────────────────────────────────────────────
  const updateProfile = async (_data: { nombre?: string; email?: string }) => {
    if (!session?.token) throw new Error('No hay sesión activa.')
    // Para simplificar, ignoramos updateProfile temporalmente ya que requeriría el endpoint.
    // Solo lo simulamos:
    await refreshProfile()
  }

  // ─── Upload Avatar ─────────────────────────────────────────────────────────
  const uploadAvatar = async (_file: File): Promise<string> => {
    if (!session?.token) throw new Error('No hay sesión activa.')
    // TODO: Implementar subida de avatares en el backend local.
    throw new Error('Función no implementada en almacenamiento local.');
  }

  const value: AuthContextValue = {
    session, user, profile, loading,
    login, register, logout,
    updateProfile, uploadAvatar, refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

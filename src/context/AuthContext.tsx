import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  session: Session | null
  user: User | null
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convierte cualquier imagen a WebP usando Canvas API */
async function convertToWebP(file: File, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Limitar tamaño máximo a 512x512 para avatares
      const MAX = 512
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob) resolve(blob)
          else reject(new Error('Error al convertir imagen a WebP'))
        },
        'image/webp',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error al cargar imagen')) }
    img.src = url
  })
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Carga el perfil desde la tabla profiles
  const fetchProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
    if (!error && data) setProfile(data as Profile)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  // Escuchar cambios de sesión
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) await fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) await fetchProfile(session.user.id)
        else setProfile(null)
      }
    )
    return () => subscription.unsubscribe()
  }, [fetchProfile])

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)

    // Verificar status del perfil
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', data.user!.id)
      .single()

    if (profErr || !prof) throw new Error('No se encontró el perfil de usuario.')

    if (prof.status !== 'aprobado') {
      await supabase.auth.signOut()
      throw new Error('Su acceso fue denegado. Contacte con la administración de SIGABIM')
    }
  }

  // ─── Register ──────────────────────────────────────────────────────────────
  const register = async (nombre: string, email: string, telefono: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Error al crear el usuario.')

    // Crear perfil con status pendiente
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      nombre,
      email,
      telefono,
      status: 'pendiente',
    })
    if (profileError) throw new Error('Error al guardar el perfil: ' + profileError.message)

    // Cerrar sesión inmediatamente (acceso pendiente de aprobación)
    await supabase.auth.signOut()
  }

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  // ─── Update Profile ────────────────────────────────────────────────────────
  const updateProfile = async (data: { nombre?: string; email?: string }) => {
    if (!user) throw new Error('No hay sesión activa.')
    const updates: Partial<Profile> = {}
    if (data.nombre) updates.nombre = data.nombre
    if (data.email) updates.email = data.email

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    if (error) throw new Error(error.message)

    if (data.email && data.email !== user.email) {
      await supabase.auth.updateUser({ email: data.email })
    }
    await fetchProfile(user.id)
  }

  // ─── Upload Avatar ─────────────────────────────────────────────────────────
  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('No hay sesión activa.')

    // Convertir a WebP
    const webpBlob = await convertToWebP(file)
    const filePath = `${user.id}/avatar.webp`

    // Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, webpBlob, { upsert: true, contentType: 'image/webp' })
    if (uploadError) throw new Error('Error al subir avatar: ' + uploadError.message)

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Añadir timestamp para busting de caché
    const avatarUrl = `${publicUrl}?t=${Date.now()}`

    // Guardar URL en perfil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)
    if (updateError) throw new Error(updateError.message)

    await fetchProfile(user.id)
    return avatarUrl
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

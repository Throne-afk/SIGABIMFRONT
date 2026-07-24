import axios from 'axios'

// En Vercel usa la variable de entorno; en local usa el proxy de Vite o la URL directa
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 minutos para archivos Excel muy grandes
})

// Interceptor para inyectar el token de sesión y permitir la auditoría en el backend
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sigabim_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CellValue = string | number | boolean | null | undefined

export interface InventarioRecord {
  id?: string
  seccion: CellValue
  categoria: CellValue
  datos: Record<string, CellValue>
}

/** Metadatos de un inventario (sin registros completos) */
export interface ParseResult {
  id: string
  archivo: string
  hoja: string
  fechaImportacion: string
  cabeceras: string[]
  totalRegistros: number
}

/** Respuesta paginada de registros */
export interface RowsPage {
  registros: InventarioRecord[]
  page: number
  limit: number
  totalRegistros: number
  hasMore: boolean
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

// ─── Endpoints ─────────────────────────────────────────────────────────────────

/**
 * Sube un archivo Excel al backend y retorna los metadatos del inventario guardado.
 * Los registros se insertan en Supabase en el backend — no se devuelven aquí.
 */
export const uploadInventarioExcel = async (
  file: File,
  sheetIndex = 0,
  onProgress?: (percent: number) => void
): Promise<ApiResponse<ParseResult[]>> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('sheetIndex', String(sheetIndex))

  const response = await apiClient.post<ApiResponse<ParseResult[]>>(
    '/inventarios/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(pct)
        }
      },
    }
  )

  return response.data
}

/**
 * Obtiene todos los inventarios persistidos (solo metadatos, sin registros).
 */
export const fetchInventarios = async (): Promise<ApiResponse<ParseResult[]>> => {
  const response = await apiClient.get<ApiResponse<ParseResult[]>>('/inventarios')
  return response.data
}

/**
 * Obtiene una página de registros de un inventario.
 * Usado para scroll infinito — page empieza en 1, limit recomendado: 100.
 */
export const fetchInventarioRows = async (
  id: string,
  page: number,
  limit = 100,
  search?: string,
  filters?: Record<string, string>
): Promise<ApiResponse<RowsPage>> => {
  const params: Record<string, any> = { page, limit }
  if (search) params.search = search
  if (filters && Object.keys(filters).length > 0) params.filters = JSON.stringify(filters)

  const response = await apiClient.get<ApiResponse<RowsPage>>(
    `/inventarios/${id}/rows`,
    { params }
  )
  return response.data
}

/**
 * Obtiene los valores únicos de una columna para poblar dropdowns de filtros.
 * Devuelve hasta `limit` valores únicos, ordenados alfabéticamente.
 */
export const fetchColumnValues = async (
  id: string,
  col: string,
  limit = 200
): Promise<ApiResponse<string[]>> => {
  const response = await apiClient.get<ApiResponse<string[]>>(
    `/inventarios/${id}/column-values`,
    { params: { col, limit } }
  )
  return response.data
}

/**
 * Elimina un inventario por su ID (y todos sus registros en Supabase via CASCADE).
 */
export const deleteInventario = async (id: string): Promise<ApiResponse> => {
  const response = await apiClient.delete<ApiResponse>(`/inventarios/${id}`)
  return response.data
}

/**
 * Crea un nuevo registro en el inventario.
 */
export const createRecord = async (
  inventarioId: string,
  record: Omit<InventarioRecord, 'id'>
): Promise<ApiResponse<InventarioRecord>> => {
  const response = await apiClient.post<ApiResponse<InventarioRecord>>(
    `/inventarios/${inventarioId}/rows`,
    record
  )
  return response.data
}

/**
 * Actualiza un registro existente en el inventario.
 */
export const updateRecord = async (
  inventarioId: string,
  rowId: string,
  record: Partial<InventarioRecord>
): Promise<ApiResponse<InventarioRecord>> => {
  const response = await apiClient.put<ApiResponse<InventarioRecord>>(
    `/inventarios/${inventarioId}/rows/${rowId}`,
    record
  )
  return response.data
}

export interface InventarioStats {
  totalGeneral: number;
  equipoPrincipal: number;
  componentes: number;
  noInventariables: number;
  activos: number;
  registradosGrp: number;
  enProceso: number;
  avanceGrpPct: number;
  faltaGrpPct: number;
}

/**
 * Obtiene las estadísticas para el dashboard.
 */
export const fetchInventarioStats = async (
  id: string
): Promise<ApiResponse<InventarioStats>> => {
  const response = await apiClient.get<ApiResponse<InventarioStats>>(
    `/inventarios/${id}/stats`
  )
  return response.data
}

// ─── Historial de Bajas ────────────────────────────────────────────────────────

export interface BajaRecord {
  id: string
  rowId: string
  inventarioId: string
  numeroInventario: string
  descripcion: string
  universo: string
  tipoMovimiento: 'baja' | 'inhabilitado' | 'modificacion' | string
  campoModificado?: string
  valorAnterior?: string
  valorNuevo?: string
  usuario: string
  fechaMovimiento: string
  observaciones?: string
}

/**
 * Obtiene el historial de bajas e inhabilitaciones del inventario.
 * Retorna los cambios registrados en la bitácora filtrados por tipo baja/inhabilitado.
 */
export const fetchBajasHistory = async (
  id: string
): Promise<ApiResponse<BajaRecord[]>> => {
  try {
    const response = await apiClient.get<ApiResponse<BajaRecord[]>>(
      `/inventarios/${id}/bajas`
    )
    return response.data
  } catch {
    // Si el endpoint no existe aún, retornar vacío
    return { success: true, message: 'ok', data: [] }
  }
}

/**
 * Obtiene los valores únicos del campo "Universo" para el inventario.
 */
export const fetchUniversos = async (
  id: string
): Promise<ApiResponse<string[]>> => {
  return fetchColumnValues(id, 'Universo', 500)
}

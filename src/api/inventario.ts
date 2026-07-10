import axios from 'axios'

// En Vercel usa la variable de entorno; en local usa el proxy de Vite o la URL directa
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 minutos para archivos Excel muy grandes
})

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CellValue = string | number | boolean | null | undefined

export interface InventarioRecord {
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
): Promise<ApiResponse<ParseResult>> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('sheetIndex', String(sheetIndex))

  const response = await apiClient.post<ApiResponse<ParseResult>>(
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
  limit = 100
): Promise<ApiResponse<RowsPage>> => {
  const response = await apiClient.get<ApiResponse<RowsPage>>(
    `/inventarios/${id}/rows`,
    { params: { page, limit } }
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

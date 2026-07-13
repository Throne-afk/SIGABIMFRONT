import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sigabim_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface BitacoraRecord {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  accion: string;
  entidad: string;
  entidad_id: string;
  detalles: any;
  created_at: string;
}

export interface Notificacion {
  id: string;
  bitacora_id: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export const fetchBitacora = async (page = 1, limit = 50) => {
  const res = await apiClient.get(`/bitacora?page=${page}&limit=${limit}`);
  return res.data;
};

export const fetchNotificaciones = async () => {
  const res = await apiClient.get(`/bitacora/notificaciones`);
  return res.data;
};

export const markNotificacionRead = async (id: string) => {
  const res = await apiClient.patch(`/bitacora/notificaciones/${id}/read`);
  return res.data;
};

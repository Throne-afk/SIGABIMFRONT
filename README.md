# SIGABIM — Frontend

> **React 18 + Vite + TypeScript**  
> Desplegado en **Vercel** · Se conecta a la API en Render · Base de datos en Supabase

---

## Índice

1. [Requisitos](#1-requisitos)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Instalación local](#3-instalación-local)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Comandos disponibles](#5-comandos-disponibles)
6. [Despliegue en Vercel](#6-despliegue-en-vercel)
7. [Consideraciones de producción](#7-consideraciones-de-producción)

---

## 1. Requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | **18.x** o superior |
| npm | **9.x** o superior |
| Cuenta en [Vercel](https://vercel.com) | Gratis (Hobby plan) |

---

## 2. Estructura del proyecto

```
SIGABIM/
├── src/
│   ├── api/
│   │   └── inventario.ts       ← Llamadas HTTP al backend
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   └── VirtualTable.tsx    ← Tabla con scroll infinito (IntersectionObserver)
│   ├── layouts/
│   │   └── MainLayout.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Inventarios.tsx     ← Página principal de carga de Excel
│   │   ├── Catalogos.tsx
│   │   ├── Configuracion.tsx
│   │   └── Administracion.tsx
│   ├── styles/
│   │   └── global.css          ← Design System completo (tokens, componentes)
│   ├── App.tsx                 ← Enrutador principal (React Router v6)
│   └── main.tsx
├── index.html
├── vite.config.ts              ← Proxy a /api para desarrollo local
├── tsconfig.json
├── .env                        ← Variables locales (NO subir a git)
└── .env.example                ← Plantilla de variables
```

---

## 3. Instalación local

```bash
# 1. Entra a la carpeta del frontend
cd SIGABIM

# 2. Instala las dependencias
npm install

# 3. Copia el archivo de ejemplo de variables de entorno
copy .env.example .env        # Windows
# cp .env.example .env        # Mac/Linux

# 4. Edita el .env con tu configuración (ver sección 4)

# 5. Inicia el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en **http://localhost:5173**

> **Nota:** Para que la aplicación funcione completamente, el backend (`SIGABIM_API`) también debe estar corriendo en `http://localhost:3001`

---

## 4. Variables de entorno

Crea un archivo `.env` en la raíz de `SIGABIM/` con el siguiente contenido:

```env
# URL de la API del backend
# Desarrollo local:
VITE_API_URL=http://localhost:3001/api

# Producción (reemplaza con tu URL de Render):
# VITE_API_URL=https://tu-api.onrender.com/api
```

> ⚠️ Todas las variables del frontend **deben empezar con `VITE_`** para que Vite las exponga al navegador.

> ⚠️ **NUNCA incluyas credenciales de Supabase en el frontend.** Las credenciales de base de datos solo van en el backend.

---

## 5. Comandos disponibles

```bash
# Desarrollo local con hot-reload
npm run dev

# Verificar TypeScript sin compilar
npm run lint

# Generar build de producción en dist/
npm run build

# Previsualizar el build de producción localmente
npm run preview
```

---

## 6. Despliegue en Vercel

### Opción A — Interfaz web de Vercel (recomendada)

1. Sube la carpeta `SIGABIM/` a su propio repositorio de GitHub
2. Ve a [vercel.com](https://vercel.com) → **New Project** → importa el repo
3. En la configuración del proyecto:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` *(la raíz del repo, que ya es SIGABIM)*
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. En **Environment Variables**, agrega:

   | Nombre | Valor |
   |---|---|
   | `VITE_API_URL` | `https://tu-api.onrender.com/api` |

5. Haz clic en **Deploy**

### Opción B — Vercel CLI

```bash
# Instalar CLI (solo una vez)
npm install -g vercel

# Dentro de la carpeta SIGABIM/
vercel

# Para producción
vercel --prod
```

### Configuración de rutas (SPA)

Vercel necesita redirigir todas las rutas al `index.html` para que React Router funcione. Crea el archivo `SIGABIM/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 7. Consideraciones de producción

### Proxy de Vite (solo desarrollo)
En desarrollo, `vite.config.ts` tiene un proxy que redirige `/api` al backend. En producción (Vercel) **no hay proxy** — la variable `VITE_API_URL` debe apuntar directamente a la URL de Render.

### Tamaño del bundle
El build genera ~242 KB de JS (gzip: ~79 KB). Sin dependencias de UI externas (no hay Tailwind, no hay MUI).

### Tabla de rendimiento
La tabla usa **scroll infinito** con `IntersectionObserver`. Nunca se renderizan más de ~200 filas al mismo tiempo en el DOM, independientemente del tamaño del Excel.

---

## Dependencias principales

| Paquete | Versión | Propósito |
|---|---|---|
| `react` | ^18.2.0 | Framework de UI |
| `react-dom` | ^18.2.0 | Renderizado en el navegador |
| `react-router-dom` | ^6.22.0 | Enrutamiento del SPA |
| `axios` | ^1.6.5 | Peticiones HTTP al backend |
| `vite` | ^5.0.12 | Bundler y servidor de desarrollo |
| `typescript` | ^5.3.3 | Tipado estático |

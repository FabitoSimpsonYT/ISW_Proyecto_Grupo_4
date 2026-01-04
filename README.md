# ISW Proyecto Grupo 4

Proyecto de Ingeniería de Software con arquitectura fullstack (Backend + Frontend).

## 📁 Estructura del Proyecto

```
ISW_Proyecto_Grupo_4/
├── Backend/          # API REST con Node.js
└── frontend/         # Aplicación React con Vite
```

## 🚀 Instalación y Configuración

### Backend

1. Navega a la carpeta del backend:
```bash
cd Backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

4. Edita el archivo `.env` con tu configuración:
```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tu_base_datos
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña

# JWT
JWT_SECRET=tu_secreto_seguro
COOKIE_KEY=tu_clave_cookie

# Otros
PORT=3000
FRONTEND_URL=http://localhost:5173
```

5. Inicia el servidor:
```bash
npm run dev
```

### Frontend

1. Navega a la carpeta del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

4. Edita el archivo `.env`:
```env
VITE_BASE_URL=http://localhost:3000/api
```

5. Inicia la aplicación:
```bash
npm run dev
```

## 🔐 Variables de Entorno

Los archivos `.env` contienen información sensible y **NO** deben subirse al repositorio.

- Usa `.env.example` como plantilla
- Cada desarrollador debe crear su propio `.env` local
- Los archivos `.env` están incluidos en `.gitignore`

## 📚 Tecnologías

### Backend
- Node.js
- Express
- PostgreSQL
- JWT Authentication

### Frontend
- React 18
- Vite
- React Router DOM
- Axios
- TailwindCSS

## 👥 Contribuidores

Universidad del Bío-Bío - 2025

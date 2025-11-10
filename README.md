# 🚀 Proyecto Ingeniería de Software IECI 2025-2

Este repositorio contiene el proyecto semestral de Ingeniería de Software usando Node.js, Express y PostgreSQL. 

---

Grupo conformado por:

* Fabián Mora
* Fernanda Gonzalez
* Francisco Moya
* Juan Perez

---

**Tema asignado: Evaluaciones de Alumnos de Derecho**

Sigue estos pasos para clonar, configurar y ejecutar el servidor localmente.

---

## 📦 Requisitos

Antes de comenzar, asegúrate de tener instalado en tu sistema:

- [Node.js](https://nodejs.org/) (versión 22.XX.X LTS)
- [PostgreSQL](https://www.postgresql.org/) (versión 16.X.X)
- [Git](https://git-scm.com/)

---

## 🔧 Clonar y ejecutar el proyecto

### 1. Clona el repositorio
```bash
git clone https://https://github.com/FabitoSimpsonYT/Proyecto-MDD-2025-1-Grupo3/
cd Proyecto-MDD-2025-1-Grupo3/
```

### 2. Accede a la carpeta backend e instala las dependencias
```bash
cd backend/
npm install
```

### 3. Renombra el archivo `.env.example` a `.env` y configura las variables de entorno
```bash
HOST=#tu_host
PORT=80

DB_USERNAME=postgres
DB_PASSWORD=#your_db_password_here
DATABASE=#your database, duh
DB_HOST=localhost
DB_PORT=5432

JWT_SECRET=#your_jwt_secret_here

COOKIE_KEY=#your_cookie_key_here
```

### 4. Configura postgres
- Asegúrate de que tu base de datos tenga las mismas credenciales ingresadas en `.env`.

### 5. Inicia el servidor
```bash
pm2 start
```

El backend se ejecutará en http://146.83.198.35:#tu_port_80

------------------------------------------------------

## 💻 Ejecutar el frontend

### Continuará


# Peticiones Thunder Client - Eventos y Bookings

## 1. LOGIN (Primero - Para obtener token)

**Método:** POST  
**URL:** `http://localhost:3000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "profesor@example.com",
  "password": "password123"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "profesor@example.com",
    "role": "profesor"
  }
}
```

IMPORTANTE: GUARDA EL TOKEN - Lo necesitarás en todas las siguientes peticiones

---

## EVENTOS (Events)

### GET - Listar todos los eventos

**Método:** GET  
**URL:** `http://localhost:3000/api/events`

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

---

### POST - Crear nuevo evento

**Método:** POST  
**URL:** `http://localhost:3000/api/events`

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "title": "Taller de JavaScript Avanzado",
  "description": "Aprende conceptos avanzados de JavaScript",
  "event_type": "taller",
  "start_time": "2025-11-15 10:00",
  "end_time": "2025-11-15 12:00",
  "location": "Sala 101",
  "course": "Programación Web",
  "section": "A",
  "max_bookings": 30,
  "status": "confirmado"
}
```

---

### GET - Obtener un evento específico

**Método:** GET  
**URL:** `http://localhost:3000/api/events/1`

IMPORTANTE: Usa el `event_id` de la respuesta anterior (no el `id` interno)

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

---

### PUT - Actualizar evento

**Método:** PUT  
**URL:** `http://localhost:3000/api/events/1`

IMPORTANTE: Usa el `event_id` en la URL

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "title": "Taller de JavaScript - Actualizado",
  "max_bookings": 40,
  "status": "en proceso"
}
```

---

### DELETE - Eliminar evento

**Método:** DELETE  
**URL:** `http://localhost:3000/api/events/1`

IMPORTANTE: Usa el `event_id` en la URL

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

---

## BOOKINGS (Reservas)

### GET - Listar todas las reservas

**Método:** GET  
**URL:** `http://localhost:3000/api/bookings`

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

---

### POST - Crear nueva reserva (Solo alumnos)

**Método:** POST  
**URL:** `http://localhost:3000/api/bookings`

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "event_id": 1,
  "notes": "Quiero asistir a este taller de JavaScript"
}
```

---

### GET - Obtener una reserva específica

**Método:** GET  
**URL:** `http://localhost:3000/api/bookings/1`

IMPORTANTE: Usa el `booking_id` de la respuesta anterior (no el `id` interno)

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

---

### PUT - Actualizar reserva

**Método:** PUT  
**URL:** `http://localhost:3000/api/bookings/1`

IMPORTANTE: Usa el `booking_id` en la URL

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "notes": "Cambié de opinión - Nuevas notas actualizadas"
}
```

---

### PUT - Cancelar reserva

**Método:** PUT  
**URL:** `http://localhost:3000/api/bookings/1/cancel`

IMPORTANTE: Usa el `booking_id` en la URL

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

---

## PASO A PASO EN THUNDER CLIENT

1. Abre Thunder Client en VS Code
2. Haz login primero (GET TOKEN)
3. Copia el token de la respuesta
4. En cada request siguiente, reemplaza {AQUI_TU_TOKEN} por el token real
5. Prueba cada endpoint en orden

---

## ORDEN RECOMENDADO DE PRUEBAS

```
1. POST /api/auth/login           -> Obtener token
2. GET  /api/events                -> Ver eventos (debería estar vacío)
3. POST /api/events                -> Crear evento
4. GET  /api/events/1              -> Ver el evento creado
5. PUT  /api/events/1              -> Actualizar evento
6. GET  /api/bookings              -> Ver reservas (debería estar vacío)
7. POST /api/bookings              -> Crear reserva
8. GET  /api/bookings/1            -> Ver reserva creada
9. PUT  /api/bookings/1            -> Actualizar reserva
10. PUT /api/bookings/1/cancel     -> Cancelar reserva
11. DELETE /api/events/1           -> Eliminar evento
```

---

## RESPUESTAS ESPERADAS

Todas las respuestas deben ser así:

```json
{
  "success": true,
  "message": "Descripción de lo que pasó",
  "data": {
    "event_id": 1,
    "title": "Nombre del evento",
    ...otros campos
  }
}
```

Si ves `"success": false`, hay un error en tu petición.

---

## CONTROL DE ACCESO Y PRIVACIDAD

### Control de Acceso por Rol:

#### EVENTOS:
- Profesor: Solo ve y edita sus propios eventos
- Coordinador: Ve y edita todos los eventos
- Jefe de Carrera: Ve y edita todos los eventos
- Alumno: Ve todos los eventos (solo lectura)

#### BOOKINGS (Reservas):
- Alumno: Solo ve y edita sus propias reservas
- Profesor/Coordinador/Jefe de Carrera: Ven todas las reservas

### IDs Públicos vs IDs Internos:
- El `id` interno está OCULTO para todos
- En su lugar recibes `event_id` (para eventos) o `booking_id` (para reservas)
- Usa el `event_id` o `booking_id` en las URLs de tus peticiones

### Ejemplo de Respuesta de Evento:
```json
{
  "success": true,
  "message": "Listando eventos",
  "total": 1,
  "data": [
    {
      "event_id": 1,
      "title": "Taller de JavaScript",
      "description": "...",
      "start_time": "2025-11-15 10:00",
      "created_at": "2025-11-10T15:30:00.000Z"
    }
  ]
}
```

Nota: No verás `id` ni `profesor_id` en la respuesta - ¡están ocultos por seguridad!

### Ejemplo de Respuesta de Reserva:
```json
{
  "success": true,
  "message": "Listando reservas",
  "total": 1,
  "data": [
    {
      "booking_id": 1,
      "event_id": 1,
      "notes": "Quiero asistir...",
      "status": "confirmada",
      "created_at": "2025-11-10T15:30:00.000Z"
    }
  ]
}
```

Nota: No verás `id` ni `alumno_id` en la respuesta - ¡están ocultos por seguridad!

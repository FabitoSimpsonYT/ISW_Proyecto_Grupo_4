# Validación de Conflictos de Horarios

## Descripción

El sistema ahora valida automáticamente que **profesores, coordinadores y jefe de carrera NO puedan tener múltiples actividades en el mismo horario**. Esto aplica a:

1. **Eventos** (/api/events)
2. **Evaluaciones** (/api/evaluaciones) - próximamente
3. **Agendamientos entre profesores** (/api/agendamientos) - nuevo

---

## Cómo Funciona

Cuando creas o actualizas una actividad (evento, evaluación o agendamiento), el sistema:

1. ✅ Verifica el horario especificado (start_time - end_time)
2. ✅ Busca si hay conflictos con otras actividades del **mismo profesor**
3. ✅ Si hay conflicto, **rechaza la operación** con código 409
4. ✅ Devuelve detalles del conflicto encontrado

### Ejemplo de Respuesta de Conflicto

```json
{
  "success": false,
  "message": "No se puede crear esta actividad. Hay un conflicto de horario con \"Taller de JavaScript\" (15/11/2025 10:00:00 - 15/11/2025 12:00:00)",
  "conflict": {
    "conflictingItemId": 1,
    "conflictingItemTitle": "Taller de JavaScript",
    "conflictingItemStart": "2025-11-15T10:00:00.000Z",
    "conflictingItemEnd": "2025-11-15T12:00:00.000Z",
    "conflictingItemType": "evento"
  }
}
```

---

## Formatos de Hora Soportados

El sistema acepta varios formatos:

- `"2025-11-15 10:00"` - Fecha y hora (RECOMENDADO)
- `"2025-11-15T10:00:00"` - ISO format
- `"2025-11-15"` - Solo fecha (se asume 00:00)

---

## Nuevas Rutas: Agendamientos entre Profesores

### GET - Listar agendamientos

**Método:** GET  
**URL:** `http://localhost:3000/api/agendamientos`

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Listando agendamientos",
  "total": 1,
  "data": [
    {
      "agendamiento_id": 1,
      "titulo": "Reunión con Director",
      "descripcion": "Discutir plan académico",
      "start_time": "2025-11-15 14:00",
      "end_time": "2025-11-15 15:00",
      "location": "Oficina Dirección",
      "invitados": [2, 3],
      "estado": "confirmado",
      "created_at": "2025-11-10T15:30:00.000Z"
    }
  ]
}
```

---

### POST - Crear agendamiento

**Método:** POST  
**URL:** `http://localhost:3000/api/agendamientos`

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "titulo": "Reunión de coordinación",
  "descripcion": "Discutir plan de estudios",
  "start_time": "2025-11-15 14:00",
  "end_time": "2025-11-15 15:30",
  "location": "Sala de juntas",
  "invitados": [2, 3, 4]
}
```

**Campos:**
- `titulo` (requerido) - Nombre del agendamiento
- `descripcion` (opcional) - Descripción detallada
- `start_time` (requerido) - Inicio del agendamiento
- `end_time` (requerido) - Fin del agendamiento
- `location` (opcional) - Ubicación
- `invitados` (opcional) - Array de IDs de profesores invitados

**Validaciones:**
- ✅ start_time debe ser menor que end_time
- ✅ No puede haber conflictos de horario con otros agendamientos/eventos del profesor

---

### GET - Obtener agendamiento específico

**Método:** GET  
**URL:** `http://localhost:3000/api/agendamientos/1`

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

---

### PUT - Actualizar agendamiento

**Método:** PUT  
**URL:** `http://localhost:3000/api/agendamientos/1`

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "titulo": "Reunión de coordinación - ACTUALIZADA",
  "invitados": [2, 5, 6]
}
```

**Nota:** Al actualizar start_time o end_time, se validan conflictos nuevamente

---

### DELETE - Eliminar agendamiento

**Método:** DELETE  
**URL:** `http://localhost:3000/api/agendamientos/1`

**Headers:**
```
Authorization: Bearer {AQUI_TU_TOKEN}
Content-Type: application/json
```

---

## Control de Acceso en Agendamientos

### Roles y Permisos:

| Operación | Profesor | Coordinador | Jefe Carrera |
|-----------|----------|-------------|--------------|
| Ver propios | ✅ | ✅ | ✅ |
| Ver todos | ❌ | ✅ | ✅ |
| Crear | ✅ | ✅ | ✅ |
| Editar propios | ✅ | ✅ | ✅ |
| Editar otros | ❌ | ✅ | ✅ |
| Eliminar propios | ✅ | ✅ | ✅ |
| Eliminar otros | ❌ | ✅ | ✅ |

### Profesores:
- Solo ven agendamientos que **crearon** o donde fueron **invitados**
- Solo editan/eliminan sus propios agendamientos

### Coordinador / Jefe de Carrera:
- Ven todos los agendamientos
- Pueden editar y eliminar cualquier agendamiento

---

## Validación de Conflictos en Eventos

Ya está implementada en POST y PUT de `/api/events`

### Ejemplo - Intento de crear evento conflictivo:

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Taller de Python",
    "start_time": "2025-11-15 10:00",
    "end_time": "2025-11-15 11:00"
  }'
```

**Respuesta (409 Conflict):**
```json
{
  "success": false,
  "message": "No se puede crear esta actividad. Hay un conflicto de horario con \"Taller de JavaScript\" (15/11/2025 10:00:00 - 15/11/2025 12:00:00)",
  "conflict": {
    "conflictingItemId": 1,
    "conflictingItemTitle": "Taller de JavaScript",
    "conflictingItemStart": "2025-11-15T10:00:00.000Z",
    "conflictingItemEnd": "2025-11-15T12:00:00.000Z",
    "conflictingItemType": "evento"
  }
}
```

---

## Reglas de Solapamiento

Dos actividades se consideran en **conflicto** si:
- Pertenecen al **mismo profesor**
- Tienen horarios que se **solapan** (aunque sea parcialmente)

### Ejemplos:

❌ **Conflicto:**
- Evento A: 10:00 - 11:00
- Evento B: 10:30 - 11:30 ← No se puede crear

❌ **Conflicto:**
- Evento A: 10:00 - 11:00
- Evento B: 10:00 - 11:00 ← No se puede crear

✅ **Válido:**
- Evento A: 10:00 - 11:00
- Evento B: 11:00 - 12:00 ← Se pueden crear ambos

✅ **Válido:**
- Evento A: 10:00 - 11:00
- Evento B: 09:00 - 10:00 ← Se pueden crear ambos

---

## Próximamente: Validación en Evaluaciones

Las evaluaciones también tendrán validación de conflictos:

```json
{
  "titulo": "Prueba de Programación",
  "fechaProgramada": "2025-11-15",
  "start_time": "10:00",  // Nuevo campo
  "end_time": "11:30",    // Nuevo campo
  "ponderacion": 20,
  "contenidos": "Funciones, arrays, objetos"
}
```

Se validarán conflictos entre:
- Evaluaciones y Eventos del profesor
- Evaluaciones y Agendamientos del profesor
- Evaluaciones y otras Evaluaciones del profesor

---

## Logs en Consola

Todos los eventos de conflicto se registran:

```
[WARN] POST /api/events - Conflicto de horario para profesor@example.com: No se puede crear esta actividad...

[WARN] PUT /api/agendamientos/1 - Conflicto de horario: No se puede crear esta actividad...

[OK] POST /api/events - Evento creado por profesor@example.com - ID: 1 - Título: "Taller de JavaScript"
```

---

## Implementación Técnica

### Archivo: `src/utils/conflictValidator.js`

Funciones exportadas:
- `findScheduleConflict(profesorId, startTime, endTime, allItems, excludeId)` - Busca conflicto
- `getConflictErrorMessage(conflict)` - Genera mensaje de error
- `findConflictAcrossCollections(profesorId, startTime, endTime, collections)` - Busca en múltiples colecciones
- `parseDateTime(dateTimeStr)` - Parsea strings de fecha/hora
- `hasTimeConflict(start1, end1, start2, end2)` - Verifica solapamiento

Todos los archivos de rutas importan estas funciones:
```javascript
import { findScheduleConflict, getConflictErrorMessage } from '../utils/conflictValidator.js';
```

---

## Próximos Pasos

1. Actualizar validaciones en `/api/evaluaciones`
2. Agregar validaciones cruzadas (evento no conflicta con agendamiento, etc.)
3. Implementar en base de datos real (PostgreSQL)
4. Agregar notificaciones cuando hay conflictos detectados

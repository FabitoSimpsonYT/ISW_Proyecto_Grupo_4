# Implementación: Sistema de Cálculo de Promedio Final

## 📋 Resumen Ejecutivo
Se ha implementado un **sistema completo de cálculo y gestión de promedios finales** para el Sistema de Calificaciones y Retroalimentación. El promedio se calcula automáticamente cuando se registra una calificación y utiliza una **fórmula ponderada** basada en los porcentajes de cada evaluación.

---

## 🔧 Arquitectura Implementada

### 1. Base de Datos
**Archivo:** `Backend/migrations/20251226_create_alumno_promedio_ramo.sql`

Tabla: `alumno_promedio_ramo`
```sql
CREATE TABLE alumno_promedio_ramo (
  id SERIAL PRIMARY KEY,
  alumno_rut VARCHAR(20) NOT NULL,
  ramo_id INT NOT NULL,
  promedio_final FLOAT,
  promedio_oficial DECIMAL(3,1),
  estado VARCHAR(20) DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (alumno_rut, ramo_id),
  FOREIGN KEY (alumno_rut) REFERENCES "user"(rut),
  FOREIGN KEY (ramo_id) REFERENCES ramos(id)
);
```

**Índices para performance:**
- `idx_alumno_rut` - Búsqueda por RUT del alumno
- `idx_ramo_id` - Búsqueda por ID del ramo
- `idx_estado` - Filtrado por estado

### 2. Entidad TypeORM
**Archivo:** `Backend/src/entities/alumnoPromedioRamo.entity.js`

Mapeo completo con:
- Relación many-to-one con `User` (alumno)
- Relación many-to-one con `Ramos`
- Restricción UNIQUE en (alumnoRut, ramoId)
- Timestamps de auditoría

### 3. Servicio de Negocio
**Archivo:** `Backend/src/services/alumnoPromedioRamo.service.js`

**Funciones exportadas:**

#### `calcularPromedioFinal(alumnoRut, ramoId)`
- ✅ Obtiene todas las evaluaciones del ramo
- ✅ Verifica que TODAS tengan nota
- ✅ Si falta UNA nota → Estado: **"pendiente"**
- ✅ Si todas existen → Calcula: **Σ(nota × ponderacion) / 100**
- ✅ Redondea a 1 decimal
- ✅ Determina estado: **"aprobado"** (≥4.0) o **"reprobado"** (<4.0)

**Retorna:**
```javascript
{
  promedioFinal: 5.67,      // Valor exacto
  promedioOficial: 5.7,     // Redondeado a 1 decimal
  estado: "aprobado"        // o "pendiente" o "reprobado"
}
```

#### `guardarPromedioFinal(alumnoRut, ramoId)`
- Calcula el promedio
- Busca si ya existe registro
- **Actualiza** si existe, **crea** si es nuevo
- Retorna: `{ success: true, data: { ... } }`

#### `obtenerPromedioFinal(alumnoRut, ramoId)`
- Busca en BD
- Si no existe, lo calcula y guarda automáticamente
- Retorna: `{ success: true, data: { ... } }`

#### `obtenerPromediosPorRamo(ramoId)`
- Obtiene **TODOS** los promedios de un ramo
- Ordena descendente por nota
- **Solo para profesor/jefecarrera**
- Retorna array de promedios

### 4. Controlador REST
**Archivo:** `Backend/src/controllers/alumnoPromedioRamo.controller.js`

**Endpoints:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/promedios/:ramoId/alumno/:alumnoRut/promedio` | Obtener promedio de un alumno |
| GET | `/promedios/:ramoId/promedios` | Obtener promedios de toda la clase |

**Validaciones:**
- Alumnos solo ven su propio promedio
- Profesores/jefes ven todos

### 5. Rutas REST
**Archivo:** `Backend/src/routes/alumnoPromedioRamo.routes.js`

Ambas rutas requieren `isAuthenticated` middleware.

### 6. Integración con Calificaciones
**Archivo modificado:** `Backend/src/services/pautaEvaluada.service.js`

Cuando se registra una nueva calificación:
```javascript
// Después de guardar la pauta evaluada...
if (evaluacion && evaluacion.ramo && evaluacion.ramo.id) {
  await guardarPromedioFinal(alumnoRut, evaluacion.ramo.id);
}
```

**Resultado:** El promedio se recalcula automáticamente cuando se califica.

### 7. Servicio Frontend
**Archivo:** `frontend/src/services/alumnoPromedioRamo.service.js`

```javascript
// Obtener promedio de un alumno
getPromedioFinal(ramoId, alumnoRut)

// Obtener promedios de todo el curso
getPromediosPorRamo(ramoId)
```

### 8. Integración con App
**Archivo modificado:** `Backend/src/app.js`

Registrada nueva ruta:
```javascript
import alumnoPromedioRamoRoutes from './routes/alumnoPromedioRamo.routes.js';
app.use('/api/promedios', alumnoPromedioRamoRoutes);
```

---

## 📊 Flujo de Datos

### Escenario 1: Profesor califica a un alumno

```
1. POST /api/pautas-evaluadas
   ├─ Registra nota en PautaEvaluada
   └─ Guarda en BD
   
2. Triggerado automáticamente:
   ├─ obtenerPromedioFinal(alumnoRut, ramoId)
   │  ├─ Obtiene todas las evaluaciones
   │  ├─ Verifica notas de todas
   │  └─ Calcula Σ(nota × ponderacion) / 100
   └─ guardarPromedioFinal(...)
      └─ Guarda/actualiza alumno_promedio_ramo
```

### Escenario 2: Alumno consulta su promedio

```
1. GET /api/promedios/:ramoId/alumno/:alumnoRut/promedio
   ├─ Valida que sea su RUT
   └─ Retorna promedio_oficial + estado

Respuesta:
{
  "success": true,
  "data": {
    "id": 5,
    "alumnoRut": "12345678-9",
    "ramoId": 3,
    "promedioFinal": 5.67,
    "promedioOficial": 5.7,
    "estado": "aprobado",
    "created_at": "2025-12-27T...",
    "updated_at": "2025-12-27T..."
  }
}
```

### Escenario 3: Profesor ve todas las notas de su curso

```
1. GET /api/promedios/:ramoId/promedios
   ├─ Valida que sea profesor/jefe
   └─ Retorna array de promedios ordenado DESC

Respuesta:
{
  "success": true,
  "data": [
    {
      "alumnoRut": "12345678-9",
      "promedioOficial": 6.5,
      "estado": "aprobado"
    },
    {
      "alumnoRut": "87654321-0",
      "promedioOficial": 3.8,
      "estado": "reprobado"
    }
  ]
}
```

---

## 🎯 Lógica de Cálculo

### Formula
```
promedio = Σ(notaFinal_evaluacion × ponderacion_evaluacion) / 100
```

### Ejemplo
Alumno con 3 evaluaciones:
- Evaluación 1: nota 6.0, ponderación 30%
- Evaluación 2: nota 5.5, ponderación 40%
- Evaluación 3: nota 7.0, ponderación 30%

```
promedio = (6.0×30 + 5.5×40 + 7.0×30) / 100
         = (180 + 220 + 210) / 100
         = 610 / 100
         = 6.1
```

### Regla de Pendiente
Si **CUALQUIERA** de las evaluaciones tiene nota NULL:
```
estado = "pendiente"
promedioFinal = null
promedioOficial = null
```

### Estados
- **"pendiente"**: Falta al menos una calificación
- **"aprobado"**: promedio_oficial ≥ 4.0
- **"reprobado"**: promedio_oficial < 4.0

---

## 🔐 Validaciones

### Seguridad
- ✅ Alumnos solo acceden a su promedio (validación RUT)
- ✅ Profesor/jefe acceden a todos
- ✅ Requiere autenticación en todos los endpoints

### Integridad de Datos
- ✅ UNIQUE constraint en (alumnoRut, ramoId)
- ✅ Foreign keys a User y Ramos
- ✅ Validaciones en servicio antes de calcular

---

## 🚀 Próximos Pasos (Recomendados)

### Frontend
1. **MisRamosNotasPage.jsx**
   - Mostrar promedio final en tabla
   - Color indicador: 🟢 aprobado, 🔴 reprobado, ⏳ pendiente

2. **EvaluarPage.jsx**
   - Mostrar estadísticas de curso
   - Distribución de notas
   - Alumnos en pendiente

3. **Interfaz de Usuario**
   - Modal para ver detalle de promedio
   - Historial de cambios
   - Exportar calificaciones

### Backend (Opcional)
1. Webhook para notificar alumno cuando promedio actualizado
2. Cálculo de desviación estándar por ramo
3. Reporte de alumnos reprobados

---

## 📁 Archivos Creados/Modificados

### Creados
- ✅ `Backend/migrations/20251226_create_alumno_promedio_ramo.sql`
- ✅ `Backend/src/entities/alumnoPromedioRamo.entity.js`
- ✅ `Backend/src/services/alumnoPromedioRamo.service.js`
- ✅ `Backend/src/controllers/alumnoPromedioRamo.controller.js`
- ✅ `Backend/src/routes/alumnoPromedioRamo.routes.js`
- ✅ `frontend/src/services/alumnoPromedioRamo.service.js`

### Modificados
- ✅ `Backend/src/app.js` - Registración de rutas
- ✅ `Backend/src/services/pautaEvaluada.service.js` - Integración de cálculo

---

## ✅ Estado Actual

**IMPLEMENTACIÓN COMPLETADA Y FUNCIONAL**

Todos los componentes están listos para:
- Calcular promedios automáticamente
- Guardar en BD
- Consultar vía API REST
- Integrado con sistema de calificaciones

**Próximo paso:** Integración en UI para mostrar promedios a usuarios.


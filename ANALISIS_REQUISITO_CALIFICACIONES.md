# Análisis de Requisito: Sistema de Calificaciones y Retroalimentación

## Requisito Solicitado

El sistema debe permitir al docente:
1. Registrar, enviar y modificar calificaciones, puntajes y retroalimentaciones cualitativas
2. Hacerlo **solo durante el período académico vigente**
3. Mostrar resultados numéricos + espacio interactivo de retroalimentación
4. Permitir observaciones, recomendaciones y sugerencias personalizadas
5. Permitir que el estudiante revise y **responda mediante comentarios o solicitudes de aclaración**
6. Incluir la pauta de evaluación aplicada a cada estudiante
7. Calcular automáticamente el promedio final según ponderaciones

El estudiante debe:
1. Visualizar sus notas, puntajes y retroalimentaciones en un panel personal
2. Acceder al historial de evaluaciones, respuestas del docente y mejoras sugeridas
3. Participar en un proceso formativo más participativo y reflexivo

---

## ✅ QUÉ ESTÁ IMPLEMENTADO

### Backend

#### 1. **Entidades de Base de Datos**
- **PautaEvaluada**: Almacena calificaciones, puntajes, retroalimentación e observaciones
  - ✅ `puntajesObtenidos` (JSON)
  - ✅ `notaFinal` (Float)
  - ✅ `observaciones` (Text)
  - ✅ `retroalimentacion` (JSON array - comentarios prof/alumno)
  - ⚠️ Falta: campo específico para periodo académico de vigencia

- **Evaluacion**: Define evaluaciones asociadas a ramos
  - ✅ `ponderacion` (Float)
  - ✅ `estado` (pendiente, aplicada, finalizada)
  - ✅ `promedio` (Float)
  - ✅ `puntajeTotal` (Int)
  - ⚠️ Falta: validación de período académico vigente

- **Pauta**: Almacena rubrica/criterios de evaluación
  - ✅ `criterios` (Text)
  - ✅ `distribucionPuntaje` (JSON)
  - ✅ `publicada` (Boolean)

#### 2. **Servicios Implementados**

**pautaEvaluada.service.js**:
- ✅ `createPautaEvaluadaService()`: Crea evaluación de estudiante
- ✅ `updatePautaEvaluadaService()`: Modifica calificaciones existentes
- ✅ `calcNotaFinal()`: Calcula automáticamente nota según puntajes y ponderación
- ✅ `updateEvaluacionPromedio()`: Actualiza promedio de la evaluación
- ✅ `obtenerPromedioPorEvaluacion()`: Obtiene promedio por evaluación
- ✅ `obtenerPromedioPorAlumno()`: Obtiene promedio del alumno en evaluaciones
- ✅ `obtenerPromedioGeneralPorRamo()`: Promedio general por ramo
- ✅ `obtenerEvaluacionesYNotasAlumno()`: Historial de notas del alumno

**retroalimentacion.service.js**:
- ✅ `addRetroalimentacionService()`: Agrega retroalimentación (profesor o alumno)
- ✅ `getRetroalimentacionesService()`: Obtiene retroalimentaciones
- ✅ Maneja comentarios del profesor y respuestas del alumno

#### 3. **Controladores**
- ✅ `pautaEvaluada.controller.js`: CRUD de pautas evaluadas
- ✅ `retroalimentacion.controller.js`: Gestión de retroalimentación
- ✅ `evaluacion.controller.js`: Gestión de evaluaciones

#### 4. **Rutas API**
- ✅ POST `/pautas/:pautaId/retroalimentacion` - Agregar retroalimentación
- ✅ GET `/pautas/:pautaId/retroalimentacion` - Obtener retroalimentación
- ✅ POST/PATCH `/pautas-evaluadas` - Crear/modificar calificaciones
- ✅ GET `/pautas-evaluadas` - Obtener pautas evaluadas

### Frontend

#### 1. **Páginas Implementadas**
- ✅ **EvaluarPage.jsx**: Interfaz para docentes
  - Tabla de estudiantes con estados de evaluación
  - Distribución de puntajes por criterio
  - Campo de puntajes obtenidos editable
  - Campo de observaciones
  - Cálculo automático de nota final
  - Botón guardar/reevaluar

- ✅ **MisRamosNotasPage.jsx**: Panel personal del alumno
  - Vista de ramos inscritos
  - Lista de evaluaciones por ramo
  - Notas obtenidas en cada evaluación
  - Modal con detalle de pauta evaluada:
    - Desglose de criterios con puntajes
    - Puntaje obtenido vs puntaje total
    - Nota final
    - **PERO**: No muestra retroalimentación ni permite interacción

#### 2. **Servicios Frontend**
- ✅ `evaluacion.service.js`: Llamadas API para evaluaciones
- ✅ `pautaEvaluada.service.js`: CRUD de pautas evaluadas
- ✅ `retroalimentacion.service.js`: Gestión de retroalimentación (existe pero NO se usa en UI)

---

## ❌ QUÉ FALTA IMPLEMENTAR

### 1. **CRÍTICO: Validación de Período Académico Vigente**

**Problema**: No existe modelo de "Período Académico" en el sistema

**Lo que falta**:
- [ ] Entidad `PeriodoAcademico` con:
  - `id`, `nombre`, `fechaInicio`, `fechaFin`, `estado` (vigente/finalizado/planificado)
  - Relación con ramos
- [ ] Validación en controladores de evaluación para verificar si el período está vigente
- [ ] Middleware de autorización que bloquee modificaciones fuera del período vigente
- [ ] Endpoint para crear/modificar periodos académicos (admin/jefeCarrera)

**Impacto**: Actualmente el docente puede calificar EN CUALQUIER MOMENTO, violando el requisito

---

### 2. **CRÍTICO: Interfaz Interactiva de Retroalimentación**

**Problema**: La retroalimentación está en BD pero NO está integrada en la UI del alumno

**Lo que falta**:

#### En Frontend:
- [ ] **Componente RetroalimentacionPanel** en MisRamosNotasPage que muestre:
  - Retroalimentaciones del profesor con fecha/hora
  - Campo de texto para que el alumno responda
  - Historial de comentarios bidireccionales
  - Estados: "No respondido", "Respondido", "Aclaración solicitada"

- [ ] **Interfaz de Retroalimentación en EvaluarPage** para docente:
  - Sección de "Retroalimentación Cualitativa" para cada estudiante
  - Area de texto para observaciones
  - Area de texto para recomendaciones/sugerencias
  - Area de texto para mejoras sugeridas
  - Visualizar respuestas del alumno

- [ ] **Notificaciones** cuando:
  - El alumno responde una retroalimentación
  - El profesor agrega una retroalimentación

#### En Backend:
- [ ] **Endpoint PUT/PATCH** para que alumno responda retroalimentación
- [ ] **Endpoint GET** para obtener retroalimentación con respuestas asociadas
- [ ] **Validación** de permisos profesor-alumno en retroalimentación
- [ ] **Mejora de estructura** en retroalimentacion.service.js para manejar threads de comentarios

---

### 3. **PARCIAL: Pauta de Evaluación por Estudiante**

**Estado Actual**:
- ✅ Se guarda `idPauta` en cada pauta evaluada
- ✅ Se incluyen `puntajesObtenidos` (especifico del estudiante)
- ❌ **La pauta aplicada (con criterios) NO se muestra en MisRamosNotasPage**

**Lo que falta**:
- [ ] Mostrar en modal de notas del alumno:
  - Nombre de criterios de la pauta
  - Puntaje máximo por criterio
  - Puntaje obtenido por criterio (ya está)
  - Observaciones específicas por criterio (si existen)

---

### 4. **PARCIAL: Cálculo de Promedio Final**

**Estado Actual**:
- ✅ Se calcula nota por evaluación según puntajes
- ⚠️ **Promedio final de la asignatura** NO se calcula/visualiza
- ❌ No se usa la ponderación de cada evaluación en el cálculo final

**Lo que falta**:
- [ ] Crear servicio `calcularPromedioFinal()` que:
  - Obtenga todas las evaluaciones del ramo (con ponderaciones)
  - Obtenga notas finales del alumno por evaluación
  - Calcule: `promedio = Σ(notaEval × ponderacion) / Σ(ponderacion)`
  
- [ ] **Endpoint GET** `/ramos/:ramoId/alumno/:alumnoRut/promedio-final`

- [ ] **Mostrar en MisRamosNotasPage**:
  - Tabla con evaluaciones + ponderación + nota
  - **Promedio final de la asignatura** destacado
  - Indicador de aprobación (≥4.0)

- [ ] **Mostrar en EvaluarPage** (docente):
  - Promedio de la clase por ramo
  - Distribución de notas

---

### 5. **FALTA: Historial Completo en Panel del Alumno**

**Lo que falta en MisRamosNotasPage**:
- [ ] Botón "Ver Detalles" que abra modal completo con:
  - Pauta de evaluación (criterios)
  - Calificaciones por criterio
  - Retroalimentación del profesor (observaciones, recomendaciones, mejoras)
  - Campo para responder/comentar
  - Historial de comentarios bidireccionales
  - Solicitar aclaración (botón específico)
  
- [ ] Timeline/historial que muestre:
  - Fecha de calificación
  - Fecha de retroalimentación añadida
  - Fecha de respuesta del alumno
  - Cambios en calificación (si fue reevaluado)

---

### 6. **FALTA: Mejoras en Estructura de Retroalimentación**

**Problema**: Campo `retroalimentacion` es un array plano sin estructura clara

**Lo que falta**:
- [ ] **Entidad separada `ComentarioRetroalimentacion`** con:
  - `id`, `pautaEvaluadaId`, `autorId`, `autorRole`
  - `tipo` (observacion, recomendacion, sugerencia, respuesta_alumno, solicitud_aclaracion)
  - `contenido` (texto)
  - `timestamp`
  - `parentCommentId` (para threads)
  - `estado` (sin_leer, leido, respondido)

- [ ] **Servicios mejorados**:
  - `addComentario()`
  - `responderComentario()`
  - `solicitarAclaracion()`
  - `obtenerThreadDeComentarios()`

- [ ] **Rutas mejoradas**:
  - POST `/pautas-evaluadas/:id/comentarios` - Agregar comentario
  - POST `/pautas-evaluadas/:id/comentarios/:comentarioId/responder` - Responder
  - GET `/pautas-evaluadas/:id/comentarios` - Obtener hilo

---

### 7. **FALTA: Permisos y Validaciones**

**Lo que falta**:
- [ ] Validar que profesor solo pueda calificar evaluaciones de sus propios ramos
- [ ] Validar que alumno solo vea sus propias calificaciones
- [ ] Validar que solo profesor pueda agregar retroalimentación (pero alumno pueda responder)
- [ ] Validar fecha del período académico en UPDATE de calificaciones

---

## 📋 RESUMEN DE IMPLEMENTACIÓN REQUERIDA

| Funcionalidad | Backend | Frontend | Prioridad |
|---|---|---|---|
| Período Académico (modelo + validación) | ❌ | ❌ | CRÍTICA |
| Interfaz de retroalimentación interactiva | ⚠️ (API existe, no usada) | ❌ | CRÍTICA |
| Respuestas del alumno a retroalimentación | ✅ (lógica existe) | ❌ | CRÍTICA |
| Mostrar pauta en vista del alumno | ✅ | ⚠️ (parcial) | ALTA |
| Promedio final de asignatura | ❌ | ❌ | ALTA |
| Historial completo | ⚠️ | ❌ | MEDIA |
| Estructura mejorada de comentarios | ❌ | ❌ | MEDIA |
| Notificaciones de retroalimentación | ⚠️ | ❌ | MEDIA |
| Validaciones de permisos | ⚠️ | ❌ | ALTA |

---

## 🎯 ORDEN RECOMENDADO DE IMPLEMENTACIÓN

1. **Crear PeriodoAcademico** (Backend)
2. **Validar período vigente** en controladores
3. **UI de retroalimentación** en MisRamosNotasPage
4. **Cálculo de promedio final** con ponderaciones
5. **Mejorar estructura de comentarios** en BD
6. **Historial completo** en panel del alumno
7. **Notificaciones** de actividad


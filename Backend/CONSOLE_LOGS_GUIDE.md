# Guía de Logs de la Consola

Tu servidor ahora mostrará todos los eventos y errores en la consola. Aquí está qué esperar:

## LOGS EXITOSOS

### Cuando inicias el servidor:
```
[OK] Servidor iniciado en http://localhost:3000
[READY] Ready to accept connections
```

### Cuando haces una petición GET (listar):
```
[REQUEST] GET /api/events
Headers: { authorization: 'Bearer token...', ... }
[OK] GET /api/events - Usuario: profesor@example.com (profesor) - Eventos encontrados: 2
```

### Cuando creas un evento:
```
[REQUEST] POST /api/events
Headers: { authorization: 'Bearer token...', ... }
Body: { title: 'Taller de JavaScript', ... }
[OK] POST /api/events - Evento creado por profesor@example.com - ID: 1 - Título: "Taller de JavaScript"
```

### Cuando obtienes un evento específico:
```
[REQUEST] GET /api/events/1
Headers: { authorization: 'Bearer token...', ... }
[OK] GET /api/events/1 - Evento encontrado por profesor@example.com
```

### Cuando actualizas un evento:
```
[REQUEST] PUT /api/events/1
Headers: { authorization: 'Bearer token...', ... }
Body: { title: 'Título actualizado', ... }
[OK] PUT /api/events/1 - Evento actualizado por profesor@example.com
```

### Cuando eliminas un evento:
```
[REQUEST] DELETE /api/events/1
Headers: { authorization: 'Bearer token...', ... }
[OK] DELETE /api/events/1 - Evento eliminado por profesor@example.com
```

### Cuando creas una reserva:
```
[REQUEST] POST /api/bookings
Headers: { authorization: 'Bearer token...', ... }
Body: { event_id: 1, notes: '...' }
[OK] POST /api/bookings - Reserva creada por alumno@example.com - ID: 1 - Event ID: 1
```

---

## ADVERTENCIAS (Errores que no causan crash)

### Cuando intentas acceder a un recurso que no existe:
```
[REQUEST] GET /api/events/999
Headers: { authorization: 'Bearer token...', ... }
[WARN] GET /api/events/999 - Evento no encontrado
```

### Cuando intentas acceder sin permisos:
```
[REQUEST] GET /api/events/5
Headers: { authorization: 'Bearer token...', ... }
[WARN] GET /api/events/5 - profesor@example.com intentó acceder a evento de otro profesor
```

### Cuando intentas acceder a una ruta inexistente:
```
[REQUEST] GET /api/rutas-inexistentes
[WARN] RUTA NO ENCONTRADA: GET /api/rutas-inexistentes
```

---

## ERRORES CRÍTICOS

### Error en la base de datos:
```
[ERROR] Error al conectar con la base de datos: Connection refused
```

### Error en la inicialización:
```
[ERROR] Error al inicializar datos por defecto: [error details]
```

### Error en una petición (try-catch):
```
[REQUEST] POST /api/events
Body: { ... }
[ERROR] ERROR en POST /api/events: TypeError: Cannot read property 'title' of undefined
```

---

## INTERPRETAR LOS LOGS

### Símbolos:
- [OK] Verde = Operación exitosa
- [WARN] Amarillo = Advertencia (error esperado, sin crash)
- [ERROR] Rojo = Error crítico (investigar)
- [REQUEST] Azul = Nueva petición recibida
- [READY] Cohete = Servidor listo

### Información útil en cada log:
```
[OK] GET /api/events                              -> El método HTTP y ruta
   - Usuario: profesor@example.com             -> Quién hizo la petición
   - Eventos encontrados: 2                    -> Resultado de la operación
```

---

## EJEMPLO DE SESIÓN COMPLETA EN LA CONSOLA

```
[OK] Servidor iniciado en http://localhost:3000
[READY] Ready to accept connections

[REQUEST] POST /api/auth/login
Headers: { content-type: 'application/json' }
Body: { email: 'profesor@example.com', password: 'password123' }

[REQUEST] POST /api/events
Headers: { authorization: 'Bearer eyJhb...', content-type: 'application/json' }
Body: { title: 'Taller JS', description: 'Aprende JS', event_type: 'taller', ... }
[OK] POST /api/events - Evento creado por profesor@example.com - ID: 1 - Título: "Taller JS"

[REQUEST] GET /api/events
Headers: { authorization: 'Bearer eyJhb...', content-type: 'application/json' }
[OK] GET /api/events - Usuario: profesor@example.com (profesor) - Eventos encontrados: 1

[REQUEST] GET /api/events/1
Headers: { authorization: 'Bearer eyJhb...', content-type: 'application/json' }
[OK] GET /api/events/1 - Evento encontrado por profesor@example.com

[REQUEST] PUT /api/events/1
Headers: { authorization: 'Bearer eyJhb...', content-type: 'application/json' }
Body: { title: 'Taller JavaScript ACTUALIZADO' }
[OK] PUT /api/events/1 - Evento actualizado por profesor@example.com

[REQUEST] DELETE /api/events/1
Headers: { authorization: 'Bearer eyJhb...', content-type: 'application/json' }
[OK] DELETE /api/events/1 - Evento eliminado por profesor@example.com
```

---

## TIPS ÚTILES

1. Buscar errores: Busca por [ERROR] para encontrar rápidamente problemas
2. Ver quién hizo qué: Cada log tiene el `email` del usuario
3. Auditoría: Puedes revisar qué usuario hizo cada operación
4. Debug: Si algo no funciona, revisa si el usuario tiene permisos (rol correcto)

Ahora puedes seguir en detalle qué está pasando en tu API!

# Instrucciones de Integración - Sistema de Retroalimentaciones

## Backend

### 1. Instalar Socket.io
```bash
npm install socket.io
```

### 2. Integrar Socket.io en `server.js`

```javascript
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import retroalimentacionHandler from './websocket/retroalimentacionHandler.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://tu-dominio.com'],
    credentials: true,
  },
});

// Inicializar handlers WebSocket
retroalimentacionHandler.initialize(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
```

### 3. Registrar rutas de retroalimentación en `app.js`

```javascript
import retroalimentacionRoutes from './routes/retroalimentacion.routes.js';

// ... otras rutas ...

app.use('/retroalimentacion', retroalimentacionRoutes);
```

### 4. Ejecutar migración
```bash
node runMigrations.js
```

## Frontend

### 1. Instalar Socket.io
```bash
npm install socket.io-client
```

### 2. Configurar variable de entorno en `.env.local`
```
VITE_SOCKET_URL=http://localhost:3000
```

### 3. Inicializar Socket en el contexto de autenticación

En tu `AuthContext.jsx`, agregar:

```javascript
import socketService from '../services/socket.service';

// En el useEffect donde confirmas que el usuario está autenticado:
if (user && token) {
  socketService.connect(token, user);
}

// En logout:
socketService.desconectar();
```

### 4. Usar en Componentes

#### Ejemplo: Sección de Evaluar (Profesor)

```jsx
import { useState } from 'react';
import { BotonRetroalimentacion } from '../components/BotonRetroalimentacion';
import { ModalRetroalimentacion } from '../components/ModalRetroalimentacion';

export const PaginaEvaluar = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState(null);

  const abrirChat = (alumno, evaluacion) => {
    setSelectedAlumno({ alumno, evaluacion });
    setModalOpen(true);
  };

  return (
    <div>
      {/* Tus contenidos */}
      
      {alumnosEvaluados.map(alumno => (
        <div key={alumno.id}>
          {/* Info del alumno */}
          
          <BotonRetroalimentacion
            ramoId={ramoId}
            alumnoRut={alumno.rut}
            evaluacionId={evaluacion.id}
            alumnoNombre={alumno.nombre}
            onClick={() => abrirChat(alumno, evaluacion)}
            label="Retroalimentación"
            variante="evaluar"
          />
        </div>
      ))}

      <ModalRetroalimentacion
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        evaluacion={selectedAlumno?.evaluacion}
        alumnoRut={selectedAlumno?.alumno?.rut}
        ramoId={ramoId}
        alumnoNombre={selectedAlumno?.alumno?.nombre}
        alumnoEmail={selectedAlumno?.alumno?.email}
        profesorNombre={user?.nombre}
        profesorEmail={user?.email}
        isProfesor={true}
      />
    </div>
  );
};
```

#### Ejemplo: Mis Notas (Alumno)

```jsx
import { useState } from 'react';
import { BotonRetroalimentacion } from '../components/BotonRetroalimentacion';
import { ModalRetroalimentacion } from '../components/ModalRetroalimentacion';

export const MisNotas = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvaluacion, setSelectedEvaluacion] = useState(null);
  const { user } = useAuth();

  const abrirChat = (evaluacion, profesor) => {
    setSelectedEvaluacion({ evaluacion, profesor });
    setModalOpen(true);
  };

  return (
    <div>
      {/* Tus evaluaciones */}
      
      {misEvaluaciones.map(evaluacion => (
        <div key={evaluacion.id}>
          {/* Nota y detalles */}
          
          <BotonRetroalimentacion
            ramoId={evaluacion.ramoId}
            alumnoRut={user?.rut}
            evaluacionId={evaluacion.id}
            alumnoNombre={user?.nombre}
            onClick={() => abrirChat(evaluacion, evaluacion.profesor)}
            label="Ver Retroalimentación"
            variante="mis-notas"
          />
        </div>
      ))}

      <ModalRetroalimentacion
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        evaluacion={selectedEvaluacion?.evaluacion}
        alumnoRut={user?.rut}
        ramoId={selectedEvaluacion?.evaluacion?.ramoId}
        alumnoNombre={user?.nombre}
        alumnoEmail={user?.email}
        profesorNombre={selectedEvaluacion?.profesor?.nombre}
        profesorEmail={selectedEvaluacion?.profesor?.email}
        evaluacionIntegradoraId={selectedEvaluacion?.evaluacion?.evaluacionIntegradoraId}
        isProfesor={false}
      />
    </div>
  );
};
```

### 5. Mostrar Notificaciones de Retroalimentación

En tu layout principal o donde manejes notificaciones:

```jsx
import { NotificacionRetroalimentacion } from '../components/NotificacionRetroalimentacion';
import { useEffect, useState } from 'react';
import { obtenerNoVistos } from '../services/retroalimentacion.service';

export const App = () => {
  const { user } = useAuth();
  const [notificacion, setNotificacion] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Verificar mensajes no vistos periódicamente
    const interval = setInterval(async () => {
      try {
        // Obtener ramos del usuario
        const ramos = user.ramos || [];
        
        for (const ramo of ramos) {
          const data = await obtenerNoVistos(ramo.id);
          if (data.mensajes?.length > 0) {
            // Mostrar notificación
            setNotificacion({
              tipo: user.role === 'profesor' ? 'profesor' : 'alumno',
              mensaje: data.mensajes[0],
              evaluacion: data.mensajes[0].evaluacion,
              ramo: data.mensajes[0].ramo,
            });
            break;
          }
        }
      } catch (error) {
        console.error('Error obteniendo notificaciones:', error);
      }
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      {/* Tu layout */}
      
      {notificacion && (
        <NotificacionRetroalimentacion
          notificacion={notificacion}
          tipo={notificacion.tipo}
          onClose={() => setNotificacion(null)}
          onClick={() => {
            // Abrir modal de retroalimentación
            console.log('Abrir chat');
          }}
        />
      )}
    </>
  );
};
```

## Estructura de Datos

### Mensaje de Retroalimentación
```javascript
{
  id: number,
  evaluacionId: number | null,
  evaluacionIntegradoraId: number | null,
  profesorId: number,
  alumnoRut: string,
  ramoId: number,
  codigoRamo: string | null,
  mensaje: string,
  visto: boolean,
  createdAt: timestamp,
  profesor: { id, nombre, email },
  ramo: { id, nombre, codigo }
}
```

## Eventos Socket.io

### Cliente → Servidor
- `join-retroalimentacion` - Unirse a sala
- `mensaje-retroalimentacion` - Enviar mensaje
- `marcar-vistos` - Marcar como visto

### Servidor → Cliente
- `mensajes-previos` - Historial inicial
- `nuevo-mensaje` - Nuevo mensaje llega
- `mensajes-marcados-vistos` - Confirmación de marca como visto
- `usuario-conectado` - Otro usuario se conectó
- `error` - Error en Socket

## Notas Importantes

1. **Autenticación**: El socket se autentica con el JWT token
2. **Salas**: Se usan salas por `retroalimentacion-{ramoId}-{alumnoRut}`
3. **Persistencia**: Los mensajes se guardan en BD
4. **Notificaciones**: Se integran con el sistema de notificaciones existente
5. **Colores**: 
   - Chat: Azul #1e5a8e (enviado), Blanco (recibido)
   - No vistos: Verde #4caf50
   - Gris: #999 (sin mensajes)

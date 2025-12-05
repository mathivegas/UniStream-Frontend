# UniStream Frontend

Interfaz de usuario para la plataforma de streaming interactiva **UniStream**. Desarrollada para el curso de Programación Web.

## 📋 Características

- ✅ Autenticación de usuarios (Login/Registro)
- ✅ Panel de control para Espectadores
- ✅ Panel de control para Streamers
- ✅ Envío de regalos interactivo
- ✅ Compra de monedas
- ✅ Sistema de notificaciones
- ✅ Interfaz responsiva

## 🛠️ Tecnologías

- **React 19** - Librería UI
- **TypeScript** - Tipado estático
- **Material-UI (MUI)** - Componentes UI profesionales
- **React Router DOM** - Navegación
- **Vite** - Build tool (opcional, usa create-react-app actualmente)

## 📦 Instalación

### Prerrequisitos

- Node.js v18 o superior
- npm o yarn
- Backend corriendo en `http://localhost:3000`

### Pasos

1. **Clonar el repositorio:**

```bash
git clone https://github.com/mathivegas/UniStream-Frontend.git
cd UniStream-Frontend
```

2. **Instalar dependencias:**

```bash
npm install
```

3. **Iniciar el servidor de desarrollo:**

```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

---


## 🔗 Conexión con Backend

La API se conecta a través del archivo `src/services/api.ts`. Configura la URL del backend:

```typescript
// Desarrollo
const API_URL = "http://localhost:3000/api";

// Producción
// const API_URL = "https://tu-backend.com/api";
```

---



Este proyecto es de uso educativo.

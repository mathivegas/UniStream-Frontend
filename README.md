# UniStream Frontend 🎬

Interfaz de usuario para la plataforma de streaming interactiva **UniStream**. Desarrollada con **React**, **TypeScript** y **Material-UI**.

## 📋 Características

- ✅ Autenticación de usuarios (Login/Registro)
- ✅ Panel de control para Espectadores
- ✅ Panel de control para Streamers
- ✅ Envío de regalos interactivo
- ✅ Compra de monedas
- ✅ Visualización de perfiles
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

## 🚀 Scripts Disponibles

```bash
npm start      # Inicia el servidor de desarrollo
npm run build  # Construye la aplicación para producción
npm test       # Ejecuta los tests
npm run eject  # Expone la configuración (irreversible)
```

---

## 📁 Estructura del Proyecto

```
frontend/src/
├── components/
│   ├── button.tsx              # Componente de botón
│   ├── input_field.tsx         # Campo de entrada
│   ├── InputConLabel.tsx       # Input con etiqueta
│   ├── ProtectedRoute.tsx      # Ruta protegida
│   ├── GiftCard/               # Tarjeta de regalo
│   ├── GiftForm/               # Formulario de envío de regalo
│   ├── Navigation/             # Barra de navegación
│   ├── NotificationSystem/     # Sistema de notificaciones
│   ├── ProgressBar/            # Barra de progreso
│   └── UserProfile/            # Perfil de usuario
├── context/
│   └── AuthContext.tsx         # Contexto de autenticación
├── pages/
│   ├── home.tsx                # Página de inicio
│   ├── login.tsx               # Login
│   ├── registro.tsx            # Registro
│   ├── recarga.tsx             # Compra de monedas
│   ├── SpectatorDashboard.tsx  # Dashboard espectador
│   ├── StreamerDashboard.tsx   # Dashboard streamer
│   ├── about.tsx               # Acerca de
│   ├── terms.tsx               # Términos
│   ├── AdminPanel/             # Panel de administración
│   ├── Login/                  # Página de login
│   ├── PerfilEspectador/       # Perfil del espectador
│   └── Registro/               # Página de registro
├── services/
│   └── api.ts                  # Servicios de API
├── types/
│   └── index.ts                # Tipos TypeScript
├── App.tsx                     # Componente principal
├── index.tsx                   # Entrada de la aplicación
└── index.css                   # Estilos globales
```

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

## 🎨 Componentes Principales

### AuthContext
Maneja la autenticación y el estado del usuario:

```typescript
const { user, token, isAuthenticated, login, register, logout } = useAuth();
```

### Pages
- **home.tsx** - Página de bienvenida
- **login.tsx** - Formulario de login
- **registro.tsx** - Formulario de registro
- **SpectatorDashboard.tsx** - Panel principal para espectadores
- **StreamerDashboard.tsx** - Panel principal para streamers
- **recarga.tsx** - Compra de monedas

### Components
- **GiftCard** - Muestra un regalo disponible
- **GiftForm** - Formulario para enviar regalo
- **Navigation** - Barra de navegación
- **NotificationSystem** - Notificaciones emergentes
- **UserProfile** - Información del usuario

---

## 🚀 Despliegue

### En Vercel (Recomendado)

1. Ve a [Vercel](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Haz clic en **"Deploy"**
4. Agrega variable de entorno:
   ```
   REACT_APP_API_URL=https://tu-backend.com/api
   ```

### En Netlify

1. Ve a [Netlify](https://netlify.com)
2. Conecta tu repositorio
3. **Build Command:** `npm run build`
4. **Publish Directory:** `build`

### En GitHub Pages

```bash
npm run build
npm install -g gh-pages
echo "homepage: https://mathivegas.github.io/UniStream-Frontend" >> package.json
npm run deploy
```

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENV=development
```

---

## 📱 Responsive Design

La aplicación está optimizada para:
- ✅ Desktop (1920px y mayor)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (320px - 767px)

---

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Con cobertura
npm test -- --coverage
```

---

## 🐛 Troubleshooting

### Puerto 3000 en uso
```bash
# Usa otro puerto
PORT=3001 npm start
```

### Problemas de CORS
Asegúrate de que el backend esté corriendo y el `.env` apunte a la URL correcta.

### Módulos no encontrados
```bash
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## 🤝 Contribuyentes

- **Mathias Vegas** - Desarrollo completo

---

## 📄 Licencia

Este proyecto es de uso educativo.

---

## 📞 Soporte

Para reportar bugs o sugerencias, abre un **Issue** en el repositorio.

---

**Última actualización:** Diciembre 2025

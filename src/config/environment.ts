// Configuración de URLs según el entorno

const isDevelopment = process.env.NODE_ENV === 'development';

// URL del backend
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3000'  // Desarrollo local
  : process.env.REACT_APP_API_URL || 'https://tu-backend.onrender.com'; // Producción

// URL del WebSocket (Agora o cualquier otro servicio en tiempo real)
export const WS_BASE_URL = isDevelopment
  ? 'ws://localhost:3000'
  : process.env.REACT_APP_WS_URL || 'wss://tu-backend.onrender.com';

console.log('🌐 Modo:', isDevelopment ? 'DESARROLLO' : 'PRODUCCIÓN');
console.log('🔗 API URL:', API_BASE_URL);

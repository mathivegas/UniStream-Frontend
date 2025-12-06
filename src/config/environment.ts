// Configuración de URLs según el entorno
import logger from '../utils/logger';

const isDevelopment = process.env.NODE_ENV === 'development' || 
                      window.location.hostname === 'localhost';

// URL del backend
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3000'  // Desarrollo local
  : process.env.REACT_APP_API_URL || 'https://unistream-backend.onrender.com'; // Producción

// URL del WebSocket para Socket.io
export const WS_BASE_URL = isDevelopment
  ? 'http://localhost:3000'
  : process.env.REACT_APP_API_URL || 'https://unistream-backend.onrender.com';

// Agora App ID
export const AGORA_APP_ID = process.env.REACT_APP_AGORA_APP_ID || 'bdea611def67404b86bf6de6aa55840d';

logger.info('🌐 Modo:', isDevelopment ? 'DESARROLLO' : 'PRODUCCIÓN');
logger.info('🔗 API URL:', API_BASE_URL);
logger.info('🔌 Socket URL:', WS_BASE_URL);
logger.info('📡 Agora App ID:', AGORA_APP_ID ? '✅ Configurado' : '❌ Falta configurar');

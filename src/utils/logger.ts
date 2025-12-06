/**
 * Sistema de logging optimizado para UniStream
 * Los logs solo se muestran en desarrollo, en producción se silencian automáticamente
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Logger optimizado que solo funciona en desarrollo
 */
export const logger = {
  // Logs informativos (solo desarrollo)
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // Información importante (solo desarrollo)
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  // Advertencias (siempre se muestran)
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  // Errores (siempre se muestran)
  error: (...args: any[]) => {
    console.error(...args);
  },

  // Debug detallado (solo desarrollo)
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  // Logs de grupo (solo desarrollo)
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  // Tiempo de ejecución (solo desarrollo)
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }
};

// Export default para uso simple
export default logger;

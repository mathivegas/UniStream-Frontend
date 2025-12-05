export const AGORA_APP_ID = process.env.REACT_APP_AGORA_APP_ID || '';

if (!AGORA_APP_ID) {
  console.error('⚠️ AGORA_APP_ID no está configurado. Verifica tu archivo .env');
}

// Generar un nombre único de canal basado en el ID del usuario
export const generateChannelName = (userId: string): string => {
  return `stream_${userId.substring(0, 8)}_${Date.now()}`;
};

// Generar un UID único para el usuario en Agora
export const generateUID = (): number => {
  return Math.floor(Math.random() * 100000);
};
export type UserType = 'espectador' | 'streamer';

// User interface with all properties
export interface User {
  id: string;
  nombre: string;
  username: string;
  email: string;
  password: string;
  userType: UserType;
  avatarUrl: string;
  nivel: number;
  puntos: number;
  puntosMaximos: number;
  tiempoVisualizacion: string;
  streamersSeguidos: number;
  regalosEnviados: number;
  regalosRecibidos: number;
  bio?: string;
  fechaRegistro: string;
  hours?: number;
  isLive?: boolean;
  liveStartedAt?: string;
  level?: number;
  coins?: number;
  points?: number;
}

export interface AuthUser {
  id: string;
  nombre: string;
  username: string;
  email: string;
  userType: UserType;
  avatarUrl: string;
  coins?: number;
  points?: number;
  level?: number;
  hours?: number;
  isLive?: boolean;
  liveStartedAt?: string;
}

export interface Gift {
  id: string;
  nombre: string;
  descripcion: string;
  costo: number;
  puntos: number;
  imagenUrl: string;
}

export interface GiftHistory {
  id: string;
  tipo: 'enviado' | 'recibido';
  destinatario?: string;
  remitente?: string;
  puntos: number;
  fecha: string;
}

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'levelup';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  isVisible: boolean;
}

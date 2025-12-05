import { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

// Socket compartido global (singleton)
let sharedSocket: any = null;
let socketRefCount = 0;

export type ChatMessage = {
  ts: number;
  userId: string;
  userName: string;
  userLevelAtSend: number;
  text: string;
};

export type GiftNotification = {
  senderName: string;
  giftEmoji: string;
  giftName: string;
  giftPoints: number;
};

// Hook unificado que maneja todo: chat, notificaciones de regalos y actualización de lista
export function useSocket(streamerId: string | null, options?: {
  userName?: string;
  onGiftReceived?: (gift: GiftNotification) => void;
  onGiftListUpdated?: (gift: any) => void;
  onStreamerStatusChanged?: (data: { streamerId: string; isLive: boolean; liveChannelName: string | null }) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const onGiftReceivedRef = useRef(options?.onGiftReceived);
  const onGiftListUpdatedRef = useRef(options?.onGiftListUpdated);
  const onStreamerStatusChangedRef = useRef(options?.onStreamerStatusChanged);
  const userNameRef = useRef(options?.userName);
  const prevStreamerIdRef = useRef<string | null>(null);

  // Actualizar referencias sin causar reconexión
  useEffect(() => {
    onGiftReceivedRef.current = options?.onGiftReceived;
    onGiftListUpdatedRef.current = options?.onGiftListUpdated;
    onStreamerStatusChangedRef.current = options?.onStreamerStatusChanged;
    userNameRef.current = options?.userName;
  }, [options?.onGiftReceived, options?.onGiftListUpdated, options?.onStreamerStatusChanged, options?.userName]);

  // Crear socket una sola vez (singleton global)
  useEffect(() => {
    if (!sharedSocket) {
      sharedSocket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
      
      sharedSocket.on('connect', () => {
        setIsConnected(true);
      });

      sharedSocket.on('disconnect', () => {
        setIsConnected(false);
      });
    }

    socketRefCount++;

    return () => {
      socketRefCount--;
      // Solo desconectar cuando todos los componentes se desmonten
      if (socketRefCount === 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
    };
  }, []); // Solo se ejecuta una vez

  // Manejar cambio de sala cuando cambia el streamerId
  useEffect(() => {
    if (!streamerId || !sharedSocket) {
      setMessages([]);
      return;
    }

    // Solo unirse a nueva sala si cambió el streamer
    if (prevStreamerIdRef.current !== streamerId) {
      setMessages([]); // Limpiar mensajes del streamer anterior

      // Cargar mensajes del localStorage
      const chatKey = `chat_${streamerId}`;
      const savedChat = localStorage.getItem(chatKey);
      if (savedChat) {
        try {
          setMessages(JSON.parse(savedChat));
        } catch (error) {
          console.error('Error al cargar chat:', error);
        }
      }

      prevStreamerIdRef.current = streamerId;
    }
  }, [streamerId]);

  // Unirse a la sala cuando el socket esté conectado
  useEffect(() => {
    if (!streamerId || !sharedSocket || !isConnected) return;

    // Unirse a la sala del streamer
    sharedSocket.emit('join-chat', {
      streamerId,
      userName: userNameRef.current || 'Usuario'
    });
  }, [streamerId, isConnected]);

  // Registrar event listeners
  useEffect(() => {
    if (!sharedSocket || !streamerId) return;

    const chatKey = `chat_${streamerId}`;

    const handleNewMessage = (message: ChatMessage) => {
      setMessages((prev) => {
        // Prevenir duplicados: verificar si el mensaje ya existe por timestamp + userId
        const isDuplicate = prev.some(
          (m) => m.ts === message.ts && m.userId === message.userId
        );
        
        if (isDuplicate) {
          return prev; // No agregar si ya existe
        }
        
        const updated = [...prev, message];
        localStorage.setItem(chatKey, JSON.stringify(updated));
        return updated;
      });
    };

    const handleGiftReceived = (giftData: GiftNotification) => {
      if (onGiftReceivedRef.current) {
        onGiftReceivedRef.current(giftData);
      }
    };

    const handleGiftListUpdated = (gift: any) => {
      if (onGiftListUpdatedRef.current) {
        onGiftListUpdatedRef.current(gift);
      }
    };

    const handleStreamerStatusChanged = (data: { streamerId: string; isLive: boolean; liveChannelName: string | null }) => {
      if (onStreamerStatusChangedRef.current) {
        onStreamerStatusChangedRef.current(data);
      }
    };

    sharedSocket.on('new-message', handleNewMessage);
    sharedSocket.on('gift-received', handleGiftReceived);
    sharedSocket.on('gift-list-updated', handleGiftListUpdated);
    sharedSocket.on('streamer-status-changed', handleStreamerStatusChanged);

    return () => {
      if (sharedSocket) {
        sharedSocket.off('new-message', handleNewMessage);
        sharedSocket.off('gift-received', handleGiftReceived);
        sharedSocket.off('gift-list-updated', handleGiftListUpdated);
        sharedSocket.off('streamer-status-changed', handleStreamerStatusChanged);
      }
    };
  }, [streamerId]);

  const sendMessage = useCallback((message: ChatMessage) => {
    if (!sharedSocket || !streamerId) return;

    // Agregar mensaje localmente de inmediato (optimistic update)
    setMessages((prev) => {
      const updated = [...prev, message];
      const chatKey = `chat_${streamerId}`;
      localStorage.setItem(chatKey, JSON.stringify(updated));
      return updated;
    });

    // Enviar mensaje al servidor
    sharedSocket.emit('send-message', {
      streamerId,
      message,
    });
  }, [streamerId]);

  const notifyGift = useCallback((giftData: GiftNotification) => {
    if (!sharedSocket || !streamerId) return;

    sharedSocket.emit('send-gift', {
      streamerId,
      giftData,
    });
  }, [streamerId]);

  const notifyNewGift = useCallback((gift: any) => {
    if (!sharedSocket || !streamerId) return;

    sharedSocket.emit('new-gift-added', {
      streamerId,
      gift,
    });
  }, [streamerId]);

  return {
    messages,
    isConnected,
    sendMessage,
    notifyGift,
    notifyNewGift,
    socket: sharedSocket,
  };
}

// Mantener exportaciones antiguas para compatibilidad (wrappers)
export function useChat(streamerId: string | null) {
  const { messages, isConnected, sendMessage, socket } = useSocket(streamerId);
  return { messages, isConnected, sendMessage, socket };
}

export function useGiftNotifications(streamerId: string | null, onGiftReceived?: (gift: GiftNotification) => void) {
  const { notifyGift, notifyNewGift } = useSocket(streamerId, { onGiftReceived });
  return { notifyGift, notifyNewGift };
}

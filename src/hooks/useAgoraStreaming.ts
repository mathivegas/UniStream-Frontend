import { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng';
import { AGORA_APP_ID, generateUID } from '../services/agoraConfig';

// Debug mode - solo logs en desarrollo
const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args: any[]) => DEBUG && console.log(...args);
const error = (...args: any[]) => console.error(...args); // Errores siempre se muestran

interface UseAgoraStreamingProps {
  channelName: string | null;
  isHost: boolean; // true = streamer (publica), false = espectador (solo ve)
}

export const useAgoraStreaming = ({ channelName, isHost }: UseAgoraStreamingProps) => {
  const [client] = useState<IAgoraRTCClient>(() => 
    AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
  );
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [screenShareSupported, setScreenShareSupported] = useState(false);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  // Verificar si el navegador soporta compartir pantalla
  useEffect(() => {
    const checkScreenShareSupport = async () => {
      try {
        // Verificar si la API existe
        const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
        setScreenShareSupported(isSupported);
        
        if (!isSupported) {
          log('📱 Compartir pantalla no soportado en este dispositivo/navegador');
        } else {
          log('🖥️ Compartir pantalla disponible');
        }
      } catch (error) {
        setScreenShareSupported(false);
      }
    };
    
    checkScreenShareSupport();
  }, []);

  // Función para activar audio manualmente
  const enableAudio = () => {
    remoteUsers.forEach((user) => {
      user.audioTrack?.play();
    });
    setAudioBlocked(false);
  };

  // Inicializar cliente
  useEffect(() => {
    const init = async () => {
      // Configurar rol: host (streamer) o audience (espectador)
      await client.setClientRole(isHost ? 'host' : 'audience');

      // Eventos de usuarios remotos
      client.on('user-published', async (user, mediaType) => {
        try {
          await client.subscribe(user, mediaType);
          console.log('Usuario publicó:', user.uid, mediaType);

          if (mediaType === 'video') {
            setRemoteUsers((prev) => {
              const exists = prev.find((u) => u.uid === user.uid);
              if (exists) return prev;
              return [...prev, user];
            });
          }

          if (mediaType === 'audio') {
            // Reproducir audio automáticamente
            try {
              await user.audioTrack?.play();
              console.log('🔊 Audio remoto reproduciendo automáticamente');
            } catch (error) {
              console.warn('⚠️ El navegador bloqueó el autoplay de audio');
              setAudioBlocked(true);
            }
          }
        } catch (error: any) {
          // Ignorar errores de suscripción cuando el stream no existe
          if (error.code === 'ERR_SUBSCRIBE_REQUEST_INVALID') {
            console.warn('Stream no disponible aún, ignorando...');
          } else {
            console.error('Error al suscribirse:', error);
          }
        }
      });

      client.on('user-unpublished', (user) => {
        console.log('Usuario dejó de publicar:', user.uid);
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      client.on('user-left', (user) => {
        console.log('Usuario salió:', user.uid);
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });
    };

    init();

    return () => {
      client.removeAllListeners();
    };
  }, [client, isHost]);

  // Reproducir video remoto cuando hay usuarios
  useEffect(() => {
    if (remoteUsers.length > 0 && remoteVideoRef.current) {
      const remoteUser = remoteUsers[0];
      remoteUser.videoTrack?.play(remoteVideoRef.current);
    }
  }, [remoteUsers]);

  // Reproducir video local cuando el track esté listo
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      console.log('🎥 Reproduciendo video local en ref...');
      try {
        localVideoTrack.play(localVideoRef.current);
        console.log('✅ Video local reproducido correctamente');
      } catch (error) {
        console.error('❌ Error al reproducir video local:', error);
      }
    }
  }, [localVideoTrack, localVideoRef.current]);

  // Segundo intento con delay para asegurar que el DOM esté listo
  useEffect(() => {
    if (localVideoTrack && isPublishing) {
      const timer = setTimeout(() => {
        if (localVideoRef.current) {
          console.log('🔄 Reintento de reproducción de video...');
          try {
            localVideoTrack.play(localVideoRef.current);
            console.log('✅ Video reproducido en segundo intento');
          } catch (error) {
            console.error('❌ Error en segundo intento:', error);
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [localVideoTrack, isPublishing]);

  // Unirse al canal
  const join = async (channel: string) => {
    if (!channel || isJoined) {
      console.warn('Canal inválido o ya unido');
      return;
    }

    try {
      const uid = generateUID();
      console.log(`🔵 Uniéndose al canal ${channel} con UID ${uid}...`);
      console.log(`🔑 APP_ID: ${AGORA_APP_ID.substring(0, 8)}...`);
      
      await client.join(AGORA_APP_ID, channel, null, uid);
      setIsJoined(true);
      console.log(`✅ Unido al canal: ${channel} como ${isHost ? 'host' : 'audience'}`);

      // Si es host, crear y publicar tracks
      if (isHost) {
        console.log('🎬 Creando tracks de video y audio...');
        
        try {
          const videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: {
              width: 640,
              height: 480,
              frameRate: 30,
              bitrateMin: 600,
              bitrateMax: 1500,
            }
          });
          console.log('✅ Video track creado:', videoTrack.getTrackId());
          
          const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          console.log('✅ Audio track creado:', audioTrack.getTrackId());

          setLocalVideoTrack(videoTrack);
          setLocalAudioTrack(audioTrack);

          // Publicar
          console.log('📡 Publicando tracks al canal...');
          await client.publish([videoTrack, audioTrack]);
          setIsPublishing(true);
          console.log('✅ Tracks publicados correctamente');
          
        } catch (trackError) {
          console.error('❌ Error al crear tracks:', trackError);
          throw trackError;
        }
      }
    } catch (error) {
      console.error('❌ Error al unirse al canal:', error);
      throw error;
    }
  };

  // Salir del canal
  const leave = async () => {
    if (!isJoined) {
      console.log('No estaba unido a ningún canal');
      return;
    }

    try {
      console.log('🚪 Saliendo del canal...');

      // Detener y cerrar todos los tracks remotos primero
      remoteUsers.forEach((user) => {
        if (user.videoTrack) {
          user.videoTrack.stop();
          console.log('⏹️ Video remoto detenido');
        }
        if (user.audioTrack) {
          user.audioTrack.stop();
          console.log('⏹️ Audio remoto detenido');
        }
      });

      // Detener tracks locales (si es host)
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        console.log('⏹️ Video local cerrado');
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        console.log('⏹️ Audio local cerrado');
      }
      if (screenTrack) {
        screenTrack.stop();
        screenTrack.close();
        console.log('⏹️ Pantalla compartida cerrada');
      }

      // Salir del canal
      await client.leave();

      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setScreenTrack(null);
      setIsScreenSharing(false);
      setIsJoined(false);
      setIsPublishing(false);
      setRemoteUsers([]);

      console.log('✅ Saliste del canal correctamente');
    } catch (error) {
      console.error('❌ Error al salir del canal:', error);
      // Forzar limpieza de estado incluso si hay error
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setScreenTrack(null);
      setIsScreenSharing(false);
      setIsJoined(false);
      setIsPublishing(false);
      setRemoteUsers([]);
    }
  };

  // Iniciar compartir pantalla
  const startScreenShare = async () => {
    // Verificar si el navegador soporta compartir pantalla
    if (!screenShareSupported) {
      alert('❌ Tu navegador o dispositivo no soporta compartir pantalla.\n\n📱 En móviles, esta función no está disponible. Usa un navegador de escritorio (Chrome, Firefox, Edge) para compartir pantalla.');
      return;
    }

    if (!isJoined || !isHost) {
      console.warn('Debes estar en vivo para compartir pantalla');
      return;
    }

    try {
      console.log('🖥️ Iniciando compartir pantalla...');
      
      // Crear track de pantalla
      const screenVideoTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: {
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitrateMin: 1000,
          bitrateMax: 3000,
        }
      }, 'auto'); // 'auto' permite compartir pantalla o ventana
      
      // Manejar cuando el usuario cancela compartir pantalla desde el navegador
      if (Array.isArray(screenVideoTrack)) {
        // Si incluye audio del sistema
        const [videoTrack, audioTrack] = screenVideoTrack;
        videoTrack.on('track-ended', () => {
          console.log('🛑 Usuario detuvo compartir pantalla');
          stopScreenShare();
        });
        
        // Despublicar video de cámara y publicar pantalla
        if (localVideoTrack) {
          await client.unpublish([localVideoTrack]);
          console.log('📹 Video de cámara despublicado');
        }
        
        await client.publish([videoTrack, audioTrack]);
        setScreenTrack(videoTrack);
        setIsScreenSharing(true);
        
        // Reproducir pantalla en el contenedor local
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }
        
        console.log('✅ Compartiendo pantalla con audio del sistema');
      } else {
        // Solo video de pantalla
        screenVideoTrack.on('track-ended', () => {
          console.log('🛑 Usuario detuvo compartir pantalla');
          stopScreenShare();
        });
        
        // Despublicar video de cámara y publicar pantalla
        if (localVideoTrack) {
          await client.unpublish([localVideoTrack]);
          console.log('📹 Video de cámara despublicado');
        }
        
        await client.publish([screenVideoTrack]);
        setScreenTrack(screenVideoTrack);
        setIsScreenSharing(true);
        
        // Reproducir pantalla en el contenedor local
        if (localVideoRef.current) {
          screenVideoTrack.play(localVideoRef.current);
        }
        
        console.log('✅ Compartiendo pantalla');
      }
    } catch (error: any) {
      console.error('❌ Error al compartir pantalla:', error);
      
      // Si el usuario cancela la selección de pantalla
      if (error.code === 'PERMISSION_DENIED' || error.name === 'NotAllowedError') {
        console.log('⚠️ Usuario canceló compartir pantalla');
      } else {
        alert('Error al compartir pantalla: ' + error.message);
      }
    }
  };

  // Detener compartir pantalla y volver a la cámara
  const stopScreenShare = async () => {
    if (!screenTrack) return;

    try {
      console.log('🛑 Deteniendo compartir pantalla...');
      
      // Despublicar pantalla
      await client.unpublish([screenTrack]);
      screenTrack.stop();
      screenTrack.close();
      setScreenTrack(null);
      setIsScreenSharing(false);
      
      // Volver a publicar video de cámara
      if (localVideoTrack) {
        await client.publish([localVideoTrack]);
        
        // Reproducir cámara nuevamente
        if (localVideoRef.current) {
          localVideoTrack.play(localVideoRef.current);
        }
        
        console.log('✅ Volviendo a transmitir desde la cámara');
      }
    } catch (error) {
      console.error('❌ Error al detener compartir pantalla:', error);
    }
  };

  return {
    join,
    leave,
    isJoined,
    isPublishing,
    localVideoRef,
    remoteVideoRef,
    remoteUsers,
    localVideoTrack,
    localAudioTrack,
    audioBlocked,
    enableAudio,
    isScreenSharing,
    screenShareSupported,
    startScreenShare,
    stopScreenShare,
  };
};

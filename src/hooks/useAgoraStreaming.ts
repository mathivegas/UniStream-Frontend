import { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { AGORA_APP_ID, generateUID } from '../services/agoraConfig';

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
  const [isJoined, setIsJoined] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

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
              frameRate: 15,
              bitrateMin: 400,
              bitrateMax: 1000,
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

      // Salir del canal
      await client.leave();

      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setIsJoined(false);
      setIsPublishing(false);
      setRemoteUsers([]);

      console.log('✅ Saliste del canal correctamente');
    } catch (error) {
      console.error('❌ Error al salir del canal:', error);
      // Forzar limpieza de estado incluso si hay error
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setIsJoined(false);
      setIsPublishing(false);
      setRemoteUsers([]);
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
  };
};

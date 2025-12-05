import React, { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';
import Card from '@mui/joy/Card';
import Table from '@mui/joy/Table';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useAgoraStreaming } from '../hooks/useAgoraStreaming';
import { useSocket, type ChatMessage } from '../hooks/useChat';
import { API_BASE_URL } from '../config/environment';

type Gift = { 
  id: string;
  name: string; 
  emoji: string;
  cost: number; 
  points: number;
  description?: string;
};

type User = {
  email: string;
  username?: string;
  role?: 'espectador' | 'streamer';
  coins?: number;
  points?: number;
  level?: number;
  hours?: number;
};

type Streamer = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  isLive?: boolean;
  liveChannelName?: string | null;
  level?: number;
  points?: number;
};

export default function SpectatorDashboard() {
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [coins, setCoins] = useState<number | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);

  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [selectedStreamerId, setSelectedStreamerId] = useState<string | null>(null);
  const selectedStreamer = useMemo(
    () => streamers.find((s) => s.id === selectedStreamerId) || null,
    [streamers, selectedStreamerId]
  );

  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hook unificado de Socket.io (una sola conexión para todo)
  const { 
    messages, 
    isConnected, 
    sendMessage: sendSocketMessage, 
    notifyGift,
    socket 
  } = useSocket(selectedStreamerId, {
    userName: currentUser?.username || currentUser?.email || 'Espectador',
    onGiftListUpdated: (newGift) => {
      setGifts((prevGifts) => {
        if (prevGifts.some(g => g.id === newGift.id)) return prevGifts;
        return [...prevGifts, newGift];
      });
    },
    onStreamerStatusChanged: (data: { streamerId: string; isLive: boolean; liveChannelName: string | null }) => {
      setStreamers((prev) =>
        prev.map((s) =>
          s.id === data.streamerId
            ? { ...s, isLive: data.isLive, liveChannelName: data.liveChannelName }
            : s
        )
      );
    }
  });

  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevelRef = useRef<number>(1);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Estado para los niveles del streamer actual
  const [streamerLevels, setStreamerLevels] = useState<Array<{ levelNumber: number; levelName: string; requiredPoints: number }>>([]);

  // Calcular el siguiente nivel y puntos necesarios
  const nextLevelInfo = useMemo(() => {
    if (!user?.level || streamerLevels.length === 0 || points === null) {
      return { nextLevel: 2, pointsNeeded: 50, currentLevelPoints: 0, isMaxLevel: false };
    }

    const userLevel = user.level; // Extraer para TypeScript
    
    // Encontrar el nivel actual y el siguiente
    const currentLevel = streamerLevels.find(l => l.levelNumber === userLevel);
    const nextLevel = streamerLevels.find(l => l.levelNumber === userLevel + 1);

    if (!nextLevel) {
      // Ya está en el nivel máximo
      return { 
        nextLevel: userLevel, 
        pointsNeeded: currentLevel?.requiredPoints || points, 
        currentLevelPoints: currentLevel?.requiredPoints || 0,
        isMaxLevel: true
      };
    }

    return {
      nextLevel: nextLevel.levelNumber,
      pointsNeeded: nextLevel.requiredPoints,
      currentLevelPoints: currentLevel?.requiredPoints || 0,
      isMaxLevel: false
    };
  }, [user?.level, streamerLevels, points]);

  // Estado para visualización de stream
  const [isWatching, setIsWatching] = useState(false);
  const [watchingChannelName, setWatchingChannelName] = useState<string | null>(null);

  // Hook de Agora para ver streams (isHost: false = audience)
  const {
    join: joinChannel,
    leave: leaveChannel,
    isJoined,
    remoteVideoRef,
    remoteUsers,
    audioBlocked,
    enableAudio,
  } = useAgoraStreaming({ 
    channelName: watchingChannelName, 
    isHost: false 
  });

  // Cargar regalos del streamer seleccionado
  useEffect(() => {
    const fetchGifts = async () => {
      if (!selectedStreamerId) {
        setGifts([]);
        return;
      }
      try {
        const response = await api.get(`/gifts/${selectedStreamerId}`);
        setGifts(response.data);
      } catch (error) {
        console.error('Error al cargar regalos:', error);
        setGifts([]);
      }
    };
    fetchGifts();
  }, [selectedStreamerId]);

  // Cargar niveles del streamer seleccionado
  useEffect(() => {
    const fetchLevels = async () => {
      if (!selectedStreamerId) {
        setStreamerLevels([]);
        return;
      }
      try {
        const response = await api.get(`/streamers/${selectedStreamerId}/levels`);
        setStreamerLevels(response.data);
      } catch (error) {
        console.error('Error al cargar niveles del streamer:', error);
        setStreamerLevels([]);
      }
    };
    fetchLevels();
  }, [selectedStreamerId]);

  // Cargar progreso del espectador con el streamer seleccionado
  useEffect(() => {
    const fetchProgress = async () => {
      if (!selectedStreamerId || !currentUser?.id) {
        console.log('⏭️ Saltando carga de progreso:', { selectedStreamerId, userId: currentUser?.id });
        return;
      }
      try {
        console.log('📊 Cargando progreso para streamer:', selectedStreamerId);
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/spectators/me/progress/${selectedStreamerId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Progreso recibido:', data);
          setPoints(data.points);
          setUser(prev => prev ? { ...prev, points: data.points, level: data.level } : null);
          // Inicializar prevLevelRef para evitar animación falsa en el primer render
          prevLevelRef.current = data.level;
        } else {
          console.error('❌ Error en respuesta:', response.status);
        }
      } catch (error) {
        console.error('❌ Error al cargar progreso:', error);
      }
    };
    fetchProgress();
  }, [selectedStreamerId, currentUser?.id]);

  // Auto-unirse al stream cuando se selecciona un streamer en vivo
  useEffect(() => {
    const autoJoinStream = async () => {
      console.log('=== AUTO JOIN EFFECT ===');
      console.log('Selected streamer:', selectedStreamer?.name, 'isLive:', selectedStreamer?.isLive);
      console.log('Currently watching:', isWatching, 'Channel:', watchingChannelName);
      
      // Si no hay streamer seleccionado, salir si estaba viendo algo
      if (!selectedStreamer) {
        if (isWatching) {
          console.log('❌ No hay streamer seleccionado, desconectando...');
          await handleStopWatching();
        }
        return;
      }

      // Si el streamer NO está en vivo pero estamos viendo algo
      if (!selectedStreamer.isLive && isWatching) {
        console.log('❌ El streamer no está en vivo, desconectando...');
        await handleStopWatching();
        return;
      }

      // Si el streamer está en vivo
      if (selectedStreamer.isLive && selectedStreamer.liveChannelName) {
        console.log('✅ Streamer está en vivo, canal:', selectedStreamer.liveChannelName);
        
        // Si ya estamos viendo el canal correcto, no hacer nada
        if (isWatching && watchingChannelName === selectedStreamer.liveChannelName) {
          console.log('✅ Ya estamos viendo este canal, no hacer nada');
          return;
        }

        // Si estamos viendo otro canal, desconectar primero
        if (isWatching && watchingChannelName !== selectedStreamer.liveChannelName) {
          console.log('🔄 Cambiando de canal, desconectando del anterior:', watchingChannelName);
          await handleStopWatching();
          // Pequeño delay para asegurar desconexión completa
          console.log('⏳ Esperando 500ms antes de reconectar...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Conectar al nuevo canal
        try {
          console.log('🎬 Auto-uniéndose al stream de', selectedStreamer.name, 'canal:', selectedStreamer.liveChannelName);
          setWatchingChannelName(selectedStreamer.liveChannelName);
          await joinChannel(selectedStreamer.liveChannelName);
          setIsWatching(true);
          console.log('✅ Conectado exitosamente');
        } catch (error) {
          console.error('❌ Error al auto-unirse al stream:', error);
          setIsWatching(false);
          setWatchingChannelName(null);
        }
      }
    };

    autoJoinStream();
  }, [selectedStreamer?.id, selectedStreamer?.isLive, selectedStreamer?.liveChannelName]);

  // Cargar streamers desde la API (solo una vez al inicio)
  useEffect(() => {
    const fetchStreamers = async () => {
      try {
        const response = await api.get('/streamers');
        setStreamers(response.data);
      } catch (error) {
        console.error('Error al cargar streamers:', error);
      }
    };
    
    fetchStreamers();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.userType === 'streamer') {
      navigate('/dashboard');
      return;
    }
    
    // Cargar datos del espectador desde la base de datos (solo una vez al montar)
    const fetchSpectatorData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        console.log('📡 Cargando datos del espectador (solo monedas)');
        
        const response = await fetch(`${API_BASE_URL}/api/spectators/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const spectatorData = await response.json();
          console.log('✅ Datos cargados:', spectatorData);
          setUser({
            email: spectatorData.email,
            username: spectatorData.name,
            role: 'espectador',
            coins: spectatorData.coins,
            points: 0,
            level: 1,
          });
          setCoins(spectatorData.coins);
        } else {
          console.error('❌ Error en la respuesta:', response.status);
          // Fallback: crear usuario básico si no existe en DB
          setUser({
            email: currentUser.email,
            username: currentUser.username,
            role: 'espectador',
            coins: 0,
            points: 0,
            level: 1,
          });
        }
      } catch (error) {
        console.error('❌ Error al cargar datos del espectador:', error);
        // Fallback en caso de error
        setUser({
          email: currentUser.email,
          username: currentUser.username,
          role: 'espectador',
          coins: 0,
          points: 0,
          level: 1,
        });
      }
    };
    
    fetchSpectatorData();
  }, [navigate]);

  useEffect(() => {
    const savedSel = localStorage.getItem('selectedStreamerId');
    if (savedSel && streamers.some((s) => s.id === savedSel)) {
      setSelectedStreamerId(savedSel);
    }
  }, [streamers]);

  useEffect(() => {
    if (selectedStreamerId) {
      localStorage.setItem('selectedStreamerId', selectedStreamerId);
    }
  }, [selectedStreamerId]);

  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  useEffect(() => {
    if (user && user.level && user.level > (prevLevelRef.current || 1)) {
      setShowLevelUp(true);
      const t = setTimeout(() => setShowLevelUp(false), 2000);
      prevLevelRef.current = user.level;
      return () => clearTimeout(t);
    }
  }, [user?.level]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (!selectedStreamerId) {
      setGifts([]);
      return;
    }

    const fetchGifts = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/gifts/${selectedStreamerId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setGifts(data);
        }
      } catch (error) {
        console.error('Error al cargar regalos:', error);
      }
    };

    fetchGifts();
  }, [selectedStreamerId]);

  const handleBuyCoins = (amount: number) => setCoins((c) => (c || 0) + amount);

  const handleWatchStream = async () => {
    if (!selectedStreamer?.isLive || !selectedStreamer?.liveChannelName) {
      window.alert('Este streamer no está en vivo actualmente');
      return;
    }

    try {
      console.log('🎬 Uniéndose como espectador al canal:', selectedStreamer.liveChannelName);
      setWatchingChannelName(selectedStreamer.liveChannelName);
      await joinChannel(selectedStreamer.liveChannelName);
      setIsWatching(true);
      console.log('✅ Viendo stream de', selectedStreamer.name);
    } catch (error) {
      console.error('Error al unirse al stream:', error);
      window.alert('Error al conectarse al stream');
    }
  };

  const handleStopWatching = async () => {
    try {
      await leaveChannel();
      setIsWatching(false);
      setWatchingChannelName(null);
      console.log('✅ Dejaste de ver el stream');
    } catch (error) {
      console.error('Error al salir del stream:', error);
    }
  };

  const handleSendGift = async (gift: Gift) => {
    if (!selectedStreamer) {
      window.alert('Selecciona un streamer registrado.');
      return;
    }
    if ((currentUser?.coins || 0) < gift.cost) {
      window.alert('Saldo insuficiente para enviar este regalo');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/gifts/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedStreamer.id,
          giftId: gift.id,
          amount: 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al enviar regalo');
      }

      const data = await response.json();

      setCoins(data.senderCoins);
      setUser(prev => prev ? { ...prev, coins: data.senderCoins } : null);

      // Actualizar puntos del espectador en la base de datos
      try {
        const token = localStorage.getItem('authToken');
        const pointsResponse = await fetch(`${API_BASE_URL}/api/spectators/me/points`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ pointsToAdd: gift.points, streamerId: selectedStreamerId })
        });

        if (pointsResponse.ok) {
          const pointsData = await pointsResponse.json();
          setPoints(pointsData.points);
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              points: pointsData.points,
              level: pointsData.level
            };
          });
        } else {
          const newPoints = (points || 0) + gift.points;
          setPoints(newPoints);
          setUser(prev => prev ? { ...prev, points: newPoints } : null);
        }
      } catch (error) {
        console.error('Error al actualizar puntos:', error);
        setPoints((p) => (p || 0) + gift.points);
      }

      const notificationMsg: ChatMessage = {
        ts: Date.now(),
        userId: 'system',
        userName: '',
        userLevelAtSend: -1,
        text: `${currentUser?.username || currentUser?.email || 'Visitante'} envió ${gift.emoji} ${gift.name}`,
      };
      sendSocketMessage(notificationMsg);

      notifyGift({
        senderName: currentUser?.username || currentUser?.email || 'Visitante',
        giftEmoji: gift.emoji,
        giftName: gift.name,
        giftPoints: gift.points,
      });

      setOverlayMessage(`¡Enviaste ${gift.emoji} ${gift.name} a ${selectedStreamer.name}!`);
      setTimeout(() => setOverlayMessage(null), 3000);

    } catch (error: any) {
      console.error('Error al enviar regalo:', error);
      window.alert(error.message || 'Error al enviar regalo. Intenta de nuevo.');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !selectedStreamerId) return;
    
    const msg: ChatMessage = {
      ts: Date.now(),
      userId: user.email,
      userName: user.username || user.email,
      userLevelAtSend: user.level || 1,
      text: message.trim(),
    };

    sendSocketMessage(msg);
    setMessage('');

    // Actualizar puntos en la base de datos (+1 por mensaje)
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/spectators/me/points`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pointsToAdd: 1, streamerId: selectedStreamerId })
      });

      if (response.ok) {
        const data = await response.json();
        setPoints(data.points);
        setUser(prev => {
          if (!prev) return null;
          return { 
            ...prev, 
            points: data.points, 
            level: data.level
          };
        });
      }
    } catch (error) {
      console.error('Error al actualizar puntos:', error);
      const newPoints = (points || 0) + 1;
      setPoints(newPoints);
      setUser(prev => prev ? { ...prev, points: newPoints } : null);
    }
  };

  const handleLogout = async () => {
    if (isWatching) {
      console.log('🚪 Desconectando del stream antes de cerrar sesión...');
      await handleStopWatching();
    }
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  useEffect(() => {
    return () => {
      if (isWatching) {
        console.log('🧹 Limpieza: desconectando del stream...');
        leaveChannel();
      }
    };
  }, [isWatching]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0a0e27' : '#EEF4FF', p: 3, position: 'relative', transition: 'background-color 0.3s' }}>
      {overlayMessage && (
        <Box
          sx={{
            position: 'fixed',
            top: 80,
            right: 20,
            zIndex: 1200,
            bgcolor: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            px: 3,
            py: 2,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'slideInRight 0.3s ease-out',
            maxWidth: 400,
            '@keyframes slideInRight': {
              from: { transform: 'translateX(100%)', opacity: 0 },
              to: { transform: 'translateX(0)', opacity: 1 }
            }
          }}
        >
          <Typography level="body-md" sx={{ fontWeight: 'lg', color: '#fff' }}>
            {overlayMessage}
          </Typography>
        </Box>
      )}

      {showLevelUp && (
        <Box
          sx={{
            position: 'fixed',
            top: 150,
            right: 20,
            bgcolor: '#10b981',
            color: '#fff',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            zIndex: 1200,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            animation: 'slideInRight 0.3s ease-out',
            '@keyframes slideInRight': {
              from: { transform: 'translateX(100%)', opacity: 0 },
              to: { transform: 'translateX(0)', opacity: 1 }
            }
          }}
        >
          <Typography level="body-md" sx={{ fontWeight: 'bold' }}>🎉 ¡Subiste a nivel {user?.level || 1}!</Typography>
        </Box>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography level="h3" sx={{ fontWeight: 'xl', color: darkMode ? '#fff' : 'inherit' }}>Panel del Espectador</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={toggleDarkMode} variant="soft" color="neutral">
            {darkMode ? '☀️' : '🌙'}
          </IconButton>
          <Button component="a" href="/nosotros" variant="plain" sx={{ color: darkMode ? '#fff' : 'inherit' }}>Nosotros</Button>
          <Button component="a" href="/terminos" variant="plain" sx={{ color: darkMode ? '#fff' : 'inherit' }}>TyC</Button>
          <Button variant="solid" color="danger" onClick={handleLogout}>Cerrar sesión</Button>
        </Stack>
      </Stack>

      {/* Selector de streamer + video mock + tus stats */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        {/* Player + selector */}
        <Card variant="soft" className="floating-card" sx={{ flex: 2, p: 0, overflow: 'hidden', position: 'relative', bgcolor: darkMode ? '#1a1f3a' : undefined, color: darkMode ? '#fff' : undefined }}>
          <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography level="body-md" sx={{ fontWeight: 'lg', color: darkMode ? '#fff' : undefined }}>Streamer:</Typography>
            <Select
              value={selectedStreamerId ?? ''}
              onChange={(_, val) => setSelectedStreamerId(val as string)}
              placeholder="Elige un streamer registrado"
              sx={{ minWidth: 280 }}
            >
              {streamers.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.isLive ? '🔴 ' : '⚫ '}{s.name}
                </Option>
              ))}
            </Select>
          </Box>

          <Box sx={{ aspectRatio: '16 / 9', width: '100%', bgcolor: '#0f172a', display: 'grid', placeItems: 'center', color: '#93c5fd', position: 'relative' }}>
            {isWatching && isJoined && selectedStreamer?.isLive ? (
              <>
                <div
                  ref={remoteVideoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backgroundColor: '#000'
                  }}
                />
                {remoteUsers.length === 0 && (
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.7)' }}>
                    <Typography level="body-md" sx={{ color: '#fff' }}>
                      Conectando con {selectedStreamer.name}...
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    bgcolor: 'red',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
                >
                  🔴 EN VIVO
                </Box>
                {audioBlocked && (
                  <Button
                    color="warning"
                    onClick={enableAudio}
                    sx={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10
                    }}
                  >
                    🔊 Activar Audio
                  </Button>
                )}
              </>
            ) : selectedStreamer ? (
              <Stack spacing={1} alignItems="center">
                <Typography level="h4" sx={{ color: '#93c5fd' }}>Canal de {selectedStreamer.name}</Typography>
                <Typography level="body-md" sx={{ color: '#93c5fd' }}>
                  {selectedStreamer.isLive ? '🔴 Conectando...' : '⚫ Fuera de línea'}
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={1} alignItems="center">
                <Typography level="body-md" sx={{ color: '#93c5fd' }}>Selecciona un streamer registrado.</Typography>
                {streamers.length === 0 && (
                  <Typography level="body-sm" sx={{ color: '#93c5fd', textAlign: 'center', px: 2 }}>
                    No hay streamers en tu base local. Crea uno en <b>Registro</b> eligiendo el rol <b>Streamer</b>.
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
        </Card>

        {/* Progreso / Monedas / Acciones */}
        <Card variant="soft" className="floating-card" sx={{ flex: 1, p: 2, bgcolor: darkMode ? '#1a1f3a' : undefined, color: darkMode ? '#fff' : undefined }}>
          <Typography level="h4" sx={{ mb: 1, fontWeight: 'lg', color: darkMode ? '#fff' : undefined }}>Tu progreso</Typography>
          <Typography level="body-md" sx={{ color: darkMode ? '#fff' : undefined }}>Monedas: <b>{coins ?? '...'}</b></Typography>
          <Typography level="body-md" sx={{ color: darkMode ? '#fff' : undefined }}>Puntos: <b>{points ?? '...'}</b></Typography>
          <Typography level="body-md" sx={{ color: darkMode ? '#fff' : undefined, mb: 1 }}>Nivel: <b>{user?.level || 1}</b></Typography>

          {/* Barra de progreso de nivel */}
          {points !== null && user?.level && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography level="body-sm" sx={{ color: darkMode ? '#aaa' : 'text.secondary' }}>
                  {nextLevelInfo.isMaxLevel ? 'Nivel Máximo Alcanzado' : `Progreso al nivel ${nextLevelInfo.nextLevel}`}
                </Typography>
                <Typography level="body-sm" sx={{ color: darkMode ? '#aaa' : 'text.secondary' }}>
                  {nextLevelInfo.isMaxLevel ? `${points} pts` : `${points} / ${nextLevelInfo.pointsNeeded} pts`}
                </Typography>
              </Stack>
              <Box sx={{ 
                width: '100%', 
                height: 8, 
                bgcolor: darkMode ? '#0f1629' : '#e0e0e0', 
                borderRadius: 10, 
                overflow: 'hidden',
                position: 'relative'
              }}>
                <Box sx={{ 
                  width: nextLevelInfo.isMaxLevel 
                    ? '100%' 
                    : `${Math.min(100, Math.max(0, ((points - nextLevelInfo.currentLevelPoints) / (nextLevelInfo.pointsNeeded - nextLevelInfo.currentLevelPoints)) * 100))}%`, 
                  height: '100%', 
                  bgcolor: user.level >= 10 ? '#f59e0b' : user.level >= 5 ? '#8b5cf6' : '#3b82f6',
                  borderRadius: 10,
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                }} />
              </Box>
            </Box>
          )}

          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
            {/* Botones de testing - comentados para producción */}
            {/* {[100, 500, 1000].map((a) => (
              <Button key={a} variant="soft" onClick={() => handleBuyCoins(a)} className="effect-button">+{a}</Button>
            ))} */}
            <Button variant="solid" color="primary" onClick={() => navigate('/recargar')} fullWidth>Recargar con tarjeta</Button>
          </Stack>
        </Card>
      </Stack>

      {/* Regalos para enviar (al streamer seleccionado) */}
      <Card variant="soft" className="floating-card" sx={{ mb: 3, p: 2, bgcolor: darkMode ? '#1a1f3a' : undefined, color: darkMode ? '#fff' : undefined }}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between">
          <Typography level="h4" sx={{ mb: 1, fontWeight: 'lg', color: darkMode ? '#fff' : undefined }}>Enviar regalo</Typography>
          <Typography level="body-sm" sx={{ color: darkMode ? '#aaa' : 'text.secondary' }}>
            {selectedStreamer ? `Enviando a: ${selectedStreamer.name}` : 'Elige un streamer primero'}
          </Typography>
        </Stack>
        <Table variant="plain" aria-label="regalos" sx={{ 
          '& thead tr': { 
            bgcolor: darkMode ? '#0f1629' : undefined,
          },
          '& thead th': {
            bgcolor: darkMode ? '#0f1629 !important' : undefined,
            borderBottom: darkMode ? '1px solid #2a3350' : undefined,
          },
          '& tbody tr': {
            bgcolor: darkMode ? '#1a1f3a' : undefined,
            '&:hover': {
              bgcolor: darkMode ? '#252d4a' : undefined,
            }
          }
        }}>
          <thead>
            <tr>
              <th><Typography level="body-sm" sx={{ color: darkMode ? '#fff' : undefined, fontWeight: 'bold' }}>Regalo</Typography></th>
              <th><Typography level="body-sm" sx={{ color: darkMode ? '#fff' : undefined, fontWeight: 'bold' }}>Costo</Typography></th>
              <th><Typography level="body-sm" sx={{ color: darkMode ? '#fff' : undefined, fontWeight: 'bold' }}>Puntos</Typography></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {gifts.map((g) => (
              <tr key={g.id}>
                <td><Typography level="body-md" sx={{ color: darkMode ? '#fff' : undefined }}>{g.emoji} {g.name}</Typography></td>
                <td><Typography level="body-md" sx={{ color: darkMode ? '#fff' : undefined }}>{g.cost} monedas</Typography></td>
                <td><Typography level="body-md" sx={{ color: darkMode ? '#fff' : undefined }}>{g.points} pts</Typography></td>
                <td>
                  <Button
                    size="sm"
                    variant="solid"
                    color="success"
                    onClick={() => handleSendGift(g)}
                    className="effect-button"
                    disabled={!selectedStreamer}
                  >
                    Enviar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Chat persistente por streamer */}
      <Card variant="soft" className="floating-card" sx={{ p: 2, bgcolor: darkMode ? '#1a1f3a' : undefined, color: darkMode ? '#fff' : undefined }}>
        <Typography level="h4" sx={{ mb: 1, fontWeight: 'lg', color: darkMode ? '#fff' : undefined }}>Chat</Typography>
        <Box
          ref={scrollRef}
          sx={{ height: 220, overflowY: 'auto', bgcolor: darkMode ? '#0f1629' : '#fff', borderRadius: 12, p: 1, mb: 2, boxShadow: 'inset 0 0 6px rgba(0,0,0,.07)' }}
        >
          {(!selectedStreamerId || messages.length === 0) && (
            <Typography level="body-sm" sx={{ color: darkMode ? '#aaa' : 'text.secondary' }}>
              {selectedStreamerId ? 'No hay mensajes todavía. ¡Envía el primero!' : 'Elige un streamer para ver su chat.'}
            </Typography>
          )}
          {messages.map((m, idx) => (
            <Box key={`${m.ts}-${idx}`} sx={{ bgcolor: darkMode ? (idx % 2 === 0 ? '#1a1f3a' : '#0f1629') : (idx % 2 === 0 ? '#F1F6FF' : '#E8EEFF'), py: 1, px: 2, borderRadius: 10, mb: 1 }}>
              <Typography level="body-sm" sx={{ color: darkMode ? '#fff' : undefined }}>
                {m.userLevelAtSend >= 0 ? (
                  <><b>[Nv {m.userLevelAtSend}] {m.userName}:</b> {m.text}</>
                ) : (
                  <>{m.text}</>
                )}
              </Typography>
            </Box>
          ))}
        </Box>
        <Stack direction="row" spacing={1}>
          <Input
            fullWidth
            placeholder={selectedStreamer ? `Mensaje para ${selectedStreamer.name}…` : 'Elige un streamer para chatear…'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); } }}
            disabled={!selectedStreamerId}
          />
          <Button variant="solid" onClick={handleSendMessage} className="effect-button" disabled={!selectedStreamerId}>
            Enviar
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}

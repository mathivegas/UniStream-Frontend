import React, { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';
import Card from '@mui/joy/Card';
import Table from '@mui/joy/Table';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useAgoraStreaming } from '../hooks/useAgoraStreaming';
import { generateChannelName } from '../services/agoraConfig';
import { useSocket, type ChatMessage } from '../hooks/useChat';
import { User } from '../types';
import LevelConfiguration from '../components/LevelConfiguration/LevelConfiguration';
import { API_BASE_URL } from '../config/environment';

type Gift = { 
  id?: string;
  name: string; 
  emoji: string;
  cost: number; 
  points: number;
  description?: string;
};

export default function StreamerDashboard() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  
  type HistoryEntry = {
    ts: number;
    from: string;
    gift?: string;
    points?: number;
    type?: 'gift' | 'message';
    text?: string;
  };
  const [giftHistory, setGiftHistory] = useState<HistoryEntry[]>([]);
  
  type RealHistoryEntry = {
    id: string;
    createdAt: string;
    senderName: string;
    senderEmail: string;
    giftName: string;
    giftEmoji: string;
    giftPoints: number;
  };
  const [realGiftHistory, setRealGiftHistory] = useState<RealHistoryEntry[]>([]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [hours, setHours] = useState(0);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Estado del chat
  const [message, setMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);
  const [showLevelUpHours, setShowLevelUpHours] = useState(false);
  const prevHourLevelRef = useRef(1);

  const fetchHistory = async () => {
    if (!currentUser?.id) return;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/gifts/history/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRealGiftHistory(data);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const { 
    messages, 
    isConnected, 
    sendMessage: sendSocketMessage,
    notifyNewGift,
    socket
  } = useSocket(currentUser?.id || null, {
    userName: currentUser?.username || currentUser?.email || 'Streamer',
    onGiftReceived: (giftData) => {
      setOverlayMessage(`¡${giftData.senderName} te envió ${giftData.giftEmoji} ${giftData.giftName}! +${giftData.giftPoints} pts`);
      setTimeout(() => setOverlayMessage(null), 3000);
      fetchHistory();
    }
  });

  const {
    join: joinChannel,
    leave: leaveChannel,
    isJoined,
    isPublishing,
    localVideoRef,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
  } = useAgoraStreaming({
    channelName,
    isHost: true,
  });

  // Cargar regalos del streamer desde la API
  useEffect(() => {
    const fetchGifts = async () => {
      if (!currentUser?.id) return;
      setLoadingGifts(true);
      try {
        const response = await api.get(`/gifts/${currentUser.id}`);
        setGifts(response.data);
      } catch (error) {
        console.error('Error al cargar regalos:', error);
      } finally {
        setLoadingGifts(false);
      }
    };
    fetchGifts();
  }, [currentUser]);

  // Cargar historial de regalos recibidos desde la API
  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  // Verificar si estaba en vivo al cargar la página
  useEffect(() => {
    const checkLiveStatus = async () => {
      if (!currentUser?.id) {
        console.log('No hay usuario, saltando verificación de transmisión');
        return;
      }

      if (isStreaming) {
        console.log('Ya está en streaming, saltando verificación');
        return;
      }

      try {
        console.log('Verificando si estaba en vivo...');
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/streamers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const streamers = await response.json();
          const currentStreamer = streamers.find((s: any) => s.id === currentUser.id);

          console.log('Estado del streamer:', currentStreamer);

          if (currentStreamer && currentStreamer.isLive && currentStreamer.liveChannelName) {
            console.log('⚡ Reconectando a transmisión en curso:', currentStreamer.liveChannelName);
            
            setChannelName(currentStreamer.liveChannelName);
            
            try {
              await joinChannel(currentStreamer.liveChannelName);
              setIsStreaming(true);
              setStartTs(new Date(currentStreamer.liveStartedAt).getTime());
              console.log('✅ Reconectado a la transmisión');
            } catch (error) {
              console.error('Error al reconectar:', error);
            }
          } else {
            console.log('No estaba en vivo, no hay nada que reconectar');
          }
        }
      } catch (error) {
        console.error('Error al verificar estado de transmisión:', error);
      }
    };

    const timer = setTimeout(checkLiveStatus, 500);
    return () => clearTimeout(timer);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.userType !== 'streamer') {
      navigate('/espectador');
      return;
    }
    
    // Cargar datos del streamer desde el backend
    const loadStreamerData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/streamers/${currentUser.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            nombre: currentUser.nombre || '',
            username: currentUser.username || '',
            password: '',
            userType: 'streamer',
            avatarUrl: currentUser.avatarUrl || '',
            nivel: data.level || 1,
            puntos: data.points || 0,
            puntosMaximos: 100,
            tiempoVisualizacion: '',
            streamersSeguidos: 0,
            regalosEnviados: 0,
            regalosRecibidos: 0,
            fechaRegistro: new Date().toISOString(),
            hours: data.hoursStreamed || 0,
            level: data.level || 1,
            points: data.points || 0,
            isLive: data.isLive || false,
            liveStartedAt: data.liveStartedAt || undefined,
            coins: data.coins || 0,
          });
          setHours(data.hoursStreamed || 0);
        }
      } catch (error) {
        console.error('Error al cargar datos del streamer:', error);
      }
    };
    
    loadStreamerData();

    try {
      const hist = localStorage.getItem('giftHistory');
      const perKey = `giftHistory_${currentUser.email}`;
      const per = localStorage.getItem(perKey);
      if (per) setGiftHistory(JSON.parse(per));
      else if (hist) setGiftHistory(JSON.parse(hist));
    } catch {}
  }, [navigate, currentUser]);

  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!isStreaming) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [isStreaming]);

  const liveHours = useMemo(() => {
    if (isStreaming && startTs) {
      // ACELERADO PARA DEMO: 10 segundos real = 1 hora mostrada (x360)
      return hours + ((now - startTs) / 36e5) * 360;
    }
    return hours;
  }, [hours, isStreaming, startTs, now]);

  const currentLevel = useMemo(() => {
    if (isStreaming && startTs) {
      const baseLevel = user?.level || 1;
      const sessionHours = ((now - startTs) / 36e5) * 360;
      const totalHours = hours + sessionHours;
      const currentLevelFromHours = Math.floor(totalHours / 5);
      const previousLevelFromHours = Math.floor(hours / 5);
      const levelsGained = currentLevelFromHours - previousLevelFromHours;
      return baseLevel + levelsGained;
    }
    return user?.level || 1;
  }, [isStreaming, startTs, user?.level, now, hours]);

  useEffect(() => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, hours } : null);
  }, [hours]);

  useEffect(() => {
    localStorage.setItem('gifts', JSON.stringify(gifts));
  }, [gifts]);

  useEffect(() => {
    localStorage.setItem('giftHistory', JSON.stringify(giftHistory));
  }, [giftHistory]);

  useEffect(() => {
    // Inicializar prevHourLevelRef con el nivel actual cuando no está transmitiendo
    if (!isStreaming && currentLevel) {
      prevHourLevelRef.current = currentLevel;
    }
  }, [isStreaming, currentLevel]);

  useEffect(() => {
    if (currentLevel && currentLevel > prevHourLevelRef.current) {
      console.log('🎊 ¡SUBISTE DE NIVEL!', prevHourLevelRef.current, '→', currentLevel);
      setShowLevelUpHours(true);
      const t = setTimeout(() => setShowLevelUpHours(false), 2000);
      prevHourLevelRef.current = currentLevel;
      return () => clearTimeout(t);
    }
  }, [currentLevel]);

  useEffect(() => {
    if (!isStreaming || !isPublishing || !currentUser?.id || !socket) {
      return;
    }

    const heartbeatInterval = setInterval(() => {
      socket.emit('stream-heartbeat', {
        streamerId: currentUser.id,
        timestamp: Date.now()
      });
    }, 30000);

    socket.emit('stream-heartbeat', {
      streamerId: currentUser.id,
      timestamp: Date.now()
    });

    return () => clearInterval(heartbeatInterval);
  }, [isStreaming, isPublishing, currentUser?.id, socket]);

  const handleStartStreaming = async () => {
    if (!currentUser?.id) {
      console.error('No hay usuario actual');
      return;
    }

    try {
      console.log('Iniciando transmisión...');
      
      // Generar nombre único de canal
      const channel = generateChannelName(currentUser.id);
      console.log('Canal generado:', channel);
      
      console.log('Uniéndose al canal de Agora...');
      await joinChannel(channel);
      console.log('Conectado a Agora');

      setChannelName(channel);

      // Notificar al backend
      const token = localStorage.getItem('authToken');
      console.log('Notificando al backend...');
      const response = await fetch(`${API_BASE_URL}/api/streaming/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ channelName: channel })
      });

      if (!response.ok) {
        throw new Error('Error al notificar al backend');
      }

      setIsStreaming(true);
      setStartTs(Date.now());
      
      if (socket) {
        socket.emit('streamer-went-live', {
          streamerId: currentUser.id,
          channelName: channel
        });
      }
      
      console.log('✅ Transmisión iniciada en canal:', channel);
    } catch (error: any) {
      console.error('❌ Error al iniciar transmisión:', error);
      alert(`Error al iniciar transmisión: ${error.message}\n\nVerifica:\n- Permisos de cámara/micrófono\n- Backend corriendo\n- AGORA_APP_ID configurado`);
      setChannelName(null);
    }
  };

  const handleStopStreaming = async () => {
    if (!isStreaming || !startTs) return;

    try {
      await leaveChannel();

      // Calcular horas transmitidas (ACELERADO: 10 seg = 1 hora)
      const deltaMs = Date.now() - startTs;
      const deltaHrs = (deltaMs / 36e5) * 360; // x360 para acelerar
      const newTotalHours = hours + deltaHrs;
      setHours(newTotalHours);

      // Notificar al backend sobre el fin del stream
      const token = localStorage.getItem('authToken');
      await fetch(`${API_BASE_URL}/api/streaming/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Actualizar horas en la base de datos
      try {
        const hoursResponse = await fetch(`${API_BASE_URL}/api/streamers/${currentUser?.id}/hours`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ hoursToAdd: deltaHrs })
        });

        if (hoursResponse.ok) {
          const hoursData = await hoursResponse.json();
          setUser(prev => prev ? { 
            ...prev, 
            hours: hoursData.hoursStreamed, 
            level: hoursData.level 
          } : null);
        }
      } catch (error) {
        console.error('Error al actualizar horas en BD:', error);
      }

      setIsStreaming(false);
      setStartTs(null);
      setChannelName(null);

      if (socket && currentUser?.id) {
        socket.emit('streamer-went-offline', {
          streamerId: currentUser.id
        });
      }
      
      console.log('✅ Transmisión detenida');
    } catch (error) {
      console.error('Error al detener transmisión:', error);
    }
  };

  const [newGift, setNewGift] = useState<Gift>({ name: '', emoji: '', cost: 0, points: 0, description: '' });
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  
  const addGift = async () => {
    if (!newGift.name || !newGift.emoji || newGift.cost <= 0 || newGift.points <= 0) {
      alert('Por favor completa todos los campos (nombre, emoji, costo, puntos)');
      return;
    }
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/gifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newGift),
      });
      if (!response.ok) throw new Error('Error al crear regalo');
      const created = await response.json();
      setGifts((arr) => [...arr, created]);
      notifyNewGift(created);
      setNewGift({ name: '', emoji: '', cost: 0, points: 0, description: '' });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear regalo');
    }
  };

  const deleteGift = async (giftId: string) => {
    if (!window.confirm('¿Eliminar este regalo?')) return;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/gifts/${giftId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al eliminar regalo');
      setGifts((arr) => arr.filter(g => g.id !== giftId));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar regalo');
    }
  };

  const startEditGift = (gift: Gift) => {
    setEditingGift({ ...gift });
  };

  const cancelEditGift = () => {
    setEditingGift(null);
  };

  const saveEditGift = async () => {
    if (!editingGift || !editingGift.id) return;
    if (!editingGift.name || !editingGift.emoji || editingGift.cost <= 0 || editingGift.points <= 0) {
      alert('Por favor completa todos los campos (nombre, emoji, costo, puntos)');
      return;
    }
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/gifts/${editingGift.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingGift.name,
          emoji: editingGift.emoji,
          cost: editingGift.cost,
          points: editingGift.points,
          description: editingGift.description
        }),
      });
      if (!response.ok) throw new Error('Error al actualizar regalo');
      const updated = await response.json();
      setGifts((arr) => arr.map(g => g.id === updated.id ? updated : g));
      setEditingGift(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar regalo');
    }
  };

  const simulateIncomingGift = () => {
    const any = gifts[Math.floor(Math.random() * gifts.length)];
    setOverlayMessage(`¡Recibiste ${any.name}! +${any.points} pts`);
    setGiftHistory((h) => [...h, { ts: Date.now(), from: 'UsuarioDemo', gift: any.name, points: any.points }]);
    setTimeout(() => setOverlayMessage(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  const handleSendMessage = () => {
    if (!message.trim() || !currentUser) return;

    const newMsg: ChatMessage = {
      ts: Date.now(),
      userId: currentUser.id,
      userName: currentUser.username || currentUser.email,
      userLevelAtSend: user?.level || 1,
      text: message.trim(),
    };

    sendSocketMessage(newMsg);
    setMessage('');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#EEF4FF', p: 3, position: 'relative' }}>
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
          <Typography level="body-md" sx={{ fontWeight: 'lg', color: '#fff', textAlign: 'left' }}>
            {overlayMessage}
          </Typography>
        </Box>
      )}

      {showLevelUpHours && (
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
          <Typography level="body-md" sx={{ fontWeight: 'bold' }}>🎉 ¡Subiste a nivel de streamer {currentLevel}!</Typography>
        </Box>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography level="h3" sx={{ fontWeight: 'xl', color: darkMode ? '#fff' : 'inherit' }}>Panel del Streamer</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={toggleDarkMode} variant="soft" color="neutral">
            {darkMode ? '☀️' : '🌙'}
          </IconButton>
          <Button component="a" href="/nosotros" variant="plain" sx={{ color: darkMode ? '#fff' : 'inherit' }}>Nosotros</Button>
          <Button component="a" href="/terminos" variant="plain" sx={{ color: darkMode ? '#fff' : 'inherit' }}>TyC</Button>
          <Button variant="solid" color="danger" onClick={handleLogout}>Cerrar sesión</Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        {/* TRANSMISIÓN (IZQUIERDA) */}
        <Card variant="outlined" className="floating-card" sx={{ flex: 1, p: 2, bgcolor: darkMode ? '#1e293b' : 'white', borderColor: darkMode ? '#334155' : '#e0e0e0' }}>
          <Typography level="h4" sx={{ mb: 1, fontWeight: 'lg', color: darkMode ? 'white' : 'inherit' }}>Transmisión</Typography>
          
          {/* Video preview */}
          {isStreaming && isPublishing && (
            <Box
              sx={{
                width: '100%',
                aspectRatio: '16 / 9',
                bgcolor: '#000',
                borderRadius: 2,
                mb: 2,
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                ref={localVideoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
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
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                🔴 EN VIVO
              </Box>
            </Box>
          )}

          {!isStreaming ? (
            <Button variant="solid" color="success" onClick={handleStartStreaming} className="neon-button effect-button">
              Iniciar transmisión
            </Button>
          ) : (
            <>
              <Typography level="body-md" sx={{ mt: 1, color: darkMode ? '#e2e8f0' : 'inherit' }}>
                <b>En vivo</b> — Duración: {startTs ? (liveHours - hours).toFixed(2) : '0.00'} h
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button 
                  variant="solid" 
                  color="danger" 
                  onClick={handleStopStreaming} 
                  className="effect-button"
                  sx={{ flex: 1 }}
                >
                  Detener transmisión
                </Button>
                {!isScreenSharing ? (
                  <Button 
                    variant="solid" 
                    color="primary" 
                    onClick={startScreenShare}
                    className="effect-button"
                    sx={{ flex: 1 }}
                  >
                    🖥️ Compartir pantalla
                  </Button>
                ) : (
                  <Button 
                    variant="solid" 
                    color="warning" 
                    onClick={stopScreenShare}
                    className="effect-button"
                    sx={{ flex: 1 }}
                  >
                    📹 Volver a cámara
                  </Button>
                )}
              </Stack>
            </>
          )}
          <Typography level="body-md" sx={{ mt: 2, color: darkMode ? '#e2e8f0' : 'inherit' }}>Horas transmitidas: <b>{liveHours.toFixed(2)}</b></Typography>
          <Typography level="body-md" sx={{ color: darkMode ? '#e2e8f0' : 'inherit', mb: 1 }}>Nivel: <b>{currentLevel}</b></Typography>

          {/* Barra de progreso de nivel para streamer */}
          {liveHours !== undefined && currentLevel && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography level="body-sm" sx={{ color: darkMode ? '#cbd5e1' : 'text.secondary' }}>
                  Progreso al nivel {currentLevel + 1}
                </Typography>
                <Typography level="body-sm" sx={{ color: darkMode ? '#cbd5e1' : 'text.secondary' }}>
                  {(liveHours % 5).toFixed(2)} / 5.0 hrs
                </Typography>
              </Stack>
              <Box sx={{ 
                width: '100%', 
                height: 8, 
                bgcolor: darkMode ? '#334155' : '#e0e0e0', 
                borderRadius: 10, 
                overflow: 'hidden',
                position: 'relative'
              }}>
                <Box sx={{ 
                  width: `${((liveHours % 5) / 5) * 100}%`, 
                  height: '100%', 
                  bgcolor: currentLevel >= 10 ? '#f59e0b' : currentLevel >= 5 ? '#8b5cf6' : '#10b981',
                  borderRadius: 10,
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                }} />
              </Box>
            </Box>
          )}
        </Card>

        {/* CHAT (MEDIO) */}
        <Card variant="outlined" className="floating-card" sx={{ flex: 1, p: 2, bgcolor: darkMode ? '#1e293b' : 'white', borderColor: darkMode ? '#334155' : '#e0e0e0' }}>
          <Typography level="h4" sx={{ mb: 1, fontWeight: 'lg', color: darkMode ? 'white' : 'inherit' }}>Chat</Typography>
          <Box
            ref={chatScrollRef}
            sx={{ 
              height: 280, 
              overflowY: 'auto', 
              bgcolor: darkMode ? '#0f1629' : '#fff', 
              borderRadius: 2, 
              p: 2, 
              mb: 2,
              boxShadow: 'inset 0 0 6px rgba(0,0,0,.07)' 
            }}
          >
            {messages.length === 0 ? (
              <Typography level="body-sm" sx={{ color: darkMode ? '#aaa' : 'text.secondary' }}>
                No hay mensajes todavía. Escribe algo o espera a que los espectadores chateen.
              </Typography>
            ) : (
              messages.map((m, idx) => (
                <Box 
                  key={`${m.ts}-${idx}`} 
                  sx={{ 
                    bgcolor: darkMode ? (idx % 2 === 0 ? '#1a1f3a' : '#0f1629') : (idx % 2 === 0 ? '#F1F6FF' : '#E8EEFF'), 
                    py: 1, 
                    px: 2, 
                    borderRadius: 2, 
                    mb: 1 
                  }}
                >
                  <Typography level="body-sm" sx={{ color: darkMode ? '#fff' : undefined }}>
                    {m.userLevelAtSend >= 0 ? (
                      <><b>[Nv {m.userLevelAtSend}] {m.userName}:</b> {m.text}</>
                    ) : (
                      <>{m.text}</>
                    )}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Input
              fullWidth
              placeholder="Escribe un mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter') { 
                  e.preventDefault(); 
                  handleSendMessage(); 
                } 
              }}
            />
            <Button variant="solid" onClick={handleSendMessage}>
              Enviar
            </Button>
          </Stack>
        </Card>

        {/* MÉTRICAS (DERECHA) */}
        <Card variant="outlined" className="floating-card" sx={{ 
          flex: 1, 
          p: 2, 
          bgcolor: darkMode ? '#1e293b' : 'white', 
          borderColor: darkMode ? '#334155' : '#e0e0e0'
        }}>
          <Typography level="h4" sx={{ mb: 2, fontWeight: 'lg', color: darkMode ? 'white' : 'inherit' }}>
            📊 Métricas
          </Typography>
          <Stack spacing={1.5}>
            <Box>
              <Typography level="body-sm" sx={{ color: darkMode ? '#cbd5e1' : '#64748b', mb: 0.5 }}>
                Total de horas
              </Typography>
              <Typography level="h3" sx={{ color: darkMode ? 'white' : 'inherit', fontWeight: 'bold' }}>
                {user?.hours?.toFixed(2) || '0.00'} hrs
              </Typography>
            </Box>
            <Box>
              <Typography level="body-sm" sx={{ color: darkMode ? '#cbd5e1' : '#64748b', mb: 0.5 }}>
                Estado
              </Typography>
              <Typography 
                level="title-md" 
                sx={{ 
                  color: isStreaming ? '#10b981' : darkMode ? '#ef4444' : '#dc2626',
                  fontWeight: 'bold'
                }}
              >
                {isStreaming ? '🔴 EN VIVO' : '⚫ Offline'}
              </Typography>
            </Box>
            {user?.isLive && user?.liveStartedAt && (
              <Box>
                <Typography level="body-sm" sx={{ color: darkMode ? '#cbd5e1' : '#64748b', mb: 0.5 }}>
                  Sesión actual
                </Typography>
                <Typography level="title-sm" sx={{ color: darkMode ? 'white' : 'inherit' }}>
                  {(() => {
                    const startTime = new Date(user.liveStartedAt).getTime();
                    const currentTime = Date.now();
                    const diffMs = currentTime - startTime;
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    return `${hours}h ${minutes}m`;
                  })()}
                </Typography>
              </Box>
            )}
            <Box>
              <Typography level="body-sm" sx={{ color: darkMode ? '#cbd5e1' : '#64748b', mb: 0.5 }}>
                Nivel
              </Typography>
              <Typography level="title-md" sx={{ color: darkMode ? 'white' : 'inherit' }}>
                Nv {currentLevel}
                {currentLevel >= 10 && ' 👑'}
                {currentLevel >= 5 && currentLevel < 10 && ' 💜'}
                {currentLevel < 5 && ' 💚'}
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Card variant="outlined" className="floating-card" sx={{ flex: 1, p: 2, bgcolor: darkMode ? '#1e293b' : 'white', borderColor: darkMode ? '#334155' : '#e0e0e0' }}>
          <Typography level="h4" sx={{ mb: 1, fontWeight: 'lg', color: darkMode ? 'white' : 'inherit' }}>Regalos configurados</Typography>
          
          {editingGift && (
            <Box sx={{ mb: 2, p: 2, bgcolor: darkMode ? '#0f1629' : '#f0f4ff', borderRadius: 2, border: '2px solid #3b82f6' }}>
              <Typography level="title-md" sx={{ mb: 1, color: darkMode ? 'white' : 'inherit' }}>✏️ Editando: {editingGift.name}</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Input 
                  size="sm" 
                  placeholder="🎁" 
                  value={editingGift.emoji} 
                  onChange={(e) => setEditingGift({ ...editingGift, emoji: e.target.value })} 
                  sx={{ maxWidth: 80 }}
                />
                <Input 
                  size="sm" 
                  placeholder="Nombre" 
                  value={editingGift.name} 
                  onChange={(e) => setEditingGift({ ...editingGift, name: e.target.value })} 
                  sx={{ flex: 1 }}
                />
                <Input 
                  size="sm" 
                  type="number" 
                  placeholder="Costo" 
                  value={editingGift.cost} 
                  onChange={(e) => setEditingGift({ ...editingGift, cost: Number(e.target.value) })} 
                  sx={{ maxWidth: 100 }}
                />
                <Input 
                  size="sm" 
                  type="number" 
                  placeholder="Puntos" 
                  value={editingGift.points} 
                  onChange={(e) => setEditingGift({ ...editingGift, points: Number(e.target.value) })} 
                  sx={{ maxWidth: 100 }}
                />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button size="sm" variant="solid" color="primary" onClick={saveEditGift}>Guardar</Button>
                <Button size="sm" variant="outlined" color="neutral" onClick={cancelEditGift}>Cancelar</Button>
              </Stack>
            </Box>
          )}

          <Table variant="plain" aria-label="regalos-config">
            <thead>
              <tr>
                <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Emoji</Typography></th>
                <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Nombre</Typography></th>
                <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Costo</Typography></th>
                <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Puntos</Typography></th>
                <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Acciones</Typography></th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((g) => (
                <tr key={g.id}>
                  <td><Typography level="body-md" sx={{ color: darkMode ? 'black' : 'inherit' }}>{g.emoji}</Typography></td>
                  <td><Typography level="body-md" sx={{ color: darkMode ? '#e2e8f0' : 'inherit' }}>{g.name}</Typography></td>
                  <td><Typography level="body-md" sx={{ color: darkMode ? '#e2e8f0' : 'inherit' }}>{g.cost}</Typography></td>
                  <td><Typography level="body-md" sx={{ color: darkMode ? '#e2e8f0' : 'inherit' }}>{g.points}</Typography></td>
                  <td>
                    <Stack direction="row" spacing={1}>
                      <Button size="sm" variant="soft" color="primary" onClick={() => startEditGift(g)}>Editar</Button>
                      <Button size="sm" variant="solid" color="danger" onClick={() => deleteGift(g.id!)}>Eliminar</Button>
                    </Stack>
                  </td>
                </tr>
              ))}
              <tr>
                <td><Input size="sm" placeholder="🎁" value={newGift.emoji} onChange={(e) => setNewGift({ ...newGift, emoji: e.target.value })} /></td>
                <td><Input size="sm" placeholder="Nombre" value={newGift.name} onChange={(e) => setNewGift({ ...newGift, name: e.target.value })} /></td>
                <td><Input size="sm" type="number" placeholder="10" value={newGift.cost} onChange={(e) => setNewGift({ ...newGift, cost: Number(e.target.value) })} /></td>
                <td><Input size="sm" type="number" placeholder="5" value={newGift.points} onChange={(e) => setNewGift({ ...newGift, points: Number(e.target.value) })} /></td>
                <td><Button size="sm" variant="solid" color="success" onClick={addGift}>Agregar</Button></td>
              </tr>
            </tbody>
          </Table>
        </Card>
      </Stack>

      {/* Configuración de Niveles */}
      {user && <LevelConfiguration streamerId={user.id} darkMode={darkMode} />}

      <Card variant="outlined" className="floating-card" sx={{ p: 2, bgcolor: darkMode ? '#1e293b' : 'white', borderColor: darkMode ? '#334155' : '#e0e0e0' }}>
        <Typography level="h4" sx={{ mb: 1, fontWeight: 'lg', color: darkMode ? 'white' : 'inherit' }}>Historial de regalos</Typography>
        <Table variant="plain" aria-label="historial-regalos">
          <thead>
            <tr>
              <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Fecha</Typography></th>
              <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Usuario</Typography></th>
              <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Regalo</Typography></th>
              <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Puntos</Typography></th>
            </tr>
          </thead>
          <tbody>
            {realGiftHistory.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <Typography level="body-sm" sx={{ color: darkMode ? '#cbd5e1' : 'text.secondary' }}>
                    Aún no hay regalos. Los regalos que recibas aparecerán aquí.
                  </Typography>
                </td>
              </tr>
            ) : (
              realGiftHistory.map((h) => (
                <tr key={h.id}>
                  <td><Typography level="body-sm" sx={{ color: darkMode ? '#e2e8f0' : 'inherit' }}>{new Date(h.createdAt).toLocaleString()}</Typography></td>
                  <td><Typography level="body-sm" sx={{ color: darkMode ? '#e2e8f0' : 'inherit' }}>{h.senderName}</Typography></td>
                  <td><Typography level="body-sm" sx={{ color: darkMode ? '#e2e8f0' : 'inherit' }}>{h.giftEmoji} {h.giftName}</Typography></td>
                  <td><Typography level="body-sm" sx={{ color: darkMode ? '#e2e8f0' : 'inherit' }}>+{h.giftPoints}</Typography></td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </Box>
  );
}

import React, { useState, ChangeEvent } from 'react';
import Box from '@mui/joy/Box';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/environment';

const Recarga = (): React.ReactElement | null => {
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();

  // Montos (precio = monedas / 10, ej: 100 monedas = $10)
  const presetOptions = [
    { coins: 100, price: 10 },
    { coins: 500, price: 50 },
    { coins: 1000, price: 100 },
    { coins: 2000, price: 200 },
  ];
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  // Tarjeta
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Estado
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const handleSelect = (coins: number) => {
    setSelectedAmount(coins);
    setCustomAmount('');
  };

  const getAmount = () => {
    if (selectedAmount) return selectedAmount;
    const custom = parseInt(customAmount, 10);
    return Number.isNaN(custom) ? 0 : custom;
  };

  const getPrice = () => {
    const coins = getAmount();
    return coins / 10; // $10 por cada 100 monedas
  };

  const handlePay = async () => {
    const coinAmount = getAmount();
    const price = getPrice();
    
    if (coinAmount <= 0) {
      setError('Selecciona un paquete o ingresa un monto válido.');
      return;
    }
    if (!cardName || !cardNumber || !expiry || !cvv) {
      setError('Por favor completa todos los datos de la tarjeta.');
      return;
    }
    if (cardNumber.replace(/\D/g, '').length < 12 || cvv.replace(/\D/g, '').length < 3) {
      setError('Datos de tarjeta inválidos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/coins/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ coinAmount, price }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar el pago');
      }

      const data = await response.json();
      
      // Guardar el nuevo saldo de monedas
      setNewBalance(data.newBalance);
      
      // Actualizar el usuario en el contexto
      updateUser({ coins: data.newBalance });
      
      // Generar ID de transacción
      const txId = Math.random().toString(36).substring(2, 10).toUpperCase();
      setTransactionId(txId);
      setSuccess(true);
      setError('');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al procesar el pago. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F4F8FF',
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography level="h3" sx={{ fontWeight: 'xl', mb: 3 }}>
        Recargar monedas
      </Typography>

      {!success ? (
        <Box
          sx={{
            width: '100%',
            maxWidth: 500,
            bgcolor: 'white',
            borderRadius: 4,
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            p: 3,
          }}
        >
          <Typography level="h4" sx={{ mb: 2, fontWeight: 'lg' }}>
            Selecciona un paquete
          </Typography>

          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 3 }}>
            {presetOptions.map((opt) => (
              <Button
                key={opt.coins}
                variant={selectedAmount === opt.coins ? 'solid' : 'soft'}
                color="primary"
                onClick={() => handleSelect(opt.coins)}
                className="effect-button"
              >
                {opt.coins} monedas (${opt.price})
              </Button>
            ))}
          </Stack>

          <Typography level="body-sm" sx={{ mb: 1 }}>
            O ingresa un monto personalizado
          </Typography>

          <Input
            type="number"
            placeholder="Monto en monedas"
            value={customAmount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
            }}
            sx={{ mb: 2 }}
          />

          <Typography level="h4" sx={{ mt: 3, mb: 2, fontWeight: 'lg' }}>
            Datos de la tarjeta
          </Typography>

          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Nombre en la tarjeta</FormLabel>
            <Input
              value={cardName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCardName(e.target.value)}
              placeholder="Nombre del titular"
            />
          </FormControl>

          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Número de tarjeta</FormLabel>
            <Input
              value={cardNumber}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setCardNumber(e.target.value.replace(/\D/g, ''))
              }
              placeholder="1234 5678 9012 3456"
            />
          </FormControl>

          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>Expira (MM/AA)</FormLabel>
              <Input
                value={expiry}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setExpiry(e.target.value)}
                placeholder="MM/AA"
              />
            </FormControl>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>CVV</FormLabel>
              <Input
                value={cvv}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCvv(e.target.value.replace(/\D/g, ''))
                }
                placeholder="CVV"
              />
            </FormControl>
          </Stack>

          {error && (
            <Typography level="body-sm" sx={{ color: 'danger.600', mb: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            variant="solid"
            color="success"
            onClick={handlePay}
            disabled={loading}
            className="effect-button neon-button"
            fullWidth
          >
            {loading ? 'Procesando...' : `Pagar $${getPrice()} y recargar`}
          </Button>

          <Button variant="plain" onClick={() => navigate(-1)} sx={{ mt: 2 }}>
            Cancelar
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            width: '100%',
            maxWidth: 500,
            bgcolor: 'white',
            borderRadius: 4,
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Typography level="h4" sx={{ fontWeight: 'lg', mb: 2 }}>
            ¡Recarga exitosa!
          </Typography>
          <Typography level="body-md" sx={{ mb: 1 }}>
            Has agregado {getAmount()} monedas a tu cuenta.
          </Typography>
          {newBalance !== null && (
            <Typography level="body-lg" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.500' }}>
              Nuevo saldo: {newBalance} monedas 💰
            </Typography>
          )}
          <Typography level="body-md" sx={{ mb: 1 }}>
            ID de transacción: {transactionId}
          </Typography>
          <Typography level="body-md" sx={{ mb: 3 }}>
            Fecha: {new Date().toLocaleString()}
          </Typography>
          <Button
            variant="solid"
            color="primary"
            onClick={() => navigate('/dashboard')}
            className="effect-button"
            fullWidth
          >
            Volver al panel
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Recarga;

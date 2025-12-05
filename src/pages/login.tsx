import React, { useState } from 'react';
import Box from '@mui/joy/Box';
import Stack from '@mui/joy/Stack';
import Link from '@mui/joy/Link';
import Typography from '@mui/joy/Typography';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import CustomButton from '../components/button';
import InputField from '../components/input_field';
import RadioGroup from '@mui/joy/RadioGroup';
import Radio from '@mui/joy/Radio';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import { useAuth } from '../context/AuthContext';
import { UserType } from '../types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('espectador');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(email, password, userType);
      
      if (result.success) {
        // Redirigir según el tipo de usuario
        if (userType === 'espectador') {
          navigate('/espectador');
        } else {
          navigate('/admin');
        }
      } else {
        setError(result.message || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#E6F0FF',
        position: 'relative',
        px: 2,
      }}
    >
      {/* Brand */}
      <Typography
        level="h1"
        sx={{
          position: 'absolute',
          top: 20,
          left: 30,
          fontWeight: 'bold',
        }}
      >
        <img
          src="/imagenes/logo.png"
          alt="logo"
          style={{ width: 35, verticalAlign: 'middle', marginRight: 8 }}
        />
        UniStream
      </Typography>

      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          bgcolor: 'white',
          borderRadius: 6,
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          p: 4,
        }}
      >
        <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
          <Typography level="h2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            Bienvenido
          </Typography>

          <InputField
            labelText="Correo electrónico"
            placeholder="Ingresa tu correo"
            name="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />

          <InputField
            labelText="Contraseña"
            placeholder="Ingresa tu contraseña"
            isPassword
            name="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />

          <FormControl>
            <FormLabel>Tipo de usuario</FormLabel>
            <RadioGroup
              orientation="horizontal"
              name="userType"
              value={userType}
              onChange={(e) => setUserType((e.target as HTMLInputElement).value as UserType)}
              sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}
            >
              <Radio value="espectador" label="Espectador" />
              <Radio value="streamer" label="Streamer" />
            </RadioGroup>
          </FormControl>

          {error && (
            <Typography level="body-sm" sx={{ color: 'danger.600', textAlign: 'center' }}>
              {error}
            </Typography>
          )}

          <CustomButton 
            buttonText={loading ? "Iniciando..." : "Iniciar sesión"} 
            onClick={handleLogin} 
            className="neon-button" 
            disabled={loading}
          />

          <Typography sx={{ textAlign: 'center' }}>
            ¿No tienes una cuenta?{' '}
            <Link component={RouterLink} to="/registro">
              Regístrate aquí
            </Link>
          </Typography>

          <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
            <Link component={RouterLink} to="/nosotros" sx={{ color: 'text.primary' }}>
              Nosotros
            </Link>
            <Link component={RouterLink} to="/terminos" sx={{ color: 'text.primary' }}>
              TyC
            </Link>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default Login;

import React, { useState } from 'react';
import Box from '@mui/joy/Box';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Link from '@mui/joy/Link';
import CustomButton from '../components/button';
import InputField from '../components/input_field';
import RadioGroup from '@mui/joy/RadioGroup';
import Radio from '@mui/joy/Radio';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import { useAuth } from '../context/AuthContext';
import { UserType } from '../types';

const Registro: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('espectador');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await register(nombre, email, password, userType);
      
      if (result.success) {
        // Redirigir según el tipo de usuario
        if (userType === 'espectador') {
          navigate('/espectador');
        } else {
          navigate('/admin');
        }
      } else {
        setError(result.message || 'Error al registrarse');
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
        <Stack direction="column" spacing={2} alignItems="stretch" sx={{ width: '100%' }}>
          <Typography level="h2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            Únete hoy mismo
          </Typography>

          <InputField
            labelText="Nombre de usuario"
            placeholder=""
            name="nombre"
            value={nombre}
            onChange={(e: any) => setNombre(e.target.value)}
          />

          <InputField
            labelText="Contraseña"
            placeholder=""
            isPassword
            name="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />

          <InputField
            labelText="Correo electrónico"
            placeholder=""
            name="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />

          <FormControl>
            <FormLabel>Selecciona tu rol</FormLabel>
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
            buttonText={loading ? "Registrando..." : "Registrarse"} 
            onClick={handleRegister} 
            className="neon-button"
            disabled={loading}
          />

          <Typography sx={{ textAlign: 'center' }}>
            ¿Ya tienes una cuenta?{' '}
            <Link component={RouterLink} to="/login">
              <b>Inicia sesión</b>
            </Link>
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default Registro;

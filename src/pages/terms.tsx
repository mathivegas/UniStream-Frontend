import React from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import { useNavigate } from 'react-router-dom';

const Terms: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#FFF9F0',
        py: 6,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography level="h2" sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center' }}>
        Términos y Condiciones
      </Typography>

      <Box sx={{ maxWidth: 800 }}>
        <Typography level="body-md" sx={{ mb: 3, lineHeight: 1.6, fontSize: '1rem' }}>
          Bienvenido a UniStream. Al utilizar nuestra plataforma, aceptas las siguientes
          condiciones. Las cuáles son los derechos de los usuarios y cuáles son las políticas de
          privacidad y conducta. Te recomendamos leer detenidamente cada punto y
          contactarnos si tienes alguna duda.
        </Typography>
      </Box>

      <Box
        component="img"
        src="/imagenes/logo.png"
        alt="Logo"
        className="pulse"
        sx={{
          width: 200,
          height: 'auto',
          my: 4,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
        }}
      />

      <Button
        variant="solid"
        color="primary"
        onClick={() => navigate(-1)}
        className="effect-button"
        sx={{ borderRadius: '30px', px: 3 }}
      >
        Regresar
      </Button>
    </Box>
  );
};

export default Terms;

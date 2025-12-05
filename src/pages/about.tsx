import React from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Avatar from '@mui/joy/Avatar';
import Button from '@mui/joy/Button';
import { useNavigate } from 'react-router-dom';

const publicUrl = (path: string) =>
  `${process.env.PUBLIC_URL}/${path.replace(/^\/+/, '')}`;

const initialsOf = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

const teamMembers = [
  { name: 'Gabriel Macedo', img: publicUrl('imagenes/GabrielMasedo.jpeg') },
  { name: 'Adrian Sevillano', img: publicUrl('imagenes/AdrianSevillano.jpeg') },
  { name: 'Andree Alcarraz', img: publicUrl('imagenes/AndreeAlcarraz.jpeg') },
  { name: 'Raul Sanches', img: publicUrl('imagenes/npc.jpg') },
  { name: 'Mathias Vegas', img: publicUrl('imagenes/mathias.jpeg?v=2') },
];

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F5F7FF',
        py: 6,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography
        level="h2"
        sx={{
          mb: 4,
          fontWeight: 'bold',
          textAlign: 'center',
          fontSize: { xs: '1.5rem', md: '2rem' },
        }}
      >
        Nuestro equipo
      </Typography>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        justifyContent="center"
        alignItems="center"
        sx={{ flexWrap: 'wrap', width: '100%' }}
      >
        {teamMembers.map((member) => (
          <Card
            key={member.name}
            variant="outlined"
            className="floating-card"
            sx={{
              width: 200,
              textAlign: 'center',
              borderRadius: '20px',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 20px rgba(0,0,0,0.15)',
              },
            }}
          >
            <CardContent>
              <Avatar
                src={member.img}
                alt={member.name}
                sx={{
                  width: 80,
                  height: 80,
                  mb: 1.5,
                  mx: 'auto',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = '1';
                    target.src = publicUrl('imagenes/npc.jpg');
                  } else {
                    target.removeAttribute('src');
                  }
                }}
              >
                {initialsOf(member.name)}
              </Avatar>

              <Typography level="h4" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                {member.name}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Box sx={{ mt: 6 }}>
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
    </Box>
  );
};

export default About;



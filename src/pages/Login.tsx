import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/auth";
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Fade,
  Snackbar,
  Alert
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import loginBg from '../assets/login-bg.png';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("Usuário logado:", userCredential.user);

    showSnackbar("Login realizado com sucesso!", "success");
    // Pequeno delay para exibir o card antes de redirecionar
    setTimeout(() => {
      onLogin(); // mantém seu fluxo atual (provavelmente redireciona)
    }, 1000);

  } catch (error) {
    const err = error as Error;
    console.error("Erro no login:", err.message);
    showSnackbar("Email ou senha inválidos", "error");
  }
};

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Left side - Image & Branding */}
      <Box
        sx={{
          flex: { xs: 0, md: 1 },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          bgcolor: 'primary.dark',
          backgroundImage: `url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'primary.contrastText',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 137, 123, 0.4)', // theme primary with opacity
            zIndex: 1,
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center', p: 5, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
           <PetsIcon sx={{ fontSize: 72, mb: 2, color: 'white' }} />
           <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
             Lucky Animal
           </Typography>
           <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9, textShadow: '0 1px 5px rgba(0,0,0,0.3)' }}>
             O amor e cuidado que seu pet merece.
           </Typography>
        </Box>
      </Box>

      {/* Right side - Login Form */}
      <Box
        sx={{
          flex: { xs: 1, md: 0.8, lg: 0.6 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default',
          position: 'relative',
          px: { xs: 4, sm: 8, md: 12 },
        }}
      >
        <Fade in timeout={1000}>
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            {/* Mobile Header (Only visible on small screens) */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'primary.light', color: 'white', mb: 2, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <PetsIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h4" color="primary.main" fontWeight="800">
                Lucky Animal
              </Typography>
            </Box>

            <Box sx={{ mb: 6 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                Bem-vindo de volta! 👋
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Por favor, insira suas credenciais para acessar o sistema.
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="E-mail"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: 'background.paper', transition: 'all 0.2s', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } }
                }}
              />
              
              <TextField
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: 'background.paper', transition: 'all 0.2s', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } }
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                <Typography variant="body2" color="primary.main" sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                  Esqueceu a senha?
                </Typography>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                sx={{
                  mt: 2,
                  py: 1.8,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  boxShadow: '0 8px 16px rgba(0, 137, 123, 0.25)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 20px rgba(0, 137, 123, 0.35)',
                  }
                }}
              >
                Entrar no Sistema
              </Button>
            </Box>
          </Box>
        </Fade>
      </Box>

      {/* ─── Snackbar Notification ──────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// LoginPage.tsx
import { useState } from 'react';
import {
    Box, Grid, Paper, Typography, TextField, Button, Checkbox,
    FormControlLabel, Link, InputAdornment, IconButton, Alert, CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { useAuth } from '../infra/useAuth';
import { useNavigate } from 'react-router-dom';

// Estado inicial (solo UI)
const initialFormState = {
    email: 'root@root.com',
    password: '123456',
    rememberMe: true,
};

export const LoginPage = () => {
    const [formState, setFormState] = useState(initialFormState);
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((s) => !s);
    const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault();

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked, type } = event.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const { login, loading, error } = useAuth();
    const navigate = useNavigate();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(formState.email, formState.password);
            navigate('/');
        } catch {
            // el hook ya expone `error`; aquí no necesitas nada más
        }
    }

    const onCreateNewAccount = () => {
        navigate('/validation')
    }

    return (
        <Grid container component="main" sx={{ height: '100vh' }}>
            {/* Columna Izquierda (branding) */}
            <Grid
                size={{ sm: 4, md: 6 }}
                sx={{
                    display: { xs: 'none', sm: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'center',
                    p: { xs: 4, sm: 5, md: 6 },
                    bgcolor: '#3b82f6',
                    color: 'white',
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 5 }}>
                        <Box component="img" src="/logo.svg" alt="Logo UrbanSentinel" sx={{ height: 48, width: 'auto', mr: 1.5 }} />
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>UrbanSentinel</Typography>
                    </Box>
                    <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>
                        Controla. Detecta. Protege.
                    </Typography>
                    <Box component="img" src="/login-illustration.svg" alt="Ilustración de seguridad"
                        sx={{ width: '80%', maxWidth: 450, mx: 'auto', display: 'block' }} />
                </Box>
            </Grid>

            {/* Columna Derecha (formulario) */}
            <Grid
                size={{ xs: 12, sm: 8, md: 6 }}
                component={Paper}
                elevation={0}
                square
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f1f5f9',
                }}
            >
                <Box
                    sx={{
                        mx: 4,
                        p: { xs: 3, md: 5 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        width: '100%',
                        maxWidth: 450,
                        bgcolor: 'white',
                        borderRadius: 2,
                        boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
                    }}
                >
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 3, color: '#1e2b3b' }}>
                        Inicia Sesión
                    </Typography>

                    {/* FORM: el submit dispara la solicitud */}
                    <Box component="form" onSubmit={onSubmit} sx={{ width: '100%' }}>
                        {/* Error del hook */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {typeof error === 'string' ? error : 'Credenciales inválidas o error de red.'}
                            </Alert>
                        )}

                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', mb: 1 }}>
                            Correo electrónico
                        </Typography>
                        <TextField
                            fullWidth
                            name="email"
                            variant="outlined"
                            value={formState.email}
                            onChange={handleInputChange}
                            sx={{ mb: 2.5 }}
                        />

                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', mb: 1 }}>
                            Contraseña
                        </Typography>
                        <TextField
                            fullWidth
                            name="password"
                            variant="outlined"
                            type={showPassword ? 'text' : 'password'}
                            value={formState.password}
                            onChange={handleInputChange}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2 }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 3 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="rememberMe"
                                        checked={formState.rememberMe}
                                        onChange={handleInputChange}
                                        color="primary"
                                    />
                                }
                                label="Acuérdate de mi"
                                sx={{ color: '#475569' }}
                            />
                            <Link href="#" variant="body2" sx={{ fontWeight: 500, color: '#3b82f6' }}>
                                Me olvidé mi contraseña
                            </Link>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Link href='#' onClick={onCreateNewAccount} variant="body2" sx={{ fontWeight: 500, color: '#3b82f6' }}>
                                Crear nueva cuenta
                            </Link>
                        </Box>

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            endIcon={!loading ? <ArrowForwardIcon /> : undefined}
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                bgcolor: '#3b82f6',
                                '&:hover': { bgcolor: '#2563eb' },
                            }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Iniciar sesión'}
                        </Button>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};

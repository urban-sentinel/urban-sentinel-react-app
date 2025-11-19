// ChangePasswordPage.tsx
import { useState } from 'react';
import {
    Box, Grid, Paper, Typography, TextField, Button, Alert, CircularProgress
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../infra/useAuth';
import { useNavigate } from 'react-router-dom';


const initialFormState = {
    email: 'root@root.com',
    messageSent: false,
};

export const ChangePasswordPage = () => {
    const [formState, setFormState] = useState(initialFormState);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked, type } = event.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const { resetPasswordRequest, loading } = useAuth();

    const navigate = useNavigate();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await resetPasswordRequest(formState.email);
            setFormState(prev => ({ ...prev, messageSent: true }));
        } catch {
            // el hook ya expone `error`; aquí no necesitas nada más
        }
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
                        width: '100%',
                        maxWidth: 450,
                        display: 'flex',
                        justifyContent: 'flex-start',
                        px: { xs: 3, md: 5 },
                        mb: 1,
                    }}
                >
                    <Button
                        onClick={() => navigate('/login')}
                        startIcon={<ArrowBack />}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            color: '#0f172a',
                            px: 0,
                            minWidth: 0,
                            '&:hover': {
                                backgroundColor: 'transparent',
                                color: '#1d4ed8',
                            },
                        }}
                    >
                        Volver
                    </Button>
                </Box>
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
                        Cambiar contraseña
                    </Typography>

                    {/* FORM: el submit dispara la solicitud */}
                    <Box component="form" onSubmit={onSubmit} sx={{ width: '100%' }}>
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
                        {formState.messageSent && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                "Si existe una cuenta asociada a ese correo, se ha enviado un email con las instrucciones para cambiar la contraseña."
                            </Alert>
                        )}
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
                            {loading ? <CircularProgress size={24} /> : 'Enviar correo'}
                        </Button>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};

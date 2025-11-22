import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Select,
    MenuItem,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    ArrowForward as ArrowForwardIcon,
    ArrowDropDown as ArrowDropDownIcon,
    ArrowBack,
    PersonAdd // Icono actualizado para "Crear Cuenta"
} from '@mui/icons-material';
import { useAuth } from '../infra/useAuth';
import type { RegisterUserRequest } from '../types/AuthTypes';

// Estado inicial actualizado
const initialFormState = {
    nombre: '',
    apellido: '',
    phoneCountry: '+51',
    phoneNumber: '',
    email: '',
    password: '',
};

export const ValidationPage = () => {

    const navigate = useNavigate();
    const { register, error } = useAuth();

    // Estado para manejar el formulario
    const [formState, setFormState] = useState(initialFormState);
    
    // Validaciones de contraseña
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [passwordHelper, setPasswordHelper] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    // Handler genérico
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormState(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Validación en tiempo real de contraseña
    const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        handleInputChange(event);
        
        const errors: string[] = [];
        if (value.length < 8) errors.push('Mínimo 8 caracteres');
        if (!/[A-Z]/.test(value)) errors.push('Una mayúscula');
        if (!/[a-z]/.test(value)) errors.push('Una minúscula');
        if (!/[0-9]/.test(value)) errors.push('Un número');
        if (!/[!@#$%^&*().,_\-]/.test(value)) errors.push('Un carácter especial');

        setIsPasswordValid(errors.length === 0);
        setPasswordHelper(errors.length > 0 ? errors.join(' · ') : '');
    };

    const handleCountryChange = (event: SelectChangeEvent) => {
        setFormState(prev => ({ ...prev, phoneCountry: event.target.value as string }));
    };

    const onSuccesfullRegister = () => {
        // Validación básica antes de enviar
        if(!formState.nombre || !formState.apellido || !formState.email || !formState.password) return;

        const payload: RegisterUserRequest = {
            nombre: formState.nombre,
            apellido: formState.apellido,
            email: formState.email,
            password: formState.password,
            rol: "WORKER",
            phone: `${formState.phoneCountry}${formState.phoneNumber}`.trim()
        }

        register(payload);
        if (error == "") {
            navigate('/');
        }
    }

    return (
        <Grid container component="main" sx={{ height: '100vh' }}>

            {/* 1. Columna Izquierda (Barra Lateral Azul) - DISEÑO ORIGINAL RESTAURADO */}
            <Grid
                size={{ sm: 3, md: 2 }}
                sx={{
                    display: { xs: 'none', sm: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    p: { xs: 3, sm: 4, md: 5 },
                    bgcolor: '#3b82f6',
                    color: 'white',
                }}
            >
                <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 5 }}>
                        <Box
                            component="img"
                            src="/logo.svg"
                            alt="Logo"
                            sx={{ height: 48, width: 'auto', mr: 1.5 }}
                        />
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                            UrbanSentinel
                        </Typography>
                    </Box>

                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
                        Empieza
                    </Typography>

                    <List sx={{ p: 0 }}>
                        <ListItem disablePadding>
                            <ListItemButton selected sx={{
                                p: 0,
                                '&.Mui-selected': {
                                    bgcolor: 'transparent',
                                    '&:hover': { bgcolor: 'transparent' }
                                }
                            }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <PersonAdd sx={{ color: 'white', width: 24, height: 24 }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Crear Cuenta"
                                    primaryTypographyProps={{
                                        fontWeight: 500,
                                        fontSize: '1.1rem',
                                        color: 'white'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Grid>

            {/* 2. Columna Derecha (Contenido) - DISEÑO ORIGINAL RESTAURADO */}
            <Grid
                size={{ xs: 12, sm: 9, md: 10 }}
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
                {/* Botón Volver (Alineado como en el original, encima de la tarjeta) */}
                <Box sx={{ width: '100%', maxWidth: 550, mx: 4, mb: 2 }}>
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

                {/* TARJETA BLANCA - Estilos originales preservados */}
                <Box
                    sx={{
                        mx: 4,
                        p: { xs: 3, md: 5 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: 550,
                        bgcolor: 'white',
                        borderRadius: 2,
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 700,
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            mb: 0.5
                        }}
                    >
                        REGISTRO
                    </Typography>

                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            mb: 3,
                            color: '#1e2b3b'
                        }}
                    >
                        Crea tu cuenta
                    </Typography>

                    {/* --- FILA: NOMBRE Y APELLIDO --- */}
                    <Box sx={{ display: 'flex', gap: 2, width: '100%', mb: 2.5 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', mb: 1, textAlign: 'left' }}>
                                Nombre
                            </Typography>
                            <TextField
                                fullWidth
                                name="nombre"
                                placeholder="Tu nombre"
                                variant="outlined"
                                value={formState.nombre}
                                onChange={handleInputChange}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', mb: 1, textAlign: 'left' }}>
                                Apellido
                            </Typography>
                            <TextField
                                fullWidth
                                name="apellido"
                                placeholder="Tu apellido"
                                variant="outlined"
                                value={formState.apellido}
                                onChange={handleInputChange}
                            />
                        </Box>
                    </Box>

                    {/* --- CAMPO: TELÉFONO (Simplificado) --- */}
                    <Box sx={{ width: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', mb: 1, textAlign: 'left' }}>
                            Teléfono
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, width: '100%', mb: 2.5 }}>
                            <Select
                                value={formState.phoneCountry}
                                onChange={handleCountryChange}
                                IconComponent={ArrowDropDownIcon}
                                sx={{
                                    width: 100,
                                    '& .MuiSelect-select': { py: 1.3, pr: 1, pl: 1.5 },
                                    '& fieldset': { borderColor: '#cbd5e1' }
                                }}
                            >
                                <MenuItem value="+51">+51</MenuItem>
                            </Select>
                            <TextField
                                fullWidth
                                name="phoneNumber"
                                placeholder="999 999 999"
                                variant="outlined"
                                value={formState.phoneNumber}
                                onChange={handleInputChange}
                            />
                        </Box>
                    </Box>

                    {/* --- CAMPO: CORREO --- */}
                    <Box sx={{ width: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', mb: 1, textAlign: 'left' }}>
                            Correo
                        </Typography>
                        <TextField
                            fullWidth
                            name="email"
                            type="email"
                            variant="outlined"
                            value={formState.email}
                            onChange={handleInputChange}
                            sx={{ mb: 2.5 }}
                        />
                    </Box>

                    {/* --- CAMPO: CONTRASEÑA --- */}
                    <Box sx={{ width: '100%' }}>
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, color: '#475569', mb: 1, textAlign: 'left' }}
                        >
                            Contraseña
                        </Typography>

                        <TextField
                            fullWidth
                            name="password"
                            variant="outlined"
                            type={showPassword ? 'text' : 'password'}
                            value={formState.password}
                            onChange={handlePasswordChange}
                            error={Boolean(formState.password) && !isPasswordValid}
                            helperText={
                                formState.password && !isPasswordValid 
                                    ? <Typography variant="caption" color="error">{passwordHelper}</Typography> 
                                    : 'Mínimo 8 caracteres, mayúscula, número y símbolo'
                            }
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
                            sx={{ mb: 4 }}
                        />
                    </Box>

                    {!!error && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2.5 }}>
                            {error}
                        </Alert>
                    )}

                    {/* --- BOTÓN REGISTRARSE --- */}
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            onClick={onSuccesfullRegister}
                            disabled={!isPasswordValid || !formState.email || !formState.nombre}
                            sx={{
                                py: 1.5,
                                px: 4,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                bgcolor: '#3b82f6',
                                '&:hover': {
                                    bgcolor: '#2563eb',
                                }
                            }}
                        >
                            Registrarse
                        </Button>
                    </Box>

                </Box>
            </Grid>
        </Grid>
    );
};
import { useEffect, useState } from 'react';
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
    Info as InfoIcon,
    ArrowDropDown as ArrowDropDownIcon
} from '@mui/icons-material';
import { useAuth } from '../infra/useAuth';
import type { RegisterUserRequest } from '../types/AuthTypes';

// Estado inicial para los campos del formulario (solo UI)
const initialFormState = {
    phoneCountry: '+51',
    phoneNumber: '961 565 681',
    smsCode: ['', '', '', ''], // Un array para los 4 campos
    email: '',
    password: '',
};

export const ValidationPage = () => {

    const navigate = useNavigate();
    const { register, error } = useAuth();

    // Estado para manejar el formulario
    const [formState, setFormState] = useState(initialFormState);
    const [generatedCode, setGeneratedCode] = useState<string>(''); // Código aleatorio generado
    const [isPhoneValidated, setIsPhoneValidated] = useState<boolean>(false);
    const [showSmsSent, setShowSmsSent] = useState<boolean>(false);
    const [smsError, setSmsError] = useState<string | null>(null);

    // Estado para el toggle de la contraseña
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    // Handler genérico para inputs
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormState(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handler para el Select de país
    const handleCountryChange = (event: SelectChangeEvent) => {
        setFormState(prev => ({
            ...prev,
            phoneCountry: event.target.value as string,
        }));
    };

    // Handler para los campos de SMS
    const handleSmsChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const { value } = e.target;
        // Solo permite un número
        if (value.length > 1) return;
        if (value && !/^[0-9]$/.test(value)) return;

        const newSmsCode = [...formState.smsCode];
        newSmsCode[index] = value;

        setFormState(prev => ({
            ...prev,
            smsCode: newSmsCode
        }));

        // Auto-focus al siguiente campo
        if (value && index < 3) {
            const nextInput = document.getElementById(`sms-code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const onSuccesfullRegister = () => {
        const payload: RegisterUserRequest = {
            nombre: "PENDING",
            apellido: "PENDING",
            email: formState.email,
            password: formState.password,
            rol: "WORKER",
            phone: formState.phoneNumber
        }

        register(payload);

        if (!error) {
            navigate('/history');
        }
    }

    const onValidatePhone = () => {
        // Generar código aleatorio de 4 dígitos
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedCode(code);
        setShowSmsSent(true);
        setIsPhoneValidated(false);
        setFormState(prev => ({ ...prev, smsCode: ['', '', '', ''] }));
        setSmsError(null);

        console.log("Código SMS generado:", code); // DEBUG: quita esto en producción
    };

    useEffect(() => {
        const fullCode = formState.smsCode.join('');
        if (fullCode.length === 4) {
            if (fullCode === generatedCode) {
                setIsPhoneValidated(true);
                setSmsError(null);
            } else {
                setSmsError('El código ingresado no es correcto.');
                setIsPhoneValidated(false);
            }
        }
    }, [formState.smsCode, generatedCode]);

    return (
        // Contenedor principal que ocupa toda la pantalla (100vh)
        <Grid container component="main" sx={{ height: '100vh' }}>

            {/* 1. Columna Izquierda (Barra Lateral Azul) */}
            <Grid
                // --- CORRECCIÓN AQUÍ ---
                size={{ sm: 3, md: 2 }}
                sx={{
                    display: { xs: 'none', sm: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'flex-start', // Alineado arriba
                    p: { xs: 3, sm: 4, md: 5 }, // Ajuste de padding
                    bgcolor: '#3b82f6',
                    color: 'white',
                }}
            >
                {/* Contenedor interno para el contenido de la barra lateral */}
                <Box sx={{ width: '100%' }}>
                    {/* Logo y Título */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 5 }}>
                        <Box
                            component="img"
                            src="/logo.svg"
                            alt="Logo UrbanSentinel"
                            sx={{ height: 48, width: 'auto', mr: 1.5 }}
                        />
                        <Typography
                            variant="h5"
                            component="h1"
                            sx={{ fontWeight: 700 }}
                        >
                            UrbanSentinel
                        </Typography>
                    </Box>

                    {/* Título del menú */}
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
                        Empieza
                    </Typography>

                    {/* Menú/Stepper */}
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
                                    {/* --- ÍCONO SVG DE LA CÁMARA/RECORD --- */}
                                    <Box
                                        component="img"
                                        src="/record.svg" // <-- Asegúrate que esta ruta sea correcta
                                        alt="Validar Teléfono Icono"
                                        sx={{ width: 24, height: 24 }}
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Valida tu telefono"
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

            {/* 2. Columna Derecha (Contenido Principal del Formulario) */}
            <Grid
                // --- CORRECCIÓN AQUÍ ---
                size={{ xs: 12, sm: 9, md: 10 }}
                component={Paper}
                elevation={0}
                square
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center', // Centra la tarjeta blanca
                    justifyContent: 'center', // Centra la tarjeta blanca
                    bgcolor: '#f1f5f9', // Fondo gris claro para esta mitad
                }}
            >
                {/* Esta es la TARJETA BLANCA que contiene el formulario */}
                <Box
                    sx={{
                        mx: 4, // Margen horizontal
                        p: { xs: 3, md: 5 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center', // Centra los elementos internos del formulario
                        width: '100%',
                        maxWidth: 550, // Ancho del form
                        bgcolor: 'white',
                        borderRadius: 2,
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
                    }}
                >
                    {/* Título STEP */}
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 700,
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            mb: 0.5
                        }}
                    >
                        STEP 1/1
                    </Typography>

                    {/* Título principal */}
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            mb: 3,
                            color: '#1e2b3b'
                        }}
                    >
                        Valida tu telefono
                    </Typography>

                    {/* --- INICIO DEL FORMULARIO --- */}

                    {/* Campo Telefono */}
                    <Box sx={{ width: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', mb: 1, textAlign: 'left' }}>
                            Telefono
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, width: '100%', mb: 2.5 }}>
                            <Select
                                value={formState.phoneCountry}
                                onChange={handleCountryChange}
                                IconComponent={ArrowDropDownIcon}
                                sx={{
                                    '& .MuiSelect-select': { py: 1.3, pr: 1, pl: 1.5 },
                                    '& fieldset': { borderColor: '#cbd5e1' }
                                }}
                            >
                                <MenuItem value="+51">+51</MenuItem>
                            </Select>
                            <TextField
                                fullWidth
                                name="phoneNumber"
                                variant="outlined"
                                value={formState.phoneNumber}
                                onChange={handleInputChange}
                            />
                            <Button
                                variant="contained"
                                size="large"
                                onClick={onValidatePhone}
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
                                Validar
                            </Button>
                        </Box>
                    </Box>

                    {showSmsSent && (
                        <Alert
                            icon={<InfoIcon fontSize="inherit" />}
                            severity="info"
                            sx={{ width: '100%', mb: 2.5, bgcolor: '#eff6ff', color: '#2563eb' }}
                        >
                            SMS ha sido enviado al número {formState.phoneCountry} {formState.phoneNumber}
                        </Alert>
                    )}

                    {/* Campo Codigo SMS */}
                    <Box sx={{ width: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', mb: 1, textAlign: 'left' }}>
                            Codigo SMS
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'space-between', width: '100%', mb: 2.5 }}>
                            {formState.smsCode.map((digit, index) => (
                                <TextField
                                    key={index}
                                    id={`sms-code-${index}`}
                                    variant="outlined"
                                    value={digit}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleSmsChange(e, index)}
                                    inputProps={{
                                        maxLength: 1,
                                        style: { textAlign: 'center', fontSize: '1.2rem' }
                                    }}
                                    sx={{ flexGrow: 1 }}
                                />
                            ))}
                        </Box>
                    </Box>


                    {smsError && (
                        <Alert
                            severity="error"
                            sx={{ width: '100%', mb: 2.5 }}
                        >
                            {smsError}
                        </Alert>
                    )}

                    {isPhoneValidated && (
                        <Alert
                            severity="success"
                            sx={{ width: '100%', mb: 2.5 }}
                        >
                            Teléfono validado correctamente
                        </Alert>
                    )}

                    {/* Campo Correo */}
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
                            disabled={!isPhoneValidated}
                            sx={{ mb: 2.5 }}
                        />
                    </Box>

                    {/* Campo Contraseña */}
                    <Box sx={{ width: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', mb: 1, textAlign: 'left' }}>
                            Crea tu contraseña
                        </Typography>
                        <TextField
                            fullWidth
                            name="password"
                            variant="outlined"
                            type={showPassword ? 'text' : 'password'}
                            value={formState.password}
                            disabled={!isPhoneValidated}
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
                            sx={{ mb: 4 }}
                        />
                    </Box>

                    {!!error && (
                        <Alert
                            severity="error"
                            sx={{ width: '100%', mb: 2.5 }}
                        >
                            {error}
                        </Alert>
                    )}


                    {/* Botón Registrarse */}
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            onClick={onSuccesfullRegister}
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
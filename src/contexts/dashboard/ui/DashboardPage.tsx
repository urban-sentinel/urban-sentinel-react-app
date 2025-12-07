import { useState, useEffect } from 'react';
import {
    Box,
    IconButton,
    Typography,
    Card,
    CardContent,
    Chip,
    Grid,
    Button,
    Divider,
    Paper,
    Skeleton
} from '@mui/material';
import {
    Videocam as VideocamIcon,
    Add as AddIcon,
    Visibility as VisibilityIcon,
    Archive as ArchiveIcon,
    FiberManualRecord as DotIcon,
    CalendarMonth
} from '@mui/icons-material';
import type { ConexionData, CreateCameraPayload, OficinaData } from '../../cameras/types/ConexionTypes';
import { useConexion } from '../../cameras/infra/useConexion';
import { CreateCameraDialog } from '../../cameras/ui/CreateCameraDialog';
import { useOficina } from '../../cameras/infra/useOficina';
import { useEvent } from '../../clips/infra/useEvents';
import type { EventData } from '../../clips/types/EventTypes';
import { useNotification } from '../../clips/infra/useNotification';
import type { NotificacionData } from '../types/Types';

// --- 1. INTERFACES DEL BACKEND ---



const historyMock = [
    { id: '1', title: 'Sujeto destruyó cámara', caseNumber: 'GPO001265', severity: 'high', location: 'Av. Abancay', type: 'Patadas', createdISO: '2020-09-12T00:00:00' },
    { id: '2', title: 'Intento de robo detectado', caseNumber: 'GPO001266', severity: 'low', location: 'Jr. Los Cines', type: 'Golpes', createdISO: '2020-09-13T00:00:00' },
    { id: '3', title: 'Vandalismo en propiedad', caseNumber: 'GPO001267', severity: 'high', location: 'Plaza de Armas', type: 'Patadas', createdISO: '2020-09-14T00:00:00' }
];

export const DashboardPage = () => {
    const { getAllConexions, createConexion } = useConexion();
    const { getAllOffices } = useOficina();
    const { getAllEvents } = useEvent();
    const { getAllNotifications } = useNotification();
    // --- STATES ---
    const [loading, setLoading] = useState(true);
    const [oficinas, setOficinas] = useState<OficinaData[]>([]);
    const [camaras, setCamaras] = useState<ConexionData[]>([]);
    const [eventos, setEventos] = useState<EventData[]>([]);
    const [notificaciones, setNotificaciones] = useState<NotificacionData[]>([]);

    const [showAddCamera, setShowAddCamera] = useState(false);

    const fetchCameras = async () => {
        const dataCamaras = await getAllConexions();
        setCamaras(dataCamaras ?? []);
    };

    const fetchOffices = async () => {
        const dataOffices = await getAllOffices();
        setOficinas(dataOffices ?? []);
    };

    const fetchEvents = async () => {
        const dataEvents = await getAllEvents();
        console.log("Eventos obtenidos:", dataEvents);
        setEventos(dataEvents ?? []);
    };

    const fetchNotifications = async () => {
        const dataNotifcations = await getAllNotifications();
        console.log("Notificaciones obtenidas:", dataNotifcations);
        setNotificaciones(dataNotifcations ?? []);
    };

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                fetchCameras();
                fetchOffices();
                fetchEvents();
                fetchNotifications();
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Función para manejar el submit del hijo
    const handleCreateCamera = async (payload: CreateCameraPayload) => {
        console.log("Enviando al backend:", payload);
        try {
            setLoading(true);
            await createConexion(payload);
            fetchCameras();
            setShowAddCamera(false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- HELPERS ---

    const formatTime = (iso: string) => {
        if (!iso) return '';
        const date = new Date(iso);
        return date.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const getSeverityFromConfidence = (confianza: string) => {
        const val = parseFloat(confianza);
        if (val >= 0.8 || val >= 80) return 'high';
        if (val >= 0.5 || val >= 50) return 'medium';
        return 'low';
    };

    const getSeverityBgColor = (severity: 'high' | 'medium' | 'low') => {
        switch (severity) {
            case 'high': return '#ef4444';
            case 'medium': return '#eab308';
            case 'low': return '#22c55e';
            default: return '#94a3b8';
        }
    };

    const activeCamerasCount = camaras.filter(c => c.habilitada && c.estado !== 'inactiva').length;
    const disabledCamerasCount = camaras.filter(c => !c.habilitada || c.estado === 'inactiva').length;

    return (
        <Box sx={{ mb: 6, margin: 4 }}>
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                mb: 4
            }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    Dashboard
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<CalendarMonth />}
                    size="small"
                    sx={{ textTransform: 'none', color: '#475569', borderColor: '#cbd5e1' }}
                >
                    Vista general
                </Button>
            </Box>

            <Box component="main">
                {/* Container principal */}
                <Grid container spacing={3}>

                    {/* PANEL IZQUIERDO SUPERIOR: CÁMARAS */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DotIcon sx={{ fontSize: 12, color: '#22c55e' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {activeCamerasCount} Activas
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DotIcon sx={{ fontSize: 12, color: '#ef4444' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {disabledCamerasCount} Deshabilitadas/Inactivas
                                        </Typography>
                                    </Box>
                                </Box>

                                <Grid container spacing={2}>
                                    {loading ? (
                                        [1, 2, 3].map(n => (
                                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={n}>
                                                <Skeleton variant="rectangular" height={140} />
                                            </Grid>
                                        ))
                                    ) : (
                                        camaras.map((camera) => (
                                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={camera.id}>
                                                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                            <VideocamIcon sx={{ color: '#64748b' }} />
                                                            <DotIcon
                                                                sx={{
                                                                    fontSize: 12,
                                                                    color: (camera.habilitada && camera.estado !== 'inactiva') ? '#22c55e' : '#ef4444'
                                                                }}
                                                            />
                                                        </Box>
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{ fontWeight: 600, mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                        >
                                                            {camera.nombre_camara}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ display: 'block', mb: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                        >
                                                            {camera.ubicacion || 'Sin ubicación'}
                                                        </Typography>

                                                        <Chip
                                                            label={(camera.habilitada && camera.estado !== 'inactiva') ? 'Activo' : 'Inactivo'}
                                                            color={(camera.habilitada && camera.estado !== 'inactiva') ? 'success' : 'error'}
                                                            size="small"
                                                        />
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))
                                    )}

                                    {/* Botón añadir cámara */}
                                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                border: '2px dashed #cbd5e1',
                                                cursor: 'pointer',
                                                '&:hover': { borderColor: '#3b82f6', bgcolor: '#eff6ff' },
                                                height: '100%',
                                                display: 'flex'
                                            }}
                                            onClick={() => setShowAddCamera(true)}
                                        >
                                            <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                <AddIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#64748b' }}>
                                                    Añadir cámara
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* PANEL DERECHO SUPERIOR: ALERTAS RECIENTES */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                    Eventos Recientes
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {loading ? <Skeleton variant="rectangular" height={200} /> :
                                        eventos.length === 0 ? <Typography variant="body2" color="text.secondary">No hay eventos recientes</Typography> :
                                            eventos.slice(0, 4).map((evento) => {
                                                const severity = getSeverityFromConfidence(evento.confianza);
                                                const cameraName = camaras.find(c => c.id === evento.id_conexion)?.nombre_camara || `Cam ID: ${evento.id_conexion}`;

                                                return (
                                                    <Paper
                                                        key={evento.id_evento}
                                                        sx={{
                                                            p: 2,
                                                            display: 'flex',
                                                            gap: 2,
                                                            borderLeft: `4px solid ${getSeverityBgColor(severity)}`,
                                                            '&:hover': { boxShadow: 2 }
                                                        }}
                                                    >
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                    {cameraName}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                                    {formatTime(evento.timestamp_evento)}
                                                                </Typography>
                                                            </Box>
                                                            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                                                                {evento.tipo_evento} detectado (Conf: {evento.confianza})
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                                <IconButton size="small">
                                                                    <VisibilityIcon fontSize="small" />
                                                                </IconButton>
                                                                <IconButton size="small">
                                                                    <ArchiveIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        </Box>
                                                    </Paper>
                                                );
                                            })}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* PANEL IZQUIERDO INFERIOR: HISTORIAL */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                    Historial de Casos
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {historyMock.map((historyCase) => (
                                        <Card key={historyCase.id} variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
                                                        {historyCase.title}
                                                    </Typography>
                                                    <Chip
                                                        label={historyCase.severity === 'high' ? 'Alto' : 'Bajo'}
                                                        color={historyCase.severity === 'high' ? 'error' : 'success'}
                                                        size="small"
                                                    />
                                                </Box>
                                                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                                                    Caso #{historyCase.caseNumber}
                                                </Typography>
                                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                                    <Grid size={{ xs: 4 }}>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Lugar:</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{historyCase.location}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 4 }}>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Tipo:</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{historyCase.type}</Typography>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* PANEL DERECHO INFERIOR: NOTIFICACIONES */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                    Notificaciones
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {loading ? <Skeleton /> :
                                        notificaciones.length === 0 ? <Typography variant="caption">Sin notificaciones</Typography> :
                                            notificaciones.map((note, index) => (
                                                <Box key={index}>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', mb: 0.5, display: 'block' }}>
                                                        {note.created_at ? formatTime(note.created_at) : 'Hoy'} | {note.canal}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 500,
                                                            color: note.canal === 'ALERTA' ? '#ef4444' : '#22c55e'
                                                        }}
                                                    >
                                                        {note.mensaje}
                                                    </Typography>
                                                    {index < notificaciones.length - 1 && (
                                                        <Divider sx={{ mt: 2 }} />
                                                    )}
                                                </Box>
                                            ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                </Grid>
            </Box>

            <CreateCameraDialog
                open={showAddCamera}
                onClose={() => setShowAddCamera(false)}
                onSubmit={handleCreateCamera}
                oficinas={oficinas}
            />
        </Box>
    );
};
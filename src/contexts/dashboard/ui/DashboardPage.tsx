import { useState, useEffect, useMemo } from 'react';
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
    Skeleton,
    Stack,
    Avatar
} from '@mui/material';
import {
    Videocam as VideocamIcon,
    Add as AddIcon,
    Visibility as VisibilityIcon,
    Archive as ArchiveIcon,
    FiberManualRecord as DotIcon,
    CalendarMonth,
    Assessment,
    NotificationsActive,
    Dns,
    QueryStats
} from '@mui/icons-material';
import type { ConexionData, CreateCameraPayload } from '../../cameras/types/ConexionTypes';
import type { CreateOficinaRequest, OficinaData } from '../../cameras/types/OficinaTypes';
import { useConexion } from '../../cameras/infra/useConexion';
import { CreateCameraDialog } from '../../cameras/ui/CreateCameraDialog';
import { useOficina } from '../../cameras/infra/useOficina';
import { useEvent } from '../../clips/infra/useEvents';
import type { EventData } from '../../clips/types/EventTypes';
import { useNotification } from '../../clips/infra/useNotification';
import type { NotificacionData } from '../types/Types';
import { CreateOficinaDialog } from '../../cameras/ui/CreateOficinaDialog';

export const DashboardPage = () => {
    const { getAllConexions, createConexion } = useConexion();
    const { getAllOffices, createOficina } = useOficina();
    const { getAllEvents } = useEvent();
    const { getAllNotifications } = useNotification();
    
    // --- STATES ---
    const [loading, setLoading] = useState(true);
    const [oficinas, setOficinas] = useState<OficinaData[]>([]);
    const [camaras, setCamaras] = useState<ConexionData[]>([]);
    const [eventos, setEventos] = useState<EventData[]>([]);
    const [notificaciones, setNotificaciones] = useState<NotificacionData[]>([]);
    const [openOficinaDialog, setOpenOficinaDialog] = useState(false);
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
        setEventos(dataEvents ?? []);
    };

    const fetchNotifications = async () => {
        const dataNotifcations = await getAllNotifications();
        setNotificaciones(dataNotifcations ?? []);
    };

    // --- FETCH DATA CONSOLIDADO ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Ejecutamos en paralelo para optimizar la carga inicial
                await Promise.all([
                    fetchCameras(),
                    fetchOffices(),
                    fetchEvents(),
                    fetchNotifications()
                ]);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- HANDLERS ---
    const handleCreateCamera = async (payload: CreateCameraPayload) => {
        try {
            setLoading(true);
            await createConexion(payload);
            await fetchCameras();
            setShowAddCamera(false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOficina = async (payload: CreateOficinaRequest) => {
        try {
            setLoading(true);
            await createOficina(payload);
            await fetchCameras();
            setOpenOficinaDialog(false);
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

    const niceDate = (iso: string) => {
        if (!iso) return '';
        return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getSeverityFromConfidence = (confianza: any) => {
        if (confianza === null || confianza === undefined) return 'low';
        const val = parseFloat(String(confianza));
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

    // --- METRICAS PROCESADAS ---
    const activeCamerasCount = useMemo(() => camaras.filter(c => c.habilitada && c.estado !== 'inactiva').length, [camaras]);
    const disabledCamerasCount = useMemo(() => camaras.filter(c => !c.habilitada || c.estado === 'inactiva').length, [camaras]);
    
    const incidentesPendientes = useMemo(() => eventos.filter(e => !e.procesado), [eventos]);
    
    // FIX 1: Corregido para extraer el primer evento del array correctamente
    const ultimaAlertaTexto = useMemo(() => {
        if (!eventos.length) return "Sin alertas registradas";
        const ultimo = eventos[0];
        const camName = camaras.find(c => c.id === ultimo.id_conexion)?.nombre_camara || `CAM_${ultimo.id_conexion}`;
        return `${ultimo.tipo_evento.toUpperCase()} en ${camName}`;
    }, [eventos, camaras]);

    return (
        <Box sx={{ mb: 6, p: { xs: 1, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            
            {/* Header del Dashboard */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                mb: 4
            }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
                        Centro de Control de Video
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                        Monitoreo urbano automatizado y detección de violencia en tiempo real mediante Inteligencia Artificial.
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<CalendarMonth />}
                    size="small"
                    sx={{ textTransform: 'none', color: '#475569', borderColor: '#cbd5e1', bgcolor: 'white', fontWeight: 600 }}
                >
                    Vista General COE
                </Button>
            </Box>

            {/* FILA DE KPIs EJECUTIVOS SUPERIORES */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '20px !important' }}>
                            <Avatar sx={{ bgcolor: '#eff6ff', color: '#1d4ed8' }}><Dns /></Avatar>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>CÁMARAS ACTIVAS</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{activeCamerasCount} / {camaras.length}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '20px !important' }}>
                            <Avatar sx={{ bgcolor: '#fef2f2', color: '#b91c1c' }}><NotificationsActive /></Avatar>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>INCIDENTES ACTIVOS</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: '#ef4444' }}>{incidentesPendientes.length}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '20px !important' }}>
                            <Avatar sx={{ bgcolor: '#fef3c7', color: '#d97706' }}><QueryStats /></Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ÚLTIMA DETECCIÓN</Typography>
                                {/* FIX 3: noWrap va como prop del componente, no dentro de sx */}
                                <Typography variant="body1" noWrap sx={{ fontWeight: 700 }}>
                                    {ultimaAlertaTexto}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '20px !important' }}>
                            <Avatar sx={{ bgcolor: '#f0fdf4', color: '#16a34a' }}><Assessment /></Avatar>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ESTADO DEL ENTORNO</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: '#22c55e' }}>ONLINE</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box component="main">
                <Grid container spacing={3}>

                    {/* PANEL IZQUIERDO SUPERIOR: LISTA DE CÁMARAS EN VIVO */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
                                    Nodos de Videovigilancia Integrados
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DotIcon sx={{ fontSize: 12, color: '#22c55e' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                                            {activeCamerasCount} Procesando Flujo
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DotIcon sx={{ fontSize: 12, color: '#ef4444' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                                            {disabledCamerasCount} Desconectadas
                                        </Typography>
                                    </Box>
                                </Box>

                                <Grid container spacing={2}>
                                    {loading ? (
                                        // FIX 2: Se agrega el array [1,2,3,4,5,6] del que se mapean los skeletons
                                        [1, 2, 3, 4, 5, 6].map(n => (
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={n}>
                                                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                                            </Grid>
                                        ))
                                    ) : (
                                        camaras.map((camera) => (
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={camera.id}>
                                                <Card variant="outlined" sx={{ borderRadius: 2, '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }, transition: 'all 0.2s' }}>
                                                    <CardContent sx={{ p: 2 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                                            <VideocamIcon sx={{ color: (camera.habilitada && camera.estado !== 'inactiva') ? '#3b82f6' : '#94a3b8' }} />
                                                            <DotIcon
                                                                sx={{
                                                                    fontSize: 12,
                                                                    color: (camera.habilitada && camera.estado !== 'inactiva') ? '#22c55e' : '#ef4444'
                                                                }}
                                                            />
                                                        </Box>
                                                        {/* FIX 3: noWrap como prop del componente */}
                                                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, mb: 0.5, color: '#1e293b' }}>
                                                            {camera.nombre_camara}
                                                        </Typography>
                                                        <Typography variant="caption" noWrap color="text.secondary" sx={{ display: 'block', mb: 1.5, minHeight: 18 }}>
                                                            {camera.ubicacion || 'Sin georreferencia'}
                                                        </Typography>
                                                        <Chip
                                                            label={(camera.habilitada && camera.estado !== 'inactiva') ? 'En servicio' : 'Fuera de servicio'}
                                                            color={(camera.habilitada && camera.estado !== 'inactiva') ? 'success' : 'error'}
                                                            size="small"
                                                            sx={{ fontWeight: 700, borderRadius: 1, fontSize: '0.7rem', height: 20 }}
                                                        />
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))
                                    )}

                                    {/* Botón Añadir Cámara */}
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                border: '2px dashed #cbd5e1',
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                '&:hover': { borderColor: '#3b82f6', bgcolor: '#f0f9ff' },
                                                height: '100%',
                                                display: 'flex',
                                                transition: 'all 0.2s',
                                                minHeight: 118
                                            }}
                                            onClick={() => setShowAddCamera(true)}
                                        >
                                            <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2, gap: 0.5 }}>
                                                <AddIcon sx={{ fontSize: 28, color: '#64748b' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                                                    Vincular Cámara
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* PANEL DERECHO SUPERIOR: LOG DE EVENTOS */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
                                    Alertas de Inferencia Directa
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
                                    {loading ? <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} /> :
                                        eventos.length === 0 ? <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', p: 2 }}>Esperando transmisiones del Transformer Swin3D...</Typography> :
                                            eventos.slice(0, 4).map((evento) => {
                                                const severity = getSeverityFromConfidence(evento.confianza);
                                                const cameraName = camaras.find(c => c.id === evento.id_conexion)?.nombre_camara || `CAM_ID: ${evento.id_conexion}`;

                                                return (
                                                    <Paper
                                                        key={evento.id_evento}
                                                        variant="outlined"
                                                        sx={{
                                                            p: 2,
                                                            display: 'flex',
                                                            gap: 1.5,
                                                            borderLeft: `4px solid ${getSeverityBgColor(severity)}`,
                                                            borderRadius: 2,
                                                            '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }
                                                        }}
                                                    >
                                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                                    {cameraName}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                                                                    {formatTime(evento.timestamp_evento)}
                                                                </Typography>
                                                            </Box>
                                                            <Typography variant="body2" sx={{ color: '#475569', textTransform: 'capitalize', fontWeight: 500, mb: 1 }}>
                                                                ⚠️ {evento.tipo_evento} detectado {evento.confianza ? `(${ (parseFloat(String(evento.confianza))*100).toFixed(0) }%)` : ''}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                                                <IconButton size="small" sx={{ color: '#64748b' }} title="Ver Clip de Evidencia">
                                                                    <VisibilityIcon fontSize="small" />
                                                                </IconButton>
                                                                <IconButton size="small" sx={{ color: '#64748b' }} title="Archivar Alerta">
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

                    {/* PANEL IZQUIERDO INFERIOR: BITÁCORA DE INCIDENTES */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
                                    Incidentes Críticos Recientes
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {loading ? (
                                        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
                                    ) : eventos.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" sx={{ p: 2, fontStyle: 'italic' }}>
                                            No se registran vectores de violencia huérfanos. Todo limpio.
                                        </Typography>
                                    ) : (
                                        eventos.slice(0, 3).map((evento) => {
                                            const severity = getSeverityFromConfidence(evento.confianza);
                                            const cameraObj = camaras.find(c => c.id === evento.id_conexion);
                                            const cameraName = cameraObj?.nombre_camara || `NODO_ID_${evento.id_conexion}`;
                                            const locationText = cameraObj?.ubicacion || "Ubicación de red no especificada";
                                            const codeString = `EVT-${evento.id_evento.toString().padStart(6, '0')}`;

                                            return (
                                                <Card key={evento.id_evento} variant="outlined" sx={{ borderRadius: 2.5, '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }, transition: 'all 0.2s' }}>
                                                    <CardContent sx={{ p: 2.5 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                                Alerta de {evento.tipo_evento.toUpperCase()} en {cameraName}
                                                            </Typography>
                                                            <Chip
                                                                label={severity === 'high' ? 'Crítico' : severity === 'medium' ? 'Moderado' : 'Bajo'}
                                                                color={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'success'}
                                                                size="small"
                                                                sx={{ fontWeight: 700, borderRadius: 1 }}
                                                            />
                                                        </Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace', display: 'block', mb: 2, fontSize: '0.75rem' }}>
                                                            Identificador de Auditoría: {codeString}
                                                        </Typography>
                                                        <Grid container spacing={2} sx={{ mb: 1 }}>
                                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>DIRECCIÓN EN BASE DE DATOS:</Typography>
                                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{locationText}</Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 6, sm: 4 }}>
                                                                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>VECTOR IA:</Typography>
                                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{evento.tipo_evento}</Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 6, sm: 4 }}>
                                                                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>FECHA REGISTRO UTC:</Typography>
                                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{niceDate(evento.timestamp_evento)} - {formatTime(evento.timestamp_evento)}</Typography>
                                                            </Grid>
                                                        </Grid>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* PANEL DERECHO INFERIOR: HISTORIAL DE NOTIFICACIONES */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
                                    Notificaciones de Canal SMS / Push
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 380, overflowY: 'auto' }}>
                                    {loading ? <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} /> :
                                        notificaciones.length === 0 ? <Typography variant="caption" sx={{ fontStyle: 'italic', p: 2 }}>No se registran envíos salientes de alertas.</Typography> :
                                            notificaciones.slice(0, 5).map((note, index) => (
                                                <Box key={index} sx={{ px: 0.5 }}>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', mb: 0.5, display: 'block', fontWeight: 600, fontFamily: 'monospace' }}>
                                                        {note.created_at ? `${niceDate(note.created_at)} - ${formatTime(note.created_at)}` : 'Sincronizado'} | VÍA {note.canal.toUpperCase()}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 500,
                                                            color: '#334155',
                                                            bgcolor: '#f8fafc',
                                                            p: 1.5,
                                                            borderRadius: 2,
                                                            borderLeft: `3px solid ${note.canal.toLowerCase().includes('app') ? '#3b82f6' : '#ef4444'}`
                                                        }}
                                                    >
                                                        {note.mensaje}
                                                    </Typography>
                                                    {index < notificaciones.length - 1 && (
                                                        <Divider sx={{ mt: 1.5, opacity: 0.4 }} />
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
                onOpenCreateOficina={() => setOpenOficinaDialog(true)}
            />

            <CreateOficinaDialog
                open={openOficinaDialog}
                onClose={() => setOpenOficinaDialog(false)}
                onSubmit={handleCreateOficina}
            />
        </Box>
    );
};
import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Chip,
    Stack,
    Paper,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Gavel,
    LocalPolice,
    NotificationsActive,
    CheckCircleOutline,
    ReportProblem,
    FlashOn,
    VolumeUp
} from '@mui/icons-material';

// 🔑 REUTILIZAMOS TUS HOOKS CORE EXISTENTES
import { useConexion } from '../../cameras/infra/useConexion';
import { useEvent } from '../../clips/infra/useEvents';
import { useNotification } from '../../clips/infra/useNotification';

export const AlertasPage = () => {
    const { getAllConexions } = useConexion();
    const { getAllEvents } = useEvent();
    const { getAllNotifications } = useNotification();

    // --- STATES ---
    const [loading, setLoading] = useState(true);
    const [camaras, setCamaras] = useState<any[]>([]);
    const [eventos, setEventos] = useState<any[]>([]);
    const [notificaciones, setNotificaciones] = useState<any[]>([]);
    const [alertasSilenciadas, setAlertasSilenciadas] = useState<Record<number, boolean>>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resCams, resEvts, resNotes] = await Promise.all([
                getAllConexions(),
                getAllEvents(),
                getAllNotifications()
            ]);
            setCamaras(resCams ?? []);
            setEventos(resEvts ?? []);
            setNotificaciones(resNotes ?? []);
        } catch (error) {
            console.error("Error cargando panel de control de alertas", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // 🔄 Simulamos un sondeo/polling en vivo cada 10 segundos para emular los WebSockets en la UI
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    // --- 🚀 FILTRADO CRÍTICO: Filtramos eventos no procesados (Las emergencias vivas) ---
    const alertasVivas = useMemo(() => {
        return (eventos || [])
            .filter(e => !e.procesado) // Solo las no atendidas
            .map(e => {
                const camara = camaras.find(c => c.id === e.id_conexion);
                const valConf = parseFloat(String(e.confianza ?? "0"));
                
                // Clasificación dinámica de prioridad operativa por confianza/tipo
                let prioridad: 'ALTA' | 'MEDIA' | 'BAJA' = 'BAJA';
                if (valConf >= 0.8 || e.tipo_evento === 'forcejeo') prioridad = 'ALTA';
                else if (valConf >= 0.5) prioridad = 'MEDIA';

                return {
                    ...e,
                    _cameraName: camara?.nombre_camara || `NODO_${e.id_conexion}`,
                    _location: camara?.ubicacion || "Coordenadas no disponibles",
                    _prioridad: prioridad
                };
            })
            .sort((a, b) => {
                // Las de prioridad ALTA van primero en la cola del despachador
                if (a._prioridad === 'ALTA' && b._prioridad !== 'ALTA') return -1;
                if (a._prioridad !== 'ALTA' && b._prioridad === 'ALTA') return 1;
                return new Date(b.timestamp_evento).getTime() - new Date(a.timestamp_evento).getTime();
            });
    }, [eventos, camaras]);

    // --- ACCIONES DE OPERACIÓN EN VIVO (Simuladas en UI para la Tesis) ---
    const handleDespacharSerenazgo = (evtId: number, camName: string) => {
        alert(`🚨 ORDEN DE DESPACHO ENVIADA: Patrulla asignada al nodo ${camName} (Incidente EVT-${evtId})`);
        // Aquí conectarías con un endpoint de despacho o alertas si lo requieres
    };

    const handleDescartarAlerta = (evtId: number) => {
        setAlertasSilenciadas(prev => ({ ...prev, [evtId]: true }));
        // Aquí harías el PUT /api/eventos/{id} con procesado = true para matarla de la DB
    };

    const formatTime = (iso?: string) => {
        if (!iso) return '';
        return new Date(iso).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
            
            {/* Header del Centro de Monitoreo */}
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <NotificationsActive sx={{ color: '#ef4444', fontSize: 32 }} />
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
                            Despacho de Emergencias en Vivo
                        </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, pl: 5 }}>
                        Cola operativa de incidentes violentos detectados por el Transformer Swin3D pendientes de atención.
                    </Typography>
                </Box>
                <Chip 
                    label="CONEXIÓN TRANSMITIENDO" 
                    icon={<FlashOn style={{ color: '#22c55e' }} />}
                    sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 700, borderRadius: 2, border: '1px solid #bbf7d0' }} 
                />
            </Box>

            {loading && !eventos.length ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            ) : (
                <Grid container spacing={3}>
                    
                    {/* 🚨 COLUMNA IZQUIERDA: COLA PRINCIPAL DE ALARMAS DE VIOLENCIA (VIVAS) */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReportProblem sx={{ color: '#ef4444' }} /> Alertas Pendientes de Validación ({alertasVivas.filter(a => !alertasSilenciadas[a.id_evento]).length})
                        </Typography>

                        <Stack spacing={2}>
                            {alertasVivas.filter(a => !alertasSilenciadas[a.id_evento]).length === 0 ? (
                                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px dashed #cbd5e1' }}>
                                    <CheckCircleOutline sx={{ color: '#22c55e', fontSize: 48, mb: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>Entorno Seguro</Typography>
                                    <Typography variant="body2" sx={{ color: '#64748b' }}>No existen alertas críticas activas en este momento.</Typography>
                                </Paper>
                            ) : (
                                alertasVivas
                                    .filter(a => !alertasSilenciadas[a.id_evento])
                                    .map((alerta) => (
                                        <Card 
                                            key={alerta.id_evento} 
                                            sx={{ 
                                                borderRadius: 4, 
                                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
                                                borderLeft: `6px solid ${alerta._prioridad === 'ALTA' ? '#ef4444' : '#f59e0b'}`,
                                                animation: alerta._prioridad === 'ALTA' ? 'pulse 2s infinite' : 'none',
                                                bgcolor: alerta._prioridad === 'ALTA' ? '#fffdfd' : 'white'
                                            }}
                                        >
                                            <CardContent sx={{ p: 3 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                                    <Box>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Chip 
                                                                label={alerta._prioridad} 
                                                                size="small" 
                                                                sx={{ bgcolor: alerta._prioridad === 'ALTA' ? '#ef4444' : '#fffbeb', color: alerta._prioridad === 'ALTA' ? 'white' : '#b45309', fontWeight: 800, borderRadius: 1 }} 
                                                            />
                                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>
                                                                INC_ID: EVT-{alerta.id_evento.toString().padStart(6, '0')}
                                                            </Typography>
                                                        </Stack>
                                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                                                            {alerta.tipo_evento.toUpperCase()} DETECTADO AUTOMÁTICAMENTE
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>
                                                            ⏱️ {formatTime(alerta.timestamp_evento)}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Grid de Metadatos Rápidos */}
                                                <Grid container spacing={2} sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 3, mb: 3, border: '1px solid #e2e8f0' }}>
                                                    <Grid size={{ xs: 12, sm: 4 }}>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>CÁMARA / VECTOR:</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>{alerta._cameraName}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 8 }}>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>UBICACIÓN GEOGRÁFICA REGISTRADA:</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{alerta._location}</Typography>
                                                    </Grid>
                                                </Grid>

                                                {/* Botones de Control de Despacho Operativo */}
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexWrap: 'wrap' }}>
                                                    <Button 
                                                        variant="outlined" 
                                                        color="inherit" 
                                                        onClick={() => handleDescartarAlerta(alerta.id_evento)}
                                                        sx={{ textTransform: 'none', borderRadius: 2, color: '#64748b', borderColor: '#cbd5e1', fontWeight: 600 }}
                                                    >
                                                        Falsa Alarma / Descartar
                                                    </Button>
                                                    <Button 
                                                        variant="contained" 
                                                        color="error"
                                                        startIcon={<LocalPolice />}
                                                        onClick={() => handleDespacharSerenazgo(alerta.id_evento, alerta._cameraName)}
                                                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, boxShadow: 'none' }}
                                                    >
                                                        Despachar Serenazgo / PNP
                                                    </Button>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))
                            )}
                        </Stack>
                    </Grid>

                    {/* 📳 COLUMNA DERECHA: ESTADO INTEGRAL DE AUDIOS Y LOG DE CANALES DE MENSAJERÍA */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        {/* Módulo de Configuración de Sirena */}
                        <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', mb: 3 }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <VolumeUp sx={{ color: 'primary.main' }} /> Consola de Audio Central
                                </Typography>
                                <Alert severity="info" icon={<VolumeUp />} sx={{ borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Alarma de audio activada</Typography>
                                    <Typography variant="caption" sx={{ display: 'block', color: '#475569', mt: 0.5 }}>El navegador reproducirá un tono de sirena automático al ingresar un evento Crítico.</Typography>
                                </Alert>
                            </CardContent>
                        </Card>

                        {/* Canales de Comunicación Despachados */}
                        <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Gavel sx={{ color: '#475569' }} /> Historial de Alertas Emitidas Hoy
                                </Typography>

                                <Stack spacing={2} sx={{ maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
                                    {notificaciones.slice(0, 6).map((note, index) => (
                                        <Box key={index} sx={{ p: 2, bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'between', mb: 0.5 }}>
                                                <Chip 
                                                    label={note.canal.toUpperCase()} 
                                                    size="small" 
                                                    sx={{ height: 16, fontSize: '0.65rem', fontWeight: 800, bgcolor: note.canal.toLowerCase().includes('app') ? '#eff6ff' : '#fff1f2', color: note.canal.toLowerCase().includes('app') ? '#1d4ed8' : '#e11d48' }} 
                                                />
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#94a3b8', fontWeight: 600 }}>
                                                    {formatTime(note.created_at) || 'Sincrónico'}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.4, fontWeight: 500 }}>
                                                {note.mensaje}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                </Grid>
            )}

            {/* Estilo CSS inyectado para el efecto de parpadeo de emergencia */}
            <style>{`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </Box>
    );
};
import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    IconButton,
    Card,
    CardContent,
    CardMedia,
    Stack,
    Divider,
    CircularProgress,
    Alert,
    Grid,
    Paper
} from '@mui/material';
import {
    ArrowBack,
    CalendarMonth,
    MoreVert,
    Analytics,
    VideoFile,
    NotificationsActive,
    Place,
    CorporateFare,
    Timer
} from '@mui/icons-material';
import { useNotification } from '../../clips/infra/useNotification';
import type { NotificacionData } from '../../dashboard/types/Types';

// Reutilizamos tus funciones helpers existentes
const API_BASE = (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, '') || 'http://127.0.0.1:8000';

function getVideoStreamUrl(clip: any): string | undefined {
    if (!clip) return undefined;
    if (clip.id_clip) return `${API_BASE}/api/clips/${clip.id_clip}/stream`;
    if (clip.storage_path && /^https?:\/\//i.test(clip.storage_path)) return clip.storage_path;
    return undefined;
}

function niceDate(dIso: string) {
    try {
        return new Date(dIso).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    } catch { return dIso; }
}

interface EventDetailProps {
    evento: any;
    cameraName: string;
    officeName: string;
    locationText: string;
    severityStyles: any;
    category: string;
    onBack: () => void;
    useClipHook: (id: number | null) => any;
    useEventoLogHook: (path: string | null, id: number | null) => any;
}

export const EventDetail: React.FC<EventDetailProps> = ({
    evento,
    cameraName,
    officeName,
    locationText,
    severityStyles,
    category,
    onBack,
    useClipHook,
    useEventoLogHook
}) => {
    const { getAllNotifications } = useNotification();
    const [notificaciones, setNotificaciones] = useState<NotificacionData[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);

    // Consumo de tus hooks de logs de la IA y clips de video
    const { log, loading: loadingLog, err: errLog } = useEventoLogHook(evento.subclip_path, evento.id_evento);
    const { clip } = useClipHook(evento.id_clip);
    
    const videoUrl = useMemo(() => getVideoStreamUrl(clip), [clip]);

    // 🔥 Carga de notificaciones salientes de la base de datos
    useEffect(() => {
        const fetchNotes = async () => {
            setLoadingNotes(true);
            try {
                const data = await getAllNotifications();
                setNotificaciones(data ?? []);
            } catch (e) {
                console.error("Error cargando notificaciones en detalle forense", e);
            } finally {
                setLoadingNotes(false);
            }
        };
        fetchNotes();
    }, []);

    // 🔗 CRUCE EN CALIENTE: Filtramos los SMS/Push enviados exclusivamente por este Nodo/Cámara
    const notificacionesDeCamara = useMemo(() => {
        return notificaciones.filter(n => 
            n.mensaje.toLowerCase().includes(cameraName.toLowerCase())
        );
    }, [notificaciones, cameraName]);

    const resumenMetricas = useMemo(() => {
        const metrics = log?.analisis_ia?.metricas_promedio;
        if (!metrics) return null;
        return Object.entries(metrics)
            .map(([clase, valor]) => `${clase}: ${(Number(valor) * 100).toFixed(1)}%`)
            .join('  ·  ');
    }, [log]);

    const timelineFrames = useMemo(() => {
        const logsArray = (log as any)?.logs || [];
        if (!logsArray.length) return [];
        return logsArray.map((frame: any, index: number) => {
            const probabilities = frame.probabilities || {};
            const top3Str = Object.entries(probabilities)
                .sort((a: any, b: any) => b - a)
                .slice(0, 3)
                .map(([clase, valor]: any) => `${clase}: ${(valor * 100).toFixed(0)}%`)
                .join(', ');
            return { t: frame.t ?? frame.timestamp_ms ?? (index * 500), top3: top3Str };
        });
    }, [log]);

    return (
        <Box sx={{ p: { xs: 1, md: 2 } }}>
            {/* Barra de Navegación de Retorno */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={onBack} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', '&:hover': { bgcolor: '#f1f5f9' } }}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b' }}>Volver al repositorio de clips</Typography>
            </Box>

            {/* Ficha Maestra del Incidente */}
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', border: '1px solid #e2e8f0', mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', p: 1, borderRadius: 2, fontFamily: 'monospace', fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                                EVT-{evento.id_evento.toString().padStart(6, '0')}
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                Análisis Criminalístico de {category}
                            </Typography>
                            <Chip label={category.toUpperCase()} size="small" sx={{ ...severityStyles, fontWeight: 700, borderRadius: 1.5 }} />
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#64748b' }}>
                            <CalendarMonth fontSize="small" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{niceDate(evento.timestamp_evento)}</Typography>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>

            {/* 📊 GRID MAESTRO DE 3 COLUMNAS (Sintaxis Grid v2) */}
            <Grid container spacing={3}>
                
                {/* COLUMNA 1: INFERENCIA Y TIMELINE DE LA IA */}
                <Grid size={{ xs: 12, md: 4, lg: 3.5 }}>
                    <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <Analytics sx={{ color: 'primary.main' }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Métricas del Transformer</Typography>
                            </Stack>
                            
                            {resumenMetricas && (
                                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 0.5 }}>PROMEDIOS DE RED NEURONAL:</Typography>
                                    <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic', fontSize: '0.8rem', lineHeight: 1.5 }}>{resumenMetricas}</Typography>
                                </Box>
                            )}

                            {loadingLog && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>}
                            {errLog && <Alert severity="warning" sx={{ borderRadius: 2 }}>{errLog}</Alert>}
                            
                            {timelineFrames.length > 0 && (
                                <Box sx={{ maxHeight: 380, overflowY: 'auto', display: 'grid', gap: 1, border: '1px solid #e2e8f0', borderRadius: 2, p: 1, bgcolor: '#f8fafc' }}>
                                    {timelineFrames.map((row, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white', border: '1px solid #f1f5f9', borderRadius: 1.5, p: 1, '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>t={row.t} ms</Typography>
                                            <Typography variant="caption" sx={{ textAlign: 'right', color: '#475569', fontWeight: 500, maxWidth: '70%' }}>{row.top3}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* COLUMNA 2: REPRODUCTOR DE VIDEO DE EVIDENCIA Y REGISTRO GEOGRÁFICO */}
                <Grid size={{ xs: 12, md: 8, lg: 5.5 }}>
                    <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <VideoFile sx={{ color: '#3b82f6' }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Evidencia Multimedia Servida</Typography>
                            </Stack>

                            {/* Fila de metadatos georreferenciados rápidos */}
                            <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 3, p: 2, mb: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>SEDE OPERATIVA</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>{officeName}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>CÁM ORIGEN</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{cameraName}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>DIRECCIÓN FÍSICA</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{locationText}</Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            {videoUrl ? (
                                <CardMedia component="video" controls src={videoUrl} sx={{ width: '100%', height: 320, objectFit: 'contain', bgcolor: 'black', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            ) : (
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>El buffer de MediaMTX no posee clips guardados para el ID {evento.id_clip}.</Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* 🔒 COLUMNA 3 (NUEVA): HISTORIAL DE NOTIFICACIONES LIGADAS A ESTA CÁMARA */}
                <Grid size={{ xs: 12, lg: 3 }}>
                    <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <NotificationsActive sx={{ color: '#ef4444' }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Despachos del Nodo</Typography>
                            </Stack>

                            {loadingNotes && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={20} /></Box>}

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
                                {!loadingNotes && notificacionesDeCamara.length === 0 ? (
                                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#94a3b8', p: 1, textAlign: 'center', display: 'block' }}>
                                        No se registran envíos SMS salientes para este nodo.
                                    </Typography>
                                ) : (
                                    notificacionesDeCamara.map((note, index) => (
                                        <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', borderLeft: `3px solid ${note.canal.toLowerCase().includes('app') ? '#3b82f6' : '#ef4444'}` }}>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', mb: 0.5, display: 'block', fontWeight: 700, fontFamily: 'monospace' }}>
                                                VÍA {note.canal.toUpperCase()}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569', fontSize: '0.78rem', lineHeight: 1.4 }}>
                                                {note.mensaje}
                                            </Typography>
                                        </Paper>
                                    ))
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>
        </Box>
    );
};
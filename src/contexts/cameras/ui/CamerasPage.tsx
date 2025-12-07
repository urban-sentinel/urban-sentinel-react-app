import { useEffect, useMemo, useState } from 'react';
import {
    Box, Card, CardHeader, CardContent, CardActions, Chip, Button,
    IconButton, Grid, Stack, Typography, CircularProgress
} from '@mui/material';
import { CalendarMonth, VideocamOff, ArrowBack, OpenInNew } from '@mui/icons-material';
import { useCameraStream } from '../infra/useCameraStream';
import { CameraCard } from './CameraCard';
import { useConexion } from '../infra/useConexion';
import type { ConexionData } from '../types/ConexionTypes';

type CameraStatus = 'active' | 'disabled';

export type CameraDisplayData = {
    id: string;
    conexion_id: number;
    name: string;
    status: CameraStatus;
    habilitada: boolean;
    lastReportCount?: number;
    ubicacion: string;
    conexion: ConexionData;
};

const mapConexionToDisplay = (conexion: ConexionData): CameraDisplayData => ({
    id: `cam_0${conexion.id}`,
    conexion_id: conexion.id,
    name: conexion.nombre_camara,
    habilitada: conexion.habilitada,
    // Mantenemos el status según backend, pero ya no bloqueará la vista
    status: conexion.estado === 'inactiva' ? 'disabled' : 'active',
    lastReportCount: 0,
    ubicacion: conexion.ubicacion,
    conexion: conexion,
});

export const CamerasPage = () => {
    const { getAllConexions } = useConexion();
    const [view, setView] = useState<'grid' | 'detail'>('grid');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [camaras, setCamaras] = useState<ConexionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCameras = async () => {
        setIsLoading(true);
        try {
            const data = await getAllConexions();
            setCamaras(data ?? []);
        } catch (error) {
            console.error("Error fetching cameras:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchCameras(); }, []);

    const displayCameras = useMemo(() => camaras.map(mapConexionToDisplay), [camaras]);
    const selectedCamera = useMemo(() => displayCameras.find(c => c.id === selectedId) ?? null, [selectedId, displayCameras]);
    
    // HOOK DE VIDEO
    // Auto-conectar: Si es webcam, intentamos conectar siempre al entrar al detalle,
    // ignorando el estado 'active' del backend.
    const shouldAutoConnect = view === 'detail' && !!selectedCamera && 
                            (selectedCamera.conexion.rtsp_url === 'webcam' || selectedCamera.status === 'active');

    const { 
        imgSrc, 
        activeStream, 
        isConnected, 
        error, 
        connect, 
        disconnect, 
        isWebcamMode 
    } = useCameraStream({
        cameraId: selectedCamera?.id ?? '',
        rtspUrl: selectedCamera?.conexion.rtsp_url ?? '',
        autoConnect: shouldAutoConnect
    });

    const activeCount = displayCameras.filter(c => c.status === 'active').length;

    return (
        <Box sx={{ mb: 6, m: 4 }}>
            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="h5" fontWeight={700}>Cámaras</Typography>
                    <Chip label={`${activeCount} Activas`} color="success" size="small" variant="outlined" />
                </Stack>
                <Button variant="outlined" startIcon={<CalendarMonth />} size="small">
                    Filtrar Fecha
                </Button>
            </Box>

            {isLoading ? (
                <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
            ) : (
                <>
                    {/* VISTA: GRID */}
                    {view === 'grid' && (
                        <Grid container spacing={3}>
                            {displayCameras.map((camera) => (
                                <Grid sx={{ xs:12, md: 6, lg: 4 }} key={camera.id}>
                                    <CameraCard
                                        camera={camera}
                                        onExpand={(id) => { setSelectedId(id); setView('detail'); }}
                                        onReload={fetchCameras}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* VISTA: DETAIL */}
                    {view === 'detail' && selectedCamera && (
                        <Box>
                            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', mb: 3, borderRadius: 3 }}>
                                <CardHeader
                                    avatar={<IconButton onClick={() => { setView('grid'); setSelectedId(null); }}><ArrowBack /></IconButton>}
                                    title={selectedCamera.name}
                                    subheader={isWebcamMode ? "Modo Webcam Local" : selectedCamera.ubicacion}
                                    action={
                                        <Chip 
                                            label={selectedCamera.status === 'active' ? 'Active' : 'Disabled (Backend)'} 
                                            color={selectedCamera.status === 'active' ? 'success' : 'default'} 
                                            size="small" 
                                        />
                                    }
                                />
                                <CardContent>
                                    <Box sx={{ 
                                        position: 'relative', width: '100%', maxWidth: 800, aspectRatio: '16/9', 
                                        bgcolor: 'black', mx: 'auto', borderRadius: 2, overflow: 'hidden' 
                                    }}>
                                        {/* --- ZONA DE VIDEO SIN BLOQUEO DE ESTADO --- */}
                                        {isWebcamMode ? (
                                            // MODO WEBCAM
                                            activeStream ? (
                                                <video 
                                                    ref={(node) => {
                                                        if (node && activeStream && node.srcObject !== activeStream) {
                                                            node.srcObject = activeStream;
                                                            node.play().catch(() => {});
                                                        }
                                                    }}
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                />
                                            ) : (
                                                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                    {error ? (
                                                        <Typography color="error">{error}</Typography>
                                                    ) : (
                                                        <>
                                                            <CircularProgress size={30} sx={{ mr: 2 }} />
                                                            <Typography>Iniciando Webcam...</Typography>
                                                        </>
                                                    )}
                                                </Box>
                                            )
                                        ) : (
                                            // MODO RTSP (Aquí si respetamos un poco más el estado, o mostramos lo que haya)
                                            imgSrc ? (
                                                <img src={imgSrc} alt="Live" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'grey.500', flexDirection: 'column' }}>
                                                    {isConnected ? (
                                                        <Typography>Esperando frames del servidor...</Typography>
                                                    ) : (
                                                        <>
                                                            <VideocamOff sx={{ fontSize: 60 }} />
                                                            <Typography sx={{ mt: 1 }}>Sin conexión de video</Typography>
                                                        </>
                                                    )}
                                                </Box>
                                            )
                                        )}
                                    </Box>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                                    <Button onClick={isConnected ? disconnect : connect} variant="contained" size="small">
                                        {isConnected ? 'Desconectar' : 'Conectar'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};
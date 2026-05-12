import { useEffect, useMemo, useState } from 'react';
import {
    Box, Card, CardHeader, CardContent, CardActions, Chip, Button,
    IconButton, Stack, Typography, CircularProgress
} from '@mui/material';
import { CalendarMonth, VideocamOff, ArrowBack } from '@mui/icons-material';
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
    rtsp_url: string;
    lastReportCount?: number;
    ubicacion: string;
    conexion: ConexionData;
};

const mapConexionToDisplay = (conexion: ConexionData): CameraDisplayData => ({
    id: `cam_0${conexion.id}`,
    conexion_id: conexion.id,
    name: conexion.nombre_camara,
    habilitada: conexion.habilitada,
    rtsp_url: conexion.rtsp_url,
    status: conexion.estado === 'inactiva' ? 'disabled' : 'active',
    lastReportCount: 0,
    ubicacion: conexion.ubicacion,
    conexion: conexion,
});

// Ancho fijo de cada tarjeta de camara en el grid
const CARD_WIDTH = 500;

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
            console.error('Error fetching cameras:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchCameras(); }, []);

    const displayCameras = useMemo(() => camaras.map(mapConexionToDisplay), [camaras]);
    const selectedCamera = useMemo(
        () => displayCameras.find(c => c.id === selectedId) ?? null,
        [selectedId, displayCameras]
    );

    const shouldAutoConnect =
        view === 'detail' &&
        !!selectedCamera &&
        (selectedCamera.conexion.rtsp_url === 'webcam' || selectedCamera.status === 'active');

    const {
        activeStream,
        isConnected,
        error,
        connect,
        disconnect,
        isWebcamMode,
        videoRef,
    } = useCameraStream({
        cameraId: selectedCamera?.id ?? '',
        rtspUrl: selectedCamera?.conexion.rtsp_url ?? '',
        autoConnect: shouldAutoConnect,
    });

    const activeCount = displayCameras.filter(c => c.status === 'active').length;

    return (
        <Box sx={{ mb: 6, mx: 3, mt: 3 }}>

            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography variant="h6" fontWeight={600} letterSpacing={-0.3}>
                        Camaras
                    </Typography>
                    <Chip
                        label={`${activeCount} activas`}
                        color="success"
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                    <Chip
                        label={`${displayCameras.length} total`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem', color: 'text.secondary' }}
                    />
                </Stack>
                <Button variant="outlined" startIcon={<CalendarMonth />} size="small">
                    Filtrar fecha
                </Button>
            </Box>

            {isLoading ? (
                <Box display="flex" justifyContent="center" p={6}>
                    <CircularProgress size={28} />
                </Box>
            ) : (
                <>
                    {/* VISTA GRID: tarjetas de ancho fijo, sin estirar */}
                    {view === 'grid' && (
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 2,
                                alignItems: 'flex-start',
                            }}
                        >
                            {displayCameras.map((camera) => (
                                <Box
                                    key={camera.id}
                                    sx={{
                                        // Ancho fijo: nunca crece ni se encoge
                                        width: { xs: '100%', sm: CARD_WIDTH },
                                        flexShrink: 0,
                                        flexGrow: 0,
                                    }}
                                >
                                    <CameraCard
                                        camera={camera}
                                        onExpand={(id) => { setSelectedId(id); setView('detail'); }}
                                        onReload={fetchCameras}
                                    />
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* VISTA DETAIL */}
                    {view === 'detail' && selectedCamera && (
                        <Box sx={{ maxWidth: 860, mx: 'auto' }}>
                            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>

                                <CardHeader
                                    sx={{ pb: 0 }}
                                    avatar={
                                        <IconButton
                                            size="small"
                                            onClick={() => { setView('grid'); setSelectedId(null); }}
                                        >
                                            <ArrowBack fontSize="small" />
                                        </IconButton>
                                    }
                                    title={
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            {selectedCamera.name}
                                        </Typography>
                                    }
                                    subheader={
                                        <Typography variant="caption" color="text.secondary">
                                            {isWebcamMode ? 'Modo webcam local' : selectedCamera.ubicacion}
                                        </Typography>
                                    }
                                    action={
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, mr: 1 }}>
                                            <Chip
                                                label={selectedCamera.status === 'active' ? 'Activa' : 'Inactiva'}
                                                color={selectedCamera.status === 'active' ? 'success' : 'default'}
                                                size="small"
                                            />
                                            {isConnected && (
                                                <Chip
                                                    label="LIVE"
                                                    color="error"
                                                    size="small"
                                                    sx={{ height: 20, fontSize: '0.68rem' }}
                                                />
                                            )}
                                        </Stack>
                                    }
                                />

                                <CardContent sx={{ pt: 1.5 }}>
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: '100%',
                                            aspectRatio: '16/9',
                                            bgcolor: '#0a0a0a',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        {isWebcamMode ? (
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
                                                <Box sx={{
                                                    position: 'absolute', inset: 0,
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', color: 'grey.600',
                                                    flexDirection: 'column', gap: 1,
                                                }}>
                                                    {error
                                                        ? <Typography variant="caption" color="error.main">{error}</Typography>
                                                        : <><CircularProgress size={28} color="inherit" /><Typography variant="caption">Iniciando webcam...</Typography></>
                                                    }
                                                </Box>
                                            )
                                        ) : (
                                            <>
                                                <video
                                                    ref={videoRef}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                />
                                                {!isConnected && !error && (
                                                    <Box sx={{
                                                        position: 'absolute', inset: 0,
                                                        display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', flexDirection: 'column',
                                                        gap: 1, color: 'grey.600',
                                                    }}>
                                                        {selectedCamera.status === 'active'
                                                            ? <><CircularProgress size={28} color="inherit" /><Typography variant="caption">Esperando senal HLS...</Typography></>
                                                            : <><VideocamOff sx={{ fontSize: 48 }} /><Typography variant="caption">Camara inactiva</Typography></>
                                                        }
                                                    </Box>
                                                )}
                                            </>
                                        )}

                                        {error && (
                                            <Box sx={{
                                                position: 'absolute', inset: 0,
                                                bgcolor: 'rgba(0,0,0,0.72)',
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', p: 3, textAlign: 'center',
                                            }}>
                                                <Typography variant="caption" color="error.main">{error}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, pt: 0 }}>
                                    <Button
                                        onClick={isConnected ? disconnect : connect}
                                        variant="contained"
                                        size="small"
                                        color={isConnected ? 'error' : 'primary'}
                                        disableElevation
                                    >
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
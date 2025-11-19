import { useEffect, useMemo, useState } from 'react';
import {
    Box, Card, CardHeader, CardContent, CardActions, Chip, Button,
    IconButton, Grid, Stack, Typography, Badge, CircularProgress
} from '@mui/material';
import { CalendarMonth, VideocamOff, ArrowBack, OpenInNew, CameraAlt } from '@mui/icons-material';
import { useWsVideo } from '../infra/useWsVideo';
import { CameraCard } from './CameraCard'; // Asegúrate que CameraCard reciba la ubicacion
import { useConexion } from '../infra/useConexion';
import type { ConexionData } from '../types/ConexionTypes';


type CameraStatus = 'active' | 'disabled';

// Definimos el tipo de cámara que el componente espera internamente,
export type CameraDisplayData = { // Exportar para usar en CameraCard.tsx
    id: string;
    conexion_id: number;
    name: string;
    status: CameraStatus;
    habilitada: boolean;
    lastReportCount?: number;
    ubicacion: string; // <-- AÑADIDO: para mostrar en la tarjeta
    conexion: ConexionData;
};

// --- Mapeo de ConexionData a CameraDisplayData para el render ---
const mapConexionToDisplay = (conexion: ConexionData): CameraDisplayData => ({
    id: `cam_0${conexion.id}`,
    conexion_id: conexion.id,
    name: conexion.nombre_camara,
    habilitada: conexion.habilitada,
    status: conexion.estado === 'inactiva' ? 'disabled' : 'active',
    lastReportCount: conexion.id % 3,
    ubicacion: conexion.ubicacion, // <-- Mapeamos la ubicación
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
            const dataCamaras = await getAllConexions();
            setCamaras(dataCamaras ?? []);
        } catch (error) {
            console.error("Error fetching cameras:", error);
            setCamaras([]);
        } finally {
            setIsLoading(false);
        }
    };

    const displayCameras = useMemo(() => camaras.map(mapConexionToDisplay), [camaras]);

    const selectedCamera = useMemo(
        () => displayCameras.find((c) => c.id === selectedId) ?? null,
        [selectedId, displayCameras]
    );

    const activeCount = displayCameras.filter(c => c.status === 'active').length;
    const disabledCount = displayCameras.length - activeCount;

    // Hook de video SOLO para la cámara seleccionada
    const { imgSrc, isConnected, error, connect, disconnect } = useWsVideo({
        cameraId: selectedCamera?.id ?? 'cam_01',
        autoConnect: view === 'detail' && !!selectedCamera && selectedCamera.status === 'active',
    });

    const handleExpandCamera = (cameraId: string) => {
        setSelectedId(cameraId);
        setView('detail');
    };

    const handleBackToGrid = () => {
        setView('grid');
        setSelectedId(null);
    };

    const StatusChip = ({ status }: { status: CameraStatus }) => (
        <Chip
            label={status === 'active' ? 'Active' : 'Disabled'}
            size="small"
            color={status === 'active' ? 'success' : 'error'}
        />
    );

    useEffect(() => {
        fetchCameras();
    }, []);

    return (
        <Box sx={{ mb: 6, m: 4 }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 4,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Cámaras
                    </Typography>
                    <Chip
                        label={`${activeCount} Active`}
                        size="small"
                        sx={{ bgcolor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 500 }}
                    />
                    <Chip
                        label={`${disabledCount} Disabled`}
                        size="small"
                        sx={{ bgcolor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', fontWeight: 500 }}
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        startIcon={<CalendarMonth />}
                        size="small"
                        sx={{ textTransform: 'none', color: '#475569', borderColor: '#cbd5e1' }}
                    >
                        Nov 16, 2020 – Dec 16, 2020
                    </Button>
                </Box>
            </Box>

            {/* MANEJO DE ESTADO DE CARGA */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ ml: 2, alignSelf: 'center' }}>Cargando cámaras...</Typography>
                </Box>
            ) : (
                <>
                    {/* MENSAJE SI NO HAY CÁMARAS */}
                    {displayCameras.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <VideocamOff sx={{ fontSize: 60, color: 'grey.400' }} />
                            <Typography variant="h6" color="text.secondary">No se encontraron cámaras disponibles.</Typography>
                            <Typography variant="body2" color="text.secondary">Verifique la conexión con el servidor o la configuración de cámaras habilitadas.</Typography>
                        </Box>
                    )}

                    {/* GRID VIEW */}
                    {view === 'grid' && displayCameras.length > 0 && (
                        <Grid container spacing={3}>
                            {displayCameras.map((camera) => (
                                <Grid
                                    key={camera.id}
                                    sx={{ xs: 12, sm: 6, md: 4 }}
                                >
                                    <Box sx={{ height: '100%' }}>
                                        <CameraCard
                                            camera={camera}
                                            onExpand={handleExpandCamera}
                                            enableLive={true}
                                            onReload={fetchCameras}
                                            imgSrc={imgSrc}
                                            isConnected={isConnected}
                                        />
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* DETAIL VIEW (sin cambios, como pediste) */}
                    {view === 'detail' && selectedCamera && (
                        <Box>
                            <Card elevation={0} sx={{ borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}`, boxShadow: (t) => t.shadows[1], mb: 3 }}>
                                <CardHeader
                                    avatar={<IconButton onClick={handleBackToGrid} aria-label="volver"><ArrowBack /></IconButton>}
                                    title={<Typography variant="h6" sx={{ fontWeight: 600 }}>{selectedCamera.name}</Typography>}
                                    action={<StatusChip status={selectedCamera.status} />}
                                />

                                <CardContent sx={{ pt: 0, pb: 2 }}>
                                    {/* Contenido de video (sin cambios) */}
                                    <Box
                                        sx={{
                                            position: 'relative', width: '90%', aspectRatio: '16/9',
                                            bgcolor: 'grey.900', borderRadius: 2, overflow: 'hidden', mx: 'auto',
                                        }}
                                    >
                                        {selectedCamera.status === 'active' ? (
                                            <>
                                                {imgSrc ? (
                                                    <img
                                                        src={imgSrc}
                                                        alt={`LIVE ${selectedCamera.name}`}
                                                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <Box
                                                        sx={{
                                                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', color: 'grey.400',
                                                        }}
                                                    >
                                                        <Typography variant="caption">
                                                            {error ? 'Error de stream' : (isConnected ? 'Conectado, esperando frames…' : 'Conectando…')}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                <Chip
                                                    label={isConnected ? 'LIVE' : 'IDLE'}
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute', top: 8, left: 8, fontWeight: 700,
                                                        color: 'common.white', bgcolor: isConnected ? 'error.main' : 'rgba(0,0,0,0.6)',
                                                    }}
                                                />

                                                {selectedCamera.lastReportCount! > 0 && (
                                                    <Badge
                                                        badgeContent={selectedCamera.lastReportCount}
                                                        color="warning"
                                                        sx={{ position: 'absolute', top: 8, right: 8, '& .MuiBadge-badge': { fontWeight: 700, boxShadow: 1 } }}
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <VideocamOff sx={{ fontSize: 56, color: 'grey.500' }} />
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ px: 4, pb: 4, '& .MuiButton-root': { textTransform: 'none' } }}>
                                    <Button variant="outlined" size="small">Reportar</Button>
                                    <Button variant="outlined" size="small" startIcon={<CameraAlt />}>Snapshot</Button>
                                    <Box sx={{ flexGrow: 1 }} />
                                    {isConnected ? (
                                        <Button variant="text" size="small" onClick={disconnect}>Detener</Button>
                                    ) : (
                                        <Button variant="text" size="small" onClick={connect}>Conectar</Button>
                                    )}
                                    <Button variant="text" size="small" endIcon={<OpenInNew />} sx={{ color: 'primary.main' }}>
                                        Abrir en nueva pestaña
                                    </Button>
                                </CardActions>
                            </Card>

                            {/* OTRAS CÁMARAS */}
                            <Typography variant="subtitle2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}>
                                Otras cámaras
                            </Typography>

                            <Box sx={{ overflowX: 'auto', pb: 2 }}>
                                <Stack direction="row" spacing={2}>
                                    {displayCameras.filter((c) => c.id !== selectedId).map((camera) => (
                                        <Card
                                            key={camera.id}
                                            sx={{
                                                minWidth: 220, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}`,
                                                boxShadow: (t) => t.shadows[0], cursor: 'pointer',
                                                transition: (t) => t.transitions.create(['box-shadow', 'transform'], { duration: t.transitions.duration.shortest }),
                                                '&:hover': { boxShadow: (t) => t.shadows[2], transform: 'translateY(-1px)' },
                                            }}
                                            onClick={() => setSelectedId(camera.id)}
                                        >
                                            <CardHeader
                                                sx={{ pb: 1, '& .MuiCardHeader-title': { fontWeight: 600 } }}
                                                title={<Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{camera.name}</Typography>}
                                                action={<StatusChip status={camera.status} />}
                                            />
                                            <CardContent sx={{ pt: 0, pb: 1 }}>
                                                {/* Contenido de preview */}
                                                <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', bgcolor: 'grey.900', borderRadius: 1, overflow: 'hidden' }}>
                                                    {camera.status === 'active' ? (
                                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'grey.400' }}>
                                                            <Typography variant="caption">Selecciona para ver LIVE</Typography>
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <VideocamOff sx={{ fontSize: 40, color: 'grey.500' }} />
                                                        </Box>
                                                    )}
                                                </Box>
                                            </CardContent>
                                            <CardActions
                                                sx={{ px: 3, pb: 2, justifyContent: 'space-between', '& .MuiButton-root': { textTransform: 'none' } }}
                                            >
                                                <Button size="small" sx={{ color: 'text.secondary', fontSize: 12 }}>Reportar</Button>
                                                <Button size="small" endIcon={<OpenInNew fontSize="small" />} sx={{ color: 'primary.main', fontSize: 12 }}>
                                                    Expandir
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    ))}
                                </Stack>
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};
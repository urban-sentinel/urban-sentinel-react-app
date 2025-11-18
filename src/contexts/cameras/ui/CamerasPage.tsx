import { useMemo, useState } from 'react';
import {
    Box, Card, CardHeader, CardContent, CardActions, Chip, Button,
    IconButton, Grid, Stack, Typography, Badge
} from '@mui/material';
import { CalendarMonth, VideocamOff, ArrowBack, OpenInNew, FiberManualRecord, CameraAlt } from '@mui/icons-material';
import { useWsVideo } from '../infra/useWsVideo';
import { CameraCard } from './CameraCard';

type CameraStatus = 'active' | 'disabled';

type Camera = {
    id: string;
    name: string;
    status: CameraStatus;
    previewUrl: string;
    streamUrl?: string;
    lastReportCount?: number;
};

const mockCameras: Camera[] = [
    { id: 'cam_01', name: 'Av. Primavera', status: 'active', previewUrl: '', streamUrl: '', lastReportCount: 3 },
    { id: 'cam_02', name: 'Calle Los Rosales', status: 'disabled', previewUrl: '', streamUrl: '', lastReportCount: 1 },
    { id: 'cam_03', name: 'Jr. Las Flores', status: 'disabled', previewUrl: '', lastReportCount: 0 },
    { id: 'cam_04', name: 'Av. Javier Prado', status: 'disabled', previewUrl: '', streamUrl: '', lastReportCount: 5 },
    { id: 'cam_05', name: 'Calle San Martin', status: 'disabled', previewUrl: '', streamUrl: '', lastReportCount: 2 },
    { id: 'cam_06', name: 'Av. Arequipa', status: 'disabled', previewUrl: '', streamUrl: '', lastReportCount: 0 },
];

export const CamerasPage = () => {
    const [view, setView] = useState<'grid' | 'detail'>('grid');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const selectedCamera = useMemo(
        () => mockCameras.find((c) => c.id === selectedId) ?? null,
        [selectedId]
    );

    // Hook de video SOLO para la cámara seleccionada (evitamos abrir WS por cada card)
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
            className={
                status === 'active'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
            }
        />
    );

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
                        Camaras
                    </Typography>
                    <Chip
                        label={`5 Active`}
                        size="small"
                        sx={{ bgcolor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 500 }}
                    />
                    <Chip
                        label={`1 Disabled`}
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

            {/* GRID VIEW */}
            {view === 'grid' && (
                <Grid container spacing={3}>
                    {mockCameras.map((camera) => (
                        <CameraCard
                            key={camera.id}
                            camera={camera}
                            onExpand={handleExpandCamera}
                            enableLive={true}   // ← LIVE también en grid, misma tasa que detalle
                        />
                    ))}
                </Grid>
            )}

            {/* DETAIL VIEW */}
            {view === 'detail' && selectedCamera && (
                <Box>
                    <Card elevation={0} sx={{ borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}`, boxShadow: (t) => t.shadows[1], mb: 3 }}>
                        <CardHeader
                            avatar={<IconButton onClick={handleBackToGrid} aria-label="volver"><ArrowBack /></IconButton>}
                            title={<Typography variant="h6" sx={{ fontWeight: 600 }}>{selectedCamera.name}</Typography>}
                            action={<StatusChip status={selectedCamera.status} />}
                        />

                        <CardContent sx={{ pt: 0, pb: 2 }}>
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

                    <Typography variant="subtitle2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}>
                        Otras cámaras
                    </Typography>

                    <Box sx={{ overflowX: 'auto', pb: 2 }}>
                        <Stack direction="row" spacing={2}>
                            {mockCameras.filter((c) => c.id !== selectedId).map((camera) => (
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
        </Box>
    );
};

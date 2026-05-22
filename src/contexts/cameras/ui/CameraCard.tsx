import { useState } from 'react';
import {
    Card, CardHeader, CardContent, CardActions, Chip, Typography,
    Box, Badge, Button, Stack, CircularProgress
} from '@mui/material';
import { Videocam, VideocamOff, Cloud } from '@mui/icons-material';
import type { CameraDisplayData } from './CamerasPage';
import { useConexion } from '../infra/useConexion';
import { useCameraStream } from '../infra/useCameraStream';

interface CameraCardProps {
    camera: CameraDisplayData;
    onExpand: (cameraId: string) => void;
    enableLive?: boolean;
    onReload?: () => Promise<void> | void;
}

export const CameraCard = ({ camera, onExpand, enableLive = true, onReload }: CameraCardProps) => {
    const { updateConexionEstado, updateHabilitado, deleteConexion } = useConexion(); // Añadimos deleteConexion aquíx  
    const [loadingAction, setLoadingAction] = useState(false);

    const {
        activeStream,
        isConnected,
        error,
        isWebcamMode,
        videoRef,
    } = useCameraStream({
        cameraId: camera.id,
        rtspUrl: camera.rtsp_url,
        autoConnect: enableLive && camera.status === 'active',
    });

    const handleToggleVideo = async () => {
        setLoadingAction(true);
        try {
            await updateConexionEstado(camera.conexion_id, camera.status !== 'active');
            if (onReload) await onReload();
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleToggleModel = async () => {
        setLoadingAction(true);
        try {
            await updateHabilitado(camera.conexion_id, !camera.habilitada);
            if (onReload) await onReload();
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar esta cámara del panel? Sus videos guardados se conservarán en el historial.")) return;
        
        setLoadingAction(true);
        try {
            await deleteConexion(camera.conexion_id);
            if (onReload) await onReload(); 
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <Card
            elevation={0}
            sx={{
                // Sin height: 100% — la tarjeta tiene altura natural según su contenido.
                // El ancho lo controla el contenedor padre (Box de ancho fijo en CamerasPage).
                width: '100%',
                borderRadius: 2.5,
                border: (t) => `1px solid ${t.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-1px)',
                    cursor: 'pointer',
                },
            }}
            onClick={() => onExpand(camera.id)}
        >
            {/* Header compacto */}
            <CardHeader
                sx={{ pb: 0.5, pt: 1.5, px: 1.5 }}
                title={
                    <Typography variant="body2" fontWeight={600} noWrap>
                        {camera.name}
                    </Typography>
                }
                subheader={
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
                        {isWebcamMode
                            ? <Videocam sx={{ fontSize: 11, color: 'text.disabled' }} />
                            : <Cloud sx={{ fontSize: 11, color: 'text.disabled' }} />
                        }
                        <Typography variant="caption" color="text.disabled" noWrap>
                            {isWebcamMode ? 'Webcam local' : camera.ubicacion}
                        </Typography>
                    </Stack>
                }
                action={
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1, mr: 0.5 }}>
                        <Chip
                            label={camera.status === 'active' ? 'ON' : 'OFF'}
                            size="small"
                            color={camera.status === 'active' ? 'success' : 'default'}
                            sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                        {camera.habilitada && (
                            <Chip
                                label="IA"
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                        )}
                    </Stack>
                }
            />

            {/* Preview de video — aspecto 16:9 fijo */}
            <CardContent sx={{ pt: 1, pb: 0.5, px: 1.5 }}>
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        bgcolor: '#0a0a0a',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {camera.status === 'active' ? (
                        <>
                            {isWebcamMode ? (
                                activeStream ? (
                                    <video
                                        ref={(node) => {
                                            if (node && activeStream && node.srcObject !== activeStream) {
                                                node.srcObject = activeStream;
                                                node.play().catch(() => {});
                                            }
                                        }}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        muted
                                        playsInline
                                        autoPlay
                                    />
                                ) : (
                                    <Stack alignItems="center" spacing={0.5} sx={{ color: 'grey.600' }}>
                                        <CircularProgress size={18} color="inherit" />
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Iniciando...</Typography>
                                    </Stack>
                                )
                            ) : (
                                <>
                                    <video
                                        ref={videoRef}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        muted
                                        playsInline
                                        autoPlay
                                    />
                                    {!isConnected && !error && (
                                        <Box sx={{
                                            position: 'absolute', inset: 0,
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', flexDirection: 'column',
                                            gap: 0.5, color: 'grey.600',
                                        }}>
                                            <CircularProgress size={18} color="inherit" />
                                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Esperando...</Typography>
                                        </Box>
                                    )}
                                </>
                            )}

                            {/* Error overlay */}
                            {error && (
                                <Box sx={{
                                    position: 'absolute', inset: 0,
                                    bgcolor: 'rgba(0,0,0,0.7)',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', p: 1.5, textAlign: 'center',
                                }}>
                                    <Typography variant="caption" color="error.main" sx={{ fontSize: '0.65rem' }}>
                                        {error}
                                    </Typography>
                                </Box>
                            )}

                            {/* Badge LIVE */}
                            {isConnected && (
                                <Chip
                                    label="LIVE"
                                    size="small"
                                    color="error"
                                    sx={{
                                        position: 'absolute', top: 6, left: 6,
                                        height: 18, fontSize: '0.6rem',
                                        '& .MuiChip-label': { px: 0.75 },
                                    }}
                                />
                            )}

                            {/* Badge de alertas */}
                            {!!camera.lastReportCount && camera.lastReportCount > 0 && (
                                <Badge
                                    badgeContent={camera.lastReportCount}
                                    color="warning"
                                    sx={{ position: 'absolute', top: 8, right: 8 }}
                                />
                            )}
                        </>
                    ) : (
                        <Stack alignItems="center" spacing={0.5} sx={{ color: 'grey.700' }}>
                            <VideocamOff sx={{ fontSize: 28 }} />
                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Apagada</Typography>
                        </Stack>
                    )}
                </Box>
            </CardContent>

            {/* Acciones compactas */}
            <CardActions
                sx={{ px: 1.5, pb: 1.5, pt: 0.5, justifyContent: 'space-between' }}
                onClick={(e) => e.stopPropagation()}
            >
                <Button
                    size="small"
                    variant="outlined"
                    color={camera.status === 'active' ? 'error' : 'primary'}
                    onClick={handleToggleVideo}
                    disabled={loadingAction}
                    sx={{ fontSize: '0.7rem', py: 0.25 }}
                >
                    {camera.status === 'active' ? 'Apagar' : 'Encender'}
                </Button>
                <Button
                    size="small"
                    variant="text"
                    onClick={handleToggleModel}
                    disabled={loadingAction}
                    sx={{ fontSize: '0.7rem', py: 0.25, color: 'text.secondary' }}
                >
                    {camera.habilitada ? 'Sin IA' : 'Con IA'}
                </Button>
                <Button
                    size="small"
                    variant="text"
                    color="error"
                    onClick={handleDelete}
                    disabled={loadingAction}
                    sx={{ fontSize: '0.7rem', py: 0.25 }}
                >
                    Eliminar 
                </Button>
            </CardActions>
        </Card>
    );
};
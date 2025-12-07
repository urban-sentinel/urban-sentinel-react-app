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
    const { updateConexionEstado, updateHabilitado } = useConexion();
    const [loadingAction, setLoadingAction] = useState(false);

    // 1. Usamos el hook y extraemos activeStream
    const { 
        imgSrc, 
        // videoRef, // Ya no lo usamos directamente en el render
        activeStream, // <--- IMPORTANTE: El stream puro
        isConnected, 
        error, 
        isWebcamMode 
    } = useCameraStream({
        cameraId: camera.id,
        rtspUrl: camera.conexion.rtsp_url,
        // Solo conectamos si la cámara está activa para ahorrar recursos en el grid
        autoConnect: enableLive && camera.status === 'active'
    });

    const handleToggleVideo = async () => {
        setLoadingAction(true);
        try {
            const newState = camera.status !== 'active';
            await updateConexionEstado(camera.conexion_id, newState);
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
            const newState = !camera.habilitada;
            await updateHabilitado(camera.conexion_id, newState);
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
                borderRadius: 3,
                border: (t) => `1px solid ${t.palette.divider}`,
                boxShadow: (t) => t.shadows[1],
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
            }}
        >
            <CardHeader
                sx={{ pb: 1 }}
                title={
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {camera.name}
                    </Typography>
                }
                subheader={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        {isWebcamMode ? <Videocam fontSize="inherit" /> : <Cloud fontSize="inherit" />}
                        <Typography variant="caption" color="text.secondary">
                            {isWebcamMode ? 'Webcam Local' : camera.ubicacion}
                        </Typography>
                    </Stack>
                }
                action={
                    <Stack direction="row" spacing={1}>
                        <Chip
                            label={camera.status === 'active' ? 'ON' : 'OFF'}
                            size="small"
                            color={camera.status === 'active' ? 'success' : 'default'}
                            variant="filled"
                        />
                        <Chip
                            label={camera.habilitada ? 'IA' : 'No IA'}
                            size="small"
                            color={camera.habilitada ? 'primary' : 'default'}
                            variant={camera.habilitada ? 'filled' : 'outlined'}
                        />
                    </Stack>
                }
            />

            <CardContent sx={{ pt: 0, pb: 1, flexGrow: 1 }}>
                <Box
                    sx={{
                        position: 'relative', width: '100%', aspectRatio: '16/9',
                        bgcolor: 'grey.900', borderRadius: 2, overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                    onClick={() => onExpand(camera.id)}
                >
                    {camera.status === 'active' ? (
                        <>
                            {/* --- LÓGICA DE RENDERIZADO DE VIDEO CORREGIDA --- */}
                            {isWebcamMode ? (
                                activeStream ? (
                                    <video
                                        ref={(node) => {
                                            // CALLBACK REF: Asigna el stream apenas el nodo existe
                                            if (node && activeStream && node.srcObject !== activeStream) {
                                                node.srcObject = activeStream;
                                                node.play().catch(() => {}); // Ignorar errores de autoplay
                                            }
                                        }}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        muted
                                        playsInline
                                        autoPlay
                                    />
                                ) : (
                                    <Stack alignItems="center" color="grey.500">
                                        <CircularProgress size={24} color="inherit" />
                                        <Typography variant="caption" mt={1}>Iniciando...</Typography>
                                    </Stack>
                                )
                            ) : (
                                imgSrc ? (
                                    <img src={imgSrc} alt="Live" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Stack alignItems="center" color="grey.500">
                                        <CircularProgress size={24} color="inherit" />
                                        <Typography variant="caption" mt={1}>Esperando señal...</Typography>
                                    </Stack>
                                )
                            )}

                            {/* Mensajes de error si falló la conexión */}
                            {error && (
                                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="error.main">{error}</Typography>
                                </Box>
                            )}
                            
                            {isConnected && (
                                <Chip label="LIVE" size="small" color="error" sx={{ position: 'absolute', top: 8, left: 8, height: 20, fontSize: '0.7rem' }} />
                            )}
                        </>
                    ) : (
                        <Stack alignItems="center" color="grey.700">
                            <VideocamOff fontSize="large" />
                            <Typography variant="caption">Cámara Apagada</Typography>
                        </Stack>
                    )}

                    {/* Badge de alertas */}
                    {camera.lastReportCount && camera.lastReportCount > 0 && (
                        <Badge
                            badgeContent={camera.lastReportCount}
                            color="warning"
                            sx={{ position: 'absolute', top: 10, right: 10 }}
                        />
                    )}
                </Box>
            </CardContent>

            <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
                <Button
                    size="small" variant="outlined" color={camera.status === 'active' ? 'error' : 'primary'}
                    onClick={(e) => { e.stopPropagation(); handleToggleVideo(); }} 
                    disabled={loadingAction}
                >
                    {camera.status === 'active' ? 'Apagar' : 'Encender'}
                </Button>

                <Button
                    size="small" variant="text"
                    onClick={(e) => { e.stopPropagation(); handleToggleModel(); }}
                    disabled={loadingAction}
                >
                    {camera.habilitada ? 'Deshabilitar IA' : 'Habilitar IA'}
                </Button>
            </CardActions>
        </Card>
    );
};
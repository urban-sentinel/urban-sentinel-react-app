import { useState, useEffect } from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Chip,
    Typography,
    Box,
    Badge,
    Button,
    Stack,
} from '@mui/material';
import { VideocamOff } from '@mui/icons-material';
import type { CameraDisplayData } from './CamerasPage';
import { useCameraControl } from '../infra/useCameraControl';
import { useConexion } from '../infra/useConexion';

interface CameraCardProps {
    camera: CameraDisplayData;
    onExpand: (cameraId: string) => void;
    enableLive?: boolean;
    onReload?: () => Promise<void> | void;
    imgSrc?: string | null;
    isConnected?: boolean;
}

export const CameraCard = ({
    camera,
    onExpand,
    enableLive = true,
    onReload,
    imgSrc,
    isConnected
}: CameraCardProps) => {

    const showLivePreview = enableLive && camera.status === 'active';

    const { updateConexionEstado, updateHabilitado } = useConexion();

    const {
        startCamera,
        stopCamera,
        enableInference,
        disableInference,
        loading,
        error,
    } = useCameraControl();

    // Estado local para saber qué texto mostrar en los botones
    const [videoOn, setVideoOn] = useState(camera.status === 'active');
    const [inferenceOn, setInferenceOn] = useState(camera.habilitada === true); // asumimos que arranca activo

    // Si cambia el status de la cámara desde fuera, sincronizamos
    useEffect(() => {
        setVideoOn(camera.status === 'active');
    }, [camera.status]);

    const StatusChip = ({ status }: { status: 'active' | 'disabled' }) => (
        <Chip
            label={status === 'active' ? 'Active' : 'Disabled'}
            size="small"
            color={status === 'active' ? 'success' : 'error'}
        />
    );

    const HabilitadoChip = ({ enabled }: { enabled: boolean }) => (
        <Chip
            label={enabled ? 'Habilitado' : 'Modelo detenido'}
            size="small"
            color={enabled ? 'primary' : 'default'}
            variant={enabled ? 'filled' : 'outlined'}
        />
    );

    const handleToggleVideo = async () => {
        try {
            if (videoOn) {
                await stopCamera("cam_01");
                await updateConexionEstado(camera.conexion_id, false);
                setVideoOn(false);
            } else {
                await startCamera("cam_01");
                await updateConexionEstado(camera.conexion_id, true);
                setVideoOn(true);
            }
        } catch {
            // El error ya se maneja en el hook (state error)
        } finally {
            if (onReload) {
                onReload();
            }
        }
    };

    const handleToggleInference = async () => {
        try {
            if (inferenceOn) {
                await disableInference("cam_01");
                await updateHabilitado(camera.conexion_id, false);
                setInferenceOn(false);
            } else {
                await enableInference("cam_01");
                await updateHabilitado(camera.conexion_id, true);
                setInferenceOn(true);
            }
        } catch {
            // idem
        } finally {
            if (onReload) {
                onReload();
            }
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
                width: '550px',
                display: 'flex',
                flexDirection: 'column',
                transition: (t) =>
                    t.transitions.create(['box-shadow', 'transform'], {
                        duration: t.transitions.duration.shortest,
                    }),
                '&:hover': {
                    boxShadow: (t) => t.shadows[2],
                    transform: 'translateY(-1px)',
                },
            }}
        >
            <CardHeader
                sx={{ pb: 1, '& .MuiCardHeader-title': { fontWeight: 600 } }}
                title={
                    <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
                        {camera.name}
                    </Typography>
                }
                subheader={
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {camera.ubicacion}
                    </Typography>
                }
                action={
                    <Stack direction="row" spacing={1} alignItems="center">
                        <StatusChip status={camera.status} />
                        <HabilitadoChip enabled={camera.habilitada} />
                    </Stack>
                }
            />

            <CardContent sx={{ pt: 0, pb: 1, flexGrow: 1 }}>
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        bgcolor: 'grey.900',
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'grey.400',
                        cursor: 'pointer',
                    }}
                    onClick={() => onExpand(camera.id)}
                >
                    {imgSrc && camera.conexion_id == 1 ? (
                        <img
                            src={imgSrc}
                            alt={`LIVE CAM_01`}
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
                                {error ? 'Error de stream' : (isConnected ? 'Conectado, esperando frames…' : 'No señal de video')}
                            </Typography>
                        </Box>
                    )}


                    {camera.lastReportCount && camera.lastReportCount > 0 && (
                        <Badge
                            badgeContent={camera.lastReportCount}
                            color="warning"
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                '& .MuiBadge-badge': { fontWeight: 700, boxShadow: 1 },
                            }}
                        />
                    )}
                </Box>
            </CardContent>

            <CardActions
                sx={{
                    px: 2.5,
                    pb: 2,
                    mt: 'auto',
                    gap: 1,
                    '& .MuiButton-root': { textTransform: 'none', fontSize: 12 },
                }}
            >
                {/* Botón 1: video (start/stop) */}
                <Button
                    size="small"
                    variant="outlined"
                    disabled={loading}
                    onClick={handleToggleVideo}
                >
                    {videoOn ? 'Detener video' : 'Iniciar video'}
                </Button>

                {/* Botón 2: modelo IA (enable/disable) */}
                <Button
                    size="small"
                    variant="outlined"
                    disabled={loading /* o también !videoOn si quieres forzar que haya video */}
                    onClick={handleToggleInference}
                >
                    {inferenceOn ? 'Detener modelo' : 'Iniciar modelo'}
                </Button>

                {error && (
                    <Typography
                        variant="caption"
                        color="error"
                        sx={{ width: '100%', mt: 0.5 }}
                    >
                        {error.message}
                    </Typography>
                )}
            </CardActions>
        </Card>
    );
};

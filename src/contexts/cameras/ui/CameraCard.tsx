import { Badge, Box, Button, Card, CardActions, CardContent, CardHeader, Chip, Grid, Stack, Typography } from "@mui/material";
import { useWsVideo } from "../infrastructure/useWsVideo";
import { FiberManualRecord, OpenInNew, VideocamOff } from "@mui/icons-material";

type CameraStatus = 'active' | 'disabled';
type Camera = {
    id: string;
    name: string;
    status: CameraStatus;
    previewUrl?: string;
    streamUrl?: string;
    lastReportCount?: number;
};

export function CameraCard({
    camera,
    onExpand,
    enableLive, // true cuando estamos en grid y queremos live
}: {
    camera: Camera;
    onExpand: (id: string) => void;
    enableLive: boolean;
}) {
    // MISMA TASA que en detalle: sin throttle (throttleMs: 0)
    const { imgSrc, isConnected } = useWsVideo({
        cameraId: camera.id,
        autoConnect: enableLive && camera.status === 'active',
    });

    return (
        <Grid key={camera.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
                elevation={0}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    border: (t) => `1px solid ${t.palette.divider}`,
                    boxShadow: (t) => t.shadows[0],
                    transition: (t) =>
                        t.transitions.create(['box-shadow', 'transform'], {
                            duration: t.transitions.duration.shorter,
                        }),
                    '&:hover': { boxShadow: (t) => t.shadows[3], transform: 'translateY(-2px)' },
                }}
            >
                <CardHeader
                    sx={{
                        pb: 1,
                        '& .MuiCardHeader-title': { fontWeight: 600, fontSize: 14, color: 'text.primary' },
                        '& .MuiCardHeader-action': { alignSelf: 'center' },
                    }}
                    title={<Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>{camera.name}</Typography>}
                    action={
                        <Chip
                            label={camera.status === 'active' ? 'Active' : 'Disabled'}
                            size="small"
                            color={camera.status === 'active' ? 'success' : 'error'}
                        />
                    }
                />

                <CardContent sx={{ pt: 0, pb: 2 }}>
                    <Box
                        onClick={() => onExpand(camera.id)}
                        sx={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '16/9',
                            bgcolor: camera.status === 'active' ? 'grey.900' : 'grey.100',
                            borderRadius: 2,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            outline: '1px solid',
                            outlineColor: 'divider',
                            '&:hover .liveChip': { opacity: 1, transform: 'translateY(0)' },
                        }}
                    >
                        {camera.status === 'active' ? (
                            imgSrc ? (
                                <img
                                    src={imgSrc}
                                    alt={`LIVE ${camera.name}`}
                                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'grey.400',
                                    }}
                                >
                                    <Typography variant="caption">
                                        {isConnected ? 'Conectado, esperando frames…' : 'Click para ver LIVE'}
                                    </Typography>
                                </Box>
                            )
                        ) : (
                            <Box
                                sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <VideocamOff sx={{ fontSize: 56, color: 'grey.500' }} />
                            </Box>
                        )}

                        {!!camera.lastReportCount && camera.lastReportCount > 0 && (
                            <Badge
                                badgeContent={camera.lastReportCount}
                                color="warning"
                                sx={{ position: 'absolute', top: 8, right: 8, '& .MuiBadge-badge': { fontWeight: 700, boxShadow: 1 } }}
                            />
                        )}
                    </Box>
                </CardContent>

                <CardActions sx={{ mt: 'auto', px: 2, pb: 2, justifyContent: 'space-between', '& .MuiButton-root': { textTransform: 'none' } }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <FiberManualRecord sx={{ fontSize: 12, color: camera.status === 'active' ? 'success.main' : 'error.main' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {camera.status === 'active' ? 'Disponible' : 'Inactiva'}
                        </Typography>
                    </Stack>
                    <Button size="small" endIcon={<OpenInNew fontSize="small" />} onClick={() => onExpand(camera.id)} sx={{ color: 'primary.main' }}>
                        Expandir
                    </Button>
                </CardActions>
            </Card>
        </Grid>
    );
}

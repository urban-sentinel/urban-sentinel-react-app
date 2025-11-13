import { useState } from 'react';
import {
    Box,
    IconButton,
    Typography,
    Card,
    CardContent,
    Chip,
    TextField,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Paper
} from '@mui/material';
import {
    Videocam as VideocamIcon,
    Add as AddIcon,
    Visibility as VisibilityIcon,
    Archive as ArchiveIcon,
    CalendarToday as CalendarIcon,
    FiberManualRecord as DotIcon,
    CalendarMonth
} from '@mui/icons-material';

import { initialState, type AlertSeverity, type CameraStatus } from '../domain/Types';

export const DashboardPage = () => {

    const [state, setState] = useState(initialState);
    const [showAddCamera, setShowAddCamera] = useState(false);
    const [newCameraName, setNewCameraName] = useState('');
    const [newCameraLocation, setNewCameraLocation] = useState('');

    const setRoute = (route: string) => {
        setState(prev => ({
            ...prev,
            ui: { ...prev.ui, currentRoute: route, sidebarOpen: false }
        }));
    };

    const archiveAlert = (alertId: string) => {
        setState(prev => ({
            ...prev,
            alerts: prev.alerts.map(a => a.id === alertId ? { ...a, read: true } : a)
        }));
    };

    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const formatRelativeTime = (iso: string) => {
        return `Hoy | ${formatTime(iso)}`;
    };

    const handleAddCamera = () => {
        if (newCameraName && newCameraLocation) {
            setState(prev => ({
                ...prev,
                cameras: [
                    ...prev.cameras,
                    {
                        id: String(prev.cameras.length + 1),
                        name: newCameraName,
                        location: newCameraLocation,
                        status: 'active' as CameraStatus
                    }
                ]
            }));
            setNewCameraName('');
            setNewCameraLocation('');
            setShowAddCamera(false);
        }
    };

    const activeCameras = state.cameras.filter(c => c.status === 'active').length;
    const disabledCameras = state.cameras.filter(c => c.status === 'disabled').length;

    const getSeverityColor = (severity: AlertSeverity) => {
        switch (severity) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    const getSeverityBgColor = (severity: AlertSeverity) => {
        switch (severity) {
            case 'high': return '#ef4444';
            case 'medium': return '#eab308';
            case 'low': return '#22c55e';
            default: return '#94a3b8';
        }
    };

    return (
        <Box sx={{ mb: 6, margin: 4 }}>
            {/* Título y chips */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                mb: 4
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Dashboard
                    </Typography>
                </Box>

                {/* Controles de filtrado */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        startIcon={<CalendarMonth />}
                        size="small"
                        sx={{
                            textTransform: 'none',
                            color: '#475569',
                            borderColor: '#cbd5e1'
                        }}
                    >
                        Nov 16, 2020 – Dec 16, 2020
                    </Button>

                </Box>
            </Box>
            <Box component="main" sx={{ p: { xs: 2, md: 3 } }}>
                <Grid container spacing={3}>
                    {/* Camera Panel */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DotIcon sx={{ fontSize: 12, color: '#22c55e' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {activeCameras} Activas
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DotIcon sx={{ fontSize: 12, color: '#ef4444' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {disabledCameras} Deshabilitadas
                                        </Typography>
                                    </Box>
                                </Box>

                                <Grid container spacing={2}>
                                    {state.cameras.map((camera) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={camera.id}>
                                            <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                        <VideocamIcon sx={{ color: '#64748b' }} />
                                                        <DotIcon
                                                            sx={{
                                                                fontSize: 12,
                                                                color: camera.status === 'active' ? '#22c55e' : '#ef4444'
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                                        {camera.name}
                                                    </Typography>
                                                    <Chip
                                                        label={camera.status === 'active' ? 'Activo' : 'Deshabilitado'}
                                                        color={camera.status === 'active' ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}

                                    {[1, 2].map((i) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={`add-${i}`}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    border: '2px dashed #cbd5e1',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        borderColor: '#3b82f6',
                                                        bgcolor: '#eff6ff'
                                                    }
                                                }}
                                                onClick={() => setShowAddCamera(true)}
                                            >
                                                <CardContent
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minHeight: 140,
                                                        gap: 1
                                                    }}
                                                >
                                                    <AddIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#64748b' }}>
                                                        Añadir nueva cámara
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Alerts Panel */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                    Alertas Recientes
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {state.alerts.filter(a => !a.read).slice(0, 4).map((alert) => {
                                        const camera = state.cameras.find(c => c.id === alert.cameraId);
                                        return (
                                            <Paper
                                                key={alert.id}
                                                sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    gap: 2,
                                                    borderLeft: `4px solid ${getSeverityBgColor(alert.severity)}`,
                                                    '&:hover': { boxShadow: 2 }
                                                }}
                                            >
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                            {camera?.name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                            {formatTime(alert.timeISO)}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                                                        {alert.type} detectado
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box>
                                                            <IconButton size="small" onClick={() => setRoute(`/alertas/${alert.id}`)}>
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => archiveAlert(alert.id)}>
                                                                <ArchiveIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* History Panel */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                    Historial de Casos
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {state.history.map((historyCase) => (
                                        <Card key={historyCase.id} variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
                                                        {historyCase.title}
                                                    </Typography>
                                                    <Chip
                                                        label={historyCase.severity === 'high' ? 'Alto' : historyCase.severity === 'medium' ? 'Medio' : 'Bajo'}
                                                        color={getSeverityColor(historyCase.severity)}
                                                        size="small"
                                                    />
                                                </Box>
                                                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                                                    Caso #{historyCase.caseNumber}
                                                </Typography>
                                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                                    <Grid size={{ xs: 4 }}>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Lugar:</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {historyCase.location}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 4 }}>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Tipo:</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {historyCase.type}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CalendarIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                        Creado {new Date(historyCase.createdISO).toLocaleDateString('es-PE', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Notifications Panel */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                    Notificaciones del Sistema
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {state.notifications.map((note, index) => (
                                        <Box key={note.id}>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', mb: 0.5, display: 'block' }}>
                                                {formatRelativeTime(note.timeISO)}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 500,
                                                    color: note.level === 'success' ? '#22c55e' :
                                                        note.level === 'error' ? '#ef4444' : '#9b9b9bff'
                                                }}
                                            >
                                                {note.message}
                                            </Typography>
                                            {index < state.notifications.length - 1 && (
                                                <Divider sx={{ mt: 2 }} />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
            {/* Add Camera Dialog */}
            <Dialog
                open={showAddCamera}
                onClose={() => setShowAddCamera(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Añadir Nueva Cámara</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Nombre"
                            fullWidth
                            value={newCameraName}
                            onChange={(e) => setNewCameraName(e.target.value)}
                            placeholder="Ej: Av. Principal"
                        />
                        <TextField
                            label="Ubicación"
                            fullWidth
                            value={newCameraLocation}
                            onChange={(e) => setNewCameraLocation(e.target.value)}
                            placeholder="Ej: Centro"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddCamera(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAddCamera}
                        disabled={!newCameraName || !newCameraLocation}
                    >
                        Agregar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

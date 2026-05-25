import { useEffect, useState, useRef, useMemo } from "react";
import {
    AppBar,
    Avatar,
    Badge,
    Box,
    IconButton,
    InputBase,
    Toolbar,
    Typography,
    Menu,
    MenuItem,
    ListItemText,
    Divider,
    useTheme,
    useMediaQuery,
    ListItemIcon,
    Chip
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNotification } from "../../../contexts/clips/infra/useNotification";
import type { NotificacionData } from "../../../contexts/dashboard/types/Types";

const DRAWER_WIDTH_COLLAPSED = 72;

interface TopBarProps {
    title?: string;
    userName?: string;
    onSidebarToggle?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title = "Dashboard", userName, onSidebarToggle }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    const { getAllNotifications } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const [notificaciones, setNotificaciones] = useState<NotificacionData[]>([]);
    const anchorRef = useRef<HTMLButtonElement>(null);

    const unreadCount = notificaciones.length;

    const handleToggle = () => {
        setIsOpen((prev) => !prev);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const fetchNotifications = async () => {
        try {
            const dataNotifcations = await getAllNotifications();
            setNotificaciones(dataNotifcations ?? []);
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Helper para dar formato rápido a la hora en las notificaciones
    const formatNotificationTime = (isoString?: string) => {
        if (!isoString) return "Reciente";
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch {
            return isoString;
        }
    };

    const displayedNotifications = useMemo(() => notificaciones.slice(0, 8), [notificaciones]);

    return (
        <AppBar
            position="fixed"
            color="inherit"
            elevation={0}
            sx={{
                borderBottom: 1,
                borderColor: "divider",
                width: { xs: '100%', lg: `calc(100% - ${DRAWER_WIDTH_COLLAPSED}px)` },
                ml: { xs: 0, lg: `${DRAWER_WIDTH_COLLAPSED}px` },
                bgcolor: 'white'
            }}
        >
            <Toolbar sx={{ gap: 2, minHeight: 70 }}>
                {isMobile && (
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={onSidebarToggle}
                        sx={{ mr: 1 }}
                    >
                        <MenuIcon />
                    </IconButton>
                )}

                {/* Buscador Superior */}
                <Box
                    sx={{
                        flex: 1,
                        maxWidth: 420,
                        px: 2,
                        py: 0.75,
                        borderRadius: 2.5,
                        bgcolor: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    <SearchIcon fontSize="small" sx={{ color: '#64748b' }} />
                    <InputBase
                        placeholder="Buscar incidentes, cámaras o reportes..."
                        sx={{ flex: 1, fontSize: '0.875rem', color: '#334155' }}
                    />
                </Box>

                {/* Sección Derecha de Perfil y Alertas */}
                <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 2 }}>
                    {userName && (
                        <Typography
                            variant="body2"
                            sx={{
                                display: { xs: 'none', md: 'block' },
                                fontWeight: 600,
                                color: '#334155'
                            }}
                        >
                            {userName}
                        </Typography>
                    )}

                    {/* Botón de Notificaciones con Badge */}
                    <IconButton
                        ref={anchorRef}
                        size="medium"
                        onClick={handleToggle}
                        sx={{ 
                            bgcolor: isOpen ? '#f1f5f9' : 'transparent',
                            color: unreadCount ? '#ef4444' : '#64748b',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: '#f1f5f9' }
                        }}
                    >
                        <Badge
                            color="error"
                            badgeContent={unreadCount || undefined}
                            max={99}
                            sx={{
                                '& .MuiBadge-badge': {
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    height: 18,
                                    minWidth: 18
                                }
                            }}
                        >
                            <NotificationsIcon fontSize="medium" />
                        </Badge>
                    </IconButton>

                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#3b82f6', fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(59,130,246,0.2)' }}>
                        {userName ? userName.charAt(0).toUpperCase() : 'R'}
                    </Avatar>
                </Box>

                {/* 🔄 POPUP MENÚ DE NOTIFICACIONES TOTALMENTE CUADRADO Y COMPACTO */}
                <Menu
                    id="notifications-menu"
                    anchorEl={anchorRef.current}
                    open={isOpen}
                    onClose={handleClose}
                    disableScrollLock={true}
                    slotProps={{
                        paper: {
                            elevation: 4,
                            sx: {
                                width: 380,
                                maxHeight: 480,
                                mt: 1.5,
                                borderRadius: 3,
                                overflow: 'hidden',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                                '&:before': {
                                    content: '""',
                                    display: 'block',
                                    position: 'absolute',
                                    top: 0,
                                    right: 18,
                                    width: 10,
                                    height: 10,
                                    bgcolor: 'background.paper',
                                    transform: 'translateY(-50%) rotate(45deg)',
                                    zIndex: 0,
                                },
                            }
                        }
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    sx={{ zIndex: 1300 }}
                >
                    {/* Encabezado del Popover */}
                    <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            Alertas de Monitoreo
                        </Typography>
                        <Chip 
                            label={`${unreadCount} pendientes`} 
                            size="small" 
                            sx={{ bgcolor: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: '0.75rem' }} 
                        />
                    </Box>
                    <Divider />

                    {/* Contenedor con Scroll para los items */}
                    <Box sx={{ maxHeight: 340, overflowY: 'auto' }}>
                        {displayedNotifications.length > 0 ? (
                            displayedNotifications.map((n) => {
                                // Evaluamos si es una alerta crítica de la IA para cambiarle el icono
                                const esAlerta = n.mensaje.toLowerCase().includes("alerta") || n.mensaje.toLowerCase().includes("forcejeo");
                                
                                return (
                                    <MenuItem 
                                        key={n.id} 
                                        onClick={handleClose}
                                        sx={{
                                            py: 1.5,
                                            px: 2.5,
                                            // 🔥 LA CORRECCIÓN CLAVE: Rompe el nowrap y permite saltos de línea fluidos
                                            whiteSpace: 'normal', 
                                            wordBreak: 'break-word',
                                            alignItems: 'flex-start',
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'background 0.2s',
                                            '&:hover': { bgcolor: '#f8fafc' }
                                        }}
                                    >
                                        <ListItemIcon sx={{ mt: 0.25, minWidth: 32 }}>
                                            {esAlerta ? (
                                                <ErrorIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                                            ) : (
                                                <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 20 }} />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={n.mensaje}
                                            secondary={formatNotificationTime(n.created_at)}
                                            primaryTypographyProps={{ 
                                                variant: 'body2', 
                                                fontWeight: 500, 
                                                color: '#334155', 
                                                lineHeight: 1.4,
                                                mb: 0.5 
                                            }}
                                            secondaryTypographyProps={{ 
                                                variant: 'caption', 
                                                color: '#94a3b8',
                                                fontWeight: 600,
                                                fontFamily: 'monospace'
                                            }}
                                        />
                                    </MenuItem>
                                );
                            })
                        ) : (
                            <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    No se registran eventos huérfanos en la cola.
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Footer si hay más de 8 notificaciones en Postgres */}
                    {unreadCount > 8 && (
                        <Box>
                            <Divider />
                            <Box sx={{ p: 1, bgcolor: '#f8fafc', textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#3b82f6', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                    Ver todas las notificaciones en el centro de control
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Menu>
            </Toolbar>
        </AppBar>
    );
};
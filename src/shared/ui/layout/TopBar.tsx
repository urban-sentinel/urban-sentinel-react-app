import { useEffect, useState, useRef } from "react";
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
    useMediaQuery
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import { useNotification } from "../../../contexts/clips/infra/useNotification";
import type { NotificacionData } from "../../../contexts/dashboard/types/Types";

// Definimos el ancho del sidebar colapsado aquí para sincronizarlo con el layout
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
        fetchNotifications()
    }, []);

    const displayedNotifications = notificaciones.slice(0, 8);

    return (
        <AppBar
            position="fixed"
            color="inherit"
            elevation={0}
            sx={{
                borderBottom: 1,
                borderColor: "divider",
                // CORRECCIÓN CLAVE:
                // 1. En Desktop (lg), el ancho es 100% MENOS el ancho del sidebar
                // 2. Empujamos la barra a la derecha (ml) lo que mide el sidebar
                width: { xs: '100%', lg: `calc(100% - ${DRAWER_WIDTH_COLLAPSED}px)` },
                ml: { xs: 0, lg: `${DRAWER_WIDTH_COLLAPSED}px` },
                // El zIndex ya no necesita ser super alto, lo estándar funciona bien
            }}
        >
            <Toolbar sx={{ gap: 2 }}>
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

                <Box
                    sx={{
                        flex: 1,
                        maxWidth: 520,
                        ml: { xs: 0, lg: 0 },
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        bgcolor: "background.default",
                        border: 1,
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <SearchIcon fontSize="small" />
                    <InputBase
                        placeholder="Buscar..."
                        sx={{ flex: 1 }}
                    />
                </Box>

                <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.5 }}>
                    {userName && (
                        <Typography
                            variant="body2"
                            sx={{
                                display: { xs: 'none', md: 'block' },
                                fontWeight: 500,
                                color: '#1e293b'
                            }}
                        >
                            {userName}
                        </Typography>
                    )}

                    <IconButton
                        ref={anchorRef}
                        size="large"
                        onClick={handleToggle}
                        sx={{ border: '1px solid transparent' }}
                    >
                        <Badge
                            color="error"
                            badgeContent={unreadCount || undefined}
                            variant={unreadCount ? "standard" : "dot"}
                        >
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>

                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#3b82f6' }}>
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                </Box>

                <Menu
                    id="notifications-menu"
                    anchorEl={anchorRef.current}
                    open={isOpen}
                    onClose={handleClose}
                    onClick={handleClose}
                    disableScrollLock={true}
                    slotProps={{
                        paper: {
                            elevation: 4,
                            sx: {
                                width: 360,
                                maxHeight: 400,
                                mt: 1.5,
                                overflow: 'visible',
                                '&:before': {
                                    content: '""',
                                    display: 'block',
                                    position: 'absolute',
                                    top: 0,
                                    right: 14,
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
                    <Box sx={{ px: 2, pt: 1, pb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Notificaciones ({unreadCount})
                        </Typography>
                    </Box>
                    <Divider />

                    {displayedNotifications.length > 0 ? (
                        displayedNotifications.map((n) => (
                            <MenuItem key={n.id} onClick={handleClose}>
                                <ListItemText
                                    primary={n.mensaje}
                                    secondary={n.created_at}
                                />
                            </MenuItem>
                        ))
                    ) : (
                        <MenuItem disabled>
                            <ListItemText primary="No hay notificaciones nuevas" />
                        </MenuItem>
                    )}

                    {unreadCount > 8 && (
                        <Box>
                            <Divider />
                            <MenuItem sx={{ justifyContent: "center" }}>
                                <Typography variant="body2" color="primary">
                                    Ver todas las notificaciones ({unreadCount})
                                </Typography>
                            </MenuItem>
                        </Box>
                    )}
                </Menu>
            </Toolbar>
        </AppBar>
    );
};
import React, { useEffect, useState } from 'react';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Typography, Avatar, useMediaQuery, useTheme, Snackbar, Alert, Toolbar
} from '@mui/material';
import {
    Home as HomeIcon, Videocam as VideocamIcon, Warning as WarningIcon,
    History as HistoryIcon, Logout as LogoutIcon, Report, AdminPanelSettings
} from '@mui/icons-material';
// 1. IMPORTAMOS OUTLET Y USELOCATION
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth/infra/useAuth';
import type { NotificationData } from '../../../contexts/clips/types/NotificationTypes';
import { useNotificationStream } from '../../hooks/useNotificationStream';
import { useAlertSound } from '../../hooks/useAlarmSound';

import { TopBar } from './TopBar';

const initialState = {
    user: { id: '1', name: '', avatarUrl: '', role: 'admin' },
    ui: { sidebarOpen: false } // Quitamos currentRoute del state, usaremos location
};

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 72;

export type AppShellProps = {};

export const AppShell: React.FC<AppShellProps> = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    const { logout, isAdmin } = useAuth();
    const [state, setState] = useState(initialState);
    const [snack, setSnack] = useState<NotificationData | null>(null);

    const navigate = useNavigate();
    const location = useLocation(); // Hook para saber dónde estamos

    const destinatario = `usuario:${state.user.id}`;
    const { latest } = useNotificationStream(destinatario);
    const { playAlert } = useAlertSound();

    useEffect(() => {
        const user_names = localStorage.getItem("user_names")
        if (user_names) {
            setState(prev => ({ ...prev, user: { ...prev.user, name: user_names } }))
        }
    }, [])

    useEffect(() => {
        if (latest) { setSnack(latest); }
        playAlert();
    }, [latest]);

    const getPageTitle = (pathname: string) => {
        if (pathname === '/') return 'Dashboard';
        if (pathname.startsWith('/cameras')) return 'Cámaras';
        if (pathname.startsWith('/alerts')) return 'Alertas';
        if (pathname.startsWith('/reports')) return 'Reportes';
        if (pathname.startsWith('/history')) return 'Historial';
        if (pathname.startsWith('/admin')) return 'Admin Workers';
        return 'SecureCam';
    };

    const toggleSidebar = () => {
        setState(prev => ({ ...prev, ui: { ...prev.ui, sidebarOpen: !prev.ui.sidebarOpen } }));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    const workerMenuItems = [
        { id: '/', icon: <HomeIcon />, label: 'Dashboard' },
        { id: '/cameras', icon: <VideocamIcon />, label: 'Cámaras' },
        { id: '/alerts', icon: <WarningIcon />, label: 'Alertas' },
        { id: '/history', icon: <HistoryIcon />, label: 'Historial' },
        { id: '/reports', icon: <Report />, label: 'Reportes' }
    ];

    const adminMenuItems = [
        { id: '/', icon: <HomeIcon />, label: 'Dashboard' },
        { id: '/cameras', icon: <VideocamIcon />, label: 'Cámaras' },
        { id: '/alerts', icon: <WarningIcon />, label: 'Alertas' },
        { id: '/history', icon: <HistoryIcon />, label: 'Historial' },
        { id: '/reports', icon: <Report />, label: 'Reportes' },
        { id: '/admin/workers', icon: <AdminPanelSettings />, label: 'Workers' }
    ];

    const menuItems = isAdmin ? adminMenuItems : workerMenuItems;

    const SidebarContent = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#1e293b' }}>
            <Box sx={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #334155' }}>
                <Avatar sx={{ bgcolor: '#3b82f6', width: 40, height: 40 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>S</Typography>
                </Avatar>
            </Box>
            <List sx={{ flex: 1, px: isMobile ? 1 : 0, py: 2 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.id} disablePadding>
                        <ListItemButton
                            // Usamos location.pathname para saber si está activo
                            selected={location.pathname === item.id} 
                            onClick={() => navigate(item.id)}
                            sx={{
                                justifyContent: isMobile ? 'flex-start' : 'center',
                                px: isMobile ? 3 : 0, py: 2, color: '#94a3b8', position: 'relative',
                                '&:hover': { bgcolor: '#334155', color: 'white' },
                                '&.Mui-selected': {
                                    bgcolor: '#334155', color: 'white', '&:hover': { bgcolor: '#334155' },
                                    '&::before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: '#3b82f6' }
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit', minWidth: isMobile ? 40 : 'auto', justifyContent: 'center' }}>
                                {item.icon}
                            </ListItemIcon>
                            {isMobile && <ListItemText primary={item.label} />}
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <ListItem disablePadding sx={{ mb: 2 }}>
                <ListItemButton onClick={handleLogout} sx={{ justifyContent: isMobile ? 'flex-start' : 'center', px: isMobile ? 3 : 0, py: 2, color: '#94a3b8', '&:hover': { bgcolor: '#334155', color: 'white' } }}>
                    <ListItemIcon sx={{ color: 'inherit', minWidth: isMobile ? 40 : 'auto', justifyContent: 'center' }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    {isMobile && <ListItemText primary="Cerrar sesión" />}
                </ListItemButton>
            </ListItem>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
            <TopBar
                title={getPageTitle(location.pathname)} // Título dinámico
                userName={state.user.name}
                onSidebarToggle={toggleSidebar}
            />
            <Box component="nav" sx={{ width: { lg: DRAWER_WIDTH_COLLAPSED }, flexShrink: { lg: 0 } }}>
                <Drawer
                    variant={isMobile ? 'temporary' : 'permanent'}
                    open={isMobile ? state.ui.sidebarOpen : true}
                    onClose={toggleSidebar}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: isMobile ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
                            boxSizing: 'border-box',
                            borderRight: '1px solid #334155',
                            height: '100%',
                        },
                    }}
                >
                    <SidebarContent />
                </Drawer>
            </Box>
            <Box sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Toolbar />
                {/* 4. AQUI RENDERIZAMOS LAS PAGINAS HIJAS */}
                <Outlet />
            </Box>
            <Snackbar open={!!snack} autoHideDuration={6000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={() => setSnack(null)} severity="warning" variant="filled" sx={{ width: '100%' }}>
                    {snack?.mensaje}
                </Alert>
            </Snackbar>
        </Box>
    );
}
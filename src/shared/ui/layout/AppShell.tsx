import React, { useState } from 'react';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Typography,
    Avatar,
    Badge,
    TextField,
    InputAdornment,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Home as HomeIcon,
    Videocam as VideocamIcon,
    Warning as WarningIcon,
    History as HistoryIcon,
    Logout as LogoutIcon,
    Notifications as NotificationsIcon,
    Search as SearchIcon,
    CalendarToday as CalendarIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import type { NavItem } from '../../types/types';
import { useNavigate } from 'react-router-dom';

const initialState = {
    user: {
        id: '1',
        name: 'Zárate Jose',
        avatarUrl: '',
        role: 'admin'
    },
    ui: {
        sidebarOpen: false,
        dateRange: {
            from: 'Nov 16, 2020',
            to: 'Dec 16, 2020'
        },
        search: '',
        currentRoute: '/'
    }
};

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 72;

export type AppShellProps = {
    navItems: NavItem[];
    headerTitle?: string;
    children?: React.ReactNode;
    drawerWidth?: number;
    logo?: React.ReactNode;
};

export const AppShell: React.FC<AppShellProps> = ({
    children
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    const [state, setState] = useState(initialState);
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setState(prev => ({
            ...prev,
            ui: { ...prev.ui, sidebarOpen: !prev.ui.sidebarOpen }
        }));
    };

    const setRoute = (route: string) => {
        setState(prev => ({
            ...prev,
            ui: { ...prev.ui, currentRoute: route, sidebarOpen: false }
        }));
        navigate(route)
    };

    const menuItems = [
        { id: '/', icon: <HomeIcon />, label: 'Dashboard' },
        { id: '/cameras', icon: <VideocamIcon />, label: 'Cámaras' },
        { id: '/alerts', icon: <WarningIcon />, label: 'Alertas' },
        { id: '/history', icon: <HistoryIcon />, label: 'Historial' }
    ];

    // Sidebar Component
    const SidebarContent = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#1e293b' }}>
            {/* Logo */}
            <Box sx={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #334155'
            }}>
                <Avatar sx={{ bgcolor: '#3b82f6', width: 40, height: 40 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>S</Typography>
                </Avatar>
            </Box>

            {/* Menu */}
            <List sx={{ flex: 1, px: isMobile ? 1 : 0, py: 2 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.id} disablePadding>
                        <ListItemButton
                            selected={state.ui.currentRoute === item.id}
                            onClick={() => setRoute(item.id)}
                            sx={{
                                justifyContent: isMobile ? 'flex-start' : 'center',
                                px: isMobile ? 3 : 0,
                                py: 2,
                                color: '#94a3b8',
                                position: 'relative',
                                '&:hover': {
                                    bgcolor: '#334155',
                                    color: 'white'
                                },
                                '&.Mui-selected': {
                                    bgcolor: '#334155',
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: '#334155'
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: 4,
                                        bgcolor: '#3b82f6'
                                    }
                                }
                            }}
                        >
                            <ListItemIcon sx={{
                                color: 'inherit',
                                minWidth: isMobile ? 40 : 'auto',
                                justifyContent: 'center'
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            {isMobile && <ListItemText primary={item.label} />}
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            {/* Logout */}
            <ListItem disablePadding sx={{ mb: 2 }}>
                <ListItemButton
                    sx={{
                        justifyContent: isMobile ? 'flex-start' : 'center',
                        px: isMobile ? 3 : 0,
                        py: 2,
                        color: '#94a3b8',
                        '&:hover': {
                            bgcolor: '#334155',
                            color: 'white'
                        }
                    }}
                >
                    <ListItemIcon sx={{
                        color: 'inherit',
                        minWidth: isMobile ? 40 : 'auto',
                        justifyContent: 'center'
                    }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    {isMobile && <ListItemText primary="Cerrar sesión" />}
                </ListItemButton>
            </ListItem>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
            {/* Sidebar */}
            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? state.ui.sidebarOpen : true}
                onClose={toggleSidebar}
                sx={{
                    width: isMobile ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: isMobile ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
                        boxSizing: 'border-box',
                        border: 'none'
                    },
                }}
            >
                <SidebarContent />
            </Drawer>

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* AppBar */}
                <AppBar
                    position="sticky"
                    elevation={1}
                    sx={{
                        bgcolor: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%)',
                        background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%)',
                        borderBottom: '1px solid #cbd5e1'
                    }}
                >
                    <Toolbar>
                        {isMobile && (
                            <IconButton
                                edge="start"
                                onClick={toggleSidebar}
                                sx={{ mr: 2, color: '#475569' }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}

                        <TextField
                            placeholder="Buscar cámaras, alertas, casos..."
                            variant="outlined"
                            size="small"
                            value={state.ui.search}
                            onChange={(e) => setState(prev => ({
                                ...prev,
                                ui: { ...prev.ui, search: e.target.value }
                            }))}
                            sx={{
                                maxWidth: 400,
                                flexGrow: 1,
                                bgcolor: 'white',
                                borderRadius: 1,
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#cbd5e1' }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#94a3b8' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box sx={{ flexGrow: 1 }} />

                        <IconButton sx={{ color: '#475569' }}>
                            <Badge badgeContent={4} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>


                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                            <Avatar sx={{ bgcolor: '#3b82f6', width: 36, height: 36 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>ZJ</Typography>
                            </Avatar>
                            <Typography
                                variant="body2"
                                sx={{
                                    display: { xs: 'none', md: 'block' },
                                    fontWeight: 500,
                                    color: '#1e293b'
                                }}
                            >
                                {state.user.name}
                            </Typography>
                        </Box>
                    </Toolbar>
                </AppBar>
                { children }
            </Box>
        </Box>
    );
}
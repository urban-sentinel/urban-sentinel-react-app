import { AppShell } from "../../shared/ui/layout/AppShell";
import { createBrowserRouter } from "react-router-dom";

import type { NavItem } from "../../shared/types/types";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VideocamIcon from "@mui/icons-material/Videocam";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HistoryIcon from "@mui/icons-material/History";
import { Box, Typography } from "@mui/material";
import { DashboardPage } from "../../contexts/dashboard/ui/DashboardPage";
import { CamerasPage } from "../../contexts/cameras/ui/CamerasPage";
import { ClipsPage } from "../../contexts/clips/ui/ClipsPage";
import { LoginPage } from "../../contexts/auth/ui/LoginPage";
import { ValidationPage } from "../../contexts/auth/ui/ValidationPage";
import { AdminRoute, PrivateRoute, PublicRoute } from "./Guards";
import { AdminUserPage } from "../../contexts/admin/ui/AdminUserPage";

function BlankPage({ title }: { title: string }) {
    return (
        <Box sx={{ display: "grid", placeItems: "center", height: 360 }}>
            <Typography variant="h5" color="text.secondary">{title}</Typography>
        </Box>
    );
}

const navItems: NavItem[] = [
    { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
    { label: "Cámaras", path: "/cameras", icon: <VideocamIcon /> },
    { label: "Alertas", path: "/alerts", icon: <NotificationsIcon /> },
    { label: "Reportes", path: "/reports", icon: <AssessmentIcon /> },
    { label: "Historial", path: "/history", icon: <HistoryIcon /> },
];

export const browserRouter = createBrowserRouter([
    {
        path: "/login",
        element: (
            <PublicRoute>
                <LoginPage />
            </PublicRoute>
        ),
    },
    {
        path: "/validation",
        element: (
            <PublicRoute>
                <ValidationPage />
            </PublicRoute>
        ),
    },
    {
        path: "*",
        element: (
            <PublicRoute>
                <LoginPage />
            </PublicRoute>
        ),
    },

    // RUTAS PRIVADAS (si NO está logueado => redirige a /login)
    {
        path: "/",
        element: (
            <PrivateRoute>
                <AppShell navItems={navItems}>
                    <DashboardPage />
                </AppShell>
            </PrivateRoute>
        ),
    },
    {
        path: "/cameras",
        element: (
            <PrivateRoute>
                <AppShell navItems={navItems} headerTitle="Cámaras">
                    <CamerasPage />
                </AppShell>
            </PrivateRoute>
        ),
    },
    {
        path: "/alerts",
        element: (
            <PrivateRoute>
                <AppShell navItems={navItems} headerTitle="Alertas">
                    <BlankPage title="Alertas" />
                </AppShell>
            </PrivateRoute>
        ),
    },
    {
        path: "/reports",
        element: (
            <PrivateRoute>
                <AppShell navItems={navItems} headerTitle="Reportes">
                    <BlankPage title="Reportes" />
                </AppShell>
            </PrivateRoute>
        ),
    },
    {
        path: "/history",
        element: (
            <PrivateRoute>
                <AppShell navItems={navItems} headerTitle="Historial">
                    <ClipsPage />
                </AppShell>
            </PrivateRoute>
        ),
    },
    {
        path: "/admin/workers",
        element: (
            <AdminRoute>
                <AppShell navItems={navItems} headerTitle="Admin Workers">
                    <AdminUserPage />
                </AppShell>
            </AdminRoute>
        ),
    }
]);

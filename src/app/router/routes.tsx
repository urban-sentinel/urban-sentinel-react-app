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
        element: <LoginPage />,
    },
    {
        path: "/validation",
        element: <ValidationPage />, // o <ValidationPage />
    },
    {
        path: "/",
        element: (
            <AppShell navItems={navItems}>
                <DashboardPage />
            </AppShell>
        ),
    },
    {
        path: "/cameras",
        element: (
            <AppShell navItems={navItems} headerTitle="Cámaras">
                <CamerasPage />
            </AppShell>
        ),
    },
    {
        path: "/alerts",
        element: (
            <AppShell navItems={navItems} headerTitle="Alertas">
                <BlankPage title="Alertas" />
            </AppShell>
        ),
    },
    {
        path: "/reports",
        element: (
            <AppShell navItems={navItems} headerTitle="Reportes">
                <BlankPage title="Reportes" />
            </AppShell>
        ),
    },
    {
        path: "/history",
        element: (
            <AppShell navItems={navItems} headerTitle="Historial">
                <ClipsPage />
            </AppShell>
        ),
    },
]);
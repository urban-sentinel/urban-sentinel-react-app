import { AppShell } from "../../shared/ui/layout/AppShell";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";

// Páginas
import { DashboardPage } from "../../contexts/dashboard/ui/DashboardPage";
import { CamerasPage } from "../../contexts/cameras/ui/CamerasPage";
import { ClipsPage } from "../../contexts/clips/ui/ClipsPage";
import { LoginPage } from "../../contexts/auth/ui/LoginPage";
import { ValidationPage } from "../../contexts/auth/ui/ValidationPage";
import { AdminUserPage } from "../../contexts/admin/ui/AdminUserPage";
import { ChangePasswordPage } from "../../contexts/auth/ui/ChangePasswordPage";
import ResetPasswordPage from "../../contexts/auth/ui/ResetPasswordPage";
import { ReportsPage } from "../../contexts/reports/ui/ReportPage";

// Guards
import { AdminRoute, PrivateRoute, PublicRoute } from "./guards";

function BlankPage({ title }: { title: string }) {
    return (
        <Box sx={{ display: "grid", placeItems: "center", height: 360 }}>
            <Typography variant="h5" color="text.secondary">{title}</Typography>
        </Box>
    );
}

export const browserRouter = createBrowserRouter([
    // --- RUTAS PÚBLICAS ---
    {
        path: "/login",
        element: <PublicRoute><LoginPage /></PublicRoute>,
    },
    {
        path: "/validation",
        element: <PublicRoute><ValidationPage /></PublicRoute>,
    },
    {
        path: "/change-password",
        element: <PublicRoute><ChangePasswordPage /></PublicRoute>,
    },
    {
        path: "/reset-password",
        element: <PublicRoute><ResetPasswordPage /></PublicRoute>,
    },

    // --- RUTAS PRIVADAS (LAYOUT PERSISTENTE) ---
    {
        // El AppShell se monta UNA VEZ aquí y no se destruye al navegar entre hijos
        element: (
            <PrivateRoute>
                <AppShell />
            </PrivateRoute>
        ),
        // Todas estas rutas se renderizan donde pusimos el <Outlet /> en AppShell
        children: [
            {
                path: "/",
                element: <DashboardPage />,
            },
            {
                path: "/cameras",
                element: <CamerasPage />,
            },
            {
                path: "/alerts",
                element: <BlankPage title="Alertas" />,
            },
            {
                path: "/history",
                element: <ClipsPage />,
            },
            {
                path: "/reports",
                element: (
                    <AdminRoute>
                        <ReportsPage />
                    </AdminRoute>
                ),
            },
            {
                path: "/admin/workers",
                // Protegemos SOLO esta página específica
                element: (
                    <AdminRoute>
                        <AdminUserPage />
                    </AdminRoute>
                ),
            }
        ]
    },

    // --- FALLBACK ---
    {
        path: "*",
        element: <Navigate to="/login" replace />,
    },
]);
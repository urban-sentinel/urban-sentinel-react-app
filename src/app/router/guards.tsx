// src/router/guards.tsx
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../contexts/auth/infra/useAuth"; // ajusta la ruta

type GuardProps = {
    children: ReactNode;
};

export const PrivateRoute = ({ children }: GuardProps) => {
    const { isAuthenticated, loading } = useAuth(); // adapta a tu hook

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!isAuthenticated) {
        // si NO está logueado => siempre al login
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export const PublicRoute = ({ children }: GuardProps) => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        // si ya está logueado => no tiene sentido ver login/validation
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export const RoleRoute = ({ children }: GuardProps) => {
    const { loading, isAdmin } = useAuth();

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!isAdmin) {
        // está logueado pero NO tiene rol permitido
        return <Navigate to="/" replace />; // o a una página 403
    }

    return <>{children}</>;
};

export const AdminRoute = ({ children }: GuardProps) => (
    <RoleRoute>{children}</RoleRoute>
);
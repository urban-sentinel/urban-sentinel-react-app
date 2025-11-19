import React, { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";

type TokenStatus = "checking" | "valid" | "invalid";

const ChangePasswordPage: React.FC = () => {
    // -------- NUEVO: leer token de la URL y estados de validación --------
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [tokenStatus, setTokenStatus] = useState<TokenStatus>("checking");

    useEffect(() => {
        const validateToken = async () => {
            // Si no hay token en la URL, lo consideramos inválido
            if (!token) {
                setTokenStatus("invalid");
                return;
            }

            try {
                const res = await fetch(
                    `http://localhost:8000/api/auth/reset-password/validate?token=${encodeURIComponent(
                        token
                    )}`
                );
                if (res.ok) {
                    setTokenStatus("valid");
                } else {
                    setTokenStatus("invalid");
                }
            } catch {
                setTokenStatus("invalid");
            }
        };

        validateToken();
    }, [token]);
    // --------------------------------------------------------------------

    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!email) {
            setErrorMsg("Ingresa tu correo electrónico.");
            return;
        }

        if (!currentPassword) {
            setErrorMsg("Ingresa tu contraseña actual.");
            return;
        }

        if (newPassword.length < 8) {
            setErrorMsg("La nueva contraseña debe tener al menos 8 caracteres.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setErrorMsg("La nueva contraseña y su confirmación no coinciden.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(
                "http://localhost:8000/api/auth/change-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        current_password: currentPassword,
                        new_password: newPassword,
                    }),
                }
            );

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(
                    data.detail || "No se pudo cambiar la contraseña."
                );
            }

            setSuccessMsg("Contraseña actualizada correctamente ✅");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (err: any) {
            setErrorMsg(err.message || "Error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    // -------- NUEVO: render según estado del token --------

    // Mientras se valida el token
    if (tokenStatus === "checking") {
        return (
            <Box
                minHeight="100vh"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <CircularProgress />
            </Box>
        );
    }

    // Token inválido o expirado
    if (tokenStatus === "invalid") {
        return (
            <Box
                minHeight="100vh"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Paper sx={{ p: 4, maxWidth: 420, width: "100%" }}>
                    <Typography variant="h6" gutterBottom>
                        Enlace no válido
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        El enlace de recuperación es inválido o ha expirado. Solicita uno
                        nuevo desde la pantalla de inicio de sesión.
                    </Typography>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate("/change-password")}
                    >
                        Volver a recuperar contraseña
                    </Button>
                </Paper>
            </Box>
        );
    }

    // ------------------------------------------------------

    // Token válido → se muestra tu formulario original tal cual
    return (
        <Box
            minHeight="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Paper sx={{ p: 4, maxWidth: 420, width: "100%" }}>
                <Typography variant="h6" gutterBottom>
                    Cambiar contraseña
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Ingresa tu correo, tu contraseña actual y la nueva contraseña.
                </Typography>

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Correo electrónico"
                        type="email"
                        sx={{ mb: 2 }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <TextField
                        fullWidth
                        label="Contraseña actual"
                        type="password"
                        sx={{ mb: 2 }}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />

                    <TextField
                        fullWidth
                        label="Nueva contraseña"
                        type="password"
                        sx={{ mb: 2 }}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />

                    <TextField
                        fullWidth
                        label="Confirmar nueva contraseña"
                        type="password"
                        sx={{ mb: 2 }}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />

                    {errorMsg && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errorMsg}
                        </Alert>
                    )}

                    {successMsg && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {successMsg}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                    >
                        {loading ? "Guardando..." : "Cambiar contraseña"}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default ChangePasswordPage;

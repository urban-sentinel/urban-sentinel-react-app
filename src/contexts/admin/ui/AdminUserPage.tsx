import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    Chip,
    Typography,
    Avatar,
    Box,
    Tooltip
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAuth } from '../../auth/infra/useAuth';
import type { UserData } from '../../auth/types/AuthTypes';

export const AdminUserPage = () => {

    const { getAllUsers, deleteUser } = useAuth();

    const [users, setUsers] = useState<UserData[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);


    // Función para abrir el diálogo de confirmación
    const handleDeleteClick = (id: number) => {
        setSelectedUserId(id);
        setOpenDialog(true);
    };

    // Función para cerrar el diálogo
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedUserId(null);
    };

    // Función que ejecuta la eliminación real
    const handleConfirmDelete = () => {
        if (selectedUserId !== null) {
            setUsers((prevUsers) => prevUsers.filter((user) => user.id_usuario !== selectedUserId));
            console.log(`Usuario con ID ${selectedUserId} eliminado.`);
        }
        deleteUser(selectedUserId!);
        handleCloseDialog();
    };

    // Utilidad para color del Chip según el rol
    const getRoleColor = (role: string) => {
        return role === 'ADMIN' ? 'primary' : 'default';
    };

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await getAllUsers();
            setUsers(data ?? []);   // 👈 esto está OK
        };

        fetchUsers();
    }, [getAllUsers]);


    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: '#333' }}>
                Gestión de Usuarios
            </Typography>

            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table sx={{ minWidth: 650 }} aria-label="tabla de usuarios">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Teléfono</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">Rol</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow
                                key={user.id_usuario}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#fafafa' } }}
                            >
                                <TableCell component="th" scope="row">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: user.rol === 'ADMIN' ? 'primary.main' : 'secondary.main' }}>
                                            {user.nombre.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {user.nombre} {user.apellido}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.phone}</TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={user.rol}
                                        color={getRoleColor(user.rol)}
                                        size="small"
                                        variant={user.rol === 'ADMIN' ? 'filled' : 'outlined'}
                                        sx={{ fontWeight: 500, minWidth: 80 }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Eliminar usuario">
                                        <IconButton
                                            onClick={() => handleDeleteClick(user.id_usuario)}
                                            color="error"
                                            size="small"
                                        >
                                            <DeleteOutlineIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}

                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No hay usuarios registrados
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Diálogo de Confirmación */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"¿Estás seguro de eliminar este usuario?"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Esta acción eliminará al usuario de la lista permanentemente. No podrás deshacer esta acción.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseDialog} color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
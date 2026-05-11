import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    FormControl, Typography,
    Stack, Box
} from '@mui/material';
import { Phone, Person } from '@mui/icons-material';
import type { CreateOficinaRequest } from '../types/OficinaTypes';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateOficinaRequest) => void;
}

const initialFormState: CreateOficinaRequest = {
    nombre_oficina: '',
    direccion: '',
    ciudad: '',
    responsable: '',
    telefono_contacto: ''
};

export const CreateOficinaDialog = ({ open, onClose, onSubmit }: Props) => {
    const [form, setForm] = useState<CreateOficinaRequest>(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setForm(initialFormState);
            setErrors({});
        }
    }, [open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name as string]: value }));
    };

    const validate = (field: string, value: any): string => {
        switch (field) {
            case 'nombre_oficina': 
                return !value.trim() ? 'El nombre de la oficina es obligatorio' : '';
            case 'direccion': 
                return !value.trim() ? 'La dirección es obligatoria' : '';
            case 'ciudad': 
                return !value.trim() ? 'La ciudad es obligatoria' : '';
            case 'responsable': 
                return !value.trim() ? 'El nombre del responsable es obligatorio' : '';
            case 'telefono_contacto': {
                if (!value.trim()) return 'El teléfono es obligatorio';
                return !/^[0-9\s\-\+\(\)]{7,}$/.test(value) ? 'Ingresa un teléfono válido' : '';
            }
            default: 
                return '';
        }
    };

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        Object.keys(form).forEach(key => {
            const error = validate(key, (form as any)[key]);
            if (error) { 
                newErrors[key] = error; 
                isValid = false; 
            }
        });

        setErrors(newErrors);

        if (isValid) {
            onSubmit({
                nombre_oficina: form.nombre_oficina.trim(),
                direccion: form.direccion.trim(),
                ciudad: form.ciudad.trim(),
                responsable: form.responsable.trim(),
                telefono_contacto: form.telefono_contacto.trim()
            });
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
                Registrar Nueva Oficina
            </DialogTitle>

            <DialogContent dividers>
                {/* USAMOS STACK:
                    spacing={2} -> Espacio vertical entre cada bloque
                */}
                <Stack spacing={3} sx={{ mt: 1 }}>

                    {/* BLOQUE 1: NOMBRE Y CIUDAD (En fila) */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                            fullWidth
                            label="Nombre de la Oficina"
                            name="nombre_oficina"
                            value={form.nombre_oficina}
                            onChange={handleChange}
                            error={!!errors.nombre_oficina}
                            helperText={errors.nombre_oficina}
                            placeholder="Ej: Oficina Lima Centro"
                        />
                        <TextField
                            fullWidth
                            label="Ciudad"
                            name="ciudad"
                            value={form.ciudad}
                            onChange={handleChange}
                            error={!!errors.ciudad}
                            helperText={errors.ciudad}
                            placeholder="Ej: Lima"
                        />
                    </Stack>

                    {/* BLOQUE 2: DIRECCIÓN */}
                    <TextField
                        fullWidth
                        label="Dirección Física"
                        name="direccion"
                        value={form.direccion}
                        onChange={handleChange}
                        error={!!errors.direccion}
                        helperText={errors.direccion}
                        placeholder="Ej: Av. Principal 123, Piso 4"
                        multiline
                        rows={2}
                    />

                    {/* BLOQUE 3: RESPONSABLE Y TELÉFONO (En fila) */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                            fullWidth
                            label="Responsable"
                            name="responsable"
                            value={form.responsable}
                            onChange={handleChange}
                            error={!!errors.responsable}
                            helperText={errors.responsable}
                            placeholder="Ej: Juan Pérez"
                            InputProps={{
                                startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Teléfono de Contacto"
                            name="telefono_contacto"
                            value={form.telefono_contacto}
                            onChange={handleChange}
                            error={!!errors.telefono_contacto}
                            helperText={errors.telefono_contacto}
                            placeholder="Ej: +51 1 2345678"
                            InputProps={{
                                startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
                            }}
                        />
                    </Stack>

                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} color="inherit" sx={{ mr: 1 }}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained">Registrar Oficina</Button>
            </DialogActions>
        </Dialog>
    );
};
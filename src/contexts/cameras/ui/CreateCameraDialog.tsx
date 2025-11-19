import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid, // Usamos la versión nueva de Grid
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Switch,
    FormControlLabel,
    Typography
} from '@mui/material';
import type { CreateCameraPayload, OficinaData } from '../types/ConexionTypes';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCameraPayload) => void;
    oficinas: OficinaData[]; // Recibimos las oficinas disponibles
}

const initialFormState = {
    id_oficina: '' as unknown as number, // Truco para el select vacio
    nombre_camara: '',
    ubicacion: '',
    rtsp_url: '',
    fps_sample: 30, // Valor por defecto razonable
    habilitada: true
};

export const CreateCameraDialog = ({ open, onClose, onSubmit, oficinas }: Props) => {
    const [form, setForm] = useState(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (open) {
            setForm(initialFormState);
            setErrors({});
            setTouched({});
        }
    }, [open]);

    // --- Validaciones ---
    const validate = (field: string, value: any): string => {
        switch (field) {
            case 'id_oficina':
                return !value ? 'Debes seleccionar una oficina' : '';
            case 'nombre_camara':
                return !value.trim() ? 'El nombre es obligatorio' : '';
            case 'rtsp_url':
                if (!value) return 'La URL es obligatoria';
                // Validación solicitada: ValueError: rtsp_url must start with rtsp:// or rtmp://
                const regex = /^(rtsp|rtmp):\/\//;
                return !regex.test(value) ? 'La URL debe comenzar con rtsp:// o rtmp://' : '';
            case 'fps_sample':
                // Validación solicitada: fps_sample must be > 0
                return value <= 0 ? 'Los FPS deben ser mayor a 0' : '';
            default:
                return '';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        const fieldName = name as string;

        setForm(prev => ({ ...prev, [fieldName]: value }));

        // Validar al escribir si ya fue tocado el campo
        if (touched[fieldName]) {
            setErrors(prev => ({ ...prev, [fieldName]: validate(fieldName, value) }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
    };

    const handleSubmit = () => {
        // 1. Validar todos los campos
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
        setTouched({
            id_oficina: true,
            nombre_camara: true,
            rtsp_url: true,
            fps_sample: true
        });

        if (isValid) {
            const payload: CreateCameraPayload = {
                id_oficina: Number(form.id_oficina),
                nombre_camara: form.nombre_camara,
                ubicacion: form.ubicacion,
                rtsp_url: form.rtsp_url,
                fps_sample: Number(form.fps_sample),
                habilitada: form.habilitada,
                modo_ingesta: 'SEGMENT',
                retention_minutes: 60
            };

            onSubmit(payload);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>
                Registrar Nueva Cámara
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3} sx={{ mt: 1 }}>

                    {/* 1. Selección de Oficina */}
                    <Grid size={{ xs: 12 }}>
                        <FormControl fullWidth error={!!errors.id_oficina}>
                            <InputLabel id="office-select-label">Oficina</InputLabel>
                            <Select
                                labelId="office-select-label"
                                name="id_oficina"
                                value={form.id_oficina}
                                label="Oficina"
                                onChange={(e) => handleChange(e as any)}
                                onBlur={() => setErrors(prev => ({ ...prev, id_oficina: validate('id_oficina', form.id_oficina) }))}
                            >
                                {oficinas.map((oficina) => (
                                    <MenuItem key={oficina.id_oficina} value={oficina.id_oficina}>
                                        {oficina.nombre_oficina} - {oficina.ciudad}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.id_oficina && <FormHelperText>{errors.id_oficina}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    {/* 2. Datos básicos */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Nombre de la Cámara"
                            name="nombre_camara"
                            value={form.nombre_camara}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!errors.nombre_camara}
                            helperText={errors.nombre_camara}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Ubicación (Referencia)"
                            name="ubicacion"
                            value={form.ubicacion}
                            onChange={handleChange}
                            placeholder="Ej: Pasillo Principal"
                        />
                    </Grid>

                    {/* 3. Configuración Técnica */}
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="URL de Transmisión (RTSP/RTMP)"
                            name="rtsp_url"
                            value={form.rtsp_url}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!errors.rtsp_url}
                            helperText={errors.rtsp_url || "Debe comenzar con rtsp:// o rtmp://"}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="FPS de Muestreo"
                            name="fps_sample"
                            value={form.fps_sample}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!errors.fps_sample}
                            helperText={errors.fps_sample}
                            slotProps={{ htmlInput: { min: 1 } }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            disabled
                            label="Modo de Ingesta"
                            value="SEGMENT"
                            helperText="Configuración fija del sistema"
                        />
                    </Grid>

                    {/* Habilitada Switch */}
                    <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.habilitada}
                                    onChange={(e) => setForm({ ...form, habilitada: e.target.checked })}
                                    color="primary"
                                />
                            }
                            label="Cámara Habilitada"
                        />
                    </Grid>

                    {/* Nota informativa sobre retención */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                            * La política de retención por defecto es de 60 minutos.
                        </Typography>
                    </Grid>

                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} color="inherit">
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Guardar Cámara
                </Button>
            </DialogActions>
        </Dialog>
    );
};
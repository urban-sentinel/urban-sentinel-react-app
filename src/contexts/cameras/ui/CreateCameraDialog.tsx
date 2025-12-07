import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    FormControl, InputLabel, Select, MenuItem, FormHelperText,
    Switch, FormControlLabel, Typography, ToggleButton, ToggleButtonGroup,
    Stack, Box
} from '@mui/material';
import { Videocam, CloudUpload } from '@mui/icons-material';
import type { CreateCameraPayload, OficinaData } from '../types/ConexionTypes';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCameraPayload) => void;
    oficinas: OficinaData[];
}

const initialFormState = {
    id_oficina: '' as unknown as number,
    nombre_camara: '',
    ubicacion: '',
    rtsp_url: '',
    source_type: 'rtsp',
    fps_sample: 30,
    habilitada: true
};

export const CreateCameraDialog = ({ open, onClose, onSubmit, oficinas }: Props) => {
    const [form, setForm] = useState(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setForm(initialFormState);
            setErrors({});
        }
    }, [open]);

    const handleSourceTypeChange = (_event: React.MouseEvent<HTMLElement>, newType: string | null) => {
        if (newType !== null) {
            setForm(prev => ({
                ...prev,
                source_type: newType,
                rtsp_url: newType === 'webcam' ? 'webcam' : ''
            }));
            setErrors(prev => ({ ...prev, rtsp_url: '' }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name as string]: value }));
    };

    const validate = (field: string, value: any): string => {
        switch (field) {
            case 'id_oficina': return !value ? 'Debes seleccionar una oficina' : '';
            case 'nombre_camara': return !value.trim() ? 'El nombre es obligatorio' : '';
            case 'rtsp_url':
                if (form.source_type === 'webcam') return '';
                if (!value) return 'La URL es obligatoria';
                return !/^(rtsp|rtmp):\/\//.test(value) ? 'Debe comenzar con rtsp:// o rtmp://' : '';
            case 'fps_sample': return value <= 0 ? 'FPS debe ser mayor a 0' : '';
            default: return '';
        }
    };

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;
        Object.keys(form).forEach(key => {
            if (key !== 'source_type') {
                const error = validate(key, (form as any)[key]);
                if (error) { newErrors[key] = error; isValid = false; }
            }
        });
        setErrors(newErrors);

        if (isValid) {
            onSubmit({
                id_oficina: Number(form.id_oficina),
                nombre_camara: form.nombre_camara,
                ubicacion: form.ubicacion,
                rtsp_url: form.rtsp_url,
                fps_sample: Number(form.fps_sample),
                habilitada: form.habilitada,
                modo_ingesta: 'SEGMENT',
                retention_minutes: 60
            });
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
                Registrar Nueva Cámara
            </DialogTitle>

            <DialogContent dividers>
                {/* USAMOS STACK:
                    spacing={2} -> Espacio vertical entre cada bloque
                */}
                <Stack spacing={3} sx={{ mt: 1 }}>
                    
                    {/* BLOQUE 1: FUENTE DE VIDEO */}
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Fuente de Video
                        </Typography>
                        <ToggleButtonGroup
                            value={form.source_type}
                            exclusive
                            onChange={handleSourceTypeChange}
                            fullWidth
                            color="primary"
                        >
                            <ToggleButton value="rtsp"><CloudUpload sx={{ mr: 1 }} /> RTSP / IP</ToggleButton>
                            <ToggleButton value="webcam"><Videocam sx={{ mr: 1 }} /> Webcam Local</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* BLOQUE 2: OFICINA */}
                    <FormControl fullWidth error={!!errors.id_oficina}>
                        <InputLabel>Oficina</InputLabel>
                        <Select
                            value={form.id_oficina}
                            label="Oficina"
                            name="id_oficina"
                            onChange={(e) => handleChange(e as any)}
                        >
                            {oficinas.map((of) => (
                                <MenuItem key={of.id_oficina} value={of.id_oficina}>
                                    {of.nombre_oficina} - {of.ciudad}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.id_oficina && <FormHelperText>{errors.id_oficina}</FormHelperText>}
                    </FormControl>

                    {/* BLOQUE 3: NOMBRE Y UBICACIÓN (En fila) */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                            fullWidth
                            label="Nombre de la cámara"
                            name="nombre_camara"
                            value={form.nombre_camara}
                            onChange={handleChange}
                            error={!!errors.nombre_camara}
                            helperText={errors.nombre_camara}
                        />
                        <TextField
                            fullWidth
                            label="Ubicación física"
                            name="ubicacion"
                            value={form.ubicacion}
                            onChange={handleChange}
                            placeholder="Ej: Pasillo"
                        />
                    </Stack>

                    {/* BLOQUE 4: URL */}
                    <TextField
                        fullWidth
                        label="URL de Transmisión"
                        name="rtsp_url"
                        value={form.source_type === 'webcam' ? 'Dispositivo Local (Webcam)' : form.rtsp_url}
                        disabled={form.source_type === 'webcam'}
                        onChange={handleChange}
                        error={!!errors.rtsp_url}
                        helperText={errors.rtsp_url || (form.source_type === 'rtsp' ? 'Ej: rtsp://user:pass@ip:port/stream' : '')}
                    />

                    {/* BLOQUE 5: FPS y SWITCH (En fila) */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        <TextField
                            fullWidth
                            type="number"
                            label="FPS de Muestreo"
                            name="fps_sample"
                            value={form.fps_sample}
                            onChange={handleChange}
                            inputProps={{ min: 1 }}
                        />
                        
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                            <FormControlLabel
                                control={
                                    <Switch 
                                        checked={form.habilitada} 
                                        onChange={(e) => setForm({ ...form, habilitada: e.target.checked })} 
                                    />
                                }
                                label={form.habilitada ? "Cámara Habilitada" : "Cámara Deshabilitada"}
                                labelPlacement="end"
                            />
                        </Box>
                    </Stack>

                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} color="inherit" sx={{ mr: 1 }}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained">Registrar Cámara</Button>
            </DialogActions>
        </Dialog>
    );
};
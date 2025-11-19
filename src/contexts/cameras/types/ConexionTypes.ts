export interface ConexionData {
    id: number;
    id_oficina: number;
    nombre_camara: string;
    ubicacion: string;
    rtsp_url: string;
    estado: string;
    ultimo_ping: string | null;
    modo_ingesta: string;
    fps_sample: number;
    habilitada: boolean;
    retention_minutes: number;
    created_at: string;
    updated_at: string | null;
}

export interface OficinaData {
    id_oficina: number;
    nombre_oficina: string;
    direccion: string;
    ciudad: string;
    responsable: string;
    telefono_contacto: string;
    fecha_registro: string;
}

export interface CreateCameraPayload {
    id_oficina: number;
    nombre_camara: string;
    ubicacion: string;
    rtsp_url: string;
    modo_ingesta: 'SEGMENT';
    fps_sample: number;
    habilitada: boolean;
    retention_minutes: number;
}
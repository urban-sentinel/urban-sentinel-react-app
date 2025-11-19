
export interface EventData {
    id_evento: number;
    id_conexion: number;
    id_clip: number;
    id_usuario: number;
    tipo_evento: string;
    confianza: string;
    t_inicio_ms: number;
    t_fin_ms: number;
    timestamp_evento: string;
    procesado: boolean;
    subclip_path: string;
    subclip_duracion_sec: number;
}

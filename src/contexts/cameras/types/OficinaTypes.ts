export interface OficinaData {
    id_oficina: number;
    nombre_oficina: string;
    direccion: string;
    ciudad: string;
    responsable: string;
    telefono_contacto: string;
    fecha_registro: string;
}

export interface CreateOficinaRequest {
    nombre_oficina: string;
    direccion: string;
    ciudad: string;
    responsable: string;
    telefono_contacto: string;
}


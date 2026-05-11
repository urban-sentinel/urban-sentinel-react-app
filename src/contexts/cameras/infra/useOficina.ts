import { useCallback, useState } from "react";
import { OficinaService } from "../services/OficinaService";
import { HttpClient } from "../../../app/services/httpClient";
import type { CreateOficinaRequest, OficinaData } from "../types/OficinaTypes";

const httpClient: HttpClient = new HttpClient();
const oficinaService = new OficinaService(httpClient);

export const useOficina = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAllOffices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await oficinaService.getAllConexions();
            if (!response) {
                throw new Error("No se pudieron obtener las conexiones");
            }
            return response;
        }
        catch (e: any) {
            setError(e.message || "Error desconocido");
        }
        finally {
            setLoading(false);
        }
    }, []);

    const createOficina = useCallback(async (data: CreateOficinaRequest) => {
        setLoading(true);
        setError(null);
        try {
            const response = await oficinaService.createOficina(data);
            if (!response) {
                throw new Error("No se pudo crear la oficina")
            }
            return response;
        }
        catch(e: any) {
            setError(e.message || "Error desconocido");
        }
        finally {
            setLoading(false);
        }
    }, [])

    return { getAllOffices, createOficina, loading, error };;
}

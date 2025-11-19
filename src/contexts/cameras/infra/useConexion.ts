import { useCallback, useState } from "react";
import { ConexionService } from "../services/ConexionService";
import { HttpClient } from "../../../app/services/httpClient";
import type { ConexionData, CreateCameraPayload } from "../types/ConexionTypes";

const httpClient: HttpClient = new HttpClient();
const conexionService = new ConexionService(httpClient);

export const useConexion = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAllConexions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await conexionService.getAllConexions();
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

    const createConexion = useCallback(async (data: CreateCameraPayload) => {
        setLoading(true);
        setError(null);
        try {
            const response = await conexionService.createConexion(data);
            if (!response) {
                throw new Error("No se pudo crear la conexión");
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

    const updateConexionEstado = useCallback(
        async (idConexion: number, activo: boolean): Promise<ConexionData | null> => {
            setLoading(true);
            setError(null);
            try {
                const response = await conexionService.updateEstado(idConexion, activo);
                if (!response) {
                    throw new Error("No se pudo actualizar el estado de la conexión");
                }
                return response;
            } catch (e: any) {
                setError(e.message || "Error desconocido");
                throw e;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const updateHabilitado = useCallback(
        async (idConexion: number, activo: boolean): Promise<ConexionData | null> => {
            setLoading(true);
            setError(null);
            try {
                const response = await conexionService.updateHabilitado(idConexion, activo);
                if (!response) {
                    throw new Error("No se pudo actualizar el estado de habilitación de la conexión");
                }
                return response;
            }
            catch (e: any) {
                setError(e.message || "Error desconocido");
                throw e;
            }
            finally {
                setLoading(false);
            }
        },
        []
    );

    return { updateConexionEstado, updateHabilitado, getAllConexions, createConexion, loading, error };;
}

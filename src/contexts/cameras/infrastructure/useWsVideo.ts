import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type UseWsVideoOptions = {
    cameraId: string;
    buildUrl?: (cameraId: string) => string;
    autoConnect?: boolean;
};

type WsMsgFrame = {
    type: 'frame';
    camera_id: string;
    jpeg_base64: string;
};

export function useWsVideo({ cameraId, buildUrl, autoConnect = false }: UseWsVideoOptions) {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<number | null>(null);
    const backoffRef = useRef(500); // ms (aumenta hasta 5s)

    const url = useMemo(
        () => (buildUrl ? buildUrl(cameraId) : `ws://127.0.0.1:8010/ws/frames/${cameraId}`),
        [buildUrl, cameraId]
    );

    const clearReconnectTimer = () => {
        if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    };

    const disconnect = useCallback(() => {
        clearReconnectTimer();
        const ws = wsRef.current;
        if (ws) {
            ws.onopen = ws.onclose = ws.onerror = ws.onmessage = null;
            try { ws.close(); } catch { }
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    const scheduleReconnect = useCallback(() => {
        if (!autoConnect) return;
        clearReconnectTimer();
        const delay = Math.min(backoffRef.current, 5000);
        reconnectTimerRef.current = window.setTimeout(() => {
            connect(); // eslint-disable-line @typescript-eslint/no-use-before-define
            backoffRef.current = Math.min(backoffRef.current * 2, 5000);
        }, delay);
    }, [autoConnect]);

    const connect = useCallback(() => {
        // No abras si ya hay uno en OPEN o CONNECTING
        const curr = wsRef.current;
        if (curr && (curr.readyState === WebSocket.OPEN || curr.readyState === WebSocket.CONNECTING)) return;

        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;
            setError(null);

            ws.onopen = () => {
                setIsConnected(true);
                backoffRef.current = 500; // reset backoff
            };

            ws.onmessage = (evt) => {
                try {
                    const data: WsMsgFrame = JSON.parse(evt.data);
                    if (data?.type === 'frame' && data?.jpeg_base64) {
                        setImgSrc(`data:image/jpeg;base64,${data.jpeg_base64}`);
                    }
                } catch {
                    // Ignorar paquetes no JSON
                }
            };

            ws.onerror = () => {
                setError('No se pudo conectar al stream.');
            };

            ws.onclose = () => {
                setIsConnected(false);
                wsRef.current = null;
                if (autoConnect) scheduleReconnect();
            };
        } catch (e) {
            setError('Error creando WebSocket');
            scheduleReconnect();
        }
    }, [url, autoConnect, scheduleReconnect]);

    // Conectar automáticamente SOLO cuando:
    // - autoConnect es true
    // - y no hay conexión activa
    useEffect(() => {
        if (autoConnect && !wsRef.current) {
            connect();
        }
        // No desconectes en cada re-render: cleanup SOLO al desmontar
        // o cuando cambie cameraId (debajo).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoConnect]);

    // Si cambia la cámara, cerramos y reabrimos
    useEffect(() => {
        if (!autoConnect) return;
        disconnect();
        connect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cameraId]);

    // Desmontaje: cerrar WS y timers
    useEffect(() => {
        return () => {
            disconnect();
            clearReconnectTimer();
        };
    }, [disconnect]);

    return { imgSrc, isConnected, error, connect, disconnect };
}

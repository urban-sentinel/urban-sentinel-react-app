import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type UseCameraStreamOptions = {
    cameraId: string;
    rtspUrl: string;
    buildUrl?: (cameraId: string) => string;
    autoConnect?: boolean;
};

export function useCameraStream({ cameraId, rtspUrl, buildUrl, autoConnect = false }: UseCameraStreamOptions) {
    // --- ESTADOS ---
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- REFS ---
    const wsRef = useRef<WebSocket | null>(null);       // Para recibir video (RTSP)
    const ingestWsRef = useRef<WebSocket | null>(null); // Para ENVIAR video (Webcam)
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null); // Ref opcional para UI

    const isWebcamMode = rtspUrl === 'webcam';

    // URL para RECIBIR video (Backend -> Front)
    const wsUrl = useMemo(
        () => (buildUrl ? buildUrl(cameraId) : `ws://127.0.0.1:8010/ws/frames/${cameraId}`),
        [buildUrl, cameraId]
    );

    // URL para ENVIAR video (Front -> Backend)
    const ingestUrl = `ws://127.0.0.1:8010/ws/ingest/${cameraId}`;

    // --- FUNCIÓN DE LIMPIEZA ---
    const disconnect = useCallback(() => {
        // 1. Cerrar WS de Recepción
        if (wsRef.current) {
            try { wsRef.current.close(); } catch (e) { console.warn(e); }
            wsRef.current = null;
        }

        // 2. Cerrar WS de Ingesta (Envío)
        if (ingestWsRef.current) {
            try { ingestWsRef.current.close(); } catch (e) { console.warn(e); }
            ingestWsRef.current = null;
        }

        // 3. Detener Webcam
        if (streamRef.current) {
            try { streamRef.current.getTracks().forEach(track => track.stop()); } catch (e) { console.warn(e); }
            streamRef.current = null;
        }

        // 4. Limpiar estados
        setIsConnected(false);
        setImgSrc(null);
        setActiveStream(null); 
    }, []);

    // --- FUNCIÓN DE CONEXIÓN ---
    const connect = useCallback(async () => {
        disconnect(); 
        setError(null);

        if (isWebcamMode) {
            // A) MODO WEBCAM: Obtener stream local
            try {
                // Solicitamos 15 FPS para equilibrar calidad y velocidad de llenado del buffer
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 640, height: 360, frameRate: 15 } 
                });
                
                streamRef.current = stream;
                setActiveStream(stream); // Esto dispara el useEffect de Ingesta
                setIsConnected(true);

            } catch (err) {
                console.error("Error webcam:", err);
                setError('Permiso denegado o webcam no encontrada.');
                setIsConnected(false);
            }
        } else {
            // B) MODO RTSP: Conectar WS para recibir frames del backend
            try {
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                ws.onopen = () => { setIsConnected(true); setError(null); };
                ws.onclose = () => setIsConnected(false);
                ws.onerror = () => { console.warn('Fallo conexión WS video'); setIsConnected(false); };
                ws.onmessage = (evt) => {
                    try {
                        const data = JSON.parse(evt.data);
                        if (data?.type === 'frame' && data?.jpeg_base64) {
                            setImgSrc(`data:image/jpeg;base64,${data.jpeg_base64}`);
                        }
                    } catch { }
                };
            } catch (e) {
                console.error(e);
                setError('Error interno al crear WebSocket');
            }
        }
    }, [isWebcamMode, wsUrl, disconnect]);

    // --- EFECTO 1: CICLO DE VIDA DE CONEXIÓN ---
    useEffect(() => {
        if (autoConnect) connect();
        return () => disconnect();
    }, [autoConnect, connect, disconnect, cameraId]);


    // --- EFECTO 2: LÓGICA DE INGESTA (ENVÍO DE FRAMES AL BACKEND) ---
    // Este efecto solo corre cuando tenemos un stream activo y estamos en modo webcam
    useEffect(() => {
        if (!isWebcamMode || !activeStream || !isConnected) return;

        console.log(`[Ingest] Iniciando envío de frames para ${cameraId}...`);
        
        // 1. Crear WebSocket de Ingesta
        const ws = new WebSocket(ingestUrl);
        ingestWsRef.current = ws;

        // 2. Elementos auxiliares en memoria (no en el DOM)
        const canvas = document.createElement('canvas');
        // willReadFrequently optimiza la lectura de píxeles
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Creamos un video oculto para leer los frames del stream
        const videoHidden = document.createElement('video');
        videoHidden.srcObject = activeStream;
        videoHidden.muted = true; // Necesario para autoplay
        videoHidden.play().catch(e => console.error("Error playing hidden video", e));

        let intervalId: number;

        ws.onopen = () => {
            console.log(`[Ingest] WS Conectado: ${ingestUrl}`);
            
            // 3. Intervalo de envío (66ms = ~15 FPS)
            // Esto ayuda a llenar el buffer de 32 frames del backend más rápido
            intervalId = window.setInterval(() => {
                if (ws.readyState === WebSocket.OPEN && ctx && videoHidden.readyState === videoHidden.HAVE_ENOUGH_DATA) {
                    
                    // Ajustar canvas al tamaño del video
                    canvas.width = videoHidden.videoWidth;
                    canvas.height = videoHidden.videoHeight;
                    
                    // Dibujar frame
                    ctx.drawImage(videoHidden, 0, 0);
                    
                    // Obtener Base64 (formato: "data:image/jpeg;base64,.....")
                    // Calidad 0.6 es suficiente para inferencia y ahorra ancho de banda
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
                    
                    // Quitar el prefijo para enviar solo la data raw
                    const base64Data = dataUrl.split(',')[1];
                    
                    // Enviar al backend
                    ws.send(JSON.stringify({ frame: base64Data }));
                }
            }, 66); 
        };

        ws.onerror = (e) => console.error("[Ingest] WS Error", e);

        // Cleanup del efecto de ingesta
        return () => {
            console.log(`[Ingest] Deteniendo envío para ${cameraId}`);
            clearInterval(intervalId);
            if (ws.readyState === WebSocket.OPEN) ws.close();
            videoHidden.pause();
            videoHidden.srcObject = null;
        };
    }, [isWebcamMode, activeStream, isConnected, ingestUrl, cameraId]);


    return { 
        imgSrc,       
        activeStream,
        isConnected, 
        error, 
        connect, 
        disconnect,
        isWebcamMode,
        videoRef // Ref opcional si se necesita en UI
    };
}
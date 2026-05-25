import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';

// --- CONFIGURACIÓN DE MediaMTX ---
// Cambia estos valores según tu entorno. No incluyas las credenciales en la URL
// para evitar que los navegadores modernos las bloqueen (CORS + deprecación de
// Basic Auth en URLs: https://developer.chrome.com/blog/deprecating-passwords-in-urls).
const MTX_HOST = 'localhost:8888';
const MTX_USER = 'admin';
const MTX_PASS = 'urban_pass';

// Construye la cabecera Authorization en Base64 para enviarla via XHR/fetch
const MTX_AUTH_HEADER = `Basic ${btoa(`${MTX_USER}:${MTX_PASS}`)}`;

type UseCameraStreamOptions = {
    cameraId: string;
    rtspUrl: string;
    /**
     * Sobreescribe la URL HLS por defecto.
     * La función recibe el cameraId y debe devolver la URL completa del .m3u8
     * SIN credenciales embebidas (se inyectan vía xhrSetup).
     * Ejemplo: (id) => `http://localhost:8888/${id}/index.m3u8`
     */
    buildUrl?: (cameraId: string) => string;
    autoConnect?: boolean;
};

export function useCameraStream({ cameraId, rtspUrl, buildUrl, autoConnect = false }: UseCameraStreamOptions) {
    // --- ESTADOS ---
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- REFS ---
    const hlsRef = useRef<Hls | null>(null);            // Instancia HLS
    const ingestWsRef = useRef<WebSocket | null>(null); // Para ENVIAR video (Webcam)
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null); // Ref para el <video> del DOM (HLS lo necesita)

    const isWebcamMode = rtspUrl === 'webcam';

    const hlsUrl = useMemo(() => {
        if (buildUrl) return buildUrl(cameraId);
        
        let streamPath = cameraId;
        console.log(`http://${MTX_HOST}/${streamPath}/index.m3u8`)
        return `http://${MTX_HOST}/${streamPath}/index.m3u8`;
    }, [buildUrl, cameraId, rtspUrl, isWebcamMode]);

    // URL para ENVIAR video (Front -> Backend), solo webcam
    const ingestUrl = `ws://127.0.0.1:8010/ws/ingest/${cameraId}`;

    // --- FUNCIÓN DE LIMPIEZA ---
    const disconnect = useCallback(() => {
        // 1. Destruir instancia HLS
        if (hlsRef.current) {
            try { hlsRef.current.destroy(); } catch (e) { console.warn(e); }
            hlsRef.current = null;
        }

        // 2. Limpiar el elemento <video> si existe
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.removeAttribute('src');
            videoRef.current.load();
        }

        // 3. Cerrar WS de Ingesta (Envío)
        if (ingestWsRef.current) {
            try { ingestWsRef.current.close(); } catch (e) { console.warn(e); }
            ingestWsRef.current = null;
        }

        // 4. Detener Webcam
        if (streamRef.current) {
            try { streamRef.current.getTracks().forEach(track => track.stop()); } catch (e) { console.warn(e); }
            streamRef.current = null;
        }

        // 5. Limpiar estados
        setIsConnected(false);
        setActiveStream(null);
    }, []);

    // --- FUNCIÓN DE CONEXIÓN ---
    const connect = useCallback(async () => {
        disconnect();
        setError(null);

        if (isWebcamMode) {
            // A) MODO WEBCAM: Obtener stream local y enviarlo al backend
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 360, frameRate: 15 },
                });

                streamRef.current = stream;
                setActiveStream(stream); // Dispara el useEffect de Ingesta
                setIsConnected(true);
            } catch (err) {
                console.error('Error webcam:', err);
                setError('Permiso denegado o webcam no encontrada.');
                setIsConnected(false);
            }
        } else {
            // B) MODO HLS: Reproducir el stream HLS del backend
            if (!videoRef.current) {
                setError('No se encontró el elemento <video> para HLS. Asigna videoRef a tu <video>.');
                return;
            }

            const video = videoRef.current;

            if (Hls.isSupported()) {
                // Navegadores que soportan HLS via hls.js (Chrome, Firefox, etc.)
                const hls = new Hls({
                    // Latencia baja: segmentos cortos y buffer reducido
                    liveSyncDurationCount: 2,
                    liveMaxLatencyDurationCount: 4,
                    lowLatencyMode: true,
                    backBufferLength: 0,
                    xhrSetup: (xhr, url) => {
                        xhr.setRequestHeader('Authorization', MTX_AUTH_HEADER);
                    }
                });

                hlsRef.current = hls;
                hls.loadSource(hlsUrl);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(e => console.warn('Autoplay bloqueado:', e));
                    setIsConnected(true);
                    setError(null);
                });

                hls.on(Hls.Events.ERROR, (_, data) => {
                    if (data.fatal) {
                        console.error('[HLS] Error fatal:', data);
                        setIsConnected(false);

                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                // Intentar recuperar la carga del manifest/segmentos
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                setError(`Error HLS: ${data.details}`);
                                hls.destroy();
                                hlsRef.current = null;
                                break;
                        }
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // ─── SAFARI: HLS nativo, no soporta hls.js ───────────────────────────
                // Safari soporta HLS directamente, pero no permite setRequestHeader
                // en <video src>. La solución es hacer un fetch() con el header Auth
                // para obtener el manifest y pasarlo como blob URL al <video>.
                // Los segmentos .ts los cargará Safari de forma nativa desde las URLs
                // absolutas del manifest, por lo que MediaMTX debe aceptarlos sin auth
                // o usarás un proxy. En la mayoría de setups locales esto funciona bien.
                try {
                    const manifestResponse = await fetch(hlsUrl, {
                        headers: { Authorization: MTX_AUTH_HEADER },
                    });

                    if (!manifestResponse.ok) {
                        throw new Error(`HTTP ${manifestResponse.status}`);
                    }

                    const manifestBlob = await manifestResponse.blob();
                    const blobUrl = URL.createObjectURL(manifestBlob);

                    video.src = blobUrl;
                    video.addEventListener('loadedmetadata', () => {
                        video.play().catch(e => console.warn('Autoplay bloqueado:', e));
                        setIsConnected(true);
                        setError(null);
                        // Liberar el blob URL una vez que el video empieza a cargarse
                        URL.revokeObjectURL(blobUrl);
                    }, { once: true });

                    video.addEventListener('error', () => {
                        setIsConnected(false);
                        setError('Error al reproducir el stream HLS en Safari.');
                        URL.revokeObjectURL(blobUrl);
                    }, { once: true });
                } catch (fetchErr) {
                    setError(`No se pudo obtener el manifest HLS en Safari: ${fetchErr}`);
                }
                // ─────────────────────────────────────────────────────────────────────
            } else {
                setError('Tu navegador no soporta HLS. Prueba con Chrome o Firefox.');
            }
        }
    }, [isWebcamMode, hlsUrl, disconnect]);

    // --- EFECTO 1: CICLO DE VIDA DE CONEXIÓN ---
    useEffect(() => {
        if (autoConnect) connect();
        return () => disconnect();
    }, [autoConnect, connect, disconnect, cameraId]);


    // --- EFECTO 2: LÓGICA DE INGESTA (ENVÍO DE FRAMES AL BACKEND) ---
    // Solo corre cuando hay un stream activo en modo webcam
    useEffect(() => {
        if (!isWebcamMode || !activeStream || !isConnected) return;

        console.log(`[Ingest] Iniciando envío de frames para ${cameraId}...`);

        // 1. Crear WebSocket de Ingesta
        const ws = new WebSocket(ingestUrl);
        ingestWsRef.current = ws;

        // 2. Elementos auxiliares en memoria (no en el DOM)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Video oculto para leer frames del stream de webcam
        const videoHidden = document.createElement('video');
        videoHidden.srcObject = activeStream;
        videoHidden.muted = true;
        videoHidden.play().catch(e => console.error('Error playing hidden video', e));

        let intervalId: number;

        ws.onopen = () => {
            console.log(`[Ingest] WS Conectado: ${ingestUrl}`);

            // 3. Intervalo de envío a ~15 FPS
            intervalId = window.setInterval(() => {
                if (
                    ws.readyState === WebSocket.OPEN &&
                    ctx &&
                    videoHidden.readyState === videoHidden.HAVE_ENOUGH_DATA
                ) {
                    canvas.width = videoHidden.videoWidth;
                    canvas.height = videoHidden.videoHeight;
                    ctx.drawImage(videoHidden, 0, 0);

                    // Calidad 0.6 suficiente para inferencia, menor ancho de banda
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    const base64Data = dataUrl.split(',')[1];

                    ws.send(JSON.stringify({ frame: base64Data }));
                }
            }, 66); // ~15 FPS
        };

        ws.onerror = (e) => console.error('[Ingest] WS Error', e);

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
        // imgSrc ya no existe: el video HLS se renderiza directamente en el <video> del DOM
        activeStream,   // Stream de webcam local (para preview o ingesta)
        isConnected,
        error,
        connect,
        disconnect,
        isWebcamMode,
        videoRef,       // ⚠️ REQUERIDO para HLS: asignar a <video ref={videoRef} />
    };
}
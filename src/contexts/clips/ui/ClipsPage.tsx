import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Box, Typography, Chip, Button, IconButton, Select, MenuItem, Tabs, Tab,
    Card, CardContent, Stack, Divider, CircularProgress, Alert
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { CalendarMonth, FilterList, MoreVert, ArrowBack } from '@mui/icons-material';

/* ============================
   Config
============================ */

localStorage.setItem("access_token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2IiwiaWF0IjoxNzYyOTQ4OTc5LCJleHAiOjE3NjI5NTI1Nzl9.zqNa8t9U0W1xRXxP6zn56YhxYlMozD_ul2qk4Oee3pw")


const API_BASE =
    (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, '') || 'http://127.0.0.1:8000';

// Para pruebas locales (puedes quitar esta línea si ya lo pones en localStorage/env)

const AUTH_TOKEN =
    (import.meta as any).env?.VITE_AUTH_TOKEN ||
    localStorage.getItem('access_token') ||
    '';

const authHeaders: HeadersInit = AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};

type Category = 'Golpes' | 'Patadas' | 'Forcejeos';

/* ============================
   Tipos
============================ */
type EventoResponse = {
    id_evento: number;
    id_conexion: number;
    id_clip: number | null;
    id_usuario: number | null;
    tipo_evento: 'golpe' | 'patada' | 'forcejeo' | string;
    confianza: number | null;
    t_inicio_ms: number | null;
    t_fin_ms: number | null;
    timestamp_evento: string;
    procesado: boolean;
    subclip_path: string | null;        // JSON path (ahora ruta local dentro del proyecto)
    subclip_duracion_sec: number | null;
};

type ClipResponse = {
    id_clip: number;
    id_conexion: number;
    storage_path: string;               // ruta al MP4 (ahora local en el proyecto)
    start_time_utc: string;
    duration_sec: number;
    fecha_guardado: string;
};

type EventLogJson = {
    camera_id: string;
    event_start_time: string;
    event_end_time: string;
    video_file: string;
    log_file: string;
    video_path: string;
    log_path: string;
    total_logs: number;
    logs: Array<{ timestamp_ms: number; probabilities: Record<string, number> }>;
};

/* ============================
   Helpers de rutas locales
============================ */
// Convierte a una ruta servida por la app (ej: "media/file.mp4" -> "/media/file.mp4").
// Si ya es absoluta (empieza con "/") o es http(s), la deja igual.
// Normaliza rutas a archivos estáticos servidos desde /public.
// Acepta rutas absolutas del FS (Windows/Unix) y devuelve una URL válida: "/data/...".
function normalizeStaticPath(p?: string | null): string {
    if (!p) return '';
    // Si ya es URL http(s), la dejamos tal cual
    if (/^https?:\/\//i.test(p)) return p;

    let s = String(p).replace(/\\/g, '/'); // backslashes -> slashes

    // Si viene con ruta del sistema y contiene /public/, cortamos desde ahí
    const idxPublic = s.toLowerCase().indexOf('/public/');
    if (idxPublic >= 0) s = s.slice(idxPublic + '/public'.length);

    // Si contiene /data/, nos quedamos desde /data/ hacia el final
    const idxData = s.toLowerCase().indexOf('/data/');
    if (idxData >= 0) s = s.slice(idxData);

    // Evitar prefijo duplicado y asegurar leading slash
    s = s.replace(/^\/?(public\/)?/, '/');
    if (!s.startsWith('/')) s = '/' + s;

    return s;
}

/* ============================
   Hooks de datos
============================ */
function useEventos(idConexion: number) {
    const [data, setData] = useState<EventoResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const url = `${API_BASE}/api/eventos?limit=100&offset=0&id_conexion=${idConexion}`;

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);

        fetch(url, { headers: authHeaders })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((json) => { if (alive) setData(json as EventoResponse[]); })
            .catch((e) => { if (alive) setError(String(e)); })
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [url]);

    return { data, loading, error };
}

function useClip(idClip?: number | null) {
    const [clip, setClip] = useState<ClipResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!idClip) {
            setClip(null);
            setErr(null);
            return;
        }
        let alive = true;
        setLoading(true);
        setErr(null);

        // Detalle del clip (sigue viniendo del API), pero el storage_path ahora ya es una ruta local.
        fetch(`${API_BASE}/api/clips/${idClip}`, { headers: authHeaders })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((json) => { if (alive) setClip(json as ClipResponse); })
            .catch((e) => { if (alive) setErr(String(e)); })
            .finally(() => alive && setLoading(false));

        return () => { alive = false; };
    }, [idClip]);
    return { clip, loading, err };
}

function useEventoLog(jsonPath?: string | null) {
    const [log, setLog] = useState<EventLogJson | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!jsonPath) {
            setLog(null);
            setErr(null);
            return;
        }
        // ✅ CAMBIO: ahora el JSON se lee directamente como archivo estático del proyecto
        // (por ejemplo si está en /public/logs/archivo.json -> jsonPath = "/logs/archivo.json")
        const url = normalizeStaticPath(jsonPath);
        let alive = true;
        setLoading(true);
        setErr(null);

        fetch(url)
            .then(async (r) => {
                if (!r.ok) throw new Error(`No se pudo leer el JSON (HTTP ${r.status})`);
                return r.json();
            })
            .then((j) => { if (alive) setLog(j as EventLogJson); })
            .catch((e) => { if (alive) setErr(String(e)); })
            .finally(() => alive && setLoading(false));

        return () => { alive = false; };
    }, [jsonPath]);

    return { log, loading, err };
}

/* ============================
   Utils UI
============================ */
const getSeverityStyles = (severity: Category) => {
    switch (severity) {
        case 'Forcejeos': return { bgcolor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' };
        case 'Patadas': return { bgcolor: '#fef3c7', color: '#a16207', border: '1px solid #fde68a' };
        case 'Golpes': return { bgcolor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
    }
};

function toCategory(tipo_evento: string): Category {
    const t = (tipo_evento || '').toLowerCase();
    if (t.includes('patada')) return 'Patadas';
    if (t.includes('golpe')) return 'Golpes';
    return 'Forcejeos';
}

function niceDate(dIso: string) {
    try { return new Date(dIso).toLocaleString(); } catch { return dIso; }
}

/* ============================
   Miniatura de video (captura 1 frame)
============================ */
const VideoThumbnail: React.FC<{ clipId: number | null | undefined; width?: number; height?: number; label?: string; }> = ({ clipId, width = 220, height = 124, label }) => {
    const { clip, loading } = useClip(clipId ?? undefined);
    const [thumb, setThumb] = useState<string | null>(null);
    const doneRef = useRef(false);

    useEffect(() => {
        setThumb(null);
        doneRef.current = false;

        if (!clip?.storage_path) return;

        // ✅ CAMBIO: el video ahora se carga directamente desde la ruta local
        const fileUrl = normalizeStaticPath(clip.storage_path);

        const video = document.createElement('video');
        video.src = fileUrl;
        video.muted = true;
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';

        const onLoaded = () => {
            try {
                const t = Math.max(0.1, Math.min(0.2 * (video.duration || 1), (video.duration || 1) - 0.1));
                video.currentTime = t;
            } catch {
                drawFrame();
            }
        };

        const drawFrame = () => {
            if (doneRef.current) return;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, width, height);
            try {
                const url = canvas.toDataURL('image/jpeg', 0.7);
                setThumb(url);
                doneRef.current = true;
            } catch { /* noop */ }
        };

        video.addEventListener('loadedmetadata', onLoaded);
        video.addEventListener('seeked', drawFrame);
        video.addEventListener('loadeddata', drawFrame);
        video.addEventListener('error', () => setThumb(null));

        video.load();

        return () => {
            video.removeEventListener('loadedmetadata', onLoaded);
            video.removeEventListener('seeked', drawFrame);
            video.removeEventListener('loadeddata', drawFrame);
        };
    }, [clip?.storage_path, width, height]);

    return (
        <Box
            sx={{
                width, height, flexShrink: 0, overflow: 'hidden',
                borderRadius: 1.5,
                bgcolor: 'black',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, letterSpacing: 1
            }}
        >
            {thumb ? (
                <img src={thumb} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <Box sx={{ textAlign: 'center', px: 2 }}>
                    {loading ? 'Cargando…' : (label || 'SIN CLIP')}
                </Box>
            )}
        </Box>
    );
};

/* ============================
   Página
============================ */
export const ClipsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Category>('Golpes');
    const [period, setPeriod] = useState<string>('Hoy');
    const [selected, setSelected] = useState<EventoResponse | null>(null);

    // Por ahora, conexión fija en 1 (como tu ejemplo)
    const { data: eventos, loading, error } = useEventos(1);

    const eventosDecorados = useMemo(
        () =>
            (eventos || []).map((e) => ({
                ...e,
                _category: toCategory(e.tipo_evento),
                _duration: e.subclip_duracion_sec ?? Math.max(0, Math.round(((e.t_fin_ms ?? 0) - ((e.t_inicio_ms ?? 0))) / 1000)),
                _createdAt: niceDate(e.timestamp_evento),
            })),
        [eventos]
    );

    const filtered = useMemo(
        () => eventosDecorados.filter((e) => e._category === activeTab),
        [eventosDecorados, activeTab]
    );

    const handleTabChange = (_: any, v: Category) => setActiveTab(v);
    const handlePeriodChange = (e: SelectChangeEvent<string>) => setPeriod(e.target.value);
    const handleBack = () => setSelected(null);

    const activeCameras = 5;
    const disabledCameras = 1;

    const Header = () => (
        <Box sx={{ mb: 6 }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 4,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Historial
                    </Typography>
                    <Chip label={`${activeCameras} Active`} size="small"
                        sx={{ bgcolor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 500 }} />
                    <Chip label={`${disabledCameras} Disabled`} size="small"
                        sx={{ bgcolor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', fontWeight: 500 }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" startIcon={<CalendarMonth />} size="small"
                        sx={{ textTransform: 'none', color: '#475569', borderColor: '#cbd5e1' }}>
                        Nov 16, 2020 – Dec 16, 2020
                    </Button>
                    <IconButton size="small" sx={{ border: '1px solid #cbd5e1' }} aria-label="Filtrar">
                        <FilterList fontSize="small" />
                    </IconButton>
                    <Select value={period} onChange={handlePeriodChange} size="small" sx={{ minWidth: 120 }}>
                        <MenuItem value="Hoy">Hoy</MenuItem>
                        <MenuItem value="Esta semana">Esta semana</MenuItem>
                        <MenuItem value="Este mes">Este mes</MenuItem>
                    </Select>
                </Box>
            </Box>

            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                    bgcolor: '#f1f5f9', borderRadius: '9999px', p: 0.5, minHeight: 42,
                    '& .MuiTabs-indicator': { display: 'none' },
                }}
            >
                {(['Golpes', 'Patadas', 'Forcejeos'] as Category[]).map((c) => (
                    <Tab key={c} label={c} value={c}
                        sx={{
                            textTransform: 'none', borderRadius: '9999px', minHeight: 36, px: 2,
                            '&.Mui-selected': {
                                bgcolor: 'white', color: 'primary.main', fontWeight: 600,
                                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                            },
                        }}
                    />
                ))}
            </Tabs>
        </Box>
    );

    const ListView = () => (
        <>
            <Header />

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 3 }}>No se pudo cargar el historial: {error}</Alert>}

            {!loading && !error && filtered.length === 0 && (
                <Alert severity="info">No hay eventos para la pestaña seleccionada.</Alert>
            )}

            <Stack spacing={3}>
                {filtered.map((e) => (
                    <Card
                        key={e.id_evento}
                        sx={{
                            borderRadius: 4, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', overflow: 'hidden',
                            cursor: 'pointer', transition: 'box-shadow 0.2s',
                            '&:hover': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }
                        }}
                        onClick={() => setSelected(e)}
                    >
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                            {/* Miniatura real del clip si existe */}
                            {e.id_clip
                                ? <VideoThumbnail clipId={e.id_clip} label={e.tipo_evento.toUpperCase()} />
                                : (
                                    <Box
                                        sx={{
                                            width: { xs: '100%', md: 220 }, height: { xs: 160, md: 124 }, flexShrink: 0,
                                            background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(2,6,23,0.8) 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 700
                                        }}
                                    >
                                        {e.tipo_evento.toUpperCase()}
                                    </Box>
                                )
                            }

                            <Box
                                sx={{
                                    flex: 1, p: { xs: 2, md: 3 }, display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' }, gap: 2
                                }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                                            EVT-{e.id_evento.toString().padStart(6, '0')}
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', flex: 1 }}>
                                            Evento detectado por IA
                                        </Typography>
                                        <Chip
                                            label={toCategory(e.tipo_evento)} size="small"
                                            sx={{ ...getSeverityStyles(toCategory(e.tipo_evento)), fontSize: '0.75rem', height: 24, fontWeight: 500 }}
                                        />
                                    </Box>

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
                                            gap: 1.5,
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Revisado</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {e.procesado ? 'Sí' : 'No'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Conexión</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {e.id_conexion}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Duración</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {e._duration} seg
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Clip</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {e.id_clip ?? '—'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Inicio–Fin</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {(e.t_inicio_ms ?? 0)}–{(e.t_fin_ms ?? 0)} ms
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Creado</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {e._createdAt}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box
                                    sx={{
                                        display: 'flex', flexDirection: { xs: 'row', md: 'column' },
                                        alignItems: { xs: 'center', md: 'flex-end' }, gap: 1,
                                        width: { xs: 'auto', md: 140 }, flexShrink: 0
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b' }}>
                                        <CalendarMonth fontSize="small" />
                                        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>{e._createdAt}</Typography>
                                    </Box>
                                    <IconButton size="small" aria-label="Más opciones" onClick={(evt) => evt.stopPropagation()}>
                                        <MoreVert fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Box>
                    </Card>
                ))}
            </Stack>

            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {filtered.length} resultados
                </Typography>
            </Box>
        </>
    );

    const DetailView = () => {
        if (!selected) return null;

        // JSON del evento (ruta local)
        const { log, loading: loadingLog, err: errLog } = useEventoLog(selected.subclip_path || undefined);

        // Clip para reproducir video (ruta local)
        const { clip } = useClip(selected.id_clip ?? undefined);
        const videoUrl = clip?.storage_path ? normalizeStaticPath(clip.storage_path) : undefined;

        const timeline = useMemo(() => {
            if (!log?.logs) return [] as { t: number; top3: string }[];
            return log.logs.map((l) => {
                const entries = Object.entries(l.probabilities || {});
                entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
                const top3 = entries.slice(0, 3).map(([k, v]) => `${k}: ${(v * 100).toFixed(1)}%`).join('  ·  ');
                return { t: l.timestamp_ms, top3 };
            });
        }, [log]);

        return (
            <>
                <Box sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: '#475569', '&:hover': { bgcolor: '#f1f5f9' } }} aria-label="Volver a la lista">
                        <ArrowBack />
                    </IconButton>
                </Box>

                <Header />

                <Card sx={{ borderRadius: 4, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 1.5, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1 }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                                    EVT-{selected.id_evento.toString().padStart(6, '0')}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    {toCategory(selected.tipo_evento)} detectado por IA
                                </Typography>
                                <Chip
                                    label={toCategory(selected.tipo_evento)} size="small"
                                    sx={{ ...getSeverityStyles(toCategory(selected.tipo_evento)), fontSize: '0.75rem', height: 24, fontWeight: 500 }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarMonth fontSize="small" sx={{ color: '#64748b' }} />
                                <Typography variant="caption" sx={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                                    Creado {niceDate(selected.timestamp_evento)}
                                </Typography>
                                <IconButton size="small" aria-label="Más opciones">
                                    <MoreVert fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ mb: 3 }}>
                            {/* Panel de logs desde el JSON */}
                            <Card variant="outlined" sx={{ width: { xs: '100%', lg: 480 }, borderRadius: 3 }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#1e293b' }}>
                                        Registro del evento (JSON)
                                    </Typography>

                                    {!selected.subclip_path && <Alert severity="info">Este evento no posee ruta de JSON (subclip_path es nulo).</Alert>}

                                    {selected.subclip_path && (
                                        <>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                                                {normalizeStaticPath(selected.subclip_path)}
                                            </Typography>

                                            {loadingLog && (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                                    <CircularProgress size={22} />
                                                </Box>
                                            )}

                                            {errLog && <Alert severity="warning">No se pudo leer el JSON: {errLog}</Alert>}

                                            {log && (
                                                <Box
                                                    sx={{
                                                        maxHeight: 420, overflow: 'auto', display: 'grid', gap: 1,
                                                        border: '1px solid #e2e8f0', borderRadius: 1.5, p: 1, bgcolor: '#f8fafc',
                                                    }}
                                                >
                                                    {timeline.map((row) => (
                                                        <Box key={row.t}
                                                            sx={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 1.5, p: 1
                                                            }}>
                                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#334155' }}>
                                                                t={row.t} ms
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: '#475569' }}>{row.top3}</Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Detalles + REPRODUCTOR */}
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ bgcolor: '#f8fafc', borderRadius: 3, p: 2 }}>
                                    <Typography variant="subtitle2" sx={{ color: '#334155', mb: 2, fontWeight: 600 }}>
                                        Detalles del Evento
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
                                            gap: 2,
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Revisado</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {selected.procesado ? 'Sí' : 'No'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Conexión</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {selected.id_conexion}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Duración</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {selected.subclip_duracion_sec ?? 0} seg
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Clip</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {selected.id_clip ?? '—'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Inicio–Fin</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {(selected.t_inicio_ms ?? 0)}–{(selected.t_fin_ms ?? 0)} ms
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Creado</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {niceDate(selected.timestamp_evento)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {videoUrl && (
                                    <Box sx={{ mt: 3 }}>
                                        <Box
                                            component="video"
                                            controls
                                            src={videoUrl}
                                            style={{ width: '100%', height: 420, objectFit: 'contain', background: 'black', borderRadius: 12 }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </>
        );
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: '#f5f6f8' }}>
            {selected ? <DetailView /> : <ListView />}
        </Box>
    );
};

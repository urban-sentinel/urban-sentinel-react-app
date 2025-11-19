import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    Button,
    IconButton,
    Select,
    MenuItem,
    Tabs,
    Tab,
    Card,
    CardContent,
    CardMedia,
    Stack,
    Divider,
    CircularProgress,
    Alert,
    TextField,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { CalendarMonth, MoreVert, ArrowBack } from '@mui/icons-material';

/* ============================
   Tipos
============================ */

type Category = 'Golpes' | 'Patadas' | 'Forcejeos';

type EventoResponse = {
    id_evento: number;
    id_conexion: number;
    id_clip: number | null;
    id_usuario: number | null;
    tipo_evento: 'golpe' | 'patada' | 'forcejeo' | string;
    confianza: number | null; // 0–1
    t_inicio_ms: number | null;
    t_fin_ms: number | null;
    timestamp_evento: string;
    procesado: boolean;
    subclip_path: string | null;
    subclip_duracion_sec: number | null;
};

type ClipResponse = {
    id_clip: number;
    id_conexion: number;
    storage_path: string; // ruta al MP4
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
   Helpers
============================ */

function normalizeStaticPath(p?: string | null): string {
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p;

    let s = String(p).replace(/\\/g, '/');

    const idxPublic = s.toLowerCase().indexOf('/public/');
    if (idxPublic >= 0) s = s.slice(idxPublic + '/public'.length);

    const idxData = s.toLowerCase().indexOf('/data/');
    if (idxData >= 0) s = s.slice(idxData);

    s = s.replace(/^\/?(public\/)?/, '/');
    if (!s.startsWith('/')) s = '/' + s;

    return s;
}

function toCategory(tipo_evento: string): Category {
    const t = (tipo_evento || '').toLowerCase();
    if (t.includes('patada')) return 'Patadas';
    if (t.includes('golpe')) return 'Golpes';
    return 'Forcejeos';
}

function niceDate(dIso: string) {
    try {
        return new Date(dIso).toLocaleString();
    } catch {
        return dIso;
    }
}

const getSeverityStyles = (severity: Category) => {
    switch (severity) {
        case 'Forcejeos':
            return {
                bgcolor: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
            };
        case 'Patadas':
            return {
                bgcolor: '#fef3c7',
                color: '#a16207',
                border: '1px solid #fde68a',
            };
        case 'Golpes':
            return {
                bgcolor: '#dcfce7',
                color: '#15803d',
                border: '1px solid #bbf7d0',
            };
    }
};

/* ============================
   Hooks de datos
============================ */

function useEventos(idConexion: number) {
    const [data, setData] = useState<EventoResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE =
        (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, '') ||
        'http://127.0.0.1:8000';

    const AUTH_TOKEN =
        (import.meta as any).env?.VITE_AUTH_TOKEN ||
        localStorage.getItem('access_token') ||
        '';

    const authHeaders: HeadersInit = AUTH_TOKEN
        ? { Authorization: `Bearer ${AUTH_TOKEN}` }
        : {};

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);

        const url = `${API_BASE}/api/eventos?limit=200&offset=0&id_conexion=${idConexion}`;

        fetch(url, { headers: authHeaders })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((json) => {
                if (alive) setData(json as EventoResponse[]);
            })
            .catch((e) => {
                if (alive) setError(String(e));
            })
            .finally(() => alive && setLoading(false));

        return () => {
            alive = false;
        };
    }, [API_BASE, AUTH_TOKEN, idConexion]);

    return { data, loading, error };
}

function useClip(idClip?: number | null) {
    const [clip, setClip] = useState<ClipResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const API_BASE =
        (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, '') ||
        'http://127.0.0.1:8000';

    const AUTH_TOKEN =
        (import.meta as any).env?.VITE_AUTH_TOKEN ||
        localStorage.getItem('access_token') ||
        '';

    const authHeaders: HeadersInit = AUTH_TOKEN
        ? { Authorization: `Bearer ${AUTH_TOKEN}` }
        : {};

    useEffect(() => {
        if (!idClip) {
            setClip(null);
            setErr(null);
            return;
        }

        let alive = true;
        setLoading(true);
        setErr(null);

        fetch(`${API_BASE}/api/clips/${idClip}`, { headers: authHeaders })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((json) => {
                if (alive) setClip(json as ClipResponse);
            })
            .catch((e) => {
                if (alive) setErr(String(e));
            })
            .finally(() => alive && setLoading(false));

        return () => {
            alive = false;
        };
    }, [API_BASE, AUTH_TOKEN, idClip]);

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

        const url = normalizeStaticPath(jsonPath);
        let alive = true;
        setLoading(true);
        setErr(null);

        fetch(url)
            .then(async (r) => {
                if (!r.ok)
                    throw new Error(`No se pudo leer el JSON (HTTP ${r.status})`);
                return r.json();
            })
            .then((j) => {
                if (alive) setLog(j as EventLogJson);
            })
            .catch((e) => {
                if (alive) setErr(String(e));
            })
            .finally(() => alive && setLoading(false));

        return () => {
            alive = false;
        };
    }, [jsonPath]);

    return { log, loading, err };
}

/* ============================
   Miniatura de video
============================ */

const VideoThumbnail: React.FC<{
    clipId: number | null | undefined;
    width?: number;
    height?: number;
    label?: string;
}> = ({ clipId, width = 220, height = 124, label }) => {
    const { clip, loading } = useClip(clipId ?? undefined);
    const [thumb, setThumb] = useState<string | null>(null);
    const doneRef = useRef(false);

    useEffect(() => {
        setThumb(null);
        doneRef.current = false;

        if (!clip?.storage_path) return;

        const fileUrl = normalizeStaticPath(clip.storage_path);
        console.log(fileUrl)
        console.log(clip.storage_path)

        const video = document.createElement('video');
        video.src = fileUrl;
        video.muted = true;
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';

        const onLoaded = () => {
            try {
                const t = Math.max(
                    0.1,
                    Math.min(
                        0.2 * (video.duration || 1),
                        (video.duration || 1) - 0.1
                    )
                );
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
            } catch {
                /* noop */
            }
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
                width,
                height,
                flexShrink: 0,
                overflow: 'hidden',
                borderRadius: 1.5,
                bgcolor: 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                letterSpacing: 1,
            }}
        >
            {thumb ? (
                <img
                    src={thumb}
                    alt="thumbnail"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                <Box sx={{ textAlign: 'center', px: 2 }}>
                    {loading ? 'Cargando…' : label || 'SIN CLIP'}
                </Box>
            )}
        </Box>
    );
};

/* ============================
   Header con filtros (HUs)
============================ */

type HeaderProps = {
    activeCategory: Category;
    onCategoryChange: (c: Category) => void;
    dateFrom: string;
    dateTo: string;
    onDateFromChange: (v: string) => void;
    onDateToChange: (v: string) => void;
    confidence: string;
    onConfidenceChange: (v: string) => void;
    resultsCount: number;
};

const HistoryHeader: React.FC<HeaderProps> = ({
    activeCategory,
    onCategoryChange,
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    confidence,
    onConfidenceChange,
    resultsCount,
}) => {
    const handleTabChange = (_: any, v: Category) => onCategoryChange(v);
    const handleConfChange = (e: SelectChangeEvent<string>) =>
        onConfidenceChange(e.target.value);

    return (
        <Box sx={{ mb: 4 }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        flexWrap: 'wrap',
                    }}
                >
                    <Typography
                        variant="h5"
                        component="h1"
                        sx={{ fontWeight: 700, color: '#1e293b' }}
                    >
                        Historial ({resultsCount})
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                    }}
                >
                    {/* HU1: Filtrado por fecha */}
                    <TextField
                        label="Desde"
                        type="date"
                        size="small"
                        value={dateFrom}
                        onChange={(e) => onDateFromChange(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Hasta"
                        type="date"
                        size="small"
                        value={dateTo}
                        onChange={(e) => onDateToChange(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />

                    {/* HU2: Filtrado por nivel de confianza */}
                    <Select
                        value={confidence}
                        onChange={handleConfChange}
                        size="small"
                        displayEmpty
                        sx={{ minWidth: 170 }}
                    >
                        <MenuItem value="">Confianza (todos)</MenuItem>
                        <MenuItem value="0.5">≥ 50%</MenuItem>
                        <MenuItem value="0.7">≥ 70%</MenuItem>
                        <MenuItem value="0.9">≥ 90%</MenuItem>
                    </Select>
                </Box>
            </Box>

            {/* Tabs por tipo de evento */}
            <Tabs
                value={activeCategory}
                onChange={handleTabChange}
                sx={{
                    bgcolor: '#f1f5f9',
                    borderRadius: '9999px',
                    p: 0.5,
                    minHeight: 42,
                    '& .MuiTabs-indicator': { display: 'none' },
                }}
            >
                {(['Golpes', 'Patadas', 'Forcejeos'] as Category[]).map((c) => (
                    <Tab
                        key={c}
                        label={c}
                        value={c}
                        sx={{
                            textTransform: 'none',
                            borderRadius: '9999px',
                            minHeight: 36,
                            px: 2,
                            '&.Mui-selected': {
                                bgcolor: 'white',
                                color: 'primary.main',
                                fontWeight: 600,
                                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                            },
                        }}
                    />
                ))}
            </Tabs>
        </Box>
    );
};

/* ============================
   Item de lista (tarjeta)
============================ */

type EventCardProps = {
    evento: EventoResponse & {
        _category: Category;
        _duration: number;
        _createdAt: string;
        _timestamp: Date;
    };
    onClick: () => void;
};

const EventCard: React.FC<EventCardProps> = ({ evento, onClick }) => {
    const category = evento._category;

    return (
        <Card
            sx={{
                borderRadius: 4,
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                '&:hover': {
                    boxShadow:
                        '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                },
            }}
            onClick={onClick}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                }}
            >
                {evento.id_clip ? (
                    <VideoThumbnail
                        clipId={evento.id_clip}
                        label={evento.tipo_evento.toUpperCase()}
                    />
                ) : (
                    <Box
                        sx={{
                            width: { xs: '100%', md: 220 },
                            height: { xs: 160, md: 124 },
                            flexShrink: 0,
                            background:
                                'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(2,6,23,0.8) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                        }}
                    >
                        {evento.tipo_evento.toUpperCase()}
                    </Box>
                )}

                <Box
                    sx={{
                        flex: 1,
                        p: { xs: 2, md: 3 },
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                    }}
                >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1,
                                mb: 2,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#64748b',
                                    fontFamily: 'monospace',
                                }}
                            >
                                EVT-{evento.id_evento.toString().padStart(6, '0')}
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: 600, color: '#1e293b', flex: 1 }}
                            >
                                Evento detectado por IA
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: 'repeat(2, 1fr)',
                                    md: 'repeat(3, 1fr)',
                                    lg: 'repeat(6, 1fr)',
                                },
                                gap: 1.5,
                            }}
                        >
                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{ color: '#64748b', display: 'block' }}
                                >
                                    Revisado
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500, color: '#1e293b' }}
                                >
                                    {evento.procesado ? 'Sí' : 'No'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{ color: '#64748b', display: 'block' }}
                                >
                                    Conexión
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500, color: '#1e293b' }}
                                >
                                    {evento.id_conexion}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{ color: '#64748b', display: 'block' }}
                                >
                                    Duración
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500, color: '#1e293b' }}
                                >
                                    {evento._duration} seg
                                </Typography>
                            </Box>
                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{ color: '#64748b', display: 'block' }}
                                >
                                    Clip
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500, color: '#1e293b' }}
                                >
                                    {evento.id_clip ?? '—'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{ color: '#64748b', display: 'block' }}
                                >
                                    Inicio–Fin
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500, color: '#1e293b' }}
                                >
                                    {(evento.t_inicio_ms ?? 0)}–{(evento.t_fin_ms ?? 0)} ms
                                </Typography>
                            </Box>
                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{ color: '#64748b', display: 'block' }}
                                >
                                    Creado
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500, color: '#1e293b' }}
                                >
                                    {evento._createdAt}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'row', md: 'column' },
                            alignItems: { xs: 'center', md: 'flex-end' },
                            gap: 1,
                            width: { xs: 'auto', md: 140 },
                            flexShrink: 0,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: '#64748b',
                            }}
                        >
                            <CalendarMonth fontSize="small" />
                            <Typography
                                variant="caption"
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                {evento._createdAt}
                            </Typography>
                        </Box>
                        <IconButton
                            size="small"
                            aria-label="Más opciones"
                            onClick={(evt) => evt.stopPropagation()}
                        >
                            <MoreVert fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            </Box>
        </Card>
    );
};

/* ============================
   Vista de detalle
============================ */

type DetailProps = {
    evento: EventoResponse;
    onBack: () => void;
};

const EventDetail: React.FC<DetailProps> = ({ evento, onBack }) => {
    const { log, loading: loadingLog, err: errLog } = useEventoLog(
        evento.subclip_path || undefined
    );
    const { clip } = useClip(evento.id_clip ?? undefined);
    const videoUrl = clip?.storage_path
        ? normalizeStaticPath(clip.storage_path)
        : undefined;
    console.log('videoUrl', videoUrl);

    const timeline = useMemo(() => {
        if (!log?.logs) return [] as { t: number; top3: string }[];
        return log.logs.map((l) => {
            const entries = Object.entries(l.probabilities || {});
            entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
            const top3 = entries
                .slice(0, 3)
                .map(([k, v]) => `${k}: ${(v * 100).toFixed(1)}%`)
                .join('  ·  ');
            return { t: l.timestamp_ms, top3 };
        });
    }, [log]);

    const category = toCategory(evento.tipo_evento);

    return (
        <>
            <Box sx={{ mb: 2 }}>
                <IconButton
                    onClick={onBack}
                    sx={{ color: '#475569', '&:hover': { bgcolor: '#f1f5f9' } }}
                    aria-label="Volver a la lista"
                >
                    <ArrowBack />
                </IconButton>
            </Box>

            <Card
                sx={{
                    borderRadius: 4,
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    overflow: 'hidden',
                }}
            >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            mb: 2,
                            gap: 1.5,
                            flexWrap: 'wrap',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                                flex: 1,
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{ color: '#64748b', fontFamily: 'monospace' }}
                            >
                                EVT-{evento.id_evento.toString().padStart(6, '0')}
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: 600, color: '#1e293b' }}
                            >
                                {category} detectado por IA
                            </Typography>
                            <Chip
                                label={category}
                                size="small"
                                sx={{
                                    ...getSeverityStyles(category),
                                    fontSize: '0.75rem',
                                    height: 24,
                                    fontWeight: 500,
                                }}
                            />
                        </Box>

                        <Box
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                            <CalendarMonth fontSize="small" sx={{ color: '#64748b' }} />
                            <Typography
                                variant="caption"
                                sx={{ color: '#64748b', whiteSpace: 'nowrap' }}
                            >
                                Creado {niceDate(evento.timestamp_evento)}
                            </Typography>
                            <IconButton size="small" aria-label="Más opciones">
                                <MoreVert fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Stack
                        direction={{ xs: 'column', lg: 'row' }}
                        spacing={3}
                        sx={{ mb: 3 }}
                    >
                        {/* Panel JSON / timeline */}
                        <Card
                            variant="outlined"
                            sx={{
                                width: { xs: '100%', lg: 480 },
                                borderRadius: 3,
                            }}
                        >
                            <CardContent sx={{ p: 2 }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 600,
                                        mb: 1.5,
                                        color: '#1e293b',
                                    }}
                                >
                                    Registro del evento
                                </Typography>

                                {!evento.subclip_path && (
                                    <Alert severity="info">
                                        Este evento no posee ruta de JSON (subclip_path es nulo).
                                    </Alert>
                                )}

                                {evento.subclip_path && (
                                    <>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: '#64748b',
                                                display: 'block',
                                                mb: 1,
                                            }}
                                        >
                                            {normalizeStaticPath(evento.subclip_path)}
                                        </Typography>

                                        {loadingLog && (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    py: 3,
                                                }}
                                            >
                                                <CircularProgress size={22} />
                                            </Box>
                                        )}

                                        {errLog && (
                                            <Alert severity="warning">
                                                No se pudo leer el JSON: {errLog}
                                            </Alert>
                                        )}

                                        {log && (
                                            <Box
                                                sx={{
                                                    maxHeight: 420,
                                                    overflow: 'auto',
                                                    display: 'grid',
                                                    gap: 1,
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 1.5,
                                                    p: 1,
                                                    bgcolor: '#f8fafc',
                                                }}
                                            >
                                                {timeline.map((row) => (
                                                    <Box
                                                        key={row.t}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            bgcolor: 'white',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: 1.5,
                                                            p: 1,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontFamily: 'monospace',
                                                                color: '#334155',
                                                            }}
                                                        >
                                                            t={row.t} ms
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ color: '#475569' }}
                                                        >
                                                            {row.top3}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Detalles + video */}
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ bgcolor: '#f8fafc', borderRadius: 3, p: 2 }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        color: '#334155',
                                        mb: 2,
                                        fontWeight: 600,
                                    }}
                                >
                                    Detalles del evento
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: 'repeat(2, 1fr)',
                                            md: 'repeat(3, 1fr)',
                                            lg: 'repeat(6, 1fr)',
                                        },
                                        gap: 2,
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: '#64748b', display: 'block' }}
                                        >
                                            Revisado
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 500, color: '#1e293b' }}
                                        >
                                            {evento.procesado ? 'Sí' : 'No'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: '#64748b', display: 'block' }}
                                        >
                                            Conexión
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 500, color: '#1e293b' }}
                                        >
                                            {evento.id_conexion}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: '#64748b', display: 'block' }}
                                        >
                                            Duración
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 500, color: '#1e293b' }}
                                        >
                                            {evento.subclip_duracion_sec ?? 0} seg
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: '#64748b', display: 'block' }}
                                        >
                                            Clip
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 500, color: '#1e293b' }}
                                        >
                                            {evento.id_clip ?? '—'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: '#64748b', display: 'block' }}
                                        >
                                            Inicio–Fin
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 500, color: '#1e293b' }}
                                        >
                                            {(evento.t_inicio_ms ?? 0)}–{(evento.t_fin_ms ?? 0)} ms
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: '#64748b', display: 'block' }}
                                        >
                                            Confianza
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 500, color: '#1e293b' }}
                                        >
                                            {evento.confianza !== null
                                                ? `${(evento.confianza * 100).toFixed(1)}%`
                                                : '—'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            {videoUrl && (
                                <CardMedia
                                    key={videoUrl}  // <--- ¡ESTA ES LA MAGIA!
                                    component="video"
                                    controls
                                    autoPlay // Opcional: para que arranque apenas cargue
                                    src={videoUrl}
                                    sx={{
                                        mt: 3,
                                        width: '100%',
                                        height: 420,
                                        objectFit: 'contain',
                                        bgcolor: 'black',
                                        borderRadius: 3,
                                        boxShadow: 3,
                                        display: 'block'
                                    }}
                                />
                            )}
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </>
    );
};

/* ============================
   Página principal
============================ */

export const ClipsPage: React.FC = () => {
    const [activeCategory, setActiveCategory] =
        useState<Category>('Golpes');
    const [selected, setSelected] = useState<EventoResponse | null>(null);

    // Filtros (HUs)
    const [dateFrom, setDateFrom] = useState<string>(''); // HU1
    const [dateTo, setDateTo] = useState<string>(''); // HU1
    const [confidence, setConfidence] = useState<string>(''); // HU2

    // Por ahora, conexión fija 1 (ajusta según tu app)
    const { data: eventos, loading, error } = useEventos(1);

    const eventosDecorados = useMemo(
        () =>
            (eventos || []).map((e) => ({
                ...e,
                _category: toCategory(e.tipo_evento),
                _duration:
                    e.subclip_duracion_sec ??
                    Math.max(
                        0,
                        Math.round(
                            ((e.t_fin_ms ?? 0) - (e.t_inicio_ms ?? 0)) / 1000
                        )
                    ),
                _createdAt: niceDate(e.timestamp_evento),
                _timestamp: new Date(e.timestamp_evento),
            })),
        [eventos]
    );

    const filtered = useMemo(
        () =>
            eventosDecorados.filter((e) => {
                if (e._category !== activeCategory) return false;

                // HU1: filtro por rango de fechas
                if (dateFrom) {
                    const from = new Date(`${dateFrom}T00:00:00`);
                    if (e._timestamp < from) return false;
                }
                if (dateTo) {
                    const to = new Date(`${dateTo}T23:59:59.999`);
                    if (e._timestamp > to) return false;
                }

                // HU2: filtro por nivel de confianza mínimo
                if (confidence) {
                    const min = parseFloat(confidence);
                    const conf = e.confianza ?? 0;
                    if (conf < min) return false;
                }

                // HU3 se cumple porque, si hay fecha y confianza,
                // deben cumplirse todos los criterios para pasar
                return true;
            }),
        [eventosDecorados, activeCategory, dateFrom, dateTo, confidence]
    );

    const handleSelectEvent = (evento: EventoResponse) => setSelected(evento);
    const handleBack = () => setSelected(null);

    if (selected) {
        return (
            <Box
                sx={{
                    p: { xs: 2, md: 3 },
                    minHeight: '100vh',
                    bgcolor: '#f5f6f8',
                }}
            >
                <EventDetail evento={selected} onBack={handleBack} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                p: { xs: 2, md: 3 },
                minHeight: '100vh',
                bgcolor: '#f5f6f8',
            }}
        >
            <HistoryHeader
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                confidence={confidence}
                onConfidenceChange={setConfidence}
                resultsCount={filtered.length}
            />

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    No se pudo cargar el historial: {error}
                </Alert>
            )}

            {!loading && !error && filtered.length === 0 && (
                <Alert severity="info">
                    No hay eventos para los filtros seleccionados.
                </Alert>
            )}

            <Stack spacing={3}>
                {filtered.map((e) => (
                    <EventCard
                        key={e.id_evento}
                        evento={e}
                        onClick={() => handleSelectEvent(e)}
                    />
                ))}
            </Stack>
        </Box>
    );
};

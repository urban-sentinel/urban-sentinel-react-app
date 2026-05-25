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
    Grid,
    Paper
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { 
    CalendarMonth, 
    MoreVert, 
    ArrowBack, 
    CorporateFare, 
    Videocam, 
    Place, 
    Timer, 
    FactCheck,
    Percent
} from '@mui/icons-material';

// 🔑 IMPORTACIONES DE TUS HOOKS DE INFRAESTRUCTURA EXISTENTES
import { useConexion } from '../../cameras/infra/useConexion';
import { useOficina } from '../../cameras/infra/useOficina';
import { EventDetail } from './ClipsDetailPage';

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
    confianza: number | null;
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
    storage_path: string;
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
    analisis_ia: { metricas_promedio: { Golpe: number, Peaton: number, Patada: number, Forcejeo: number } };
};

/* ============================
   Helpers
============================ */
const API_BASE =
    (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, '') ||
    'http://127.0.0.1:8000';

function getVideoStreamUrl(clip: ClipResponse | null | undefined): string | undefined {
    if (!clip) return undefined;
    if (clip.id_clip) {
        return `${API_BASE}/api/clips/${clip.id_clip}/stream`;
    }
    if (clip.storage_path && /^https?:\/\//i.test(clip.storage_path)) {
        return clip.storage_path;
    }
    return undefined;
}

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
        return new Date(dIso).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
        return dIso;
    }
}

const getSeverityStyles = (severity: Category) => {
    switch (severity) {
        case 'Forcejeos':
            return { bgcolor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' };
        case 'Patadas':
            return { bgcolor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' };
        case 'Golpes':
            return { bgcolor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' };
    }
};

/* ============================
   Hooks de datos base
============================ */
function useEventos() {
    const [data, setData] = useState<EventoResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const AUTH_TOKEN = (import.meta as any).env?.VITE_AUTH_TOKEN || localStorage.getItem('access_token') || '';
    const authHeaders: HeadersInit = AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};

    const fetchAllEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE}/api/eventos?limit=200&offset=0`;
            const r = await fetch(url, { headers: authHeaders });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const json = await r.json();
            setData(json as EventoResponse[]);
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllEvents();
    }, []);

    return { data, loading, error, refetch: fetchAllEvents };
}

function useClip(idClip?: number | null) {
    const [clip, setClip] = useState<ClipResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const AUTH_TOKEN = (import.meta as any).env?.VITE_AUTH_TOKEN || localStorage.getItem('access_token') || '';
    const authHeaders: HeadersInit = AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};

    useEffect(() => {
        if (!idClip) {
            setClip(null);
            setErr(null);
            return;
        }
        let alive = true;
        setLoading(true);
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

        return () => { alive = false; };
    }, [idClip]);

    return { clip, loading, err };
}

function useEventoLog(jsonPath?: string | null, eventoId?: number | null) {
    const [log, setLog] = useState<EventLogJson | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const AUTH_TOKEN = (import.meta as any).env?.VITE_AUTH_TOKEN || localStorage.getItem('access_token') || '';
    const authHeaders: HeadersInit = AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};

    useEffect(() => {
        if (!jsonPath && !eventoId) {
            setLog(null);
            setErr(null);
            return;
        }
        let alive = true;
        setLoading(true);
        const url = eventoId ? `${API_BASE}/api/eventos/${eventoId}/json` : normalizeStaticPath(jsonPath);

        fetch(url, { headers: authHeaders })
            .then(async (r) => {
                if (!r.ok) throw new Error(`No se pudo leer el JSON (HTTP ${r.status})`);
                return r.json();
            })
            .then((j) => { if (alive) setLog(j as EventLogJson); })
            .catch((e) => { if (alive) setErr(String(e)); })
            .finally(() => alive && setLoading(false));

        return () => { alive = false; };
    }, [jsonPath, eventoId]);

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
}> = ({ clipId, width = 240, height = 145, label }) => {
    const { clip, loading } = useClip(clipId ?? undefined);

    const fileUrl = useMemo(() => {
        return getVideoStreamUrl(clip);
    }, [clip]);

    if (loading) {
        return (
            <Box sx={{ width, height, bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <CircularProgress size={20} color="inherit" />
            </Box>
        );
    }

    if (!fileUrl) {
        return (
            <Box sx={{ width, height, flexShrink: 0, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                {label || 'SIN CLIP'}
            </Box>
        );
    }

    return (
        <Box sx={{ width, height, flexShrink: 0, overflow: 'hidden', borderRadius: { xs: '16px 16px 0 0', md: '16px 0 0 16px' }, bgcolor: 'black', position: 'relative' }}>
            <video src={`${fileUrl}#t=0.5`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline preload="metadata" />
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
    const handleConfChange = (e: SelectChangeEvent<string>) => onConfidenceChange(e.target.value);

    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
                        Auditoría Histórica de Clips ({resultsCount})
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                        Repositorio forense de evidencias multimedia procesadas por la red neuronal Swin3D.
                    </Typography>
                </Box>

                <Card sx={{ p: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <TextField label="Desde" type="date" size="small" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} InputLabelProps={{ shrink: true }} />
                    <TextField label="Hasta" type="date" size="small" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} InputLabelProps={{ shrink: true }} />
                    <Select value={confidence} onChange={handleConfChange} size="small" displayEmpty sx={{ minWidth: 160 }}>
                        <MenuItem value="">Confianza (Todos)</MenuItem>
                        <MenuItem value="0.5">≥ 50% Precisión</MenuItem>
                        <MenuItem value="0.7">≥ 70% Precisión</MenuItem>
                        <MenuItem value="0.9">≥ 90% Precisión</MenuItem>
                    </Select>
                </Card>
            </Box>

            <Tabs value={activeCategory} onChange={handleTabChange} sx={{ bgcolor: '#f1f5f9', borderRadius: '12px', p: 0.5, minHeight: 40, '& .MuiTabs-indicator': { display: 'none' } }}>
                {(['Golpes', 'Patadas', 'Forcejeos'] as Category[]).map((c) => (
                    <Tab key={c} label={c} value={c} sx={{ textTransform: 'none', borderRadius: '8px', minHeight: 32, px: 3, fontWeight: 600, color: '#475569', '&.Mui-selected': { bgcolor: 'white', color: 'primary.main', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } }} />
                ))}
            </Tabs>
        </Box>
    );
};

/* ============================
   Item de lista (Tarjeta mejorada)
============================ */
type EventCardProps = {
    evento: EventoResponse & {
        _category: Category;
        _duration: number;
        _createdAt: string;
        _timestamp: Date;
        _cameraName: string;
        _officeName: string;
        _locationText: string;
    };
    onClick: () => void;
};

const EventCard: React.FC<EventCardProps> = ({ evento, onClick }) => {
    const category = evento._category;

    return (
        <Card
            sx={{
                borderRadius: 4,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                border: '1px solid #f1f5f9',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
                    transform: 'translateY(-2px)',
                    borderColor: '#cbd5e1'
                },
            }}
            onClick={onClick}
        >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                
                {/* Lado Izquierdo: Thumbnail de Video Inteligente */}
                <VideoThumbnail clipId={evento.id_clip} label={evento.tipo_evento.toUpperCase()} />

                {/* Lado Derecho: Metadatos Estructurados (Sintaxis Grid v2) */}
                <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    
                    {/* Fila superior: Código e Identificación primaria */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600, display: 'block' }}>
                                AUDIT_ID: EVT-{evento.id_evento.toString().padStart(6, '0')}
                            </Typography>

                        </Box>
                        
                        <Stack direction="row" spacing={1}>
                            <Chip 
                                label={category.toUpperCase()} 
                                size="small" 
                                sx={{ ...getSeverityStyles(category), fontWeight: 700, borderRadius: 1.5 }} 
                            />
                            <Chip 
                                icon={<Percent fontSize="small" style={{ color: 'inherit', fontSize: '0.85rem' }} />}
                                label={evento.confianza ? `${(parseFloat(String(evento.confianza)) * 100).toFixed(0)}% Match` : 'N/A'} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontWeight: 700, color: evento.confianza ? '#10b981' : '#64748b', borderColor: evento.confianza ? '#a7f3d0' : '#e2e8f0', bgcolor: evento.confianza ? '#f0fdf4' : 'transparent', borderRadius: 1.5 }} 
                            />
                        </Stack>
                    </Box>

                    <Divider sx={{ mb: 2, opacity: 0.6 }} />

                    {/* Fila Inferior: Panel de Auditoría cruzada con Grid v2 */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CorporateFare sx={{ color: '#64748b', fontSize: 18 }} />
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>SEDE / OFICINA</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{evento._officeName}</Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Videocam sx={{ color: '#3b82f6', fontSize: 18 }} />
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>NODO DE ORIGEN</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{evento._cameraName}</Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Place sx={{ color: '#ef4444', fontSize: 18 }} />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>DIRECCIÓN GEORREFERENCIADA</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {evento._locationText}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Timer sx={{ color: '#6366f1', fontSize: 18 }} />
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>DURACIÓN</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{evento._duration} seg</Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {/* Usamos el ícono de CalendarMonth que ya tienes importado o puedes usar AccessTime si lo importas */}
                                <CalendarMonth sx={{ color: '#0284c7', fontSize: 18 }} />
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>HORA</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                                        {new Date(evento.timestamp_evento).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                </Box>
            </Box>
        </Card>
    );
};

export const ClipsPage: React.FC = () => {
    const { getAllConexions } = useConexion();
    const { getAllOffices } = useOficina();
    const { data: eventos, loading: loadingEvt, error: errorEvt } = useEventos();

    const [activeCategory, setActiveCategory] = useState<Category>('Forcejeos'); // Fijo inicial en forcejeos por tus pruebas
    const [selected, setSelected] = useState<EventoResponse | null>(null);
    const [camaras, setCamaras] = useState<any[]>([]);
    const [oficinas, setOficinas] = useState<any[]>([]);
    const [loadingBases, setLoadingBases] = useState(true);

    // Filtros UI
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [confidence, setConfidence] = useState<string>('');

    // Carga de catálogos relacionales de Postgres en paralelo
    useEffect(() => {
        const cargarCatalogos = async () => {
            setLoadingBases(true);
            try {
                const [resCams, resOffices] = await Promise.all([
                    getAllConexions(),
                    getAllOffices()
                ]);
                setCamaras(resCams ?? []);
                setOficinas(resOffices ?? []);
            } catch (e) {
                console.log("Error cargando catálogos relacionales en historial", e);
            } finally {
                setLoadingBases(false);
            }
        };
        cargarCatalogos();
    }, []);

    // 🚀 CRUCE DE INFORMACIÓN DATA-ENGINEER LEVEL
    const eventosDecorados = useMemo(() => {
        return (eventos || []).map((e) => {
            // Buscamos la fila de la cámara por el id_conexion del evento
            const camara = camaras.find((c) => c.id === e.id_conexion);
            // Buscamos la oficina a la que pertenece la cámara
            const oficina = oficinas.find((o) => o.id === camara?.id_oficina);

            return {
                ...e,
                _category: toCategory(e.tipo_evento),
                _duration: e.subclip_duracion_sec ?? Math.max(0, Math.round(((e.t_fin_ms ?? 0) - (e.t_inicio_ms ?? 0)) / 1000)),
                _createdAt: niceDate(e.timestamp_evento),
                _timestamp: new Date(e.timestamp_evento),
                // Inyecciones relacionales seguras
                _cameraName: camara?.nombre_camara || `Nodo ID: ${e.id_conexion}`,
                _officeName: oficina?.nombre || oficina?.nombre_oficina || "Central General",
                _locationText: camara?.ubicacion || "Ubicación no parametrizada"
            };
        });
    }, [eventos, camaras, oficinas]);

    // Filtrado seguro contra Timezones por String nativo (Cero desajustes locales)
    const filtered = useMemo(() => {
        return eventosDecorados.filter((e) => {
            if (e._category !== activeCategory) return false;

            const eventDateStr = e.timestamp_evento.slice(0, 10);
            if (dateFrom && eventDateStr < dateFrom) return false;
            if (dateTo && eventDateStr > dateTo) return false;

            if (confidence) {
                const min = parseFloat(confidence);
                const conf = e.confianza ?? 0;
                if (conf < min) return false;
            }
            return true;
        });
    }, [eventosDecorados, activeCategory, dateFrom, dateTo, confidence]);

    if (selected) {
        // Obtenemos los cruces en caliente para pasárselos al componente hijo
        const camara = camaras.find((c) => c.id === selected.id_conexion);
        const oficina = oficinas.find((o) => o.id === camara?.id_oficina);

        return (
            <Box sx={{ p: { xs: 1, md: 3 }, minHeight: '100vh', bgcolor: '#f8fafc' }}>
                <EventDetail
                    evento={selected} 
                    cameraName={camara?.nombre_camara || `Nodo ID: ${selected.id_conexion}`}
                    officeName={oficina?.nombre || oficina?.nombre_oficina || "Central General"}
                    locationText={camara?.ubicacion || "Ubicación no parametrizada"}
                    severityStyles={getSeverityStyles(toCategory(selected.tipo_evento))}
                    category={toCategory(selected.tipo_evento)}
                    onBack={() => setSelected(null)}
                    useClipHook={useClip}               // Pasamos el hook de clips
                    useEventoLogHook={useEventoLog}     // Pasamos el hook de logs JSON
                />
            </Box>
        );
    }

    const isLoadingAll = loadingEvt || loadingBases;

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', bgcolor: '#f8fafc' }}>
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

            {isLoadingAll && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            )}

            {errorEvt && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                    Error al recuperar el repositorio de eventos: {errorEvt}
                </Alert>
            )}

            {!isLoadingAll && !errorEvt && filtered.length === 0 && (
                <Alert severity="info" sx={{ borderRadius: 3 }}>
                    No se registran clips históricos de {activeCategory} bajo los parámetros especificados.
                </Alert>
            )}

            <Stack spacing={2.5}>
                {filtered.map((e) => (
                    <EventCard key={e.id_evento} evento={e} onClick={() => setSelected(e)} />
                ))}
            </Stack>
        </Box>
    );
};
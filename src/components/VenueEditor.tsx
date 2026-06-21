'use client';

import { useState, useRef } from 'react';
import type { Venue, Building, PointType } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

// ── Local types ──────────────────────────────────────────────────

type Mode = 'room' | 'point' | 'connect' | 'select';

interface EditorRoom {
  _id: string;
  x: number; y: number;
  w: number; h: number;
  label: string;
}

interface EditorPoint {
  id: string;
  name: string;
  type: PointType;
  x: number; y: number;
  emoji: string;
  description: string;
  imageUrl: string;
  audioUrl: string;
}

interface DrawState {
  startX: number; startY: number;
  currentX: number; currentY: number;
}

// ── Helpers ──────────────────────────────────────────────────────

function svgCoords(e: React.MouseEvent, svg: SVGSVGElement) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
  return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
}

async function uploadToStorage(
  file: File,
  venueId: string,
  pointId: string,
  kind: 'photo' | 'audio'
): Promise<string | null> {
  const client = createClient();
  if (!client) return null;
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${venueId}/${pointId}/${kind}.${ext}`;
  const { error } = await client.storage.from('venue-media').upload(path, file, { upsert: true });
  if (error) return null;
  return client.storage.from('venue-media').getPublicUrl(path).data.publicUrl;
}

const POINT_TYPES: { value: PointType; label: string; emoji: string }[] = [
  { value: 'entrance', label: 'Entrada',        emoji: '🚪' },
  { value: 'restroom', label: 'Baño',           emoji: '🚻' },
  { value: 'food',     label: 'Comida',         emoji: '🍽️' },
  { value: 'service',  label: 'Servicio',       emoji: '🛎️' },
  { value: 'info',     label: 'Información',    emoji: 'ℹ️' },
  { value: 'medical',  label: 'Médico',         emoji: '🏥' },
  { value: 'parking',  label: 'Estacionamiento',emoji: '🅿️' },
  { value: 'venue',    label: 'Salón',          emoji: '🏛️' },
  { value: 'shop',     label: 'Tienda',         emoji: '🛍️' },
  { value: 'custom',   label: 'Otro',           emoji: '📍' },
];

// ── Main component ───────────────────────────────────────────────

export function VenueEditor({ venue }: { venue: Venue }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<Mode>('room');
  const [zoom, setZoom] = useState(1);

  // Rooms
  const [rooms, setRooms] = useState<EditorRoom[]>(() =>
    venue.buildings.map((b, i) => ({ _id: `room-${i}`, x: b.x, y: b.y, w: b.w, h: b.h, label: b.label }))
  );
  const [drawState, setDrawState] = useState<DrawState | null>(null);
  const [pendingRoom, setPendingRoom] = useState<DrawState | null>(null);
  const [roomName, setRoomName] = useState('');

  // Points
  const [points, setPoints] = useState<EditorPoint[]>(() =>
    Object.values(venue.points).map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      x: p.x, y: p.y,
      emoji: p.emoji ?? '',
      description: p.description ?? '',
      imageUrl: p.imageUrl ?? '',
      audioUrl: p.audioUrl ?? '',
    }))
  );
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [pendingType, setPendingType] = useState<PointType>('entrance');

  // Paths
  const [paths, setPaths] = useState<[string, string][]>([...venue.paths]);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  // Selection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const deletedPointIds = useRef(new Set<string>());
  const [uploading, setUploading] = useState(false);

  // Save
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // ── Canvas events ────────────────────────────────────────────────

  function onCanvasMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current) return;
    // Only react to direct SVG clicks (not clicks on children)
    if (e.target !== svgRef.current && (e.target as SVGElement).tagName === 'rect' && mode !== 'room') return;

    if (mode === 'room') {
      const { x, y } = svgCoords(e, svgRef.current);
      setDrawState({ startX: x, startY: y, currentX: x, currentY: y });
    }
    if (mode === 'point' && e.target === svgRef.current) {
      const { x, y } = svgCoords(e, svgRef.current);
      setPendingPoint({ x, y });
      setPendingName('');
      setPendingType('entrance');
    }
  }

  function onCanvasMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !drawState) return;
    const { x, y } = svgCoords(e, svgRef.current);
    setDrawState(d => d ? { ...d, currentX: x, currentY: y } : null);
  }

  function onCanvasMouseUp() {
    if (!drawState) return;
    const x = Math.min(drawState.startX, drawState.currentX);
    const y = Math.min(drawState.startY, drawState.currentY);
    const w = Math.abs(drawState.currentX - drawState.startX);
    const h = Math.abs(drawState.currentY - drawState.startY);
    setDrawState(null);
    if (w > 3 && h > 3) {
      setPendingRoom({ startX: x, startY: y, currentX: x + w, currentY: y + h });
      setRoomName('');
    }
  }

  // ── Confirm pending room ─────────────────────────────────────────

  function confirmRoom() {
    if (!pendingRoom || !roomName.trim()) return;
    setRooms(rs => [...rs, {
      _id: `room-${Date.now()}`,
      x: pendingRoom.startX,
      y: pendingRoom.startY,
      w: pendingRoom.currentX - pendingRoom.startX,
      h: pendingRoom.currentY - pendingRoom.startY,
      label: roomName.trim(),
    }]);
    setPendingRoom(null);
  }

  // ── Confirm pending point ────────────────────────────────────────

  function confirmPoint() {
    if (!pendingPoint || !pendingName.trim()) return;
    const typeInfo = POINT_TYPES.find(t => t.value === pendingType);
    setPoints(ps => [...ps, {
      id: `pt-${Date.now()}`,
      name: pendingName.trim(),
      type: pendingType,
      x: pendingPoint.x,
      y: pendingPoint.y,
      emoji: typeInfo?.emoji ?? '📍',
      description: '',
      imageUrl: '',
      audioUrl: '',
    }]);
    setPendingPoint(null);
  }

  // ── Point click ──────────────────────────────────────────────────

  function onPointClick(e: React.MouseEvent, pointId: string) {
    e.stopPropagation();
    if (mode === 'connect') {
      if (!connectingFrom) {
        setConnectingFrom(pointId);
      } else if (connectingFrom === pointId) {
        setConnectingFrom(null);
      } else {
        const a = connectingFrom, b = pointId;
        const exists = paths.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
        if (!exists) setPaths(ps => [...ps, [a, b]]);
        setConnectingFrom(null);
      }
    } else if (mode === 'select') {
      setSelectedId(pointId);
    }
  }

  function onRoomClick(e: React.MouseEvent, roomId: string) {
    e.stopPropagation();
    if (mode === 'select') setSelectedId(roomId);
  }

  // ── Delete selected ──────────────────────────────────────────────

  function deleteSelected() {
    if (!selectedId) return;
    const isPoint = points.some(p => p.id === selectedId);
    if (isPoint) {
      if (!selectedId.startsWith('pt-')) deletedPointIds.current.add(selectedId);
      setPoints(ps => ps.filter(p => p.id !== selectedId));
      setPaths(ps => ps.filter(([a, b]) => a !== selectedId && b !== selectedId));
    } else {
      setRooms(rs => rs.filter(r => r._id !== selectedId));
    }
    setSelectedId(null);
  }

  // ── Update selected point field ──────────────────────────────────

  function updatePoint(field: keyof EditorPoint, value: string) {
    setPoints(ps => ps.map(p => p.id === selectedId ? { ...p, [field]: value } : p));
  }

  // ── Upload media ─────────────────────────────────────────────────

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, kind: 'photo' | 'audio') {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    setUploading(true);
    const url = await uploadToStorage(file, venue.id, selectedId, kind);
    if (url) updatePoint(kind === 'photo' ? 'imageUrl' : 'audioUrl', url);
    setUploading(false);
    e.target.value = '';
  }

  // ── Save ─────────────────────────────────────────────────────────

  async function save() {
    const client = createClient();
    if (!client) { setSaveMsg('Sin conexión a Supabase'); return; }
    setSaving(true);
    setSaveMsg('');
    try {
      const buildings: Building[] = rooms.map(({ _id: _, ...b }) => b);
      const { error: venueErr } = await client.from('venues').update({
        config: { floorWidth: venue.floorWidth, floorHeight: venue.floorHeight, buildings, paths },
        updated_at: new Date().toISOString(),
      }).eq('id', venue.id);
      if (venueErr) throw venueErr;

      if (points.length) {
        const { error: pointsErr } = await client.from('points').upsert(
          points.map(p => ({
            id: p.id,
            venue_id: venue.id,
            name: p.name,
            type: p.type,
            x: p.x,
            y: p.y,
            emoji: p.emoji || null,
            description: p.description || null,
            image_url: p.imageUrl || null,
            audio_url: p.audioUrl || null,
          })),
          { onConflict: 'venue_id,id' }
        );
        if (pointsErr) throw pointsErr;
      }

      for (const id of deletedPointIds.current) {
        await client.from('points').delete().eq('venue_id', venue.id).eq('id', id);
      }
      deletedPointIds.current.clear();
      setSaveMsg('Guardado ✓');
    } catch (err: unknown) {
      setSaveMsg(`Error: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Wheel zoom ───────────────────────────────────────────────────

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(4, z - e.deltaY * 0.001)));
  }

  // ── Derived ──────────────────────────────────────────────────────

  const selectedPoint = selectedId ? points.find(p => p.id === selectedId) ?? null : null;
  const selectedRoom = selectedId ? rooms.find(r => r._id === selectedId) ?? null : null;

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left: canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="border-b border-warm-100 px-4 py-2 flex items-center gap-1 flex-wrap">
          {([
            ['room',    '▭', 'Habitación'],
            ['point',   '📍', 'Punto'],
            ['connect', '↔',  'Conectar'],
            ['select',  '↖',  'Seleccionar'],
          ] as const).map(([m, icon, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setConnectingFrom(null); setSelectedId(null); setPendingPoint(null); setPendingRoom(null); }}
              className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors"
              style={{
                background: mode === m ? '#0F1B2E' : 'transparent',
                color: mode === m ? 'white' : '#0F1B2E',
              }}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-warm-400">{Math.round(zoom * 100)}%</span>
            {saveMsg && <span className="text-xs text-warm-500">{saveMsg}</span>}
            <button
              onClick={save}
              disabled={saving}
              className="btn btn-primary text-sm"
            >
              {saving ? 'Guardando…' : 'Guardar venue'}
            </button>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="flex-1 overflow-auto bg-warm-50 relative" onWheel={onWheel}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', display: 'inline-block' }}>
            <svg
              ref={svgRef}
              width={venue.floorWidth * 4}
              height={venue.floorHeight * 4}
              viewBox={`0 0 ${venue.floorWidth} ${venue.floorHeight}`}
              className="block select-none"
              style={{
                cursor: mode === 'room' ? 'crosshair' : mode === 'point' ? 'cell' : 'default',
                background: '#FAFAF8',
                border: '1px solid #EFEEEA',
              }}
              onMouseDown={onCanvasMouseDown}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onCanvasMouseUp}
            >
              {/* Grid */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E8E6E1" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Rooms */}
              {rooms.map(r => (
                <g key={r._id} onClick={e => onRoomClick(e, r._id)} style={{ cursor: mode === 'select' ? 'pointer' : 'default' }}>
                  <rect
                    x={r.x} y={r.y} width={r.w} height={r.h}
                    fill="#E8E6E1"
                    stroke={selectedId === r._id ? '#E63946' : '#C8C5BE'}
                    strokeWidth={selectedId === r._id ? 1 : 0.5}
                    rx={1}
                  />
                  <text
                    x={r.x + r.w / 2} y={r.y + r.h / 2}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.max(3, Math.min(r.w, r.h) * 0.16)}
                    fill="#666"
                    style={{ pointerEvents: 'none' }}
                  >
                    {r.label}
                  </text>
                </g>
              ))}

              {/* Drawing preview */}
              {drawState && (
                <rect
                  x={Math.min(drawState.startX, drawState.currentX)}
                  y={Math.min(drawState.startY, drawState.currentY)}
                  width={Math.abs(drawState.currentX - drawState.startX)}
                  height={Math.abs(drawState.currentY - drawState.startY)}
                  fill="#E8E6E1" fillOpacity={0.5}
                  stroke="#0F1B2E" strokeWidth={0.8} strokeDasharray="3,2"
                  rx={1}
                />
              )}

              {/* Paths */}
              {paths.map(([a, b], i) => {
                const pa = points.find(p => p.id === a);
                const pb = points.find(p => p.id === b);
                if (!pa || !pb) return null;
                return (
                  <line key={i}
                    x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke="#C8C5BE" strokeWidth={0.8} strokeDasharray="2,2"
                  />
                );
              })}

              {/* Connect target rings */}
              {mode === 'connect' && connectingFrom && points.map(p => {
                if (p.id === connectingFrom) return null;
                return (
                  <circle key={`ring-${p.id}`}
                    cx={p.x} cy={p.y} r={7}
                    fill="none" stroke="#E63946" strokeWidth={0.8} opacity={0.4}
                  />
                );
              })}

              {/* Points */}
              {points.map(p => (
                <g key={p.id} onClick={e => onPointClick(e, p.id)}
                  style={{ cursor: mode === 'select' || mode === 'connect' ? 'pointer' : 'default' }}>
                  <circle
                    cx={p.x} cy={p.y} r={4}
                    fill={connectingFrom === p.id || selectedId === p.id ? '#E63946' : '#0F1B2E'}
                    stroke="white" strokeWidth={0.8}
                  />
                  <text
                    x={p.x} y={p.y - 6}
                    textAnchor="middle" fontSize={3.5} fill="#0F1B2E"
                    style={{ pointerEvents: 'none' }}
                  >
                    {p.emoji || p.name.slice(0, 1)}
                  </text>
                  <text
                    x={p.x} y={p.y + 8}
                    textAnchor="middle" fontSize={2.5} fill="#888"
                    style={{ pointerEvents: 'none' }}
                  >
                    {p.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Pending room name popup */}
          {pendingRoom && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="surface p-4 shadow-lg w-64 pointer-events-auto">
                <div className="text-sm font-semibold mb-2">Nombre del espacio</div>
                <input
                  autoFocus
                  type="text"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmRoom(); if (e.key === 'Escape') setPendingRoom(null); }}
                  placeholder="ej. Salón principal"
                  className="w-full px-3 py-2 border border-warm-100 rounded-lg text-sm mb-3 focus:outline-none focus:border-ink"
                />
                <div className="flex gap-2">
                  <button onClick={confirmRoom} className="btn btn-primary flex-1 text-sm">Crear</button>
                  <button onClick={() => setPendingRoom(null)} className="btn btn-outline flex-1 text-sm">Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Pending point mini form */}
          {pendingPoint && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="surface p-4 shadow-lg w-64 pointer-events-auto">
                <div className="text-sm font-semibold mb-2">Nuevo punto</div>
                <input
                  autoFocus
                  type="text"
                  value={pendingName}
                  onChange={e => setPendingName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmPoint(); if (e.key === 'Escape') setPendingPoint(null); }}
                  placeholder="ej. Entrada principal"
                  className="w-full px-3 py-2 border border-warm-100 rounded-lg text-sm mb-2 focus:outline-none focus:border-ink"
                />
                <select
                  value={pendingType}
                  onChange={e => setPendingType(e.target.value as PointType)}
                  className="w-full px-3 py-2 border border-warm-100 rounded-lg text-sm mb-3 focus:outline-none focus:border-ink"
                >
                  {POINT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={confirmPoint} className="btn btn-primary flex-1 text-sm">Colocar</button>
                  <button onClick={() => setPendingPoint(null)} className="btn btn-outline flex-1 text-sm">Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: side panel (only in select mode when something is selected) */}
      {mode === 'select' && (selectedPoint || selectedRoom) && (
        <div className="w-72 border-l border-warm-100 overflow-y-auto shrink-0">
          <div className="p-4">
            {selectedPoint ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs label-text">Punto seleccionado</div>
                  <button onClick={deleteSelected} className="text-xs text-red-500 hover:text-red-700">Borrar</button>
                </div>

                <div>
                  <label className="text-xs text-warm-500 block mb-1">Nombre</label>
                  <input type="text" value={selectedPoint.name}
                    onChange={e => updatePoint('name', e.target.value)}
                    className="w-full px-2.5 py-2 border border-warm-100 rounded-lg text-sm focus:outline-none focus:border-ink" />
                </div>

                <div>
                  <label className="text-xs text-warm-500 block mb-1">Tipo</label>
                  <select value={selectedPoint.type}
                    onChange={e => updatePoint('type', e.target.value)}
                    className="w-full px-2.5 py-2 border border-warm-100 rounded-lg text-sm focus:outline-none focus:border-ink">
                    {POINT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-warm-500 block mb-1">Emoji</label>
                  <input type="text" value={selectedPoint.emoji} maxLength={2}
                    onChange={e => updatePoint('emoji', e.target.value)}
                    className="w-full px-2.5 py-2 border border-warm-100 rounded-lg text-sm focus:outline-none focus:border-ink" />
                </div>

                <div>
                  <label className="text-xs text-warm-500 block mb-1">Descripción</label>
                  <textarea value={selectedPoint.description}
                    onChange={e => updatePoint('description', e.target.value)}
                    rows={3}
                    className="w-full px-2.5 py-2 border border-warm-100 rounded-lg text-sm focus:outline-none focus:border-ink resize-none" />
                </div>

                <div>
                  <label className="text-xs text-warm-500 block mb-1">Foto</label>
                  {selectedPoint.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedPoint.imageUrl} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                  )}
                  <input type="file" accept="image/*" disabled={uploading}
                    onChange={e => handleFileUpload(e, 'photo')}
                    className="w-full text-xs text-warm-500" />
                </div>

                <div>
                  <label className="text-xs text-warm-500 block mb-1">Audio</label>
                  {selectedPoint.audioUrl && (
                    <audio controls src={selectedPoint.audioUrl} className="w-full mb-2" />
                  )}
                  <input type="file" accept="audio/*" disabled={uploading}
                    onChange={e => handleFileUpload(e, 'audio')}
                    className="w-full text-xs text-warm-500" />
                </div>

                {uploading && <p className="text-xs text-warm-400">Subiendo archivo…</p>}

                <div className="text-xs text-warm-400">
                  Posición: ({selectedPoint.x}, {selectedPoint.y})
                </div>
              </div>
            ) : selectedRoom ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs label-text">Habitación seleccionada</div>
                  <button onClick={deleteSelected} className="text-xs text-red-500 hover:text-red-700">Borrar</button>
                </div>
                <div className="text-sm font-semibold">{selectedRoom.label}</div>
                <div className="text-xs text-warm-400">
                  {Math.round(selectedRoom.w)} × {Math.round(selectedRoom.h)} m
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

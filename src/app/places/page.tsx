'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import AuthGuard from '@/components/AuthGuard';
import PlaceEditModal from '@/components/PlaceEditModal';
import { PlaceModel, PLACE_TYPES } from '@/types';
import {
  Search, Filter, RefreshCw, Check, X, Edit2, Trash2, MapPin, Eye, EyeOff, Star
} from 'lucide-react';

type SortField = 'name' | 'region' | 'type' | 'baseRating' | 'createdAt';
type FilterStatus = 'all' | 'published' | 'unpublished';

export default function PlacesPage() {
  const [places, setPlaces] = useState<PlaceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editPlace, setEditPlace] = useState<PlaceModel | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => { loadPlaces(); }, []);

  const loadPlaces = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'places'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PlaceModel));
      setPlaces(data);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (place: PlaceModel) => {
    setTogglingId(place.id);
    try {
      await updateDoc(doc(db, 'places', place.id), { isPublished: !place.isPublished });
      setPlaces(ps => ps.map(p => p.id === place.id ? { ...p, isPublished: !p.isPublished } : p));
    } finally {
      setTogglingId(null);
    }
  };

  const deletePlace = async (id: string) => {
    if (!confirm("Bu joyni o'chirasizmi? Bu amalni qaytarib bo'lmaydi.")) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'places', id));
      setPlaces(ps => ps.filter(p => p.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const sort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = [...places];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filterType !== 'all') list = list.filter(p => p.type === filterType);
    if (filterStatus === 'published') list = list.filter(p => p.isPublished);
    if (filterStatus === 'unpublished') list = list.filter(p => !p.isPublished);

    list.sort((a, b) => {
      let va: unknown = a[sortField];
      let vb: unknown = b[sortField];
      if (sortField === 'createdAt') {
        va = a.createdAt ? new Date(a.createdAt as unknown as string).getTime() : 0;
        vb = b.createdAt ? new Date(b.createdAt as unknown as string).getTime() : 0;
      }
      if (typeof va === 'string' && typeof vb === 'string')
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      if (typeof va === 'number' && typeof vb === 'number')
        return sortDir === 'asc' ? va - vb : vb - va;
      return 0;
    });
    return list;
  }, [places, search, filterType, filterStatus, sortField, sortDir]);

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => sort(field)}
      className="flex items-center gap-1 hover:opacity-70 transition-opacity"
    >
      {label}
      {sortField === field && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );

  return (
    <AuthGuard>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Joylar</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {filtered.length} ta joy (jami {places.length})
            </p>
          </div>
          <button onClick={loadPlaces} className="btn-ghost flex items-center gap-2">
            <RefreshCw size={15} /> Yangilash
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-5">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="input pl-9"
                placeholder="Qidirish: nom, viloyat, teg..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Type filter */}
            <select className="input w-auto min-w-36" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">Barcha turlar</option>
              {PLACE_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
            {/* Status filter */}
            <select className="input w-auto min-w-36" value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as FilterStatus)}>
              <option value="all">Barcha holat</option>
              <option value="published">Nashr etilgan</option>
              <option value="unpublished">Tasdiqlanmagan</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center" style={{ color: 'var(--text-muted)' }}>
              <MapPin size={40} className="mx-auto mb-3 opacity-30" />
              <p>Hech narsa topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th><SortBtn field="name" label="Nom" /></th>
                    <th><SortBtn field="region" label="Viloyat" /></th>
                    <th><SortBtn field="type" label="Tur" /></th>
                    <th><SortBtn field="baseRating" label="Reyting" /></th>
                    <th>Holat</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(place => {
                    const pt = PLACE_TYPES.find(t => t.id === place.type);
                    return (
                      <tr key={place.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            {place.images?.[0] ? (
                              <img src={place.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                                style={{ background: 'var(--border)' }}>
                                {pt?.icon || '📍'}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{place.name}</div>
                              {place.tags?.length > 0 && (
                                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  {place.tags.slice(0, 3).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td><span style={{ color: 'var(--text-muted)' }}>{place.region || '—'}</span></td>
                        <td>
                          <span className="badge badge-blue">{pt?.icon} {pt?.label || place.type}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Star size={13} fill="#f59e0b" color="#f59e0b" />
                            <span className="text-sm">{place.baseRating?.toFixed(1) || '—'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${place.isPublished ? 'badge-green' : 'badge-yellow'}`}>
                            {place.isPublished ? 'Nashr' : 'Kutmoqda'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            {/* Accept/Reject toggle */}
                            <button
                              onClick={() => togglePublish(place)}
                              disabled={togglingId === place.id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                              title={place.isPublished ? "Nashrdan chiqarish" : "Tasdiqlash"}
                              style={{
                                background: place.isPublished ? '#fee2e2' : '#dcfce7',
                                color: place.isPublished ? '#dc2626' : '#16a34a',
                              }}
                            >
                              {place.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            {/* Edit */}
                            <button
                              onClick={() => setEditPlace(place)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                              title="Tahrirlash"
                              style={{ background: '#dbeafe', color: '#2563eb' }}
                            >
                              <Edit2 size={14} />
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => deletePlace(place.id)}
                              disabled={deleting === place.id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                              title="O'chirish"
                              style={{ background: '#fee2e2', color: '#dc2626' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editPlace && (
        <PlaceEditModal
          place={editPlace}
          onClose={() => setEditPlace(null)}
          onSaved={loadPlaces}
        />
      )}
    </AuthGuard>
  );
}

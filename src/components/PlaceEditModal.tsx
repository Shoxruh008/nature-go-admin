'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { X, Plus, Trash2 } from 'lucide-react';
import { PlaceModel, PLACE_TYPES, SEASONS, SEASON_UZ, ALL_TAGS, TAG_UZ } from '@/types';

interface Props {
  place: PlaceModel;
  onClose: () => void;
  onSaved: () => void;
}

export default function PlaceEditModal({ place, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ ...place });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newTag, setNewTag] = useState('');

  const set = (field: keyof PlaceModel, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const ref = doc(db, 'places', place.id);
      const { id, createdAt, ...rest } = form;
      await updateDoc(ref, { ...rest });
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Joyni tahrirlash</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Nomi *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Viloyat *</label>
            <input className="input" value={form.region} onChange={e => set('region', e.target.value)} />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Turi</label>
            <select
              className="input"
              value={form.type}
              onChange={e => set('type', e.target.value)}
            >
              {PLACE_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Kenglik (lat)</label>
              <input className="input" type="number" step="any" value={form.lat}
                onChange={e => set('lat', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Uzunlik (lng)</label>
              <input className="input" type="number" step="any" value={form.lng}
                onChange={e => set('lng', parseFloat(e.target.value))} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Tavsif</label>
            <textarea className="input" rows={3} value={form.description}
              onChange={e => set('description', e.target.value)} />
          </div>

          {/* Base rating */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Asosiy reyting ({form.baseRating})
            </label>
            <input className="input" type="range" min={1} max={5} step={0.1}
              value={form.baseRating} onChange={e => set('baseRating', parseFloat(e.target.value))} />
          </div>

          {/* Published */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => set('isPublished', !form.isPublished)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer`}
                style={{ background: form.isPublished ? 'var(--primary)' : 'var(--border)' }}
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ left: form.isPublished ? '22px' : '4px' }}
                />
              </div>
              <span className="text-sm" style={{ color: 'var(--text)' }}>
                {form.isPublished ? 'Nashr etilgan' : 'Nashr etilmagan'}
              </span>
            </label>
          </div>

          {/* Seasons */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Fasllar</label>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map(s => {
                const active = form.seasonTypes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('seasonTypes', active
                      ? form.seasonTypes.filter(x => x !== s)
                      : [...form.seasonTypes, s]
                    )}
                    className="badge text-sm cursor-pointer"
                    style={active
                      ? { background: 'var(--primary)', color: 'white' }
                      : { background: 'var(--border)', color: 'var(--text-muted)' }
                    }
                  >
                    {SEASON_UZ[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Teglar</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map(tag => (
                <span key={tag} className="badge badge-blue flex items-center gap-1">
                  {TAG_UZ[tag] || tag}
                  <button onClick={() => set('tags', form.tags.filter(t => t !== tag))}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <select
              className="input"
              value=""
              onChange={e => {
                if (e.target.value && !form.tags.includes(e.target.value)) {
                  set('tags', [...form.tags, e.target.value]);
                }
              }}
            >
              <option value="">Teg qo'shish...</option>
              {ALL_TAGS.filter(t => !form.tags.includes(t)).map(t => (
                <option key={t} value={t}>{TAG_UZ[t] || t}</option>
              ))}
            </select>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Rasmlar</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {form.images.map((img, i) => (
                <div key={i} className="relative group aspect-video rounded-lg overflow-hidden"
                  style={{ background: 'var(--border)' }}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: '#dc2626' }}
                  >
                    <Trash2 size={12} color="white" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Rasm URL manzilini kiriting..."
                value={newImage}
                onChange={e => setNewImage(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary px-3"
                onClick={() => {
                  if (newImage.trim()) {
                    set('images', [...form.images, newImage.trim()]);
                    setNewImage('');
                  }
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Video URL</label>
            <input className="input" value={form.videoUrl || ''}
              onChange={e => set('videoUrl', e.target.value || null)} />
          </div>

          {/* Route file URL */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Marshrut fayl URL</label>
            <input className="input" value={form.routeFileUrl || ''}
              onChange={e => set('routeFileUrl', e.target.value || null)} />
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t sticky bottom-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <button onClick={onClose} className="btn-ghost flex-1">Bekor qilish</button>
          <button onClick={save} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

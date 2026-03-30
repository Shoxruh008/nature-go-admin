'use client';
import { useState, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { X, Plus, Trash2, Upload, FileText, Loader2 } from 'lucide-react';
import { PlaceModel, PLACE_TYPES, SEASONS, SEASON_UZ, ALL_TAGS, TAG_UZ } from '@/types';

interface Props {
  place: PlaceModel;
  onClose: () => void;
  onSaved: () => void;
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="mt-1">
      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        <span>Yuklanmoqda...</span><span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--primary)' }} />
      </div>
    </div>
  );
}

export default function PlaceEditModal({ place, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ ...place });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageProgress, setImageProgress] = useState<number | null>(null);
  const [gpxProgress, setGpxProgress] = useState<number | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingGpx, setUploadingGpx] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const gpxRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof PlaceModel, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError("Faqat rasm fayllari qabul qilinadi"); return; }
    setUploadingImg(true); setImageProgress(0); setError('');
    const path = `places/${place.id}/images/${Date.now()}_${file.name}`;
    const task = uploadBytesResumable(storageRef(storage, path), file);
    task.on('state_changed',
      snap => setImageProgress((snap.bytesTransferred / snap.totalBytes) * 100),
      err => { setError('Rasm yuklashda xatolik: ' + err.message); setUploadingImg(false); setImageProgress(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setForm(f => ({ ...f, images: [...f.images, url] }));
        setUploadingImg(false); setImageProgress(null);
        if (imageRef.current) imageRef.current.value = '';
      }
    );
  };

  const handleGpxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.gpx') && file.type !== 'application/gpx+xml' && file.type !== 'text/xml') {
      setError('Faqat .gpx fayl qabul qilinadi'); return;
    }
    setUploadingGpx(true); setGpxProgress(0); setError('');
    const path = `places/${place.id}/routes/${Date.now()}_${file.name}`;
    const task = uploadBytesResumable(storageRef(storage, path), file, { contentType: 'application/gpx+xml' });
    task.on('state_changed',
      snap => setGpxProgress((snap.bytesTransferred / snap.totalBytes) * 100),
      err => { setError('GPX yuklashda xatolik: ' + err.message); setUploadingGpx(false); setGpxProgress(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        set('routeFileUrl', url);
        setUploadingGpx(false); setGpxProgress(null);
        if (gpxRef.current) gpxRef.current.value = '';
      }
    );
  };

  const save = async () => {
    if (!form.name.trim()) { setError("Nom bo'sh bo'lishi mumkin emas"); return; }
    setSaving(true); setError('');
    try {
      const { id, createdAt, ...rest } = form;
      void id; void createdAt;
      await updateDoc(doc(db, 'places', place.id), { ...rest });
      onSaved(); onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'var(--bg-card)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Joyni tahrirlash</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Nomi *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Viloyat *</label>
            <input className="input" value={form.region} onChange={e => set('region', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Turi</label>
            <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
              {PLACE_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Kenglik (lat)</label>
              <input className="input" type="number" step="any" value={form.lat} onChange={e => set('lat', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Uzunlik (lng)</label>
              <input className="input" type="number" step="any" value={form.lng} onChange={e => set('lng', parseFloat(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Tavsif</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Asosiy reyting ({Number(form.baseRating).toFixed(1)})
            </label>
            <input className="input" type="range" min={1} max={5} step={0.1}
              value={form.baseRating} onChange={e => set('baseRating', parseFloat(e.target.value))} />
            <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}><span>1.0</span><span>5.0</span></div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => set('isPublished', !form.isPublished)}
                className="w-10 h-6 rounded-full relative cursor-pointer transition-colors"
                style={{ background: form.isPublished ? 'var(--primary)' : 'var(--border)' }}>
                <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: form.isPublished ? '22px' : '4px' }} />
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
                const active = (form.seasonTypes || []).includes(s);
                return (
                  <button key={s} type="button"
                    onClick={() => set('seasonTypes', active
                      ? (form.seasonTypes || []).filter(x => x !== s)
                      : [...(form.seasonTypes || []), s])}
                    className="badge text-sm cursor-pointer"
                    style={active ? { background: 'var(--primary)', color: 'white' } : { background: 'var(--border)', color: 'var(--text-muted)' }}>
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
              {(form.tags || []).map(tag => (
                <span key={tag} className="badge badge-blue flex items-center gap-1">
                  {TAG_UZ[tag] || tag}
                  <button onClick={() => set('tags', form.tags.filter(t => t !== tag))}><X size={10} /></button>
                </span>
              ))}
            </div>
            <select className="input" value="" onChange={e => {
              if (e.target.value && !(form.tags || []).includes(e.target.value))
                set('tags', [...(form.tags || []), e.target.value]);
            }}>
              <option value="">Teg qo&apos;shish...</option>
              {ALL_TAGS.filter(t => !(form.tags || []).includes(t)).map(t => (
                <option key={t} value={t}>{TAG_UZ[t] || t}</option>
              ))}
            </select>
          </div>

          {/* ===== IMAGES ===== */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Rasmlar</label>
            {(form.images || []).length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative group aspect-video rounded-lg overflow-hidden" style={{ background: 'var(--border)' }}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button onClick={async () => {
                        try {
                          if (img && img.includes('firebasestorage')) {
                            await deleteObject(storageRef(storage, img));
                          }
                        } catch { /* already deleted or external */ }
                        set('images', form.images.filter((_, j) => j !== i));
                      }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: '#dc2626' }}>
                      <Trash2 size={12} color="white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Upload from device */}
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
            <button type="button" onClick={() => imageRef.current?.click()} disabled={uploadingImg}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border-2 border-dashed text-sm mb-2 transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg)', cursor: uploadingImg ? 'not-allowed' : 'pointer', opacity: uploadingImg ? 0.6 : 1 }}>
              {uploadingImg ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploadingImg ? 'Yuklanmoqda...' : 'Qurilmadan rasm yuklash'}
            </button>
            {imageProgress !== null && <ProgressBar progress={imageProgress} />}
            {/* URL input */}
            <div className="flex gap-2 mt-2">
              <input className="input flex-1" placeholder="Yoki rasm URL manzili..." value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newImageUrl.trim()) { set('images', [...form.images, newImageUrl.trim()]); setNewImageUrl(''); } }} />
              <button type="button" className="btn-primary px-3"
                onClick={() => { if (newImageUrl.trim()) { set('images', [...form.images, newImageUrl.trim()]); setNewImageUrl(''); } }}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Video URL</label>
            <input className="input" value={form.videoUrl || ''} onChange={e => set('videoUrl', e.target.value || null)} />
          </div>

          {/* ===== GPX FILE ===== */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Marshrut fayli (.gpx)</label>
            {form.routeFileUrl && (
              <div className="flex items-center gap-2 p-2 rounded-lg mb-2"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <a href={form.routeFileUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs flex-1 truncate" style={{ color: 'var(--primary)' }}>
                  {form.routeFileUrl.includes('firebasestorage') ? 'Storage — GPX fayl saqlangan ✓' : form.routeFileUrl}
                </a>
                <button onClick={() => set('routeFileUrl', null)} style={{ color: 'var(--danger)' }} title="O'chirish">
                  <X size={14} />
                </button>
              </div>
            )}
            <input ref={gpxRef} type="file" accept=".gpx,application/gpx+xml,text/xml" className="hidden" onChange={handleGpxUpload} disabled={uploadingGpx} />
            <button type="button" onClick={() => gpxRef.current?.click()} disabled={uploadingGpx}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border-2 border-dashed text-sm mb-2 transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg)', cursor: uploadingGpx ? 'not-allowed' : 'pointer', opacity: uploadingGpx ? 0.6 : 1 }}>
              {uploadingGpx ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              {uploadingGpx ? 'Yuklanmoqda...' : 'Qurilmadan GPX fayl yuklash'}
            </button>
            {gpxProgress !== null && <ProgressBar progress={gpxProgress} />}
            <input className="input mt-2" placeholder="Yoki GPX URL manzili..."
              value={form.routeFileUrl && !form.routeFileUrl.includes('firebasestorage') ? form.routeFileUrl : ''}
              onChange={e => set('routeFileUrl', e.target.value || null)} />
          </div>

          {error && <div className="p-3 rounded-lg text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t sticky bottom-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <button onClick={onClose} className="btn-ghost flex-1">Bekor qilish</button>
          <button onClick={save} className="btn-primary flex-1" disabled={saving || uploadingImg || uploadingGpx}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

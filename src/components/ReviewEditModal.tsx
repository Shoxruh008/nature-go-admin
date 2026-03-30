'use client';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { X, Star } from 'lucide-react';
import { ReviewModel } from '@/types';

interface Props {
  review: ReviewModel;
  onClose: () => void;
  onSaved: () => void;
}

export default function ReviewEditModal({ review, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ ...review });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof ReviewModel, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const ref = doc(db, 'reviews', review.id);
      await updateDoc(ref, {
        authorName: form.authorName,
        text: form.text,
        rating: form.rating,
        isPublished: form.isPublished,
      });

      // If published, recalculate the place's baseRating
      if (form.isPublished) {
        const snap = await getDocs(
          query(collection(db, 'reviews'), where('placeId', '==', review.placeId))
        );
        const allReviews = snap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewModel));
        // Use updated rating for the current review
        const published = allReviews.map(r =>
          r.id === review.id ? { ...r, rating: form.rating, isPublished: form.isPublished } : r
        ).filter(r => r.isPublished);

        if (published.length > 0) {
          const avg = published.reduce((sum, r) => sum + (r.rating || 0), 0) / published.length;
          await updateDoc(doc(db, 'places', review.placeId), {
            baseRating: parseFloat(avg.toFixed(2))
          });
        }
      }

      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Sharhni tahrirlash</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Muallif ismi</label>
            <input className="input" value={form.authorName} onChange={e => set('authorName', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              Reyting
            </label>
            {/* Star picker */}
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => set('rating', star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    fill={star <= form.rating ? '#f59e0b' : 'none'}
                    color={star <= form.rating ? '#f59e0b' : 'var(--border)'}
                  />
                </button>
              ))}
              <span className="text-sm ml-1 font-medium" style={{ color: 'var(--text-muted)' }}>
                {form.rating}/5
              </span>
            </div>
            <input
              className="input"
              type="range" min={1} max={5} step={0.5}
              value={form.rating}
              onChange={e => set('rating', parseFloat(e.target.value))}
            />
            <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Sharh matni</label>
            <textarea className="input" rows={4} value={form.text} onChange={e => set('text', e.target.value)} />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => set('isPublished', !form.isPublished)}
                className="w-10 h-6 rounded-full relative cursor-pointer transition-colors"
                style={{ background: form.isPublished ? 'var(--primary)' : 'var(--border)' }}
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: form.isPublished ? '22px' : '4px' }}
                />
              </div>
              <span className="text-sm" style={{ color: 'var(--text)' }}>
                {form.isPublished ? 'Nashr etilgan' : 'Nashr etilmagan'}
              </span>
            </label>
            {form.isPublished && (
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                ✅ Saqlashda joy reytingi avtomatik hisoblanadi
              </p>
            )}
          </div>

          {/* Read-only info */}
          <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
            <div>Joy ID: <span style={{ color: 'var(--text)' }}>{review.placeId}</span></div>
            <div>Foydalanuvchi ID: <span style={{ color: 'var(--text)' }}>{review.authorId}</span></div>
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="btn-ghost flex-1">Bekor qilish</button>
          <button onClick={save} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState, useMemo } from 'react';
import { db, storage } from '@/lib/firebase';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import AuthGuard from '@/components/AuthGuard';
import ReviewEditModal from '@/components/ReviewEditModal';
import { ReviewModel } from '@/types';
import { Search, RefreshCw, Edit2, Trash2, Star, Eye, EyeOff, MessageSquare, CheckCircle } from 'lucide-react';

type FilterStatus = 'all' | 'published' | 'unpublished';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [minRating, setMinRating] = useState(0);
  const [editReview, setEditReview] = useState<ReviewModel | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [ratingUpdateMsg, setRatingUpdateMsg] = useState<string | null>(null);

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'reviews'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewModel));
      setReviews(data.sort((a, b) => {
        const aT = a.createdAt ? new Date(a.createdAt as unknown as string).getTime() : 0;
        const bT = b.createdAt ? new Date(b.createdAt as unknown as string).getTime() : 0;
        return bT - aT;
      }));
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (review: ReviewModel) => {
    setTogglingId(review.id);
    try {
      const newPublished = !review.isPublished;
      await updateDoc(doc(db, 'reviews', review.id), { isPublished: newPublished });

      // Update local state
      const updatedReviews = reviews.map(r =>
        r.id === review.id ? { ...r, isPublished: newPublished } : r
      );
      setReviews(updatedReviews);

      // Auto recalculate baseRating for the place
      const placePublished = updatedReviews.filter(
        r => r.placeId === review.placeId && r.isPublished
      );

      if (placePublished.length > 0) {
        const avg = placePublished.reduce((sum, r) => sum + (r.rating || 0), 0) / placePublished.length;
        const newRating = parseFloat(avg.toFixed(2));
        await updateDoc(doc(db, 'places', review.placeId), { baseRating: newRating });

        // Show brief notification
        setRatingUpdateMsg(
          `Joy reytingi yangilandi: ${newRating} ⭐ (${placePublished.length} ta sharh)`
        );
        setTimeout(() => setRatingUpdateMsg(null), 3500);
      }
    } finally {
      setTogglingId(null);
    }
  };

  const deleteReview = async (review: ReviewModel) => {
    if (!confirm("Bu sharhni o'chirasizmi? Rasmlari ham o'chadi.")) return;
    setDeletingId(review.id);
    try {
      // Delete review images from Storage
      if (review.images?.length) {
        await Promise.all(review.images.map(async (url) => {
          try {
            if (url && url.includes('firebasestorage')) {
              await deleteObject(storageRef(storage, url));
            }
          } catch { /* already deleted or external URL */ }
        }));
      }
      await deleteDoc(doc(db, 'reviews', review.id));
      setReviews(rs => rs.filter(r => r.id !== review.id));

      // Recalculate baseRating after deletion
      const remaining = reviews.filter(r => r.id !== review.id && r.placeId === review.placeId && r.isPublished);
      if (remaining.length > 0) {
        const avg = remaining.reduce((sum, r) => sum + (r.rating || 0), 0) / remaining.length;
        await updateDoc(doc(db, 'places', review.placeId), { baseRating: parseFloat(avg.toFixed(2)) });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.authorName.toLowerCase().includes(q) ||
        r.text.toLowerCase().includes(q) ||
        r.placeId.toLowerCase().includes(q)
      );
    }
    if (filterStatus === 'published') list = list.filter(r => r.isPublished);
    if (filterStatus === 'unpublished') list = list.filter(r => !r.isPublished);
    if (minRating > 0) list = list.filter(r => r.rating >= minRating);
    return list;
  }, [reviews, search, filterStatus, minRating]);

  const formatDate = (d: unknown) => {
    try {
      if (!d) return '—';
      const date = d instanceof Date ? d : new Date(d as string);
      return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return '—'; }
  };

  return (
    <AuthGuard>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Sharhlar</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {filtered.length} ta sharh (jami {reviews.length})
            </p>
          </div>
          <button onClick={loadReviews} className="btn-ghost flex items-center gap-2">
            <RefreshCw size={15} /> Yangilash
          </button>
        </div>

        {/* Rating update toast */}
        {ratingUpdateMsg && (
          <div
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
            style={{ background: 'var(--primary)', color: 'white', maxWidth: 340 }}
          >
            <CheckCircle size={16} />
            {ratingUpdateMsg}
          </div>
        )}

        {/* Filters */}
        <div className="card mb-5">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="input pl-9"
                placeholder="Muallif, matn, joy ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="input w-auto min-w-36" value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as FilterStatus)}>
              <option value="all">Barcha holat</option>
              <option value="published">Nashr etilgan</option>
              <option value="unpublished">Tasdiqlanmagan</option>
            </select>
            <select className="input w-auto min-w-32" value={minRating}
              onChange={e => setMinRating(Number(e.target.value))}>
              <option value={0}>Barcha reyting</option>
              <option value={1}>1+ ⭐</option>
              <option value={2}>2+ ⭐</option>
              <option value={3}>3+ ⭐</option>
              <option value={4}>4+ ⭐</option>
              <option value={5}>5 ⭐</option>
            </select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Jami', value: reviews.length, color: '#64748b' },
            { label: 'Nashr etilgan', value: reviews.filter(r => r.isPublished).length, color: '#16a34a' },
            { label: 'Kutilmoqda', value: reviews.filter(r => !r.isPublished).length, color: '#d97706' },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-3 py-3">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center" style={{ color: 'var(--text-muted)' }}>
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p>Hech narsa topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Muallif</th>
                    <th>Sharh</th>
                    <th>Reyting</th>
                    <th>Joy ID</th>
                    <th>Sana</th>
                    <th>Holat</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(review => (
                    <tr key={review.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {review.authorAvatar ? (
                            <img src={review.authorAvatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                              style={{ background: 'var(--primary)', color: 'white' }}>
                              {(review.authorName || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{review.authorName}</span>
                        </div>
                      </td>
                      <td>
                        <p className="text-sm max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {review.text || '—'}
                        </p>
                        {review.images?.length > 0 && (
                          <span className="text-xs" style={{ color: 'var(--primary)' }}>
                            {review.images.length} ta rasm
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={12}
                              fill={i <= review.rating ? '#f59e0b' : 'none'}
                              color={i <= review.rating ? '#f59e0b' : 'var(--border)'}
                            />
                          ))}
                          <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{review.rating}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          {review.placeId?.slice(0, 10)}…
                        </span>
                      </td>
                      <td>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(review.createdAt)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${review.isPublished ? 'badge-green' : 'badge-yellow'}`}>
                          {review.isPublished ? 'Nashr' : 'Kutmoqda'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => togglePublish(review)}
                            disabled={togglingId === review.id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            title={review.isPublished ? "Nashrdan chiqarish" : "Tasdiqlash"}
                            style={{
                              background: review.isPublished ? '#fee2e2' : '#dcfce7',
                              color: review.isPublished ? '#dc2626' : '#16a34a',
                            }}
                          >
                            {review.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            onClick={() => setEditReview(review)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            title="Tahrirlash"
                            style={{ background: '#dbeafe', color: '#2563eb' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteReview(review)}
                            disabled={deletingId === review.id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            title="O'chirish"
                            style={{ background: '#fee2e2', color: '#dc2626' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editReview && (
        <ReviewEditModal
          review={editReview}
          onClose={() => setEditReview(null)}
          onSaved={loadReviews}
        />
      )}
    </AuthGuard>
  );
}

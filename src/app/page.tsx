'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import AuthGuard from '@/components/AuthGuard';
import {
  MapPin, MessageSquare, Eye, EyeOff, Star, TrendingUp,
  Clock, CheckCircle, XCircle, BarChart2
} from 'lucide-react';
import { PlaceModel, ReviewModel, PLACE_TYPES } from '@/types';

interface Stats {
  totalPlaces: number;
  publishedPlaces: number;
  unpublishedPlaces: number;
  totalReviews: number;
  publishedReviews: number;
  unpublishedReviews: number;
  avgRating: number;
  recentPlaces: PlaceModel[];
  recentReviews: ReviewModel[];
  placesByType: Record<string, number>;
  placesByRegion: Record<string, number>;
}

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: number | string;
  color: string; sub?: string;
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className="p-2.5 rounded-xl" style={{ background: color + '20' }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Places
      const placesSnap = await getDocs(collection(db, 'places'));
      const places = placesSnap.docs.map(d => ({ id: d.id, ...d.data() } as PlaceModel));

      // Reviews
      const reviewsSnap = await getDocs(collection(db, 'reviews'));
      const reviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewModel));

      const publishedPlaces = places.filter(p => p.isPublished);
      const publishedReviews = reviews.filter(r => r.isPublished);
      const avgRating = publishedReviews.length
        ? publishedReviews.reduce((a, r) => a + (r.rating || 0), 0) / publishedReviews.length
        : 0;

      const placesByType: Record<string, number> = {};
      places.forEach(p => { placesByType[p.type] = (placesByType[p.type] || 0) + 1; });

      const placesByRegion: Record<string, number> = {};
      places.forEach(p => { placesByRegion[p.region] = (placesByRegion[p.region] || 0) + 1; });

      // Recent items (sorted by createdAt if available)
      const recentPlaces = [...places]
        .sort((a, b) => {
          const aT = a.createdAt ? new Date(a.createdAt as unknown as string).getTime() : 0;
          const bT = b.createdAt ? new Date(b.createdAt as unknown as string).getTime() : 0;
          return bT - aT;
        })
        .slice(0, 5);

      const recentReviews = [...reviews]
        .sort((a, b) => {
          const aT = a.createdAt ? new Date(a.createdAt as unknown as string).getTime() : 0;
          const bT = b.createdAt ? new Date(b.createdAt as unknown as string).getTime() : 0;
          return bT - aT;
        })
        .slice(0, 5);

      setStats({
        totalPlaces: places.length,
        publishedPlaces: publishedPlaces.length,
        unpublishedPlaces: places.length - publishedPlaces.length,
        totalReviews: reviews.length,
        publishedReviews: publishedReviews.length,
        unpublishedReviews: reviews.length - publishedReviews.length,
        avgRating,
        recentPlaces,
        recentReviews,
        placesByType,
        placesByRegion,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Statistika</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Barcha ma'lumotlar umumiy ko'rinishi</p>
          </div>
          <button onClick={loadStats} className="btn-ghost text-sm flex items-center gap-2">
            <TrendingUp size={16} /> Yangilash
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card h-24 animate-pulse" style={{ background: 'var(--border)' }} />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Main stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon={MapPin} label="Jami joylar" value={stats.totalPlaces} color="#16a34a" />
              <StatCard icon={CheckCircle} label="Tasdiqlangan joylar" value={stats.publishedPlaces} color="#2563eb"
                sub={`${stats.unpublishedPlaces} tasdiqlanmagan`} />
              <StatCard icon={MessageSquare} label="Jami sharhlar" value={stats.totalReviews} color="#d97706" />
              <StatCard icon={CheckCircle} label="Tasdiqlangan sharhlar" value={stats.publishedReviews} color="#7c3aed"
                sub={`${stats.unpublishedReviews} kutilmoqda`} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Star} label="O'rtacha reyting" value={stats.avgRating.toFixed(2)} color="#f59e0b" />
              <StatCard icon={Eye} label="Nashr qilingan" value={stats.publishedPlaces + stats.publishedReviews} color="#06b6d4" />
              <StatCard icon={EyeOff} label="Kutilmoqda" value={stats.unpublishedPlaces + stats.unpublishedReviews} color="#ef4444" />
              <StatCard icon={BarChart2} label="Joylar turlari" value={Object.keys(stats.placesByType).length} color="#8b5cf6" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* By type */}
              <div className="card">
                <h2 className="font-semibold text-base mb-4" style={{ color: 'var(--text)' }}>Tur bo'yicha joylar</h2>
                <div className="space-y-3">
                  {PLACE_TYPES.map(pt => {
                    const count = stats.placesByType[pt.id] || 0;
                    const pct = stats.totalPlaces ? (count / stats.totalPlaces) * 100 : 0;
                    return (
                      <div key={pt.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span style={{ color: 'var(--text)' }}>{pt.icon} {pt.label}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: 'var(--primary)' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By region */}
              <div className="card">
                <h2 className="font-semibold text-base mb-4" style={{ color: 'var(--text)' }}>Viloyat bo'yicha</h2>
                <div className="space-y-2">
                  {Object.entries(stats.placesByRegion)
                    .sort(([, a], [, b]) => b - a)
                    .map(([region, count]) => {
                      const pct = stats.totalPlaces ? (count / stats.totalPlaces) * 100 : 0;
                      return (
                        <div key={region}>
                          <div className="flex justify-between text-sm mb-1">
                            <span style={{ color: 'var(--text)' }}>{region || '—'}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#2563eb' }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent places */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                  <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>So'nggi joylar</h2>
                </div>
                <div className="space-y-3">
                  {stats.recentPlaces.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: 'var(--border)' }}>
                          {PLACE_TYPES.find(t => t.id === p.type)?.icon || '📍'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{p.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.region}</div>
                      </div>
                      <span className={`badge ${p.isPublished ? 'badge-green' : 'badge-yellow'}`}>
                        {p.isPublished ? 'Nashr' : 'Kutmoqda'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent reviews */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={16} style={{ color: 'var(--text-muted)' }} />
                  <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>So'nggi sharhlar</h2>
                </div>
                <div className="space-y-3">
                  {stats.recentReviews.map(r => (
                    <div key={r.id} className="p-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{r.authorName}</span>
                        <div className="flex items-center gap-1">
                          <Star size={12} fill="#f59e0b" color="#f59e0b" />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.rating}</span>
                          <span className={`badge ml-1 ${r.isPublished ? 'badge-green' : 'badge-yellow'}`}>
                            {r.isPublished ? 'Nashr' : 'Kutmoqda'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            Ma'lumot yuklanmadi
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

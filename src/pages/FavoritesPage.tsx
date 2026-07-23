import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { api, Photo } from '../api';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Photo[]>([]);

  useEffect(() => {
    api.getFavoritePhotos().then(setFavorites).catch(console.error);
  }, []);

  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-title">Yêu thích</h2>
        <p className="page-subtitle">{favorites.length} ảnh bạn đã thả tim.</p>
      </div>

      {/* Masonry-like grid using CSS columns */}
      <div style={{
        columns: '3 200px',
        columnGap: '6px',
        gap: '6px',
      }}>
        {favorites.map((f, i) => (
          <div
            key={f.id}
            className="photo-card"
            style={{
              breakInside: 'avoid',
              aspectRatio: 'unset',
              height: 200 + (i % 3) * 30, // fake variable height
              marginBottom: '6px',
              display: 'inline-block',
              width: '100%',
              background: (f.url || f.cloudUrl) ? 'transparent' : 'linear-gradient(135deg,#ec4899,#f43f5e)',
              position: 'relative'
            }}
          >
            {(f.url || f.cloudUrl) && (
              <img src={(f.url || f.cloudUrl)!} alt={f.altText || "Favorite"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <div className="photo-card-overlay" style={{ opacity: 1, background: 'transparent' }}>
              <Heart size={16} fill="#fff" color="#fff" style={{ position: 'absolute', top: 12, right: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

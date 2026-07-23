import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, Album } from '../api';
import PhotoCard from '../components/PhotoCard';

export default function PublicSharedPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album & { photos?: any[], user?: { name: string } } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Không tìm thấy liên kết chia sẻ.');
      setIsLoading(false);
      return;
    }

    api.getPublicSharedAlbum(token)
      .then(fetchedAlbum => {
        setAlbum(fetchedAlbum);
      })
      .catch(err => {
        console.error(err);
        setError('Album không tồn tại hoặc không còn công khai.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  if (isLoading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <span style={{ color: 'var(--text-muted)' }}>Đang tải album...</span>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem', background: 'var(--surface-sunken)' }}>
          <AlertCircle size={48} color="var(--danger, #ef4444)" style={{ opacity: 0.8, marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Không thể truy cập</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 400 }}>
            {error || 'Đã xảy ra lỗi.'}
          </p>
          <button className="btn btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/login')}>
            Về trang Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h1 className="page-title">{album.name}</h1>
        <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={14} /> Chia sẻ bởi {album.user?.name || 'Ai đó'}
        </p>
        {album.description && (
          <p style={{ marginTop: '0.5rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {album.description}
          </p>
        )}
      </div>

      <div style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
        {(!album.photos || album.photos.length === 0) ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '2rem', padding: '3rem', background: 'var(--surface-sunken)' }}>
            <p style={{ color: 'var(--text-muted)' }}>Album này hiện chưa có ảnh nào.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', padding: '1rem 0' }}>
            {album.photos.map((photo: any) => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                onClick={() => {
                  // Pass the token so PhotoPage knows it's a public viewing session
                  navigate(`/photo/${photo.id}?shared=${token}`);
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
